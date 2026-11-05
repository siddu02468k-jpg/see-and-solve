const fs = require('node:fs');
const path = require('node:path');

const GOV_SERVICES_PATH = path.join(__dirname, '..', 'data', 'gov_services.json');
let cachedGovServices = null;

function loadGovServices() {
  if (!cachedGovServices) {
    if (fs.existsSync(GOV_SERVICES_PATH)) {
      const raw = fs.readFileSync(GOV_SERVICES_PATH, 'utf8');
      cachedGovServices = JSON.parse(raw);
    } else {
      cachedGovServices = [];
    }
  }
  return cachedGovServices;
}

/**
 * Matches government department based on problem type and user location
 */
function matchGovernmentAuthority({ technicalCategory, issueTitle, location = '', isPublic = true }) {
  if (!isPublic) return null;

  const services = loadGovServices();
  const text = ((technicalCategory || '') + ' ' + (issueTitle || '') + ' ' + (location || '')).toLowerCase();
  const locLower = (location || '').toLowerCase();

  // 1. Municipal Corporation match if in specific city
  if (locLower.includes('guntur')) {
    const gmc = services.find(s => s.id === 'gmc-guntur');
    if (gmc && (text.includes('road') || text.includes('drain') || text.includes('water') || text.includes('waste') || text.includes('garbage') || text.includes('street'))) {
      return gmc;
    }
  }

  if (locLower.includes('vijayawada') || locLower.includes('ntr') || locLower.includes('krishna')) {
    const vmc = services.find(s => s.id === 'vmc-vijayawada');
    if (vmc && (text.includes('road') || text.includes('drain') || text.includes('water') || text.includes('waste') || text.includes('garbage') || text.includes('street'))) {
      return vmc;
    }
  }

  if (locLower.includes('visakhapatnam') || locLower.includes('vizag')) {
    const gvmc = services.find(s => s.id === 'gvmc-visakhapatnam');
    if (gvmc && (text.includes('road') || text.includes('drain') || text.includes('water') || text.includes('waste') || text.includes('garbage') || text.includes('street'))) {
      return gvmc;
    }
  }

  // 2. Electricity Discoms
  if (text.includes('electric') || text.includes('power') || text.includes('wire') || text.includes('pole') || text.includes('transformer') || text.includes('streetlight')) {
    if (locLower.includes('visakhapatnam') || locLower.includes('kakinada') || locLower.includes('rajahmundry') || locLower.includes('srikakulam')) {
      return services.find(s => s.id === 'apepdcl-electricity') || services.find(s => s.id === 'ap-meekosam');
    }
    if (locLower.includes('tirupati') || locLower.includes('nellore') || locLower.includes('kurnool') || locLower.includes('kadapa') || locLower.includes('anantapur')) {
      return services.find(s => s.id === 'apspdcl-electricity') || services.find(s => s.id === 'ap-meekosam');
    }
    return services.find(s => s.id === 'apcpdcl-electricity') || services.find(s => s.id === 'ap-meekosam');
  }

  // 3. Roads & Highways (PWD)
  if (text.includes('road') || text.includes('highway') || text.includes('pothole') || text.includes('bridge') || text.includes('pavement')) {
    return services.find(s => s.id === 'ap-roads-buildings') || services.find(s => s.id === 'ap-meekosam');
  }

  // 4. Rural Water Supply (RWSS)
  if (text.includes('rural') || text.includes('village') || text.includes('panchayat') || text.includes('borewell') || text.includes('water pipeline')) {
    return services.find(s => s.id === 'ap-rwss-water') || services.find(s => s.id === 'ap-meekosam');
  }

  // 5. Default to official AP Mee Kosam Chief Minister Grievance Redressal Portal
  return services.find(s => s.id === 'ap-meekosam') || services.find(s => s.id === 'central-pgportal');
}

/**
 * Generates a personalized government complaint email draft.
 * Never invents fake dates, fake damages, fake legal violations, or fake names.
 */
