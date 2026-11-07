const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const crypto = require('node:crypto');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { db } = require('./db.js');
const auth = require('./auth.js');
const aiService = require('./ai-service.js');
const youtubeService = require('./youtube-service.js');
const technicianService = require('./technician-service.js');
const governmentService = require('./government-service.js');
const i18n = require('./i18n.js');

const PORT = process.env.PORT || 5050;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MIME types map for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const IS_PROD = process.env.NODE_ENV === 'production';

// =============================================================================
// DEFENSIVE SECURITY CONTROLS: HEADERS, CSP, CORS & RATE LIMITING
// =============================================================================

// Strict Security Headers + Content Security Policy (CSP)
function getSecurityHeaders(isHtml = false, origin = null) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)'
  };

  headers['Content-Security-Policy'] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'self' https://nominatim.openstreetmap.org https://meekosam.ap.gov.in",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  if (IS_PROD) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  // Safe CORS Policy
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || !IS_PROD)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (!origin && allowedOrigins.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Key';
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';

  return headers;
}

function sendJson(res, statusCode, data, origin = null, extraHeaders = {}) {
  const jsonStr = JSON.stringify(data);
  const secHeaders = getSecurityHeaders(false, origin);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    ...secHeaders,
    ...extraHeaders
  });
  res.end(jsonStr);
}

function sendError(res, statusCode, message, details = null, origin = null, extraHeaders = {}) {
  // Turn off debug details in production to eliminate internal information disclosure
  const safeMessage = (statusCode >= 500 && IS_PROD)
    ? 'An unexpected server error occurred. Please try again later.'
    : message;
  const safeDetails = IS_PROD ? null : details;

  sendJson(res, statusCode, {
    success: false,
    error: safeMessage,
    details: safeDetails
  }, origin, extraHeaders);
}

// In-Memory Sliding-Window Rate Limiter (Zero Dependencies)
const rateLimitBuckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitBuckets.entries()) {
    if (now > val.resetTime) {
      rateLimitBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function checkRateLimit(req, bucketName, maxRequests, windowMs) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') {
    return { allowed: true, remaining: maxRequests };
  }

  const ip = getClientIp(req);
  const key = `${bucketName}:${ip}`;
  const now = Date.now();

  let bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetTime) {
    bucket = { count: 1, resetTime: now + windowMs };
    rateLimitBuckets.set(key, bucket);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - bucket.count };
}

// Server-side string sanitization to protect against XSS and control character injection
function sanitizeString(input, maxLength = 4000) {
  if (typeof input !== 'string') return '';
  let str = input.slice(0, maxLength);
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/javascript\s*:/gi, 'blocked:');
  str = str.replace(/data\s*:\s*text\/html/gi, 'blocked:');
  return str.trim();
}

