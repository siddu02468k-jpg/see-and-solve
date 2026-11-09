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
  function showToast(msg, duration = 3000) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.style.display = 'block';
    setTimeout(() => {
      els.toast.style.display = 'none';
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

    if (tabId === 'reports') {
      loadUserReports();
    } else if (tabId === 'profile') {
      loadProfileData();
    }
  }

  els.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
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
      els.themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌓';
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
          els.detectLocationBtn.textContent = `Location Set ✓${accStr}`;
        },
        (error) => {
          console.warn('Geolocation error:', error);
          alert('Unable to retrieve automatic location. Please select your city from the badges below.');
          els.detectLocationBtn.textContent = 'Use GPS';
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
      els.submitBtn.innerHTML = `<span class="spinner"></span> <span>Analyzing with AI Vision...</span>`;
      els.submitBtn.classList.add('loading-shimmer');
    } else {
      els.submitBtn.innerHTML = `<span>🔍</span> <span>Analyze Problem with AI</span>`;
      els.submitBtn.classList.remove('loading-shimmer');
    }
  }

  // =========================================================================
  // DISPLAY RESULTS
  // =========================================================================
  function displayResults(data) {
    els.resultsContainer.classList.add('visible');
    els.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

    // Wire quick nav jump buttons
    document.querySelectorAll('.qnav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.qnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      els.troubleStop.innerHTML = `<strong>⚠️ When to Stop:</strong> ${escapeHtml(tb.whenToStop || 'If symptoms persist or require specialized tools.')}`;
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
          <div style="padding:1.5rem; text-align:center; background:#f8fafc; border-radius:var(--radius-sm); border:1px solid #e2e8f0; grid-column:1/-1;">
            <p style="margin-bottom:0.75rem; color:#475569;">No direct YouTube video embedded for this exact issue. Use the AI Video Player above or search YouTube directly:</p>
            <a href="${vidData.externalSearchUrl || 'https://www.youtube.com'}" target="_blank" rel="noopener noreferrer" class="video-btn">🔍 Search YouTube for "${escapeHtml(ai.tutorial_search_query || ai.likely_issue)}"</a>
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
        els.videoNotice.innerHTML = `<strong>🛡️ Safety Compliance:</strong> ${escapeHtml(vidData.reason || 'DIY tutorial videos are strictly withheld for hazardous or public infrastructure work.')}`;
      } else {
        // Safe DIY task! Directly prompt the user for their age — equal features for guests & signed-up users
        els.videoNotice.innerHTML = `
          <div class="age-unlock-banner">
            <div style="font-size:2rem; margin-bottom:0.35rem;">🔞</div>
            <h4>Age Verification Required to Unlock AI Video Tutorials</h4>
            <p>Safety regulations require confirming you are 18 or older to view mechanical and electrical repair tutorial videos. <strong>No sign-in or account is required</strong> — verify your age below to unlock full AI tutorials:</p>
            <div class="age-unlock-actions">
              <button type="button" id="btn-inline-verify-age" class="btn-unlock-videos">
                <span>🔞</span> <span>I am 18 or Older — Unlock AI Videos Now</span>
              </button>
              <button type="button" id="btn-inline-stay-minor" class="btn-keep-minor">
                <span>🛡️</span> <span>I am Under 18 (Keep Safe Text Only)</span>
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
                btnVerify.innerHTML = `<span>🔞</span> <span>I am 18 or Older — Unlock AI Videos Now</span>`;
              }
            } catch (err) {
              showToast('Network error during age verification.');
              btnVerify.disabled = false;
              btnVerify.innerHTML = `<span>🔞</span> <span>I am 18 or Older — Unlock AI Videos Now</span>`;
            }
          };
        }

        const btnMinor = document.getElementById('btn-inline-stay-minor');
        if (btnMinor) {
          btnMinor.onclick = () => {
            els.videoNotice.innerHTML = `
              <div style="padding:1rem; text-align:center;">
                <p><strong>🛡️ Safety Mode Active:</strong> Tutorial videos are withheld for users under 18. Please follow the safe preliminary checklist above or contact a verified local technician.</p>
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
          ${techData.externalSearchUrl ? `<p style="margin-top:0.5rem;"><a href="${techData.externalSearchUrl}" target="_blank" rel="noopener noreferrer" class="btn-tech-action btn-tech-map">🔍 Search Local Providers on Google Maps (External)</a></p>` : ''}
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
        <h3 style="color:#166534; font-size:1.1rem; margin-bottom:0.25rem;">🏛️ ${escapeHtml(auth?.name || 'Responsible Civic Department')}</h3>
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
          <div style="background:#1e293b; color:white; padding:1.5rem; text-align:center;">
            <p style="font-size:0.9rem; margin-bottom:0.75rem;">🔒 This video is restricted from embedding inside third-party apps by the content owner.</p>
            <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-btn">▶️ Open on YouTube</a>
          </div>
        `;
      }

      card.innerHTML = `
        ${playerHtml}
        <div class="video-meta">
          <div>
            <h3>${escapeHtml(v.title)}</h3>
            <div class="video-channel">📺 Channel: ${escapeHtml(v.channelTitle)}</div>
            <div class="video-relevance">💡 <strong>Why this helps:</strong> ${escapeHtml(v.relevanceExplanation || 'Matches problem diagnosis')}</div>
          </div>
          <div style="margin-top:0.75rem;">
            <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-btn" style="width:100%;">
              Open on YouTube ↗
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
        ? `<div class="tech-phone available">📞 Phone: <a href="tel:${t.phone.replace(/[^0-9+]/g, '')}">${escapeHtml(t.phone)}</a></div>`
        : `<div class="tech-phone unavailable">📞 Phone number not available</div>`;

      const tagsHtml = (t.specificServices || []).map(s => `<span class="tech-tag">${escapeHtml(s)}</span>`).join('');

      card.innerHTML = `
        <div>
          <div class="tech-header">
            <h3 class="tech-name">${escapeHtml(t.name)}</h3>
            ${distanceBadge}
          </div>
          <div class="tech-address">📍 ${escapeHtml(t.address)}</div>
          ${phoneHtml}
          <div style="font-size:0.8rem; color:var(--gray-500); margin-bottom:0.5rem;">
            ⭐ ${t.rating || '4.5'} (${t.reviewCount || 20}+ reviews) • Source: ${escapeHtml(t.source || 'Verified AP Directory')}
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
        <div style="text-align:center; padding:2rem; background:white; border-radius:var(--radius-md); border:1px solid var(--gray-200);">
          <p style="margin-bottom:1rem; color:var(--gray-700);">Sign in to access your saved reports history across devices.</p>
          <button class="nav-btn active" style="margin:0 auto;" id="btn-login-prompt">Sign In / Register</button>
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
          card.className = 'result-card';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.gap = '1rem';
          card.style.flexWrap = 'wrap';

          const formattedDate = new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });

          card.innerHTML = `
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; color:var(--gray-900);">${escapeHtml(r.analysis?.likely_issue || r.description.substring(0, 60))}</h3>
              <p style="font-size:0.85rem; color:var(--gray-500);">Submitted on ${formattedDate} • ${escapeHtml(r.location || 'Local area')}</p>
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
          <div style="text-align:center; padding:2rem; background:white; border-radius:var(--radius-md); border:1px solid var(--gray-200);">
            <p style="color:var(--gray-500);">No saved reports found. Reports you submit while signed in will appear here.</p>
          </div>
        `;
      }
    } catch (e) {
      els.reportsListContainer.innerHTML = `<p style="color:red;">Error loading reports.</p>`;
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