function generatePersonalizedComplaintDraft({
  issueTitle,
  affectedObject,
  userDescription,
  location,
  userName = 'Concerned Resident',
  authority,
  language = 'en'
}) {
  const deptName = authority?.name || 'Concerned Public Works / Municipal Authority';
  const officialEmail = authority?.email || null;
  const tollFree = authority?.tollFree || '1902';
  const portalUrl = authority?.portalUrl || 'https://meekosam.ap.gov.in';

  const cleanLocation = location && location.trim().length > 0 ? location.trim() : '[Location to be specified by citizen]';

  // Specific Subject
  const subject = `Urgent Public Civic Grievance: ${issueTitle || 'Infrastructure Issue'} at ${cleanLocation}`;

  // Personalized Body (Professional, Courteous, Factual)
  let body = '';

  if (language === 'te') {
    body = `గౌరవనీయులైన కమిషనర్ / సంబంధిత అధికారి వారికి,\n` +
      `విభాగం: ${deptName}\n` +
      `ప్రదేశం: ${cleanLocation}\n\n` +
      `విషయం: ${cleanLocation} వద్ద ${issueTitle} పై తక్షణ చర్య కోరుతూ ఫిర్యాదు.\n\n` +
      `నేను ఈ క్రింది ప్రజా మౌలిక సదుపాయాల సమస్యను మీ దృష్టికి తీసుకురావడానికి రాస్తున్నాను:\n` +
      `• గుర్తించిన సమస్య: ${issueTitle}\n` +
      `• ప్రభావితమైన మౌలిక సదుపాయం: ${affectedObject || 'ప్రజా ఆస్తి'}\n` +
      `• ఖచ్చితమైన ప్రదేశం: ${cleanLocation}\n` +
      `• సమస్య వివరణ: ${userDescription}\n\n` +
      `ఈ సమస్య ప్రజా భద్రతకు మరియు ప్రయాణికులకు అసౌకర్యాన్ని కలిగిస్తోంది. దయచేసి సంబంధిత ఇంజనీరింగ్ బృందాన్ని పంపి తనిఖీ చేసి, తగిన మరమ్మతులు చేయవలసిందిగా కోరుతున్నాను.\n\n` +
      `ఈ ఫిర్యాదును స్వీకరించినట్లు ధృవీకరిస్తూ ఎస్.ఎం.ఎస్ ద్వారా ఫిర్యాదు సంఖ్య (Grievance ID) పంపవలసిందిగా అభ్యర్థిస్తున్నాను.\n\n` +
      `ధన్యవాదాలు,\n` +
      `ఇట్లు,\n` +
      `${userName}\n` +
      `నివాసి, ${cleanLocation}`;
  } else if (language === 'hi') {
    body = `सेवा में,\n` +
      `श्रीमान आयुक्त / संबंधित अधिशासी अभियंता महोदय,\n` +
      `विभाग: ${deptName}\n` +
      `स्थान: ${cleanLocation}\n\n` +
      `विषय: ${cleanLocation} पर ${issueTitle} के संबंध में त्वरित कार्रवाई हेतु शिकायत।\n\n` +
      `महोदय,\n` +
      `मैं आपका ध्यान निम्नलिखित सार्वजनिक समस्या की ओर आकर्षित करना चाहता हूँ:\n` +
      `• समस्या का प्रकार: ${issueTitle}\n` +
      `• प्रभावित सार्वजनिक संपत्ति: ${affectedObject || 'सार्वजनिक बुनियादी ढांचा'}\n` +
      `• स्थान: ${cleanLocation}\n` +
      `• विवरण: ${userDescription}\n\n` +
      `यह समस्या आम नागरिकों की सुरक्षा और यातायात में बाधा उत्पन्न कर रही है। कृपया इस स्थल का निरीक्षण कराकर आवश्यक मरम्मत कराने की कृपा करें।\n\n` +
      `कृपया इस शिकायत की पावती एवं संदर्भ संख्या (Grievance Reference Number) प्रदान करें।\n\n` +
      `सधन्यवाद,\n` +
      `भवदीय,\n` +
      `${userName}\n` +
      `नागरिक, ${cleanLocation}`;
  } else {
    // English default
    body = `To,\n` +
      `The Commissioner / Executive Engineer,\n` +
      `${deptName},\n` +
      `Jurisdiction: ${cleanLocation}\n\n` +
      `Subject: Urgent Grievance regarding ${issueTitle} at ${cleanLocation}\n\n` +
      `Respected Sir / Madam,\n\n` +
      `I am writing to formally report an active public infrastructure issue that requires inspection and corrective maintenance by your department:\n\n` +
      `• Reported Issue: ${issueTitle}\n` +
      `• Affected Public Infrastructure: ${affectedObject || 'Public Asset'}\n` +
      `• Precise Location: ${cleanLocation}\n` +
      `• Citizen Observation: ${userDescription}\n\n` +
      `Based on the visible symptoms, this condition presents an active inconvenience and safety hazard to the public and commuters in this locality. I respectfully request that an inspection officer be deputed to inspect the site and initiate timely remediation under the Citizen's Charter.\n\n` +
      `Kindly acknowledge receipt of this grievance and provide a formal tracking reference number for follow-up.\n\n` +
      `Thank you for your service and prompt attention to civic safety.\n\n` +
      `Sincerely,\n` +
      `${userName}\n` +
      `Concerned Resident, ${cleanLocation}`;
  }

  // mailto URL prefilled
  const mailtoRecipient = officialEmail || '';
  const mailtoUrl = `mailto:${encodeURIComponent(mailtoRecipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    recipientEmail: officialEmail,
    recipientName: deptName,
    body,
    officialPortalUrl: portalUrl,
    tollFreeHelpline: tollFree,
    isEmailVerified: Boolean(officialEmail),
    mailtoUrl,
    actions: {
      canMailto: true,
      mailtoUrl,
      portalUrl,
      canCopy: true
    }
  };
}

module.exports = {
  loadGovServices,
  matchGovernmentAuthority,
  generatePersonalizedComplaintDraft
};
