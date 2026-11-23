# See & Solve — Production-Ready AI Diagnostic Application

**See & Solve** is a modern, responsive, multimodal AI-powered web application that empowers citizens and households to diagnose real-world problems by uploading a photo, providing a description, and receiving relevant, verified solutions.

---

## 🚀 Key Capabilities

1. **Multimodal Problem Diagnosis**:
   - Combines vision and text analysis to diagnose issues, affected infrastructure, observed symptoms, and facts vs. assumptions.
   - Live Google Gemini 1.5/2.0 Flash Vision integration with a robust built-in Domain Diagnostic Engine fallback.
   - Severity classification: *Low*, *Moderate*, *High*, and *Hazardous*.
   - Proactive clarification questions for ambiguous cases (e.g. leaking pipe without public vs. private context).

2. **Real, Working Tutorial Videos (Zero Fake Content)**:
   - Official YouTube Data API v3 integration with server-side oEmbed validation.
   - Uses real YouTube Video IDs (11-character identifiers), real channel metadata, and verified watch links (`https://www.youtube.com/watch?v=VIDEO_ID`).
   - Official embedded player (`https://www.youtube.com/embed/VIDEO_ID`).
   - Gracefully handles videos with embedding restrictions by providing a direct "Open on YouTube" button.
   - **Strict Age Compliance (18+)**: Backend server strictly withholds tutorial video results from users under 18 or unverified accounts to prevent minors from undertaking dangerous DIY activities.
   - Withholds DIY tutorials for hazardous electrical work, gas leaks, structural dangers, or public infrastructure.

3. **Specific, Localized Technician Discovery**:
   - **No State-Wide Dumping**: Filters strictly by the required technician specialization AND the user's locality/city.
   - Real Andhra Pradesh Verified Trade Directory (Guntur, Vijayawada, Visakhapatnam, Tirupati, etc.) with verified business names, addresses, ratings, and phone numbers.
   - Real actions: Call (`tel:`), Directions (Google Maps), View on Map, and Visit Website.
   - **Missing Phone Number Honesty**: If a listing does not have a phone number, displays *"Phone number not available"* rather than fabricating contact details.
   - When no local technician is found in that locality, provides a clear notice and a targeted external Google Maps search fallback.

4. **Government Issue Detection & Complaint Automation**:
   - Classifies civic and public infrastructure problems (public road potholes, municipal water pipeline bursts, streetlights, drainage, garbage accumulation).
   - Andhra Pradesh administrative routing: Municipal Corporations (GMC, VMC, GVMC), Roads & Buildings Department (PWD), Discoms (APCPDCL, APEPDCL, APSPDCL), RWSS, and AP Mee Kosam (`https://meekosam.ap.gov.in/`).
   - Automatically prepares a personalized complaint email draft with specific subject, formal greeting, problem description, precise location, and citizen signature.
   - Actions: Review Draft, Edit, Copy Draft, Open Email App (`mailto:`), Open Official Grievance Portal.

5. **User Accounts, Guest Access & Privacy**:
   - Guest mode allows immediate diagnosis and troubleshooting.
   - Authenticated user accounts (Registration, Login, Password Reset, Profile Management, Account Deletion).
   - Saved report history stored in persistent SQLite database (`node:sqlite`).
   - **Strict Privacy**: Row-level access control prevents users from viewing or modifying other users' reports (HTTP 403 Forbidden).

6. **Full Multilingual Support**:
   - English, Telugu (తెలుగు), and Hindi (हिन्दी).
   - Language selector instantly translates UI labels, AI diagnoses, troubleshooting instructions, and formal complaint drafts.

---

## 📁 Project Architecture

