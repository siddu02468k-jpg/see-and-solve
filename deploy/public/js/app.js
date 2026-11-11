/**
 * See & Solve — Main Client Application Controller
 * AI Visual Problem Diagnostics, Interactive AI Video Player & Local Action Hub
 */

(function () {
  'use strict';

  // State
  let currentUser = null;
  let currentReportData = null;
  let currentImageBase64 = null;
  let currentMimeType = null;
  let speechRecognition = null;
  let isRecordingVoice = false;

  // Camera State
  let cameraStream = null;
  let cameraFacingMode = 'environment'; // 'environment' (back) or 'user' (selfie)

  // AI Interactive Video Player State
  const aiPlayer = {
    data: null,
    isPlaying: false,
    currentSceneIndex: 0,
    sceneElapsed: 0,
    sceneDuration: 12,
    timerInterval: null,
    animFrameId: null,
    isVoiceMuted: false,
    isCcOn: true,
    canvasCtx: null,
    pulseVal: 0
  };

  // DOM Elements
  const els = {
    // Stepper
    stepPill1: document.getElementById('step-pill-1'),
    stepPill2: document.getElementById('step-pill-2'),
    stepPill3: document.getElementById('step-pill-3'),

    // Nav & Tabs
    tabButtons: document.querySelectorAll('.nav-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    userBadge: document.getElementById('user-badge'),
    userBadgeText: document.getElementById('user-badge-text'),
    authModal: document.getElementById('auth-modal'),
    authModalClose: document.getElementById('modal-close-btn'),
    authTabLogin: document.getElementById('auth-tab-login'),
    authTabRegister: document.getElementById('auth-tab-register'),
    authFormLogin: document.getElementById('auth-form-login'),
    authFormRegister: document.getElementById('auth-form-register'),
    forgotPasswordLink: document.getElementById('forgot-password-link'),
    forgotPasswordModal: document.getElementById('forgot-modal'),
    forgotModalClose: document.getElementById('forgot-modal-close'),
    forgotForm: document.getElementById('forgot-form'),
    langSelector: document.getElementById('global-lang-select'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    resultsQuickNav: document.getElementById('results-quick-nav'),
    btnScrollTop: document.getElementById('btn-scroll-top'),
    mobileNavItems: document.querySelectorAll('.mobile-bottom-nav .m-nav-item'),
    mNavSolutions: document.getElementById('m-nav-solutions'),

    // Problem Submission Form
    problemForm: document.getElementById('problem-form'),
    imageInput: document.getElementById('image-file-input'),
    dropzone: document.getElementById('upload-dropzone'),
    btnOpenCameraModal: document.getElementById('btn-open-camera-modal'),
    btnBrowseFile: document.getElementById('btn-browse-file'),
    previewWrapper: document.getElementById('image-preview-wrapper'),
    previewImage: document.getElementById('image-preview'),
    replaceImageBtn: document.getElementById('btn-replace-image'),
    removeImageBtn: document.getElementById('btn-remove-image'),
    descInput: document.getElementById('problem-description'),
    voiceBtn: document.getElementById('btn-voice-input'),
    voiceBtnText: document.getElementById('voice-btn-text'),
    locationInput: document.getElementById('location-input'),
    detectLocationBtn: document.getElementById('btn-detect-location'),
    ageSelect: document.getElementById('user-age-select'),
    submitBtn: document.getElementById('btn-submit-problem'),
    formError: document.getElementById('form-error-msg'),

    // Live Camera Modal
    cameraModal: document.getElementById('camera-modal'),
    cameraCloseBtn: document.getElementById('btn-close-camera'),
    cameraCancelBtn: document.getElementById('btn-cancel-camera'),
    cameraFlipBtn: document.getElementById('btn-flip-camera'),
    cameraSnapBtn: document.getElementById('btn-snap-photo'),
    cameraVideoFeed: document.getElementById('camera-video-feed'),
    cameraCaptureCanvas: document.getElementById('camera-capture-canvas'),
    cameraLoadingOverlay: document.getElementById('camera-loading-overlay'),

    // Results Section
    resultsContainer: document.getElementById('results-container'),
    diagSection: document.getElementById('diag-section'),
    diagBadge: document.getElementById('diag-severity-badge'),
    diagIssue: document.getElementById('diag-likely-issue'),
    diagObject: document.getElementById('diag-affected-object'),
    diagSymptoms: document.getElementById('diag-symptoms'),
    diagFacts: document.getElementById('diag-facts'),
    diagAssumptions: document.getElementById('diag-assumptions'),
    diagModelUsed: document.getElementById('diag-model-used'),
    gaugeNeedle: document.getElementById('gauge-needle'),

    // Clarification Section
    clarificationSection: document.getElementById('clarification-section'),
    clarificationQuestions: document.getElementById('clarification-questions'),
    clarificationAnswerInput: document.getElementById('clarification-answer-input'),
    btnSubmitClarification: document.getElementById('btn-submit-clarification'),

    // Troubleshooting Section
    troubleSection: document.getElementById('trouble-section'),
    troubleChecks: document.getElementById('trouble-checks'),
    troubleSteps: document.getElementById('trouble-steps'),
    troubleStop: document.getElementById('trouble-stop-box'),

    // Video Section & AI Player
    videoSection: document.getElementById('video-section'),
    tabBtnAiVideo: document.getElementById('tab-btn-ai-video'),
    tabBtnYtVideo: document.getElementById('tab-btn-yt-video'),
    aiVideoPlayerContainer: document.getElementById('ai-video-player-container'),
    ytVideoContainer: document.getElementById('yt-video-container'),
    aiVideoTitle: document.getElementById('ai-video-title'),
    aiVideoStepTag: document.getElementById('ai-video-step-tag'),
    aiVisualCanvas: document.getElementById('ai-visual-canvas'),
    aiOverlayStepTitle: document.getElementById('ai-overlay-step-title'),
    aiOverlayInstruction: document.getElementById('ai-overlay-instruction'),
    aiOverlayOutcome: document.getElementById('ai-overlay-outcome'),
    btnAiPlayBig: document.getElementById('btn-ai-play-big'),
    btnAiPlay: document.getElementById('btn-ai-play'),
    btnAiPrev: document.getElementById('btn-ai-prev'),
    btnAiNext: document.getElementById('btn-ai-next'),
    btnAiVoiceToggle: document.getElementById('btn-ai-voice-toggle'),
    btnAiCcToggle: document.getElementById('btn-ai-cc-toggle'),
    btnAiRestart: document.getElementById('btn-ai-restart'),
    aiTimeDisplay: document.getElementById('ai-time-display'),
    aiScrubber: document.getElementById('ai-scrubber'),
    aiScrubberProgress: document.getElementById('ai-scrubber-progress'),
    aiSubtitlesBar: document.getElementById('ai-subtitles-bar'),
    aiSubtitlesText: document.getElementById('ai-subtitles-text'),
    aiChapterPills: document.getElementById('ai-chapter-pills'),
    videoGrid: document.getElementById('video-grid'),
    videoNotice: document.getElementById('video-notice-box'),

    // Technician Section
    techSection: document.getElementById('tech-section'),
    techHeaderSubtitle: document.getElementById('tech-header-subtitle'),
    techGrid: document.getElementById('tech-grid'),
    techNotice: document.getElementById('tech-notice-box'),

    // Government Section
    govSection: document.getElementById('gov-section'),
    govAuthorityCard: document.getElementById('gov-authority-card'),
    govSubjectInput: document.getElementById('gov-email-subject'),
    govBodyTextarea: document.getElementById('gov-email-body'),
    btnCopyEmail: document.getElementById('btn-copy-email'),
    btnOpenMailto: document.getElementById('btn-open-mailto'),
    btnOpenPortal: document.getElementById('btn-open-portal'),
    saveReportRow: document.getElementById('save-report-row'),
    btnSaveReport: document.getElementById('btn-save-report'),

    // Reports Tab
    reportsListContainer: document.getElementById('reports-list-container'),
    noReportsNotice: document.getElementById('no-reports-notice'),

    // Profile Tab
    profileContainer: document.getElementById('profile-container'),
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profileAge: document.getElementById('profile-age'),
    btnLogout: document.getElementById('btn-logout'),
    btnDeleteAccount: document.getElementById('btn-delete-account'),
    apiHealthContainer: document.getElementById('api-health-container'),

    // Toast
    toast: document.getElementById('toast-msg')
  };

  // Toast Notification
  let toastTimer = null;
  function showToast(msg, duration = 3000) {
    if (!els.toast) return;
    if (toastTimer) clearTimeout(toastTimer);
    els.toast.textContent = msg;
    els.toast.style.display = 'block';
    els.toast.classList.add('visible');
    toastTimer = setTimeout(() => {
      els.toast.style.display = 'none';
      els.toast.classList.remove('visible');
      toastTimer = null;
    }, duration);
  }

  // Stepper Controller
  function updateStepper(activeStep) {
    if (!els.stepPill1 || !els.stepPill2 || !els.stepPill3) return;
    [els.stepPill1, els.stepPill2, els.stepPill3].forEach((pill, idx) => {
      const stepNum = idx + 1;
      pill.classList.remove('active', 'completed');
      if (stepNum < activeStep) {
        pill.classList.add('completed');
      } else if (stepNum === activeStep) {
        pill.classList.add('active');
      }
    });
  }

  // Navigation Switch
  function switchTab(tabId) {
    els.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    if (els.mobileNavItems) {
      els.mobileNavItems.forEach(item => {
        const itemTab = item.getAttribute('data-tab');
        if (itemTab) {
          item.classList.toggle('active', itemTab === tabId);
        }
      });
    }
    els.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // Update Unique Page Title per tab
    const pageTitles = {
      report: 'Report a Real-World Problem | See & Solve',
      reports: 'My Saved Reports | See & Solve',
      profile: 'User Profile & System Settings | See & Solve'
    };
    document.title = pageTitles[tabId] || 'See & Solve — AI Visual Problem Diagnostics';

    // Update Interactive Breadcrumb
    const bcCurrent = document.getElementById('bc-current-tab');
    const bcSep = document.getElementById('bc-solutions-sep');
    const bcSol = document.getElementById('bc-solutions-item');
    if (bcCurrent) {
      if (tabId === 'report') {
        bcCurrent.textContent = 'Diagnostic Node';
      } else if (tabId === 'reports') {
        bcCurrent.textContent = 'My Saved Reports';
        if (bcSep) bcSep.style.display = 'none';
        if (bcSol) bcSol.style.display = 'none';
      } else if (tabId === 'profile') {
        bcCurrent.textContent = 'Profile & Settings';
        if (bcSep) bcSep.style.display = 'none';
        if (bcSol) bcSol.style.display = 'none';
      }
    }

    if (tabId === 'reports') {
      loadUserReports();
    } else if (tabId === 'profile') {
      loadProfileData();
    }
  }

  els.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  // Make Logo Clickable to navigate to home/report and scroll to top smoothly
  const logoLink = document.querySelector('.logo-container');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Footer navigation tab links
  document.querySelectorAll('.footer-tab-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = trigger.getAttribute('data-tab');
      if (targetTab) {
        switchTab(targetTab);
        const targetPane = document.getElementById(`tab-${targetTab}`);
        if (targetPane) {
          targetPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Dynamic Copyright Year
  const copyrightYearEl = document.getElementById('copyright-year');
  if (copyrightYearEl) {
    copyrightYearEl.textContent = new Date().getFullYear();
  }

  // Footer Legal and Accessibility Links
  document.querySelectorAll('.footer-legal-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const text = link.textContent.trim();
      if (text.includes('Privacy')) {
        showToast('Privacy Safeguards: See & Solve encrypts citizen telemetry. No personal identifiers are stored without consent.', 'info');
      } else if (text.includes('Terms')) {
        showToast('Terms of Service: Authorized civic reporting tool compliant with AP State Digital Governance guidelines.', 'info');
      } else if (text.includes('Accessibility')) {
        showToast('WCAG 2.1 AAA Compliant: Screen-reader verified, keyboard accessible, and high contrast compliant.', 'info');
      }
    });
  });

  // Mobile Bottom Navigation
  if (els.mobileNavItems) {
    els.mobileNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) {
          switchTab(tab);
        }
      });
    });
  }
  if (els.mNavSolutions) {
    els.mNavSolutions.addEventListener('click', () => {
      switchTab('report');
      if (els.resultsContainer) {
        els.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Theme Management (Dark / Light)
  const savedTheme = localStorage.getItem('see_and_solve_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('see_and_solve_theme', theme);
    if (els.themeToggleBtn) {
      els.themeToggleBtn.innerHTML = theme === 'dark'
        ? `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
      els.themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    }
  }
  applyTheme(savedTheme);
  if (els.themeToggleBtn) {
    els.themeToggleBtn.addEventListener('click', () => {
      const curTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(curTheme === 'dark' ? 'light' : 'dark');
    });
  }

  // Floating Scroll-to-Top Button
  if (els.btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 280) {
        els.btnScrollTop.classList.add('visible');
      } else {
        els.btnScrollTop.classList.remove('visible');
      }
    });
    els.btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Language Change
  if (els.langSelector) {
    const savedLang = localStorage.getItem('see_and_solve_lang') || 'en';
    els.langSelector.value = savedLang;
    if (window.applyClientLanguage) {
      window.applyClientLanguage(savedLang);
    }

    els.langSelector.addEventListener('change', (e) => {
      const newLang = e.target.value;
      if (window.applyClientLanguage) {
        window.applyClientLanguage(newLang);
      }
    });
  }

  // Session Check
  async function checkSession() {
    try {
      const token = localStorage.getItem('see_and_solve_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();

      if (data.success && data.user) {
        currentUser = data.user;
        updateUserBadge(data.user);
        if (currentUser.age) syncAgeChoice(currentUser.age);
      } else {
        currentUser = null;
        updateUserBadge(null);
      }
    } catch (e) {
      currentUser = null;
      updateUserBadge(null);
    }
  }

  function updateUserBadge(user) {
    if (!els.userBadge || !els.userBadgeText) return;
    if (user) {
      els.userBadge.className = 'user-badge';
      els.userBadgeText.textContent = user.name || user.email;
    } else {
      els.userBadge.className = 'user-badge guest';
      els.userBadgeText.textContent = 'Guest (Sign In)';
    }
  }

  // Auth Modal
  if (els.userBadge) {
    els.userBadge.addEventListener('click', () => {
      if (currentUser) {
        switchTab('profile');
      } else {
        openAuthModal('login');
      }
    });
  }

  function openAuthModal(mode = 'login') {
    if (!els.authModal) return;
    els.authModal.classList.add('active');
    setAuthMode(mode);
  }

  function closeAuthModal() {
    if (els.authModal) els.authModal.classList.remove('active');
  }

  if (els.authModalClose) els.authModalClose.addEventListener('click', closeAuthModal);

  function setAuthMode(mode) {
    if (mode === 'login') {
      els.authTabLogin.classList.add('active');
      els.authTabRegister.classList.remove('active');
      els.authFormLogin.style.display = 'block';
      els.authFormRegister.style.display = 'none';
    } else {
      els.authTabRegister.classList.add('active');
      els.authTabLogin.classList.remove('active');
      els.authFormRegister.style.display = 'block';
      els.authFormLogin.style.display = 'none';
    }
  }

  if (els.authTabLogin) els.authTabLogin.addEventListener('click', () => setAuthMode('login'));
  if (els.authTabRegister) els.authTabRegister.addEventListener('click', () => setAuthMode('register'));

  // Auth Submit: Login
  if (els.authFormLogin) {
    els.authFormLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error-msg');
      errorEl.style.display = 'none';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
          currentUser = data.user;
          localStorage.setItem('see_and_solve_token', data.token);
          updateUserBadge(data.user);
          if (data.user && data.user.age) syncAgeChoice(data.user.age);
          closeAuthModal();
          showToast(`Welcome back, ${data.user.name || data.user.email}!`);
          if (currentReportData) saveCurrentReportToAccount();
        } else {
          errorEl.textContent = data.error || 'Login failed';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        errorEl.textContent = 'Server connection error. Ensure backend is running.';
        errorEl.style.display = 'block';
      }
    });
  }

  // Auth Submit: Register
  if (els.authFormRegister) {
    els.authFormRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const age = document.getElementById('reg-age').value;
      const errorEl = document.getElementById('reg-error-msg');
      errorEl.style.display = 'none';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            age: age ? parseInt(age) : null,
            preferredLanguage: els.langSelector ? els.langSelector.value : 'en'
          })
        });
        const data = await res.json();
        if (data.success) {
          currentUser = data.user;
          localStorage.setItem('see_and_solve_token', data.token);
          updateUserBadge(data.user);
          if (data.user && data.user.age) syncAgeChoice(data.user.age);
          closeAuthModal();
          showToast(`Account created successfully. Welcome, ${data.user.name}!`);
          if (currentReportData) saveCurrentReportToAccount();
        } else {
          errorEl.textContent = data.error || 'Registration failed';
          errorEl.style.display = 'block';
        }
      } catch (err) {
        errorEl.textContent = 'Network or server error during registration.';
        errorEl.style.display = 'block';
      }
    });
  }

  // Forgot Password
  if (els.forgotPasswordLink) {
    els.forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthModal();
      if (els.forgotPasswordModal) els.forgotPasswordModal.classList.add('active');
    });
  }
  if (els.forgotModalClose) {
    els.forgotModalClose.addEventListener('click', () => {
      if (els.forgotPasswordModal) els.forgotPasswordModal.classList.remove('active');
    });
  }
  if (els.forgotForm) {
    els.forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      const msgEl = document.getElementById('forgot-msg');
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        msgEl.textContent = data.message || 'Password reset requested.';
        msgEl.style.color = '#16a34a';
        msgEl.style.display = 'block';
      } catch (e) {
        msgEl.textContent = 'Request failed';
        msgEl.style.color = '#dc2626';
        msgEl.style.display = 'block';
      }
    });
  }

  // =========================================================================
  // LIVE CAMERA VIEWFINDER (In-Browser getUserMedia)
  // =========================================================================
  async function openLiveCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Live camera streaming is not supported by this browser. Falling back to file upload.');
      if (els.imageInput) els.imageInput.click();
      return;
    }

    if (els.cameraModal) els.cameraModal.classList.add('active');
    if (els.cameraLoadingOverlay) els.cameraLoadingOverlay.style.display = 'block';

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (els.cameraVideoFeed) {
        els.cameraVideoFeed.srcObject = cameraStream;
        els.cameraVideoFeed.onloadedmetadata = () => {
          els.cameraVideoFeed.play();
          if (els.cameraLoadingOverlay) els.cameraLoadingOverlay.style.display = 'none';
        };
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      if (els.cameraLoadingOverlay) els.cameraLoadingOverlay.textContent = 'Camera permission denied or camera in use.';
      setTimeout(() => {
        closeLiveCamera();
        if (els.imageInput) els.imageInput.click();
      }, 1200);
    }
  }

  function closeLiveCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    if (els.cameraVideoFeed) {
      els.cameraVideoFeed.srcObject = null;
    }
    if (els.cameraModal) els.cameraModal.classList.remove('active');
  }

  function flipCamera() {
    cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    openLiveCamera();
  }

  function captureSnapshot() {
    if (!els.cameraVideoFeed || !els.cameraCaptureCanvas) return;
    const video = els.cameraVideoFeed;
    const canvas = els.cameraCaptureCanvas;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    currentMimeType = 'image/jpeg';
    currentImageBase64 = canvas.toDataURL('image/jpeg', 0.88);

    if (els.previewImage) els.previewImage.src = currentImageBase64;
    if (els.previewWrapper) els.previewWrapper.style.display = 'block';
    if (els.dropzone) els.dropzone.style.display = 'none';

    closeLiveCamera();
    showToast('Photo captured successfully!');
  }

  if (els.btnOpenCameraModal) els.btnOpenCameraModal.addEventListener('click', openLiveCamera);
  if (els.btnBrowseFile) els.btnBrowseFile.addEventListener('click', () => els.imageInput && els.imageInput.click());
  if (els.cameraCloseBtn) els.cameraCloseBtn.addEventListener('click', closeLiveCamera);
  if (els.cameraCancelBtn) els.cameraCancelBtn.addEventListener('click', closeLiveCamera);
  if (els.cameraFlipBtn) els.cameraFlipBtn.addEventListener('click', flipCamera);
  if (els.cameraSnapBtn) els.cameraSnapBtn.addEventListener('click', captureSnapshot);

  // File Input Drag & Drop
  if (els.dropzone && els.imageInput) {
    els.dropzone.addEventListener('click', () => els.imageInput.click());

    els.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.dropzone.style.borderColor = 'var(--primary)';
    });

    els.dropzone.addEventListener('dragleave', () => {
      els.dropzone.style.borderColor = 'var(--gray-300)';
    });

    els.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.dropzone.style.borderColor = 'var(--gray-300)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    els.imageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    currentMimeType = file.type;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageBase64 = e.target.result;
      els.previewImage.src = currentImageBase64;
      els.previewWrapper.style.display = 'block';
      els.dropzone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  if (els.replaceImageBtn) {
    els.replaceImageBtn.addEventListener('click', () => {
      if (els.imageInput) els.imageInput.click();
    });
  }

  if (els.removeImageBtn) {
    els.removeImageBtn.addEventListener('click', () => {
      currentImageBase64 = null;
      currentMimeType = null;
      els.previewImage.src = '';
      els.previewWrapper.style.display = 'none';
      els.dropzone.style.display = 'block';
      if (els.imageInput) els.imageInput.value = '';
    });
  }

  // =========================================================================
  // QUICK SAMPLE PRESETS
  // =========================================================================
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const desc = btn.getAttribute('data-desc');
      const loc = btn.getAttribute('data-loc');
      if (els.descInput) els.descInput.value = desc;
      if (els.locationInput) els.locationInput.value = loc;
      syncAgeChoice("18");
      showToast(`Preset loaded: ${btn.textContent.trim()}`);
      if (els.descInput) els.descInput.focus();
    });
  });

  // =========================================================================
  // QUICK CITY SELECTOR CHIPS
  // =========================================================================
  document.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const city = chip.getAttribute('data-city');
      const lat = parseFloat(chip.getAttribute('data-lat'));
      const lng = parseFloat(chip.getAttribute('data-lng'));
      if (els.locationInput) {
        els.locationInput.value = city;
      }
      window.lastKnownCoords = { lat, lng };
      showToast(`Location set to ${city}`);
    });
  });

  // =========================================================================
  // AGE VERIFICATION & EQUAL ACCESS FOR ALL USERS (GUESTS & SIGNED-UP)
  // =========================================================================
  function syncAgeChoice(val) {
    const ageNum = parseInt(val) || 18;
    const effectiveAge = ageNum >= 18 ? "18" : "15";
    if (els.ageSelect) els.ageSelect.value = effectiveAge;

    const radios = document.querySelectorAll('input[name="age-option"]');
    radios.forEach(r => {
      r.checked = (r.value === effectiveAge);
    });

    const card18 = document.getElementById('age-choice-18');
    const cardMinor = document.getElementById('age-choice-minor');
    if (card18 && cardMinor) {
      if (effectiveAge === "18") {
        card18.classList.add('selected');
        cardMinor.classList.remove('selected');
      } else {
        cardMinor.classList.add('selected');
        card18.classList.remove('selected');
      }
    }
  }

  // Wire radio button change events
  document.querySelectorAll('input[name="age-option"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      syncAgeChoice(e.target.value);
    });
  });

  // Make entire card interactive
  document.querySelectorAll('.age-choice-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio && e.target !== radio) {
        radio.checked = true;
        syncAgeChoice(radio.value);
      }
    });
  });

  // =========================================================================
  // VOICE INPUT VIA WEB SPEECH API
  // =========================================================================
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;

    speechRecognition.onstart = () => {
      isRecordingVoice = true;
      if (els.voiceBtn) els.voiceBtn.classList.add('recording');
      if (els.voiceBtnText) els.voiceBtnText.textContent = 'Listening... Speak now';
    };

    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (els.descInput) {
        els.descInput.value = els.descInput.value ? `${els.descInput.value} ${transcript}` : transcript;
        els.descInput.focus();
      }
      showToast('Voice transcribed successfully!');
    };

    speechRecognition.onerror = (e) => {
      console.warn('Speech recognition error:', e);
      stopVoiceRecording();
    };

    speechRecognition.onend = () => {
      stopVoiceRecording();
    };

    if (els.voiceBtn) {
      els.voiceBtn.addEventListener('click', () => {
        if (!isRecordingVoice) {
          try {
            const lang = els.langSelector ? els.langSelector.value : 'en';
            speechRecognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
            speechRecognition.start();
          } catch (err) {
            console.warn('Speech start error:', err);
          }
        } else {
          speechRecognition.stop();
        }
      });
    }
  } else {
    if (els.voiceBtn) {
      els.voiceBtn.title = "Voice recognition not supported in this browser";
      els.voiceBtn.style.opacity = "0.6";
    }
  }

  function stopVoiceRecording() {
    isRecordingVoice = false;
    if (els.voiceBtn) {
      els.voiceBtn.classList.remove('recording');
    }
    if (els.voiceBtnText) {
      els.voiceBtnText.textContent = 'Voice Input';
    }
  }

  // =========================================================================
  // GEOLOCATION DETECTION
  // =========================================================================
  const KNOWN_CITIES = [
    { name: 'Guntur', lat: 16.3067, lng: 80.4365 },
    { name: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Tirupati', lat: 13.6288, lng: 79.4192 },
    { name: 'Rajahmundry', lat: 17.0005, lng: 81.8040 },
    { name: 'Kakinada', lat: 16.9891, lng: 82.2475 },
    { name: 'Nellore', lat: 14.4426, lng: 79.9865 },
    { name: 'Kurnool', lat: 15.8281, lng: 78.0373 },
    { name: 'Anantapur', lat: 14.6819, lng: 77.6006 },
    { name: 'Kadapa', lat: 14.4674, lng: 78.8241 },
    { name: 'Eluru', lat: 16.7107, lng: 81.0952 },
    { name: 'Ongole', lat: 15.5057, lng: 80.0499 }
  ];

  function findNearestCity(lat, lng) {
    let nearest = KNOWN_CITIES[0];
    let minDist = Infinity;
    for (const city of KNOWN_CITIES) {
      const dLat = city.lat - lat;
      const dLng = city.lng - lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }
    return nearest.name;
  }

  if (els.detectLocationBtn) {
    els.detectLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      els.detectLocationBtn.textContent = 'Detecting...';
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          window.lastKnownCoords = { lat, lng };

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`, {
              headers: { 'User-Agent': 'SeeAndSolveApp/1.0' }
            });
            if (response.ok) {
              const geoData = await response.json();
              const addr = geoData.address || {};
              const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
              const suburb = addr.suburb || addr.neighbourhood || addr.road || '';
              if (city) {
                els.locationInput.value = suburb ? `${suburb}, ${city}` : city;
              } else {
                els.locationInput.value = findNearestCity(lat, lng);
              }
            } else {
              els.locationInput.value = findNearestCity(lat, lng);
            }
          } catch (e) {
            els.locationInput.value = findNearestCity(lat, lng);
          }
          const accStr = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
          els.detectLocationBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> <span>Location Set${accStr}</span>`;
        },
        (error) => {
          console.warn('Geolocation error:', error);
          alert('Unable to retrieve automatic location. Please select your city from the badges below.');
          els.detectLocationBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> <span>GPS Location</span>`;
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  }

  // =========================================================================
  // PROBLEM FORM SUBMISSION
  // =========================================================================
  if (els.problemForm) {
    els.problemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (els.formError) els.formError.style.display = 'none';

      const description = (els.descInput.value || '').trim();
      if (!description || description.length < 3) {
        showFormError('A written description of the problem is mandatory (even when an image is provided).');
        els.descInput.focus();
        return;
      }

      setLoadingState(true);
      updateStepper(2); // Step 2: AI Inspection

      const location = (els.locationInput.value || '').trim();
      const language = els.langSelector ? els.langSelector.value : 'en';
      const ageVal = els.ageSelect ? els.ageSelect.value : null;
      const userAge = ageVal ? parseInt(ageVal) : (currentUser ? currentUser.age : null);

      try {
        const payload = {
          description,
          imageBase64: currentImageBase64,
          mimeType: currentMimeType,
          location,
          coordinates: window.lastKnownCoords || null,
          language,
          age: userAge,
          voiceUsed: Boolean(els.voiceBtn && els.voiceBtn.classList.contains('recording-completed'))
        };

        const res = await fetch('/api/reports/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('see_and_solve_token') ? { 'Authorization': `Bearer ${localStorage.getItem('see_and_solve_token')}` } : {})
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        setLoadingState(false);

        if (!data.success) {
          showFormError(data.error || 'Failed to analyze problem.');
          updateStepper(1);
          return;
        }

        currentReportData = data;
        displayResults(data);
        updateStepper(3); // Step 3: Solution Hub
      } catch (err) {
        setLoadingState(false);
        updateStepper(1);
        showFormError('Network error connecting to diagnostic server. Ensure http://localhost:5050 is running.');
      }
    });
  }

  function showFormError(msg) {
    if (!els.formError) return;
    els.formError.textContent = msg;
    els.formError.style.display = 'block';
  }

  function setLoadingState(loading) {
    if (!els.submitBtn) return;
    els.submitBtn.disabled = loading;
    if (loading) {
      els.submitBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="quantum-spin"><circle cx="12" cy="12" r="9" stroke-dasharray="25 15"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg> <span>Analyzing with Neural Vision Matrix...</span>`;
      els.submitBtn.classList.add('loading-shimmer');
    } else {
      els.submitBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="quantum-spin"><circle cx="12" cy="12" r="9" stroke-dasharray="35 15"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg> <span data-i18n="analyzeButton">Run AI Diagnostics</span>`;
      els.submitBtn.classList.remove('loading-shimmer');
    }
  }

  // =========================================================================
  // DISPLAY RESULTS & AUTOMATIC SMOOTH SCROLL TO SOLUTIONS
  // =========================================================================
  function scrollToSolutions() {
    let target = null;
    if (els.clarificationSection && els.clarificationSection.style.display !== 'none') {
      target = els.clarificationSection;
    } else if (els.resultsQuickNav && els.resultsQuickNav.style.display !== 'none') {
      target = els.resultsQuickNav;
    } else if (els.diagSection && els.diagSection.style.display !== 'none') {
      target = els.diagSection;
    } else {
      target = els.resultsContainer;
    }

    if (!target) return;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const headerEl = document.querySelector('.app-header');
        const headerHeight = headerEl ? headerEl.offsetHeight : 70;
        const targetRect = target.getBoundingClientRect();
        const scrollPosition = targetRect.top + window.pageYOffset - (headerHeight + 20);

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });

        const highlightCard = (target === els.resultsQuickNav && els.diagSection) ? els.diagSection : target;
        if (highlightCard) {
          highlightCard.classList.remove('solution-spotlight');
          void highlightCard.offsetWidth;
          highlightCard.classList.add('solution-spotlight');
        }
      }, 70);
    });
  }

  function displayResults(data) {
    els.resultsContainer.classList.add('visible');

    // Update Interactive Breadcrumb to include Solutions Hub
    const bcSep = document.getElementById('bc-solutions-sep');
    const bcSol = document.getElementById('bc-solutions-item');
    if (bcSep) bcSep.style.display = 'inline-block';
    if (bcSol) bcSol.style.display = 'inline-block';

    if (els.resultsQuickNav) els.resultsQuickNav.style.display = 'block';
    if (els.mNavSolutions) els.mNavSolutions.style.display = 'flex';

    const ai = data.aiAnalysis;
    const sections = data.sections || {};

    // Filter quick nav tabs based on generated sections
    const qnavTrouble = document.getElementById('qnav-trouble');
    const qnavVideo = document.getElementById('qnav-video');
    const qnavTech = document.getElementById('qnav-tech');
    const qnavGov = document.getElementById('qnav-gov');
    if (qnavTrouble) qnavTrouble.style.display = sections.showTroubleshooting ? 'inline-flex' : 'none';
    if (qnavVideo) qnavVideo.style.display = sections.showVideos ? 'inline-flex' : 'none';
    if (qnavTech) qnavTech.style.display = sections.showTechnicians ? 'inline-flex' : 'none';
    if (qnavGov) qnavGov.style.display = sections.showGovernmentHelp ? 'inline-flex' : 'none';

    // Wire quick nav jump buttons with header offset awareness
    document.querySelectorAll('.qnav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const headerEl = document.querySelector('.app-header');
          const headerHeight = headerEl ? headerEl.offsetHeight : 70;
          const quickNavHeight = els.resultsQuickNav ? els.resultsQuickNav.offsetHeight : 50;
          const targetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight + quickNavHeight + 16);
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'smooth'
          });
        }
      };
    });

    // 1. Clarification needed
    if (data.needsClarification) {
      els.clarificationSection.style.display = 'block';
      els.clarificationQuestions.innerHTML = '';
      (data.followUpQuestions || []).forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        els.clarificationQuestions.appendChild(li);
      });

      // Wire quick answers
      document.querySelectorAll('.quick-answer-btn').forEach(btn => {
        btn.onclick = () => {
          if (els.clarificationAnswerInput) {
            els.clarificationAnswerInput.value = btn.getAttribute('data-ans');
            els.clarificationAnswerInput.focus();
          }
        };
      });

      // Hide other sections until clarified
      els.diagSection.style.display = 'none';
      els.troubleSection.style.display = 'none';
      els.videoSection.style.display = 'none';
      els.techSection.style.display = 'none';
      els.govSection.style.display = 'none';
      scrollToSolutions();
      return;
    } else {
      els.clarificationSection.style.display = 'none';
    }

    // 2. AI Diagnostics Card
    els.diagSection.style.display = 'block';
    els.diagIssue.textContent = ai.likely_issue || 'Problem diagnosed';
    els.diagObject.textContent = ai.affected_asset_or_service || 'Asset';

    // Severity Gauge Needle & Badge
    const sev = (ai.severity || 'Moderate').toLowerCase();
    els.diagBadge.className = `badge badge-${sev}`;
    els.diagBadge.textContent = `${ai.severity} Risk`;

    if (els.gaugeNeedle) {
      let angle = 0;
      if (sev.includes('low')) angle = -55;
      else if (sev.includes('mod')) angle = 0;
      else if (sev.includes('high')) angle = 45;
      else if (sev.includes('haz')) angle = 70;
      els.gaugeNeedle.style.transform = `rotate(${angle}deg)`;
    }

    // Symptoms
    els.diagSymptoms.innerHTML = '';
    (ai.symptoms_observed || []).forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      els.diagSymptoms.appendChild(li);
    });

    // Facts vs Assumptions
    els.diagFacts.innerHTML = '';
    (ai.facts || []).forEach(f => {
      const p = document.createElement('p');
      p.textContent = `• ${f}`;
      els.diagFacts.appendChild(p);
    });

    els.diagAssumptions.innerHTML = '';
    (ai.assumptions || []).forEach(a => {
      const p = document.createElement('p');
      p.textContent = `• ${a}`;
      els.diagAssumptions.appendChild(p);
    });

    els.diagModelUsed.textContent = ai.ai_model_used || 'See & Solve Vision Intelligence';

    // 3. Safe Troubleshooting (Only show if safe & suitable!)
    if (sections.showTroubleshooting && data.safeTroubleshooting) {
      els.troubleSection.style.display = 'block';
      const tb = data.safeTroubleshooting;

      // Preliminary checks as interactive checklist
      els.troubleChecks.innerHTML = '';
      (tb.safePreliminaryChecks || []).forEach((chk, idx) => {
        const label = document.createElement('label');
        label.className = 'check-item';
        label.innerHTML = `
          <input type="checkbox" id="chk-${idx}">
          <span>${escapeHtml(chk)}</span>
        `;
        const chkBox = label.querySelector('input[type="checkbox"]');
        if (chkBox) {
          chkBox.addEventListener('change', () => {
            label.classList.toggle('completed', chkBox.checked);
          });
        }
        els.troubleChecks.appendChild(label);
      });

      // Numbered Steps
      els.troubleSteps.innerHTML = '';
      (tb.steps || []).forEach(st => {
        const item = document.createElement('div');
        item.className = 'step-item';
        item.innerHTML = `
          <div class="step-num">${st.step}</div>
          <div class="step-text">
            <h4>${escapeHtml(st.instruction)}</h4>
            <p><strong>Expected Outcome:</strong> ${escapeHtml(st.expected_outcome)}</p>
          </div>
        `;
        els.troubleSteps.appendChild(item);
      });

      // Stop condition
      els.troubleStop.innerHTML = `<strong style="display:inline-flex; align-items:center; gap:0.35rem; color:var(--danger);"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Critical Stop Threshold:</strong> ${escapeHtml(tb.whenToStop || 'If symptoms persist or require specialized tools.')}`;
    } else {
      els.troubleSection.style.display = 'none';
    }

    // 4. Tutorial Videos (AI Video Player & YouTube Videos)
    const vidData = data.tutorialVideos;
    if (sections.showVideos && vidData && vidData.eligible) {
      els.videoSection.style.display = 'block';
      els.videoNotice.style.display = 'none';

      // Setup AI Interactive Video Player
      if (vidData.aiTutorialVideo) {
        initAiVideoPlayer(vidData.aiTutorialVideo);
      }

      // Setup YouTube Video Cards
      if (vidData.videos && vidData.videos.length > 0) {
        renderVideoCards(vidData.videos);
      } else {
        els.videoGrid.innerHTML = `
          <div style="padding:1.5rem; text-align:center; background:var(--bg-subtle); border-radius:var(--radius-sm); border:1px solid var(--border-card); grid-column:1/-1;">
            <p style="margin-bottom:0.75rem; color:var(--text-muted);">No direct YouTube video embedded for this exact issue. Use the AI Video Player above or search YouTube directly:</p>
            <a href="${vidData.externalSearchUrl || 'https://www.youtube.com'}" target="_blank" rel="noopener noreferrer" class="video-btn" style="display:inline-flex; align-items:center; gap:0.4rem;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Search YouTube for "${escapeHtml(ai.tutorial_search_query || ai.likely_issue)}"</span>
            </a>
          </div>
        `;
      }
    } else if (vidData && (!vidData.eligible || (vidData.videos && vidData.videos.length === 0))) {
      // Under-18 or safety restriction notice
      els.videoSection.style.display = 'block';
      els.aiVideoPlayerContainer.style.display = 'none';
      els.ytVideoContainer.style.display = 'none';
      els.videoNotice.style.display = 'block';

      // Check whether this issue is genuinely unsafe for DIY vs purely an age verification check
      const isHazardOrPublic = !ai || !ai.is_suitable_for_safe_troubleshooting || ai.is_government_related;

      if (isHazardOrPublic) {
        els.videoNotice.innerHTML = `<strong style="display:inline-flex; align-items:center; gap:0.35rem;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Safety Compliance:</strong> ${escapeHtml(vidData.reason || 'DIY tutorial videos are strictly withheld for hazardous or public infrastructure work.')}`;
      } else {
        // Safe DIY task! Directly prompt the user for their age — equal features for guests & signed-up users
        els.videoNotice.innerHTML = `
          <div class="age-unlock-banner">
            <div style="margin-bottom:0.35rem; color:var(--primary);">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <h4>Age Verification Required to Unlock AI Video Tutorials</h4>
            <p>Safety regulations require confirming you are 18 or older to view mechanical and electrical repair tutorial videos. <strong>No sign-in or account is required</strong> — verify your age below to unlock full AI tutorials:</p>
            <div class="age-unlock-actions">
              <button type="button" id="btn-inline-verify-age" class="btn-unlock-videos">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <span>I am 18 or Older — Unlock AI Videos Now</span>
              </button>
              <button type="button" id="btn-inline-stay-minor" class="btn-keep-minor">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>I am Under 18 (Keep Safe Text Only)</span>
              </button>
            </div>
          </div>
        `;

        const btnVerify = document.getElementById('btn-inline-verify-age');
        if (btnVerify) {
          btnVerify.onclick = async () => {
            btnVerify.disabled = true;
            btnVerify.innerHTML = `<span class="spinner"></span> <span>Unlocking AI Videos...</span>`;
            try {
              const verifyRes = await fetch('/api/reports/verify-age', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  age: 18,
                  tutorialSearchQuery: ai.tutorial_search_query || ai.likely_issue,
                  isSafeForDIY: true,
                  technicalCategory: ai.technical_category,
                  language: els.langSelector ? els.langSelector.value : 'en',
                  troubleshootingSteps: data.safeTroubleshooting?.steps || ai.troubleshooting_steps || [],
                  likelyIssue: ai.likely_issue,
                  affectedObject: ai.affected_asset_or_service,
                  safeChecks: data.safeTroubleshooting?.safePreliminaryChecks || ai.safe_preliminary_checks || []
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success && verifyData.tutorialVideos && verifyData.tutorialVideos.eligible) {
                data.tutorialVideos = verifyData.tutorialVideos;
                data.sections.showVideos = true;
                syncAgeChoice(18);
                showToast('✓ Age confirmed (18+). AI video tutorials unlocked!');
                els.videoNotice.style.display = 'none';
                if (verifyData.tutorialVideos.aiTutorialVideo) {
                  initAiVideoPlayer(verifyData.tutorialVideos.aiTutorialVideo);
                }
                if (verifyData.tutorialVideos.videos && verifyData.tutorialVideos.videos.length > 0) {
                  renderVideoCards(verifyData.tutorialVideos.videos);
                }
              } else {
                showToast('Could not unlock videos: ' + (verifyData.error || 'Verification failed'));
                btnVerify.disabled = false;
                btnVerify.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>I am 18 or Older — Unlock AI Videos Now</span>`;
              }
            } catch (err) {
              showToast('Network error during age verification.');
              btnVerify.disabled = false;
              btnVerify.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> <span>I am 18 or Older — Unlock AI Videos Now</span>`;
            }
          };
        }

        const btnMinor = document.getElementById('btn-inline-stay-minor');
        if (btnMinor) {
          btnMinor.onclick = () => {
            els.videoNotice.innerHTML = `
              <div style="padding:1rem; text-align:center;">
                <p><strong style="display:inline-flex; align-items:center; gap:0.35rem;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Safety Mode Active:</strong> Tutorial videos are withheld for users under 18. Please follow the safe preliminary checklist above or contact a verified local technician.</p>
              </div>
            `;
          };
        }
      }
    } else {
      els.videoSection.style.display = 'none';
    }

    // 5. Verified Local Technicians (Only show when appropriate!)
    const techData = data.technicians;
    if (sections.showTechnicians && techData && techData.showTechnicians) {
      els.techSection.style.display = 'block';
      els.techHeaderSubtitle.textContent = `Specialization: ${techData.specialization} • Search Area: ${techData.searchLocation}`;

      if (techData.count > 0 && techData.technicians && techData.technicians.length > 0) {
        els.techNotice.style.display = 'none';
        renderTechnicianCards(techData.technicians);
      } else {
        els.techGrid.innerHTML = '';
        els.techNotice.style.display = 'block';
        els.techNotice.innerHTML = `
          <p><strong>Notice:</strong> ${escapeHtml(techData.message || 'No local technicians found in this area.')}</p>
          ${techData.externalSearchUrl ? `<p style="margin-top:0.5rem;"><a href="${techData.externalSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn-tech-action btn-tech-map"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search Local Providers on Google Maps (External)</a></p>` : ''}
        `;
      }
    } else {
      els.techSection.style.display = 'none';
    }

    // 6. Government Complaint Assistance
    const govData = data.governmentAssistance;
    if (sections.showGovernment && govData && govData.isGovernmentRelated) {
      els.govSection.style.display = 'block';
      const auth = govData.authority;
      const draft = govData.emailDraft;

      els.govAuthorityCard.innerHTML = `
        <h3 style="color:#166534; font-size:1.1rem; margin-bottom:0.25rem; display:flex; align-items:center; gap:0.4rem;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2l10 8H2z"/></svg>
          <span>${escapeHtml(auth?.name || 'Responsible Civic Department')}</span>
        </h3>
        <p style="font-size:0.85rem; color:#14532d; margin-bottom:0.5rem;">${escapeHtml(auth?.description || '')}</p>
        <p style="font-size:0.85rem;"><strong>Toll-Free Helpline:</strong> ${escapeHtml(auth?.tollFree || '1902')} | <strong>Official Portal:</strong> <a href="${escapeHtml(auth?.portalUrl || 'https://meekosam.ap.gov.in')}" target="_blank" rel="noopener noreferrer">${escapeHtml(auth?.portalUrl || 'meekosam.ap.gov.in')}</a></p>
      `;

      if (draft) {
        els.govSubjectInput.value = draft.subject;
        els.govBodyTextarea.value = draft.body;

        els.btnCopyEmail.onclick = () => {
          navigator.clipboard.writeText(`Subject: ${els.govSubjectInput.value}\n\n${els.govBodyTextarea.value}`).then(() => {
            showToast('✓ Complaint email draft copied to clipboard!');
          });
        };

        els.btnOpenMailto.href = `mailto:${encodeURIComponent(draft.recipientEmail || '')}?subject=${encodeURIComponent(els.govSubjectInput.value)}&body=${encodeURIComponent(els.govBodyTextarea.value)}`;

        els.btnOpenPortal.onclick = () => {
          window.open(auth?.portalUrl || 'https://meekosam.ap.gov.in', '_blank');
        };
      }
    } else {
      els.govSection.style.display = 'none';
    }

    // Save report prompt for guests
    if (!currentUser && els.saveReportRow) {
      els.saveReportRow.style.display = 'block';
      els.btnSaveReport.onclick = () => openAuthModal('register');
    } else if (els.saveReportRow) {
      els.saveReportRow.style.display = 'none';
    }

    // Smoothly scroll down to solutions where results are presented
    scrollToSolutions();
  }

  // =========================================================================
  // AI INTERACTIVE VIDEO PLAYER CONTROLLER
  // =========================================================================
  function initAiVideoPlayer(aiVideoData) {
    aiPlayer.data = aiVideoData;
    aiPlayer.currentSceneIndex = 0;
    aiPlayer.sceneElapsed = 0;
    aiPlayer.isPlaying = false;

    if (els.aiVideoPlayerContainer) els.aiVideoPlayerContainer.style.display = 'block';
    if (els.ytVideoContainer) els.ytVideoContainer.style.display = 'none';
    if (els.tabBtnAiVideo) els.tabBtnAiVideo.classList.add('active');
    if (els.tabBtnYtVideo) els.tabBtnYtVideo.classList.remove('active');

    if (els.aiVideoTitle) els.aiVideoTitle.textContent = aiVideoData.title;

    // Render Chapter Pills
    if (els.aiChapterPills) {
      els.aiChapterPills.innerHTML = '';
      aiVideoData.scenes.forEach((sc, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `chapter-pill ${idx === 0 ? 'active' : ''}`;
        pill.textContent = `${idx + 1}. ${sc.actionHighlight || sc.title.substring(0, 18)}`;
        pill.onclick = () => jumpToScene(idx);
        els.aiChapterPills.appendChild(pill);
      });
    }

    // Init Canvas
    if (els.aiVisualCanvas) {
      aiPlayer.canvasCtx = els.aiVisualCanvas.getContext('2d');
      drawCanvasScene(0, 0);
    }

    updatePlayerUI();
  }

  function updatePlayerUI() {
    if (!aiPlayer.data) return;
    const scene = aiPlayer.data.scenes[aiPlayer.currentSceneIndex];
    if (!scene) return;

    if (els.aiVideoStepTag) {
      els.aiVideoStepTag.textContent = `Step ${scene.stepNumber} of ${aiPlayer.data.scenesCount}`;
    }
    if (els.aiOverlayStepTitle) {
      els.aiOverlayStepTitle.textContent = scene.title;
    }
    if (els.aiOverlayInstruction) {
      els.aiOverlayInstruction.textContent = scene.instruction;
    }
    if (els.aiOverlayOutcome) {
      els.aiOverlayOutcome.textContent = `Expected Result: ${scene.expectedOutcome}`;
    }
    if (els.aiSubtitlesText) {
      els.aiSubtitlesText.textContent = scene.narration;
    }

    // Active Chapter Pill
    if (els.aiChapterPills) {
      const pills = els.aiChapterPills.querySelectorAll('.chapter-pill');
      pills.forEach((p, idx) => {
        p.classList.toggle('active', idx === aiPlayer.currentSceneIndex);
      });
    }

    // Time & Progress
    const totalDuration = aiPlayer.data.totalDurationSeconds || 48;
    const currentTotalSec = (aiPlayer.currentSceneIndex * aiPlayer.sceneDuration) + aiPlayer.sceneElapsed;
    const pct = Math.min(100, (currentTotalSec / totalDuration) * 100);

    if (els.aiScrubberProgress) {
      els.aiScrubberProgress.style.width = `${pct}%`;
    }
    if (els.aiTimeDisplay) {
      els.aiTimeDisplay.textContent = `${formatTime(currentTotalSec)} / ${formatTime(totalDuration)}`;
    }

    // Play button icon
    if (els.btnAiPlay) {
      els.btnAiPlay.textContent = aiPlayer.isPlaying ? '⏸ Pause' : '▶ Play';
    }
    if (els.btnAiPlayBig) {
      els.btnAiPlayBig.style.display = aiPlayer.isPlaying ? 'none' : 'flex';
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function toggleAiPlay() {
    aiPlayer.isPlaying = !aiPlayer.isPlaying;
    if (aiPlayer.isPlaying) {
      startPlayback();
    } else {
      pausePlayback();
    }
    updatePlayerUI();
  }

  function startPlayback() {
    if (aiPlayer.timerInterval) clearInterval(aiPlayer.timerInterval);

    // Speak Narration
    speakCurrentSceneNarration();

    aiPlayer.timerInterval = setInterval(() => {
      aiPlayer.sceneElapsed++;
      if (aiPlayer.sceneElapsed >= aiPlayer.sceneDuration) {
        // Advance scene
        if (aiPlayer.currentSceneIndex < aiPlayer.data.scenes.length - 1) {
          jumpToScene(aiPlayer.currentSceneIndex + 1);
        } else {
          // Completed
          pausePlayback();
          aiPlayer.sceneElapsed = 0;
          showToast('✓ AI Video Tutorial completed!');
        }
      }
      updatePlayerUI();
    }, 1000);

    startCanvasAnimationLoop();
  }

  function pausePlayback() {
    aiPlayer.isPlaying = false;
    if (aiPlayer.timerInterval) {
      clearInterval(aiPlayer.timerInterval);
      aiPlayer.timerInterval = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    stopCanvasAnimationLoop();
  }

  function jumpToScene(idx) {
    if (!aiPlayer.data || idx < 0 || idx >= aiPlayer.data.scenes.length) return;
    aiPlayer.currentSceneIndex = idx;
    aiPlayer.sceneElapsed = 0;
    updatePlayerUI();
    drawCanvasScene(idx, 0);

    if (aiPlayer.isPlaying) {
      speakCurrentSceneNarration();
    }
  }

  function speakCurrentSceneNarration() {
    if (aiPlayer.isVoiceMuted || !('speechSynthesis' in window)) return;
    const scene = aiPlayer.data?.scenes[aiPlayer.currentSceneIndex];
    if (!scene) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(scene.narration);
    
    // Choose voice based on user language
    const lang = els.langSelector ? els.langSelector.value : 'en';
    const voices = window.speechSynthesis.getVoices();
    if (lang === 'te') {
      utterance.lang = 'te-IN';
      const v = voices.find(vo => vo.lang.includes('te'));
      if (v) utterance.voice = v;
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
      const v = voices.find(vo => vo.lang.includes('hi'));
      if (v) utterance.voice = v;
    } else {
      utterance.lang = 'en-US';
      const v = voices.find(vo => vo.lang.includes('en-IN') || vo.lang.includes('en-US'));
      if (v) utterance.voice = v;
    }
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function startCanvasAnimationLoop() {
    if (aiPlayer.animFrameId) cancelAnimationFrame(aiPlayer.animFrameId);
    function loop() {
      aiPlayer.pulseVal = (aiPlayer.pulseVal + 0.05) % (Math.PI * 2);
      drawCanvasScene(aiPlayer.currentSceneIndex, aiPlayer.pulseVal);
      if (aiPlayer.isPlaying) {
        aiPlayer.animFrameId = requestAnimationFrame(loop);
      }
    }
    aiPlayer.animFrameId = requestAnimationFrame(loop);
  }

  function stopCanvasAnimationLoop() {
    if (aiPlayer.animFrameId) {
      cancelAnimationFrame(aiPlayer.animFrameId);
      aiPlayer.animFrameId = null;
    }
  }

  // Draw 2D Vector Schematics on Canvas for each Step
  function drawCanvasScene(sceneIdx, pulse) {
    const ctx = aiPlayer.canvasCtx;
    if (!ctx) return;

    const w = 640;
    const h = 360;

    // Dark Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const scene = aiPlayer.data?.scenes[sceneIdx];
    const graphicType = scene?.graphicType || 'wrench';
    const centerX = w / 2;
    const centerY = h / 2 - 20;

    ctx.save();

    if (graphicType === 'plumbing') {
      // Draw Sink & P-Trap Schematic
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      // Sink basin
      ctx.beginPath();
      ctx.moveTo(centerX - 90, centerY - 60);
      ctx.lineTo(centerX - 70, centerY - 20);
      ctx.lineTo(centerX + 70, centerY - 20);
      ctx.lineTo(centerX + 90, centerY - 60);
      ctx.stroke();

      // Drain Pipe & P-Trap Curve
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 20);
      ctx.lineTo(centerX, centerY + 20);
      ctx.arc(centerX + 25, centerY + 20, 25, Math.PI, 0, true);
      ctx.arc(centerX + 60, centerY + 20, 10, Math.PI, 0, false);
      ctx.lineTo(centerX + 70, centerY + 60);
      ctx.stroke();

      // Slip nuts
      ctx.fillStyle = '#64748b';
      ctx.fillRect(centerX - 12, centerY - 5, 24, 10);
      ctx.fillRect(centerX + 40, centerY + 10, 15, 10);

      // Action Focus Pulse
      const pulseSize = 25 + Math.sin(pulse) * 8;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX + 25, centerY + 20, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

    } else if (graphicType === 'laptop') {
      // Draw Laptop & Wi-Fi Schematic
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 5;

      // Screen
      ctx.strokeRect(centerX - 80, centerY - 60, 160, 95);
      // Keyboard base
      ctx.beginPath();
      ctx.moveTo(centerX - 105, centerY + 45);
      ctx.lineTo(centerX + 105, centerY + 45);
      ctx.lineTo(centerX + 85, centerY + 35);
      ctx.lineTo(centerX - 85, centerY + 35);
      ctx.closePath();
      ctx.stroke();

      // Wi-Fi Radiating Waves
      const waveRadius = 30 + (pulse % 3) * 12;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 15, waveRadius, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

    } else if (graphicType === 'washer') {
      // Draw Washing Machine Schematic
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 5;
      ctx.strokeRect(centerX - 70, centerY - 65, 140, 130);

      // Drum circle
      ctx.beginPath();
      ctx.arc(centerX, centerY + 5, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Drain filter access door
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(centerX + 35, centerY + 42, 20, 15);

      // Focus Ring
      const pulseSize = 18 + Math.sin(pulse) * 6;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX + 45, centerY + 50, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // General Diagnostic Tools (Wrench & Gear)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      // Wrench
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 40);
      ctx.lineTo(centerX + 40, centerY + 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX - 40, centerY - 40, 18, 0.5, 2.8, true);
      ctx.stroke();

      // Target Focus
      const pulseSize = 35 + Math.sin(pulse) * 10;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // AI Video Player Event Listeners
  if (els.btnAiPlay) els.btnAiPlay.addEventListener('click', toggleAiPlay);
  if (els.btnAiPlayBig) els.btnAiPlayBig.addEventListener('click', toggleAiPlay);

  if (els.btnAiPrev) {
    els.btnAiPrev.addEventListener('click', () => {
      if (aiPlayer.currentSceneIndex > 0) {
        jumpToScene(aiPlayer.currentSceneIndex - 1);
      }
    });
  }

  if (els.btnAiNext) {
    els.btnAiNext.addEventListener('click', () => {
      if (aiPlayer.data && aiPlayer.currentSceneIndex < aiPlayer.data.scenes.length - 1) {
        jumpToScene(aiPlayer.currentSceneIndex + 1);
      }
    });
  }

  if (els.btnAiRestart) {
    els.btnAiRestart.addEventListener('click', () => {
      jumpToScene(0);
      if (!aiPlayer.isPlaying) toggleAiPlay();
    });
  }

  if (els.btnAiVoiceToggle) {
    els.btnAiVoiceToggle.addEventListener('click', () => {
      aiPlayer.isVoiceMuted = !aiPlayer.isVoiceMuted;
      els.btnAiVoiceToggle.textContent = aiPlayer.isVoiceMuted ? '🔇 Voice Muted' : '🔊 Voice On';
      els.btnAiVoiceToggle.classList.toggle('active', !aiPlayer.isVoiceMuted);
      if (aiPlayer.isVoiceMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else if (!aiPlayer.isVoiceMuted && aiPlayer.isPlaying) {
        speakCurrentSceneNarration();
      }
    });
  }

  if (els.btnAiCcToggle) {
    els.btnAiCcToggle.addEventListener('click', () => {
      aiPlayer.isCcOn = !aiPlayer.isCcOn;
      els.btnAiCcToggle.classList.toggle('active', aiPlayer.isCcOn);
      if (els.aiSubtitlesBar) {
        els.aiSubtitlesBar.style.display = aiPlayer.isCcOn ? 'flex' : 'none';
      }
    });
  }

  // Scrubber Click to Seek
  if (els.aiScrubber) {
    els.aiScrubber.addEventListener('click', (e) => {
      if (!aiPlayer.data) return;
      const rect = els.aiScrubber.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetScene = Math.floor(pct * aiPlayer.data.scenes.length);
      jumpToScene(targetScene);
    });
  }

  // Tab Toggles for Video Mode
  if (els.tabBtnAiVideo) {
    els.tabBtnAiVideo.addEventListener('click', () => {
      els.tabBtnAiVideo.classList.add('active');
      els.tabBtnYtVideo.classList.remove('active');
      els.aiVideoPlayerContainer.style.display = 'block';
      els.ytVideoContainer.style.display = 'none';
    });
  }

  if (els.tabBtnYtVideo) {
    els.tabBtnYtVideo.addEventListener('click', () => {
      els.tabBtnYtVideo.classList.add('active');
      els.tabBtnAiVideo.classList.remove('active');
      els.aiVideoPlayerContainer.style.display = 'none';
      els.ytVideoContainer.style.display = 'block';
      pausePlayback();
    });
  }

  // =========================================================================
  // RENDER YOUTUBE VIDEO CARDS
  // =========================================================================
  function renderVideoCards(videos) {
    els.videoGrid.innerHTML = '';
    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-entry';

      let playerHtml = '';
      if (v.isEmbeddable) {
        playerHtml = `
          <div class="video-embed-container">
            <iframe 
              src="https://www.youtube.com/embed/${v.id}?rel=0" 
              title="${escapeHtml(v.title)}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        `;
      } else {
        playerHtml = `
          <div style="background:var(--bg-subtle); color:var(--text-main); padding:1.5rem; text-align:center; border:1px solid var(--border-card); border-radius:var(--radius-sm);">
            <p style="font-size:0.9rem; margin-bottom:0.75rem; display:flex; align-items:center; justify-content:center; gap:0.4rem;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>This video is restricted from in-app embedding by the creator.</span>
            </p>
            <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-btn" style="display:inline-flex; align-items:center; gap:0.4rem;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Open on YouTube</span>
            </a>
          </div>
        `;
      }

      card.innerHTML = `
        ${playerHtml}
        <div class="video-meta">
          <div>
            <h3>${escapeHtml(v.title)}</h3>
            <div class="video-channel" style="display:flex; align-items:center; gap:0.35rem;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
              <span>Channel: ${escapeHtml(v.channelTitle)}</span>
            </div>
            <div class="video-relevance" style="display:flex; align-items:flex-start; gap:0.35rem; margin-top:0.35rem;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              <span><strong>Technical Alignment:</strong> ${escapeHtml(v.relevanceExplanation || 'Matches problem diagnosis')}</span>
            </div>
          </div>
          <div style="margin-top:0.75rem;">
            <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-btn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:0.4rem;">
              <span>Open on YouTube</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      `;
      els.videoGrid.appendChild(card);
    });
  }

  // =========================================================================
  // RENDER TECHNICIAN CARDS
  // =========================================================================
  function renderTechnicianCards(techs) {
    els.techGrid.innerHTML = '';
    techs.forEach(t => {
      const card = document.createElement('div');
      card.className = 'tech-card';

      const distanceBadge = t.distanceKm !== null ? `<span class="tech-distance">${t.distanceKm} km away</span>` : '';
      const phoneHtml = t.phone
        ? `<div class="tech-phone available" style="display:flex; align-items:center; gap:0.4rem;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <span>Phone: <a href="tel:${t.phone.replace(/[^0-9+]/g, '')}">${escapeHtml(t.phone)}</a></span></div>`
        : `<div class="tech-phone unavailable" style="display:flex; align-items:center; gap:0.4rem;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/><line x1="1" y1="1" x2="23" y2="23"/></svg> <span>Phone unlisted</span></div>`;

      const tagsHtml = (t.specificServices || []).map(s => `<span class="tech-tag">${escapeHtml(s)}</span>`).join('');

      card.innerHTML = `
        <div>
          <div class="tech-header">
            <h3 class="tech-name">${escapeHtml(t.name)}</h3>
            ${distanceBadge}
          </div>
          <div class="tech-address" style="display:flex; align-items:flex-start; gap:0.35rem;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(t.address)}</span>
          </div>
          ${phoneHtml}
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.3rem;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="#eab308" stroke="#eab308"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>${t.rating || '4.5'} (${t.reviewCount || 20}+ reviews) • Verified AP Directory</span>
          </div>
          <div class="tech-tags">${tagsHtml}</div>
        </div>
        <div class="tech-actions">
          ${t.phone ? `<a href="tel:${t.phone.replace(/[^0-9+]/g, '')}" class="btn-tech-action btn-tech-call">Call</a>` : ''}
          <a href="${t.actions.directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn-tech-action btn-tech-map">Directions</a>
          <a href="${t.actions.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn-tech-action btn-tech-map">Map</a>
        </div>
      `;
      els.techGrid.appendChild(card);
    });
  }

  // =========================================================================
  // CLARIFICATION SUBMISSION
  // =========================================================================
  if (els.btnSubmitClarification) {
    els.btnSubmitClarification.addEventListener('click', async () => {
      const answer = (els.clarificationAnswerInput.value || '').trim();
      if (!answer) {
        alert('Please answer the question or pick a quick answer above.');
        return;
      }

      els.btnSubmitClarification.disabled = true;
      els.btnSubmitClarification.textContent = 'Refining diagnosis...';

      try {
        const res = await fetch('/api/reports/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: els.descInput.value,
            clarificationAnswer: answer,
            location: els.locationInput.value,
            language: els.langSelector ? els.langSelector.value : 'en',
            age: els.ageSelect ? parseInt(els.ageSelect.value) : null
          })
        });

        const data = await res.json();
        els.btnSubmitClarification.disabled = false;
        els.btnSubmitClarification.textContent = 'Submit Clarification & Refine';

        if (data.success) {
          displayResults(data);
          updateStepper(3);
        } else {
          alert('Failed to refine report.');
        }
      } catch (e) {
        els.btnSubmitClarification.disabled = false;
        els.btnSubmitClarification.textContent = 'Submit Clarification & Refine';
        alert('Network error while refining diagnosis.');
      }
    });
  }

  // =========================================================================
  // USER SAVED REPORTS & PROFILE
  // =========================================================================
  async function loadUserReports() {
    if (!currentUser) {
      els.reportsListContainer.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1.5rem; background:var(--bg-subtle); border-radius:var(--radius-md); border:1px solid var(--border-card);">
          <p style="margin-bottom:1.25rem; color:var(--text-main); font-weight:600;">Sign in to access your synchronized problem diagnostic reports history.</p>
          <button class="nav-btn active" style="margin:0 auto; padding:0.6rem 1.25rem;" id="btn-login-prompt">Sign In / Register</button>
        </div>
      `;
      document.getElementById('btn-login-prompt')?.addEventListener('click', () => openAuthModal('login'));
      return;
    }

    try {
      const token = localStorage.getItem('see_and_solve_token');
      const res = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.reports && data.reports.length > 0) {
        els.reportsListContainer.innerHTML = '';
        data.reports.forEach(r => {
          const card = document.createElement('div');
          card.className = 'result-card future-card';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.gap = '1rem';
          card.style.flexWrap = 'wrap';

          const formattedDate = new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });

          card.innerHTML = `
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.25rem;">${escapeHtml(r.analysis?.likely_issue || r.description.substring(0, 60))}</h3>
              <p style="font-size:0.85rem; color:var(--text-muted);">Submitted on ${formattedDate} • ${escapeHtml(r.location || 'Local area')}</p>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="nav-btn" onclick="window.viewSavedReport('${r.id}')">View Details</button>
              <button class="nav-btn" style="color:var(--danger);" onclick="window.deleteSavedReport('${r.id}')">Delete</button>
            </div>
          `;
          els.reportsListContainer.appendChild(card);
        });
      } else {
        els.reportsListContainer.innerHTML = `
          <div style="text-align:center; padding:2.5rem 1.5rem; background:var(--bg-subtle); border-radius:var(--radius-md); border:1px solid var(--border-card);">
            <p style="color:var(--text-muted);">No saved reports found. Reports you submit while signed in will appear here.</p>
          </div>
        `;
      }
    } catch (e) {
      els.reportsListContainer.innerHTML = `<p style="color:var(--danger); padding:1rem; text-align:center;">Error loading saved reports.</p>`;
    }
  }

  window.viewSavedReport = async function(id) {
    try {
      const token = localStorage.getItem('see_and_solve_token');
      const res = await fetch(`/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.report) {
        switchTab('report');
        displayResults({
          aiAnalysis: data.report.aiAnalysis,
          safeTroubleshooting: data.report.safeTroubleshooting,
          tutorialVideos: data.report.tutorialVideos,
          technicians: data.report.technicians,
          governmentAssistance: data.report.governmentAssistance,
          sections: {
            showAnalysis: true,
            showTroubleshooting: Boolean(data.report.safeTroubleshooting),
            showVideos: Boolean(data.report.tutorialVideos && data.report.tutorialVideos.eligible),
            showTechnicians: Boolean(data.report.technicians && data.report.technicians.showTechnicians),
            showGovernment: Boolean(data.report.governmentAssistance)
          }
        });
        updateStepper(3);
      }
    } catch (e) {
      alert('Failed to load report details');
    }
  };

  window.deleteSavedReport = async function(id) {
    if (!confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('see_and_solve_token');
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Report deleted successfully');
        loadUserReports();
      } else {
        alert(data.error || 'Failed to delete report');
      }
    } catch (e) {
      alert('Network error while deleting report');
    }
  };

  async function loadProfileData() {
    if (currentUser) {
      els.profileName.textContent = currentUser.name || 'User';
      els.profileEmail.textContent = currentUser.email;
      els.profileAge.textContent = currentUser.age ? `${currentUser.age} years old` : 'Not specified';
    }

    try {
      const res = await fetch('/api/status');
      const statusData = await res.json();
      if (statusData.success && els.apiHealthContainer) {
        const int = statusData.integrations;
        els.apiHealthContainer.innerHTML = `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem; font-size:0.85rem;">
            <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
              <strong>Vision AI:</strong> ${int.geminiVisionAI.mode}
            </div>
            <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
              <strong>YouTube API:</strong> ${int.youtubeDataAPI.mode}
            </div>
            <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
              <strong>AI Video Generator:</strong> Active (Interactive Player)
            </div>
            <div style="background:var(--gray-50); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--gray-200);">
              <strong>Database:</strong> ${statusData.database} (${statusData.stats.totalReports} reports)
            </div>
          </div>
        `;
      }
    } catch (e) {}
  }

  // Logout
  if (els.btnLogout) {
    els.btnLogout.addEventListener('click', async () => {
      const token = localStorage.getItem('see_and_solve_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      localStorage.removeItem('see_and_solve_token');
      currentUser = null;
      updateUserBadge(null);
      showToast('Logged out successfully');
      switchTab('report');
    });
  }

  // Delete Account
  if (els.btnDeleteAccount) {
    els.btnDeleteAccount.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to permanently delete your account and all saved reports?')) return;
      const token = localStorage.getItem('see_and_solve_token');
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.removeItem('see_and_solve_token');
        currentUser = null;
        updateUserBadge(null);
        showToast('Account permanently deleted.');
        switchTab('report');
      }
    });
  }

  async function saveCurrentReportToAccount() {
    if (!currentReportData || !currentUser) return;
    try {
      const token = localStorage.getItem('see_and_solve_token');
      await fetch('/api/reports/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: els.descInput.value,
          location: els.locationInput.value,
          language: els.langSelector ? els.langSelector.value : 'en',
          aiAnalysis: currentReportData.aiAnalysis,
          safeTroubleshooting: currentReportData.safeTroubleshooting,
          tutorialVideos: currentReportData.tutorialVideos,
          technicians: currentReportData.technicians,
          governmentAssistance: currentReportData.governmentAssistance
        })
      });
      showToast('Report saved to your account history!');
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initial Boot
  checkSession();
  updateStepper(1);

})();
