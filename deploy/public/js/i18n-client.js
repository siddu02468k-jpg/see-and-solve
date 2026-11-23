// Client-side i18n support for English, Telugu, and Hindi

const CLIENT_TRANSLATIONS = {
  en: {
    appName: "See & Solve",
    tagline: "AI Visual Diagnostics & Solutions",
    navReport: "Report a Problem",
    navMyReports: "My Reports",
    navProfile: "Profile & Settings",
    submitTitle: "Report a Problem",
    submitSubtitle: "Upload or take a photo, describe what happened, and receive instant AI diagnosis, safe troubleshooting, local technicians, or government grievance assistance.",
    photoLabel: "Problem Photograph (Required)",
    photoPrompt: "Click to upload an image or capture with your camera",
    photoChange: "Replace Photo",
    photoRemove: "Remove Photo",
    descLabel: "Problem Description (Mandatory)",
    descPlaceholder: "Describe the issue in detail (e.g., 'Kitchen sink is blocked and water will not drain' or 'Deep pothole on main road causing accidents')...",
    voiceButton: "Voice Input",
    voiceListening: "Listening... Speak now",
    locationLabel: "Location (City, Locality, or Postal Code)",
    locationPlaceholder: "e.g., Brodipet, Guntur or Vijayawada",
    detectLocation: "Use GPS Location",
    ageLabel: "Your Age (Required for tutorial video safety compliance)",
    ageOption18Plus: "18 years or older (Eligible for video tutorials)",
    ageOptionUnder18: "Under 18 (Tutorial videos withheld for safety)",
    ageOptionUnknown: "Prefer not to disclose / Unverified",
    languageLabel: "Preferred Language",
    analyzeButton: "Analyze Problem with AI",
    analyzing: "Analyzing image & description with AI...",
    diagnosisTitle: "AI Vision & Technical Analysis",
    severityLabel: "Severity & Safety Level",
    objectLabel: "Identified Asset / Infrastructure",
    symptomsLabel: "Visible Symptoms",
    factsLabel: "Observed Facts",
    assumptionsLabel: "Possible Causes & Assumptions",
    troubleshootingTitle: "Safe Step-by-Step Troubleshooting",
    whenToStop: "When to Stop & Seek Professional Help",
    expectedOutcome: "Expected Outcome",
    videoTitle: "Instructional Tutorial Videos",
    technicianTitle: "Verified Local Technicians",
    govTitle: "Government Complaint Assistance"
  },
  te: {
    appName: "సీ & సాల్వ్ (See & Solve)",
    tagline: "AI ఆధారిత సమస్య గుర్తింపు & పరిష్కారాలు",
    navReport: "సమస్యను నివేదించండి",
    navMyReports: "నా నివేదికలు",
    navProfile: "ప్రొఫైల్ & సెట్టింగులు",
    submitTitle: "సమస్యను నివేదించండి",
    submitSubtitle: "ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి, సమస్యను వివరించండి, తక్షణ AI రోగనిర్ధారణ, సురక్షిత పరిష్కారాలు, స్థానిక సాంకేతిక నిపుణులు లేదా ప్రభుత్వ సహాయం పొందండి.",
    photoLabel: "సమస్య ఫోటో (తప్పనిసరి)",
    photoPrompt: "చిత్రాన్ని అప్‌లోడ్ చేయడానికి లేదా కెమెరాతో తీయడానికి క్లిక్ చేయండి",
    photoChange: "ఫోటోను మార్చండి",
    photoRemove: "ఫోటోను తొలగించండి",
    descLabel: "సమస్య వివరణ (తప్పనిసరి)",
    descPlaceholder: "సమస్యను వివరంగా రాయండి (ఉదా: 'వంటగది సింక్ జామ్ అయింది, నీరు పోవడం లేదు' లేదా 'రోడ్డుపై పెద్ద గుంత ప్రమాదాలకు కారణమవుతోంది')...",
    voiceButton: "వాయిస్ ఇన్‌పుట్",
    voiceListening: "వింటున్నాము... మాట్లాడండి",
    locationLabel: "స్థలం (నగరం, ప్రాంతం లేదా పిన్ కోడ్)",
    locationPlaceholder: "ఉదా: బ్రాడీపేట, గుంటూరు లేదా విజయవాడ",
    detectLocation: "GPS స్థానాన్ని ఉపయోగించండి",
    ageLabel: "మీ వయస్సు (వీడియో భద్రతా నిబంధనల కోసం)",
    ageOption18Plus: "18 సంవత్సరాలు లేదా అంతకంటే ఎక్కువ (వీడియోలకు అర్హులు)",
    ageOptionUnder18: "18 సంవత్సరాల కంటే తక్కువ (వీడియోలు నిలిపివేయబడ్డాయి)",
    ageOptionUnknown: "తెలియజేయడానికి ఇష్టపడటం లేదు",
    languageLabel: "భాషను ఎంచుకోండి",
    analyzeButton: "AI తో సమస్యను విశ్లేషించండి",
    analyzing: "చిత్రము మరియు వివరణను AI విశ్లేషిస్తోంది...",
    diagnosisTitle: "AI విజువల్ & సాంకేతిక విశ్లేషణ",
    severityLabel: "తీవ్రత & భద్రతా స్థాయి",
    objectLabel: "గుర్తించిన వస్తువు / మౌలిక సదుపాయాలు",
    symptomsLabel: "కనిపిస్తున్న లక్షణాలు",
    factsLabel: "గమనించిన వాస్తవాలు",
    assumptionsLabel: "సాధ్యమైన కారణాలు",
    troubleshootingTitle: "సురక్షితమైన పరిష్కార దశలు",
    whenToStop: "ఎప్పుడు ఆపాలి & నిపుణుడిని సంప్రదించాలి",
    expectedOutcome: "ఆశించిన ఫలితం",
    videoTitle: "బోధనా వీడియో ట్యుటోరియల్స్",
    technicianTitle: "ధృవీకరించబడిన స్థానిక టెక్నీషియన్లు",
    govTitle: "ప్రభుత్వ ఫిర్యాదు సహాయం"
  },
  hi: {
    appName: "सी एंड सॉल्व (See & Solve)",
    tagline: "एआई विजुअल समस्या निदान और त्वरित समाधान",
    navReport: "समस्या दर्ज करें",
    navMyReports: "मेरी रिपोर्टें",
    navProfile: "प्रोफ़ाइल और सेटिंग्स",
    submitTitle: "समस्या दर्ज करें",
    submitSubtitle: "फोटो अपलोड करें या खींचें, समस्या का विवरण दें, और त्वरित एआई निदान, सुरक्षित समस्या निवारण, स्थानीय तकनीशियन या सरकारी शिकायत सहायता प्राप्त करें।",
    photoLabel: "समस्या की फोटो (अनिवार्य)",
    photoPrompt: "छवि अपलोड करने या कैमरा से खींचने के लिए क्लिक करें",
    photoChange: "फोटो बदलें",
    photoRemove: "फोटो हटाएं",
    descLabel: "समస్య का विवरण (अनिवार्य)",
    descPlaceholder: "समस्या का विस्तार से वर्णन करें (जैसे: 'रसोई का सिंक बंद है और पानी नहीं निकल रहा है' या 'सड़क पर गहरा गड्ढा दुर्घटनाओं का कारण बन रहा है')...",
    voiceButton: "आवाज से इनपुट",
    voiceListening: "सुन रहे हैं... बोलिए",
    locationLabel: "स्थान (शहर, इलाका या पिन कोड)",
    locationPlaceholder: "उदा: ब्रॉडीपेट, गुंटूर या विजयवाड़ा",
    detectLocation: "जीपीएस स्थान का उपयोग करें",
    ageLabel: "आपकी आयु (ट्यूटोरियल वीडियो सुरक्षा नियमों के लिए आवश्यक)",
    ageOption18Plus: "18 वर्ष या अधिक (वीडियो देखने के पात्र)",
    ageOptionUnder18: "18 वर्ष से कम (सुरक्षा के लिए वीडियो रोके गए हैं)",
    ageOptionUnknown: "खुलासा नहीं करना चाहते",
    languageLabel: "पसंदीदा भाषा",
    analyzeButton: "एआई से समस्या का विश्लेषण करें",
    analyzing: "एआई छवि और विवरण का विश्लेषण कर रहा है...",
    diagnosisTitle: "एआई विजुअल और तकनीकी विश्लेषण",
    severityLabel: "गंभीरता और सुरक्षा स्तर",
    objectLabel: "पहचाना गया उपकरण / बुनियादी ढांचा",
    symptomsLabel: "दृश्यमान लक्षण",
    factsLabel: "देखे गए तथ्य",
    assumptionsLabel: "संभावित कारण और अनुमान",
    troubleshootingTitle: "सुरक्षित चरण-दर-चरण समाधान",
    whenToStop: "कब रुकें और पेशेवर की मदद लें",
    expectedOutcome: "अपेक्षित परिणाम",
    videoTitle: "अनुदेशात्मक ट्यूटोरियल वीडियो",
    technicianTitle: "सत्यापित स्थानीय तकनीशियन",
    govTitle: "सरकारी शिकायत सहायता"
  }
};

function applyClientLanguage(lang = 'en') {
  const dict = CLIENT_TRANSLATIONS[lang] || CLIENT_TRANSLATIONS.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  localStorage.setItem('see_and_solve_lang', lang);
}

window.applyClientLanguage = applyClientLanguage;
window.CLIENT_TRANSLATIONS = CLIENT_TRANSLATIONS;