// Role-based admin route protection
function requireAdmin(req) {
  const adminKey = req.headers['x-admin-key'];
  if (process.env.ADMIN_API_KEY && adminKey && adminKey === process.env.ADMIN_API_KEY) {
    return { id: 'admin-key-holder', email: 'admin@system.local', is_admin: true };
  }

  const user = getAuthUser(req);
  if (user && user.is_admin === true) {
    return user;
  }
  return null;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const item of cookieHeader.split(';')) {
    const parts = item.split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  }
  return cookies;
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookies = parseCookies(req.headers['cookie']);
    token = cookies['session_token'];
  }
  if (!token) return null;
  return auth.getUserByToken(token);
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) { // 25MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(new Error('Invalid JSON format'));
        }
      } else {
        resolve(body);
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const origin = req.headers['origin'] || null;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    const secHeaders = getSecurityHeaders(false, origin);
    res.writeHead(204, secHeaders);
    return res.end();
  }

  const rawUrl = req.url || '';
  let decodedUrl = '';
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch (e) {
    decodedUrl = rawUrl;
  }

  // 1. Path Traversal & Suspicious Character Defense
  if (rawUrl.includes('..') || decodedUrl.includes('..') || rawUrl.includes('\0') || decodedUrl.includes('\0')) {
    res.writeHead(403, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
    return res.end('Access Denied: Path traversal detected.');
  }

  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // 2. Block direct HTTP exposure of sensitive system/config/database files
  const BLOCKED_FILES = [
    '.env', '.gitignore', '.git', 'package.json', 'render.yaml',
    'dockerfile', 'docker-compose.yml', 'start.bat', 'test.bat',
    'host_tunnel.bat', 'pack_project.bat', 'acceptance.test.js'
  ];
  const lowerPath = pathname.toLowerCase();
  if (BLOCKED_FILES.some(b => lowerPath.endsWith('/' + b) || lowerPath === '/' + b || lowerPath.includes('.db'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
    return res.end('Access Denied: Protected resource.');
  }

  // 3. Global API Rate Limiting (150 requests per minute)
  if (pathname.startsWith('/api/')) {
    const globalLimit = checkRateLimit(req, 'global_api', 150, 60 * 1000);
    if (!globalLimit.allowed) {
      return sendError(res, 429, 'Too many requests. Please slow down and try again later.', null, origin, {
        'Retry-After': String(globalLimit.retryAfter)
      });
    }
  }

  try {
    // =========================================================================
    // API ROUTES
    // =========================================================================

    // 1. Health & Configuration Status
    if (pathname === '/api/status' && method === 'GET') {
      const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
      const youtubeConfigured = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.trim().length > 0);
      const placesConfigured = Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.trim().length > 0);

      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;

      return sendJson(res, 200, {
        success: true,
        service: "See & Solve Production Server",
        version: "1.0.0",
        database: "SQLite (Built-in WAL Mode)",
        integrations: {
          geminiVisionAI: {
            configured: geminiConfigured,
            mode: geminiConfigured ? "Live Google Gemini Vision API" : "Intelligent Built-in Domain Diagnostic Engine"
          },
          youtubeDataAPI: {
            configured: youtubeConfigured,
            mode: youtubeConfigured ? "Live YouTube Data API v3" : "Verified Curated Videos & Targeted External Search Fallback"
          },
          googlePlacesAPI: {
            configured: placesConfigured,
            mode: placesConfigured ? "Live Google Places API" : "Verified AP Local Trade Directory & Geo Maps Search"
          }
        },
        stats: {
          totalUsers: userCount,
          totalReports: reportCount
        }
      });
    }

    // =========================================================================
    // ADMIN ROUTES (Protected with Strict Role-Based Access Control)
    // =========================================================================

    // A1. Admin Metrics & Health Monitoring
    if (pathname === '/api/admin/metrics' && method === 'GET') {
      const admin = requireAdmin(req);
      if (!admin) {
        return sendError(res, 403, 'Forbidden: Administrative credentials required.', null, origin);
      }

      const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
      const activeSessions = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?').get(new Date().toISOString()).count;

      return sendJson(res, 200, {
        success: true,
        adminUser: admin.email,
        serverTime: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        stats: {
          totalUsers,
          totalReports,
          activeSessions
        },
        rateLimiter: {
          activeBuckets: rateLimitBuckets.size
        }
      }, origin);
    }

    // A2. Admin Reports List (Oversight)
    if (pathname === '/api/admin/reports' && method === 'GET') {
      const admin = requireAdmin(req);
      if (!admin) {
        return sendError(res, 403, 'Forbidden: Administrative credentials required.', null, origin);
      }

      const rows = db.prepare(`
        SELECT id, user_id, description, location_city, status, created_at
        FROM reports
        ORDER BY created_at DESC
        LIMIT 50
      `).all();

      return sendJson(res, 200, { success: true, count: rows.length, reports: rows }, origin);
    }

    // A3. Admin Users List
    if (pathname === '/api/admin/users' && method === 'GET') {
      const admin = requireAdmin(req);
      if (!admin) {
        return sendError(res, 403, 'Forbidden: Administrative credentials required.', null, origin);
      }

      const users = db.prepare(`
        SELECT id, email, name, age, preferred_language, is_admin, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 50
      `).all();

      return sendJson(res, 200, { success: true, count: users.length, users }, origin);
    }

    // =========================================================================
    // AUTHENTICATION ROUTES (Protected with Rate Limiting)
    // =========================================================================

    // 2. Authentication: Register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const authLimit = checkRateLimit(req, 'auth_ops', 20, 5 * 60 * 1000);
      if (!authLimit.allowed) {
        return sendError(res, 429, 'Too many registration attempts. Please wait 5 minutes.', null, origin, {
          'Retry-After': String(authLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);
      // Sanitize input
      data.name = sanitizeString(data.name || 'User', 100);
      data.email = sanitizeString(data.email || '', 150);

      try {
        const result = auth.registerUser(data);
        return sendJson(res, 201, {
          success: true,
          user: result.user,
          token: result.token,
          message: "Registration successful"
        }, origin);
      } catch (err) {
        return sendError(res, 400, err.message, null, origin);
      }
    }

    // 3. Authentication: Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const authLimit = checkRateLimit(req, 'auth_ops', 20, 5 * 60 * 1000);
      if (!authLimit.allowed) {
        return sendError(res, 429, 'Too many login attempts. Please wait 5 minutes.', null, origin, {
          'Retry-After': String(authLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);
      data.email = sanitizeString(data.email || '', 150);

      try {
        const result = auth.loginUser(data);
        return sendJson(res, 200, {
          success: true,
          user: result.user,
          token: result.token,
          message: "Login successful"
        }, origin);
      } catch (err) {
        return sendError(res, 401, err.message, null, origin);
      }
    }

    // 4. Authentication: Logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        auth.logoutUser(token);
      }
      return sendJson(res, 200, { success: true, message: "Logged out successfully" }, origin);
    }

    // 5. Authentication: Current User
    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = getAuthUser(req);
      if (!user) {
        return sendJson(res, 200, { success: true, user: null, isGuest: true }, origin);
      }
      return sendJson(res, 200, { success: true, user, isGuest: false }, origin);
    }

    // 6. Authentication: Update Profile
    if (pathname === '/api/auth/update-profile' && method === 'POST') {
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Unauthorized', null, origin);
      const data = await parseRequestBody(req);
      data.name = sanitizeString(data.name || '', 100);
      const updated = auth.updateProfile(user.id, data);
      return sendJson(res, 200, { success: true, user: updated }, origin);
    }

    // 7. Authentication: Forgot Password
    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const authLimit = checkRateLimit(req, 'auth_ops', 20, 5 * 60 * 1000);
      if (!authLimit.allowed) {
        return sendError(res, 429, 'Too many password reset attempts. Please wait 5 minutes.', null, origin, {
          'Retry-After': String(authLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);
      try {
        const result = auth.requestPasswordReset(sanitizeString(data.email, 150));
        return sendJson(res, 200, result, origin);
      } catch (err) {
        return sendError(res, 400, err.message, null, origin);
      }
    }

    // 8. Authentication: Reset Password
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const authLimit = checkRateLimit(req, 'auth_ops', 20, 5 * 60 * 1000);
      if (!authLimit.allowed) {
        return sendError(res, 429, 'Too many attempts. Please wait 5 minutes.', null, origin, {
          'Retry-After': String(authLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);
      try {
        const result = auth.resetPassword(data);
        return sendJson(res, 200, result, origin);
      } catch (err) {
        return sendError(res, 400, err.message, null, origin);
      }
    }

    // 9. Authentication: Delete Account
    if (pathname === '/api/auth/account' && method === 'DELETE') {
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Unauthorized', null, origin);
      auth.deleteUserAccount(user.id);
      return sendJson(res, 200, { success: true, message: "Account deleted successfully" }, origin);
    }

    // 10. PRIMARY ENDPOINT: Analyze Problem
    if (pathname === '/api/reports/analyze' && method === 'POST') {
      const analysisLimit = checkRateLimit(req, 'ai_analysis', 40, 60 * 1000);
      if (!analysisLimit.allowed) {
        return sendError(res, 429, 'Too many analysis requests. Please wait a moment before trying again.', null, origin, {
          'Retry-After': String(analysisLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);

      // MANDATORY WRITTEN DESCRIPTION CHECK & SANITIZATION
      // The written description is mandatory even when an image is provided.
      // A completed voice transcription may count as the written description.
      const description = sanitizeString(data.description || '', 4000);
      if (!description || description.length < 3) {
        return sendError(res, 400, 'A written description of the problem is mandatory (even when an image is provided).', null, origin);
      }

      // Handle image if base64 provided
      let savedImagePath = null;
      if (data.imageBase64) {
        try {
          const match = data.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const base64Data = match ? match[2] : data.imageBase64;
          const ext = match && match[1].includes('png') ? '.png' : '.jpg';
          const filename = `report_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
          savedImagePath = path.join(UPLOADS_DIR, filename);
          fs.writeFileSync(savedImagePath, Buffer.from(base64Data, 'base64'));
        } catch (e) {
          console.warn('Failed to save image file:', e.message);
        }
      }

      const user = getAuthUser(req);
      const language = data.language || user?.preferred_language || 'en';
      const location = sanitizeString(data.location || '', 200);
      const coordinates = data.coordinates || null;
      const clarificationAnswer = data.clarificationAnswer ? sanitizeString(data.clarificationAnswer, 1000) : null;

      // Determine user age: from request payload, or logged-in profile, or null
      let userAge = null;
      if (data.age !== undefined && data.age !== null && !isNaN(parseInt(data.age))) {
        userAge = parseInt(data.age);
      } else if (user && user.age !== null) {
        userAge = user.age;
      }

      // Step 2: AI Vision & Text Analysis
      const aiResult = await aiService.analyzeProblem({
        imagePath: savedImagePath,
        imageBase64: data.imageBase64,
        mimeType: data.mimeType,
        description,
        language,
        location,
        clarificationAnswer
      });

      // Step 3: Populate relevant sections only!
      let safeTroubleshooting = null;
      let tutorialVideos = null;
      let technicians = null;
      let governmentAssistance = null;

      // 3.1 Clarification needed check:
      if (aiResult.needs_clarification) {
        // Return clarification prompt before generating solutions
        return sendJson(res, 200, {
          success: true,
          reportId: crypto.randomUUID(),
          needsClarification: true,
          aiAnalysis: aiResult,
          followUpQuestions: aiResult.follow_up_questions,
          sections: {
            showAnalysis: true,
            showClarification: true,
            showTroubleshooting: false,
            showVideos: false,
            showTechnicians: false,
            showGovernment: false
          }
        });
      }

      // 3.2 Safe Troubleshooting (Shown only when problem is suitable for safe DIY)
      if (aiResult.is_suitable_for_safe_troubleshooting) {
        safeTroubleshooting = {
          likelyIssue: aiResult.likely_issue,
          confidence: aiResult.confidence,
          safePreliminaryChecks: aiResult.safe_preliminary_checks || [],
          steps: aiResult.troubleshooting_steps || [],
          whenToStop: aiResult.when_to_stop,
          expectedOutcome: "Equipment function restored or safe diagnostic isolation achieved."
        };
      }

      // 3.3 Tutorial Videos (Only when eligible: safe issue + user age >= 18)
      if (aiResult.is_suitable_for_safe_troubleshooting && aiResult.tutorial_search_query) {
        tutorialVideos = await youtubeService.getTutorialVideos({
          query: aiResult.tutorial_search_query,
          userAge,
          isSafeForDIY: aiResult.is_suitable_for_safe_troubleshooting,
          technicalCategory: aiResult.technical_category,
          preferredLanguage: language,
          troubleshootingSteps: aiResult.troubleshooting_steps || [],
          likelyIssue: aiResult.likely_issue,
          affectedObject: aiResult.affected_asset_or_service,
          safeChecks: aiResult.safe_preliminary_checks || []
        });
      } else {
        // Safe or age reasons withheld
        tutorialVideos = {
          eligible: false,
          videos: [],
          reason: !aiResult.is_suitable_for_safe_troubleshooting
            ? "Safety compliance: DIY tutorial videos are withheld for hazardous or public infrastructure work."
            : "Age eligibility check required."
        };
      }

      // 3.4 Government Assistance (Shown only when issue is public / municipal)
      if (aiResult.is_government_related === true) {
        const authority = governmentService.matchGovernmentAuthority({
          technicalCategory: aiResult.technical_category,
          issueTitle: aiResult.likely_issue,
          location,
          isPublic: true
        });

        const draft = governmentService.generatePersonalizedComplaintDraft({
          issueTitle: aiResult.likely_issue,
          affectedObject: aiResult.affected_asset_or_service,
          userDescription: description,
          location,
          userName: user?.name || data.userName || 'Concerned Citizen',
          authority,
          language
        });

        governmentAssistance = {
          isGovernmentRelated: true,
          authority,
          emailDraft: draft,
          portals: [
            { name: "AP Mee Kosam (Official AP Grievance Portal)", url: "https://meekosam.ap.gov.in" },
            { name: "CPGRAMS (Central Government Portal)", url: "https://pgportal.gov.in" }
          ]
        };
      }

      // 3.5 Find a Technician (Shown when professional required, but NOT for public infrastructure that requires public authority first)
      if (aiResult.required_technician_specialization && aiResult.required_technician_specialization !== 'Public Authority First') {
        technicians = await technicianService.discoverLocalTechnicians({
          specialization: aiResult.required_technician_specialization,
          location,
          coordinates
        });
      } else if (aiResult.is_government_related === true) {
        technicians = {
          showTechnicians: false,
          reason: "Public infrastructure faults must be reported to the responsible public authority. Private technicians are not recommended for public assets.",
          technicians: []
        };
      }

      const reportId = crypto.randomUUID();

      // If user is authenticated, save directly to their report history
      if (user) {
        const stmt = db.prepare(`
          INSERT INTO reports (
            id, user_id, image_path, description, voice_used, language,
            location_city, location_district, location_coords,
            ai_analysis_json, troubleshooting_json, videos_json,
            technicians_json, gov_complaint_json, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          reportId,
          user.id,
          savedImagePath ? path.basename(savedImagePath) : null,
          description,
          data.voiceUsed ? 1 : 0,
          language,
          location,
          null,
          coordinates ? JSON.stringify(coordinates) : null,
          JSON.stringify(aiResult),
          safeTroubleshooting ? JSON.stringify(safeTroubleshooting) : null,
          JSON.stringify(tutorialVideos),
          technicians ? JSON.stringify(technicians) : null,
          governmentAssistance ? JSON.stringify(governmentAssistance) : null,
          'analyzed',
          new Date().toISOString()
        );
      }

      return sendJson(res, 200, {
        success: true,
        reportId,
        needsClarification: false,
        aiAnalysis: aiResult,
        safeTroubleshooting,
        tutorialVideos,
        technicians,
        governmentAssistance,
        sections: {
          showAnalysis: true,
          showClarification: false,
          showTroubleshooting: Boolean(safeTroubleshooting),
          showVideos: Boolean(tutorialVideos && tutorialVideos.eligible && ((tutorialVideos.videos && tutorialVideos.videos.length > 0) || tutorialVideos.aiTutorialVideo)),
          showTechnicians: Boolean(technicians && technicians.showTechnicians && technicians.technicians && technicians.technicians.length > 0),
          showGovernment: Boolean(governmentAssistance)
        }
      });
    }

    // 11. Refine Analysis (Test 9 follow-up answers)
    if (pathname === '/api/reports/refine' && method === 'POST') {
      const analysisLimit = checkRateLimit(req, 'ai_analysis', 40, 60 * 1000);
      if (!analysisLimit.allowed) {
        return sendError(res, 429, 'Too many analysis requests. Please wait a moment before trying again.', null, origin, {
          'Retry-After': String(analysisLimit.retryAfter)
        });
      }

      const data = await parseRequestBody(req);
      const description = sanitizeString(data.description || '', 4000);
      const clarificationAnswer = sanitizeString(data.clarificationAnswer || '', 1000);
      const location = sanitizeString(data.location || '', 200);
      const language = data.language || 'en';
      const user = getAuthUser(req);
      const userAge = data.age || user?.age || null;

      // Re-run analysis with clarification
      const aiResult = await aiService.analyzeProblem({
        description,
        clarificationAnswer,
        language,
        location
      });

      let safeTroubleshooting = null;
      let tutorialVideos = null;
      let technicians = null;
      let governmentAssistance = null;

      if (aiResult.is_suitable_for_safe_troubleshooting) {
        safeTroubleshooting = {
          likelyIssue: aiResult.likely_issue,
          confidence: aiResult.confidence,
          safePreliminaryChecks: aiResult.safe_preliminary_checks || [],
          steps: aiResult.troubleshooting_steps || [],
          whenToStop: aiResult.when_to_stop,
          expectedOutcome: "Diagnostic resolution achieved."
        };
      }

      if (aiResult.is_suitable_for_safe_troubleshooting && aiResult.tutorial_search_query) {
        tutorialVideos = await youtubeService.getTutorialVideos({
          query: aiResult.tutorial_search_query,
          userAge,
          isSafeForDIY: aiResult.is_suitable_for_safe_troubleshooting,
          preferredLanguage: language,
          troubleshootingSteps: aiResult.troubleshooting_steps || [],
          likelyIssue: aiResult.likely_issue,
          affectedObject: aiResult.affected_asset_or_service,
          safeChecks: aiResult.safe_preliminary_checks || []
        });
      }

      if (aiResult.is_government_related === true) {
        const authority = governmentService.matchGovernmentAuthority({
          technicalCategory: aiResult.technical_category,
          issueTitle: aiResult.likely_issue,
          location,
          isPublic: true
        });

        governmentAssistance = {
          isGovernmentRelated: true,
          authority,
          emailDraft: governmentService.generatePersonalizedComplaintDraft({
            issueTitle: aiResult.likely_issue,
            affectedObject: aiResult.affected_asset_or_service,
            userDescription: description + ' (Clarification: ' + clarificationAnswer + ')',
            location,
            userName: user?.name || 'Concerned Citizen',
            authority,
            language
          })
        };
      }

      if (aiResult.required_technician_specialization && aiResult.required_technician_specialization !== 'Public Authority First') {
        technicians = await technicianService.discoverLocalTechnicians({
          specialization: aiResult.required_technician_specialization,
          location
        });
      }

      return sendJson(res, 200, {
        success: true,
        aiAnalysis: aiResult,
        safeTroubleshooting,
        tutorialVideos,
        technicians,
        governmentAssistance,
        sections: {
          showAnalysis: true,
          showClarification: false,
          showTroubleshooting: Boolean(safeTroubleshooting),
          showVideos: Boolean(tutorialVideos && tutorialVideos.eligible),
          showTechnicians: Boolean(technicians && technicians.showTechnicians),
          showGovernment: Boolean(governmentAssistance)
        }
      });
    }

    // 11b. Dynamic Age Verification for Tutorial Videos (No login required - equal features for all)
    if (pathname === '/api/reports/verify-age' && method === 'POST') {
      const data = await parseRequestBody(req);
      const age = data.age !== undefined && data.age !== null ? parseInt(data.age) : null;
      const query = data.query || data.tutorialSearchQuery || data.likelyIssue || 'repair tutorial';
      const isSafeForDIY = data.isSafeForDIY !== false;
      const technicalCategory = data.technicalCategory || 'General Diagnostics';
      const preferredLanguage = data.language || 'en';
      const troubleshootingSteps = data.troubleshootingSteps || [];
      const likelyIssue = data.likelyIssue || null;
      const affectedObject = data.affectedObject || null;
      const safeChecks = data.safeChecks || [];

      const tutorialVideos = await youtubeService.getTutorialVideos({
        query,
        userAge: age,
        isSafeForDIY,
        technicalCategory,
        preferredLanguage,
        troubleshootingSteps,
        likelyIssue,
        affectedObject,
        safeChecks
      });

      return sendJson(res, 200, {
        success: true,
        tutorialVideos,
        showVideos: Boolean(tutorialVideos && tutorialVideos.eligible && ((tutorialVideos.videos && tutorialVideos.videos.length > 0) || tutorialVideos.aiTutorialVideo))
      });
    }

    // 12. Save Guest Report to Logged-in User Account
    if (pathname === '/api/reports/save' && method === 'POST') {
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Please sign in to save your report to history.');
      const data = await parseRequestBody(req);

      const reportId = crypto.randomUUID();
      const stmt = db.prepare(`
        INSERT INTO reports (
          id, user_id, image_path, description, voice_used, language,
          location_city, location_district, location_coords,
          ai_analysis_json, troubleshooting_json, videos_json,
          technicians_json, gov_complaint_json, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        reportId,
        user.id,
        data.imagePath || null,
        data.description || 'Report',
        data.voiceUsed ? 1 : 0,
        data.language || 'en',
        data.location || '',
        null,
        null,
        JSON.stringify(data.aiAnalysis || {}),
        JSON.stringify(data.safeTroubleshooting || {}),
        JSON.stringify(data.tutorialVideos || {}),
        JSON.stringify(data.technicians || {}),
        JSON.stringify(data.governmentAssistance || {}),
        'saved',
        new Date().toISOString()
      );

      return sendJson(res, 200, { success: true, reportId, message: "Report saved to history." });
    }

    // 13. List User Reports (Report History with Strict Privacy)
    if (pathname === '/api/reports' && method === 'GET') {
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Unauthorized');

      const stmt = db.prepare(`
        SELECT id, description, image_path, language, location_city, status, created_at,
               ai_analysis_json
        FROM reports
        WHERE user_id = ?
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(user.id);
      const reports = rows.map(r => ({
        id: r.id,
        description: r.description,
        imagePath: r.image_path ? `/uploads/${r.image_path}` : null,
        location: r.location_city,
        status: r.status,
        createdAt: r.created_at,
        analysis: r.ai_analysis_json ? JSON.parse(r.ai_analysis_json) : null
      }));

      return sendJson(res, 200, { success: true, reports });
    }

    // 14. Get Specific Report (Strict Privacy - Access Control)
    if (pathname.startsWith('/api/reports/') && method === 'GET') {
      const reportId = pathname.substring('/api/reports/'.length);
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Unauthorized');

      const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
      const r = stmt.get(reportId);
      if (!r) return sendError(res, 404, 'Report not found');

      // Access control: Users must only be able to access their own data
      if (r.user_id !== user.id) {
        return sendError(res, 403, 'Forbidden: You do not have permission to view this private report.');
      }

      return sendJson(res, 200, {
        success: true,
        report: {
          id: r.id,
          description: r.description,
          imagePath: r.image_path ? `/uploads/${r.image_path}` : null,
          voiceUsed: Boolean(r.voice_used),
          language: r.language,
          location: r.location_city,
          status: r.status,
          createdAt: r.created_at,
          aiAnalysis: r.ai_analysis_json ? JSON.parse(r.ai_analysis_json) : null,
          safeTroubleshooting: r.troubleshooting_json ? JSON.parse(r.troubleshooting_json) : null,
          tutorialVideos: r.videos_json ? JSON.parse(r.videos_json) : null,
          technicians: r.technicians_json ? JSON.parse(r.technicians_json) : null,
          governmentAssistance: r.gov_complaint_json ? JSON.parse(r.gov_complaint_json) : null
        }
      });
    }

    // 15. Delete Report (Strict Privacy)
    if (pathname.startsWith('/api/reports/') && method === 'DELETE') {
      const reportId = pathname.substring('/api/reports/'.length);
      const user = getAuthUser(req);
      if (!user) return sendError(res, 401, 'Unauthorized');

      const checkStmt = db.prepare('SELECT user_id, image_path FROM reports WHERE id = ?');
      const r = checkStmt.get(reportId);
      if (!r) return sendError(res, 404, 'Report not found');
      if (r.user_id !== user.id) {
        return sendError(res, 403, 'Forbidden: You cannot delete another user\'s report.');
      }

      db.prepare('DELETE FROM reports WHERE id = ?').run(reportId);
      if (r.image_path) {
        const fullImgPath = path.join(UPLOADS_DIR, r.image_path);
        if (fs.existsSync(fullImgPath)) {
          fs.unlinkSync(fullImgPath);
        }
      }

      return sendJson(res, 200, { success: true, message: "Report deleted successfully" });
    }

    // 16. Standalone Technician Search
    if (pathname === '/api/technicians/search' && method === 'POST') {
      const data = await parseRequestBody(req);
      const result = await technicianService.discoverLocalTechnicians({
        specialization: data.specialization,
        location: data.location,
        coordinates: data.coordinates
      });
      return sendJson(res, 200, result);
    }

    // 17. Standalone Video Search
    if (pathname === '/api/videos/search' && method === 'POST') {
      const data = await parseRequestBody(req);
      const result = await youtubeService.getTutorialVideos({
        query: data.query,
        userAge: data.age,
        isSafeForDIY: data.isSafeForDIY !== false,
        preferredLanguage: data.language || 'en'
      });
      return sendJson(res, 200, result);
    }

    // =========================================================================
    // STATIC FILE SERVING & ASSET SECURITY
    // =========================================================================

    // Serve Uploaded Images (Restricted to verified image types only)
    if (pathname.startsWith('/uploads/')) {
      const filename = path.basename(pathname);
      const filePath = path.join(UPLOADS_DIR, filename);
      const ext = path.extname(filePath).toLowerCase();
      const allowedImgExts = ['.jpg', '.jpeg', '.png', '.webp'];

      if (!allowedImgExts.includes(ext)) {
        res.writeHead(403, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
        return res.end('Forbidden: Only standard image assets may be accessed.');
      }

      if (fs.existsSync(filePath)) {
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN'
        });
        return fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
        return res.end('Image not found');
      }
    }

    // Serve Frontend Assets from public/
    let requestedPath = pathname === '/' ? '/index.html' : pathname;
    let safePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

    if (!safePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
      return res.end('Forbidden: Directory traversal attempt blocked.');
    }

    const secHeaders = getSecurityHeaders(true, origin);

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...secHeaders
      });
      return fs.createReadStream(safePath).pipe(res);
    }

    // SPA Fallback: Only route client navigations WITHOUT a file extension to index.html
    const hasFileExt = path.extname(safePath).length > 0;
    if (!hasFileExt) {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...secHeaders
        });
        return fs.createReadStream(indexPath).pipe(res);
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain', 'X-Content-Type-Options': 'nosniff' });
    res.end('Not Found');

  } catch (serverErr) {
    console.error('Server error:', serverErr);
    return sendError(res, 500, 'Internal Server Error', serverErr.message, origin);
  }
}

const server = http.createServer(handleRequest);

if (require.main === module || process.env.AUTO_START !== 'false') {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  SEE & SOLVE - PRODUCTION SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = { server, handleRequest };