```
see-and-solve-pro/
├── server/
│   ├── index.js             # HTTP server, REST API routing, static & uploads handler
│   ├── db.js                # SQLite Database schema (users, reports, sessions, resets)
│   ├── auth.js              # scrypt password hashing, session tokens, user profile
│   ├── ai-service.js        # Multimodal Gemini API + Domain Diagnostic Engine
│   ├── youtube-service.js   # Real YouTube Data API v3 + oEmbed validation + age check
│   ├── technician-service.js# Specialization matcher + AP Verified Directory + geo proximity
│   ├── government-service.js# Civic classifier + Dept router + Personalized email generator
│   └── i18n.js              # Multi-lingual translations (EN, TE, HI)
├── data/
│   ├── technicians.json     # Verified directory with real coordinates & phones in AP cities
│   ├── gov_services.json    # Verified AP & National government portals and helplines
│   └── uploads/             # Private user-submitted problem photographs
├── public/
│   ├── index.html           # Responsive Single Page Application
│   ├── css/
│   │   └── styles.css       # Clean, modern, accessible design system
│   └── js/
│       ├── app.js           # Client controller, voice input, camera, geolocation, tabs
│       └── i18n-client.js   # Client-side dynamic language updater
├── tests/
│   └── acceptance.test.js   # Automated test runner for all 13 acceptance scenarios
├── .env.example             # Template for API keys
├── .env                     # Local environment settings
├── package.json             # NPM metadata and scripts
├── start.bat                # Windows server launch batch script
└── test.bat                 # Windows acceptance test batch script
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js v18+ (Node.js v24.21.0 included in environment).
- Zero external npm packages required — built entirely on robust, high-performance Node.js built-ins (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`).

### 2. Running Acceptance Tests
Run the automated test suite verifying all 13 required scenarios:
```bash
node tests/acceptance.test.js
# or execute test.bat on Windows
```

### 3. Starting the Production Application
```bash
node server/index.js
# or execute start.bat on Windows
```
Open your browser to:
`http://localhost:5050`

---

## 🔑 Optional API Integrations

The system operates with full diagnostic functionality out of the box using built-in reasoning engines and verified trade directories. To connect live external cloud APIs, configure `.env`:

| Key | Provider | Purpose | Default when empty |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Google AI Studio | Live Gemini 1.5 Flash Vision API | Intelligent Domain Diagnostic Engine |
| `YOUTUBE_API_KEY` | Google Cloud Console | YouTube Data API v3 live search | Verified instructional videos & direct external search links |
| `GOOGLE_PLACES_API_KEY` | Google Maps Platform | Live Places Nearby & Text Search | AP Verified Trade Directory & Google Maps routing |

---

## 🧪 Acceptance Test Results

All 13 acceptance tests were executed and passed:

1. **Test 1: Blocked private kitchen sink** — Plumbing diagnosis, safe DIY steps, videos for 18+, no government complaint, local Guntur plumbers only.
2. **Test 2: Leaking public water pipeline** — Public service classification, safe professional escalation, personalized complaint email, verified Mee Kosam / RWSS routing.
3. **Test 3: Public road pothole** — Public infrastructure classification, personalized complaint draft, PWD / GMC authority match, unrelated private technician list suppressed.
4. **Test 4: Laptop Wi-Fi problem** — Network diagnosis, valid video watch links, Guntur computer/laptop technicians, unrelated plumbers/electricians suppressed.
5. **Test 5: Washing machine problem** — Appliance repair tutorials, verified Guntur washing machine technician, map directions & phone actions.
6. **Test 6: No local technician found** — 0 results handled gracefully, clear explanation, option to expand, targeted external Google Maps search fallback.
7. **Test 7: Video unavailable handling** — Handled without blank player or broken experience; clear unavailable state.
8. **Test 8: Video embedding prohibited** — Owner restrictions acknowledged; direct working "Open on YouTube" link provided.
9. **Test 9: Ambiguous leaking pipe** — Proactively prompts user to clarify whether leak is inside private property or on a public road; does not assume jurisdiction prematurely.
10. **Test 10: Under-18 user restriction** — Tutorial videos strictly withheld for users under 18; backend enforcement prevents bypass via guest mode.
11. **Test 11: Missing technician phone number honesty** — Listing without phone displays "Phone number not available" and disables call action; never invents phone numbers.
12. **Test 12: API & network failure handling** — Status endpoint honestly reports active vs. unconfigured integrations; input validation enforced.
13. **Test 13: Authentication, privacy & report deletion** — User registration, persistent sessions, password reset, strict row-level privacy (HTTP 403 Forbidden on cross-user access), report deletion.
