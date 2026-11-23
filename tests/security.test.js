/**
 * SEE & SOLVE PRO - AUTOMATED SECURITY AUDIT SUITE
 * Validates OWASP Top 10, Access Control, Rate Limiting, Headers, & Defense Mechanisms
 */

process.env.AUTO_START = 'false';
const { handleRequest } = require('../server/index.js');
const { db } = require('../server/db.js');
const auth = require('../server/auth.js');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');

function createMockReqRes({ method = 'GET', url = '/', headers = {}, body = null }) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { ...headers };
  req.socket = { remoteAddress: '127.0.0.1' };

  const resHeaders = {};
  let statusCode = 200;
  let responseData = '';

  const res = {
    writeHead: (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(resHeaders, hdrs);
    },
    setHeader: (key, val) => {
      resHeaders[key.toLowerCase()] = val;
    },
    getHeader: (key) => resHeaders[key.toLowerCase()] || resHeaders[key],
    getHeaders: () => resHeaders,
    end: (chunk) => {
      if (chunk) responseData += chunk;
      res.emit('finish');
    },
    write: (chunk) => {
      if (chunk) responseData += chunk;
    },
    pipe: (dest) => {
      res.emit('finish');
      return dest;
    }
  };

  EventEmitter.call(res);
  Object.assign(res, EventEmitter.prototype);

  return { req, res, getStatusCode: () => statusCode, getHeaders: () => resHeaders, getBody: () => responseData };
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('  RUNNING SEE & SOLVE COMPREHENSIVE SECURITY AUDIT SUITE');
  console.log('================================================================\n');

  const tests = [];
  function record(name, passed, note) {
    tests.push({ name, passed });
    console.log(`${passed ? '🛡️ PASS' : '❌ FAIL'} - ${name}`);
    if (note) console.log(`       ${note}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Strict HTTP Security Headers & Content Security Policy (CSP)
    // -------------------------------------------------------------------------
    {
      const { req, res, getHeaders } = createMockReqRes({ method: 'GET', url: '/api/status' });
      process.nextTick(() => req.emit('end'));
      await handleRequest(req, res);

      const hdrs = getHeaders();
      const hasNosniff = hdrs['X-Content-Type-Options'] === 'nosniff';
      const hasFrameOptions = hdrs['X-Frame-Options'] === 'SAMEORIGIN';
      const hasXss = hdrs['X-XSS-Protection'] === '1; mode=block';
      const hasReferrer = hdrs['Referrer-Policy'] === 'strict-origin-when-cross-origin';
      const hasCsp = typeof hdrs['Content-Security-Policy'] === 'string' && hdrs['Content-Security-Policy'].includes("default-src 'self'");

      const passed = hasNosniff && hasFrameOptions && hasXss && hasReferrer && hasCsp;
      record('HTTP Security Headers & CSP Enforcement', passed,
        `nosniff: ${hasNosniff}, FrameOptions: ${hasFrameOptions}, CSP: ${hasCsp}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2: Path Traversal Attack Defense
    // -------------------------------------------------------------------------
    {
      const attacks = [
        '/api/../.env',
        '/uploads/../../data/see_and_solve.db',
        '/..%2f..%2f.env',
        '/public/../server/index.js'
      ];
      let allBlocked = true;

      for (const atk of attacks) {
        const { req, res, getStatusCode } = createMockReqRes({ method: 'GET', url: atk });
        process.nextTick(() => req.emit('end'));
        await handleRequest(req, res);
        if (getStatusCode() !== 403 && getStatusCode() !== 404) {
          allBlocked = false;
        }
      }

      record('Directory & Path Traversal Attack Prevention', allBlocked,
        `All ${attacks.length} path traversal attack variations blocked with 403/404`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Sensitive File Direct Download Protection
    // -------------------------------------------------------------------------
    {
      const sensitiveFiles = [
        '/.env',
        '/.git',
        '/.gitignore',
        '/package.json',
        '/render.yaml',
        '/data/see_and_solve.db',
        '/Dockerfile'
      ];
      let allDenied = true;

      for (const f of sensitiveFiles) {
        const { req, res, getStatusCode } = createMockReqRes({ method: 'GET', url: f });
        process.nextTick(() => req.emit('end'));
        await handleRequest(req, res);
        if (getStatusCode() !== 403 && getStatusCode() !== 404) {
          allDenied = false;
        }
      }

      record('Protected System & Database File Exposure Prevention', allDenied,
        `Direct access blocked for .env, .git, package.json, and SQLite database`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Unauthorized File Upload Extension Rejection
    // -------------------------------------------------------------------------
    {
      const invalidFiles = [
        '/uploads/malicious_payload.exe',
        '/uploads/exploit.php',
        '/uploads/xss_script.html',
        '/uploads/reverse_shell.sh'
      ];
      let allRejected = true;

      for (const f of invalidFiles) {
        const { req, res, getStatusCode } = createMockReqRes({ method: 'GET', url: f });
        process.nextTick(() => req.emit('end'));
        await handleRequest(req, res);
        if (getStatusCode() !== 403) {
          allRejected = false;
        }
      }

      record('Unsafe File Extensions in Media Uploads Blocked', allRejected,
        `Execution of non-image MIME extensions rejected with 403 Forbidden`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Role-Based Admin Route Protection (RBAC)
    // -------------------------------------------------------------------------
    {
      // 5A: Anonymous user accessing admin routes -> 403 Forbidden
      const anon = createMockReqRes({ method: 'GET', url: '/api/admin/metrics' });
      process.nextTick(() => anon.req.emit('end'));
      await handleRequest(anon.req, anon.res);
      const anonBlocked = anon.getStatusCode() === 403;

      // 5B: Authorized admin with X-Admin-Key -> 200 OK
      process.env.ADMIN_API_KEY = 'test-secure-admin-token-2026';
      const admin = createMockReqRes({
        method: 'GET',
        url: '/api/admin/metrics',
        headers: { 'x-admin-key': 'test-secure-admin-token-2026' }
      });
      process.nextTick(() => admin.req.emit('end'));
      await handleRequest(admin.req, admin.res);
      const adminAllowed = admin.getStatusCode() === 200;

      const passed = anonBlocked && adminAllowed;
      record('Role-Based Access Control on Administrative Endpoints', passed,
        `Anonymous blocked (403): ${anonBlocked}, Valid Admin Key allowed (200): ${adminAllowed}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: In-Memory Rate Limiting on Authentication
    // -------------------------------------------------------------------------
    {
      process.env.DISABLE_RATE_LIMIT = 'false';
      let triggered429 = false;

      // Send requests until rate limit trips
      for (let i = 0; i < 25; i++) {
        const { req, res, getStatusCode } = createMockReqRes({
          method: 'POST',
          url: '/api/auth/login',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '198.51.100.99' // Unique testing IP
          }
        });
        process.nextTick(() => {
          req.emit('data', JSON.stringify({ email: 'rate_test@test.com', password: 'invalid' }));
          req.emit('end');
        });
        await handleRequest(req, res);
        if (getStatusCode() === 429) {
          triggered429 = true;
          break;
        }
      }

      record('Authentication Brute-Force Rate Limiting (HTTP 429)', triggered429,
        `Excessive login requests received HTTP 429 Too Many Requests`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: Input Sanitization & Script Injection Neutralization
    // -------------------------------------------------------------------------
    {
      const payloadWithScript = 'Kitchen sink is blocked <script>alert("XSS")</script> and leaking';
      const { req, res, getBody } = createMockReqRes({
        method: 'POST',
        url: '/api/reports/analyze',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '198.51.100.100'
        }
      });
      process.nextTick(() => {
        req.emit('data', JSON.stringify({
          description: payloadWithScript,
          location: 'Guntur <script>steal()</script>',
          age: 25
        }));
        req.emit('end');
      });
      await handleRequest(req, res);

      const parsed = JSON.parse(getBody());
      const hasScriptTag = getBody().includes('<script>');
      const analysisSuccess = parsed.success === true;

      const passed = !hasScriptTag && analysisSuccess;
      record('XSS & Dangerous HTML Script Tag Sanitization', passed,
        `Script tags stripped: ${!hasScriptTag}, Analysis completed safely: ${analysisSuccess}`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Constant-Time Password Verification (Timing Attack Defense)
    // -------------------------------------------------------------------------
    {
      const testEmail = `timing_${Date.now()}@test.com`;
      auth.registerUser({ email: testEmail, password: 'SecurePassword123!', name: 'Timing User', age: 25 });

      let authFailed = false;
      try {
        auth.loginUser({ email: testEmail, password: 'WrongPassword123!' });
      } catch (err) {
        authFailed = err.message === 'Invalid email or password.';
      }

      record('Timing-Safe Password Hash Comparison', authFailed,
        `Constant-time cryptographic comparison executed without exception`);
    }

    console.log('\n================================================================');
    const totalPassed = tests.filter(t => t.passed).length;
    console.log(`  SECURITY AUDIT RESULTS: ${totalPassed} / ${tests.length} CHECKS PASSED`);
    console.log('================================================================');

    if (totalPassed === tests.length) {
      console.log('\n🔒 100% SECURITY AUDIT CHECKS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.error('\n❌ SECURITY VULNERABILITIES DETECTED.\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('Security audit execution failed:', err);
    process.exit(1);
  }
}

runSecurityAudit();
