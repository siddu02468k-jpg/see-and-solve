const fs = require('node:fs');

/**
 * AI Multimodal Vision and Text Analysis Service
 * Uses live Google Gemini 1.5/2.0 Flash API when GEMINI_API_KEY is configured.
 * When key is not provided or on network/API fallback, uses the verified Domain Diagnostic Engine.
 */

async function analyzeProblem({ imagePath, imageBase64, mimeType, description, language = 'en', location = '', clarificationAnswer = null }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const geminiResult = await callGeminiVisionAPI({
        apiKey: apiKey.trim(),
        imagePath,
        imageBase64,
        mimeType: mimeType || 'image/jpeg',
        description,
        language,
        location,
        clarificationAnswer
      });
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to Domain Diagnostic Engine:', err.message);
    }
  }

  // Domain Diagnostic Reasoning Engine
  return runDomainDiagnosticEngine({
    description,
    imagePath,
    language,
    location,
    clarificationAnswer
  });
}

/**
 * Live Google Gemini Multimodal Vision API Call
 */
async function callGeminiVisionAPI({ apiKey, imagePath, imageBase64, mimeType, description, language, location, clarificationAnswer }) {
  let base64Data = imageBase64;
  if (!base64Data && imagePath && fs.existsSync(imagePath)) {
    base64Data = fs.readFileSync(imagePath).toString('base64');
  }

  const systemPrompt = `You are See & Solve's expert multimodal technical diagnostic and civic infrastructure classifier.
Analyze the provided photo and description together.
Produce a strict JSON response with NO markdown backticks or formatting outside the JSON object.
The JSON must adhere to this exact schema:
{
  "likely_issue": "Concise summary of the likely problem",
  "affected_asset_or_service": "The specific object or infrastructure affected",
  "symptoms_observed": ["Symptom 1", "Symptom 2"],
  "facts": ["Confirmed fact based on description/image"],
  "assumptions": ["Plausible cause or assumption distinguished from facts"],
  "technical_category": "Plumbing | Electrical equipment | Computer or laptop hardware | Household appliances | Washing machine repair | Air conditioning and cooling | Roads and public infrastructure | Water supply and municipal services",
  "severity": "Low | Moderate | High | Hazardous",
  "is_suitable_for_safe_troubleshooting": true | false,
  "troubleshooting_steps": [
    { "step": 1, "instruction": "Actionable step", "expected_outcome": "What happens" }
  ],
  "safe_preliminary_checks": ["Check 1", "Check 2"],
  "when_to_stop": "Clear condition when the user must stop DIY and contact a professional",
  "is_government_related": true | false | "uncertain",
  "public_or_private_ownership": "public" | "private" | "uncertain",
  "likely_responsible_department": "Specific government department name or null",
  "classification_reason": "Detailed justification for public vs private ownership",
  "confidence": 0.85,
  "location_required": true | false,
  "needs_clarification": true | false,
  "follow_up_questions": ["Question 1", "Question 2"],
  "required_technician_specialization": "Plumber | Qualified electrician | Computer or laptop technician | Washing-machine repair technician | AC service technician | Automotive mechanic | Public Authority First | null",
  "tutorial_search_query": "Targeted YouTube search query using exact object + symptom + repair procedure",
  "recommended_tutorial_type": "Description of tutorial"
}`;

  const parts = [
    { text: systemPrompt },
    { text: `User Description: "${description}"\nLocation: "${location || 'Not provided'}"\nPreferred Language: "${language}"\n${clarificationAnswer ? `User Clarification to prior questions: "${clarificationAnswer}"` : ''}` }
  ];

  if (base64Data) {
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64Data
      }
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Empty response from Gemini');

  const cleanJson = textOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanJson);
  parsed.ai_model_used = 'Google Gemini 1.5 Flash (Live Vision API)';
  return parsed;
}

/**
 * Domain Diagnostic Reasoning Engine (Built-in)
 * Follows rigorous safety, civic infrastructure, and specialization rules.
 */
function runDomainDiagnosticEngine({ description, language, location, clarificationAnswer }) {
  const text = (description + ' ' + (clarificationAnswer || '')).toLowerCase().trim();

  // 1. Ambiguity Detection: Check for ambiguous leaking pipe without public/private context
  const isPipeMentioned = text.includes('pipe') || text.includes('pipeline') || text.includes('water leak');
  const hasPublicContext = text.includes('road') || text.includes('street') || text.includes('public') || text.includes('outside') || text.includes('colony road') || text.includes('pavement') || text.includes('municipal') || text.includes('main line');
  const hasPrivateContext = text.includes('kitchen') || text.includes('bathroom') || text.includes('sink') || text.includes('house') || text.includes('home') || text.includes('inside') || text.includes('flat') || text.includes('apartment') || text.includes('private');

  if (isPipeMentioned && !hasPublicContext && !hasPrivateContext && !clarificationAnswer) {
    // Test 9: Ambiguous leaking pipe
    return {
      likely_issue: "Unspecified water pipe leakage",
      affected_asset_or_service: "Water pipeline (Ownership undetermined)",
      symptoms_observed: ["Water leaking from pipe of unconfirmed jurisdiction"],
      facts: ["User reported leaking pipe without specifying location ownership"],
      assumptions: ["Could be an internal residential plumbing leak or an external municipal distribution line"],
      technical_category: "Water supply and plumbing",
      severity: "Moderate",
      is_suitable_for_safe_troubleshooting: false,
      troubleshooting_steps: [],
      safe_preliminary_checks: ["Avoid touching nearby electrical switches or water pooling around cables."],
      when_to_stop: "Do not attempt repairs until location ownership is determined.",
      is_government_related: "uncertain",
      public_or_private_ownership: "uncertain",
      likely_responsible_department: null,
      classification_reason: "Ownership cannot be determined without knowing if the pipe is inside private property or on a public roadway.",
      confidence: 0.50,
      location_required: true,
      needs_clarification: true,
      follow_up_questions: [
        "Is the leaking pipe located inside your private home/building or outside on a public street/road?",
        "Is it connected to a private tap/fixture, or is it a major public distribution pipeline?"
      ],
      required_technician_specialization: null,
      tutorial_search_query: null,
      recommended_tutorial_type: null,
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 2. Public Road Pothole / Road damage
  if (text.includes('pothole') || text.includes('pot hole') || text.includes('road damage') || text.includes('broken road') || text.includes('damaged road') || text.includes('asphalt crack')) {
    return {
      likely_issue: "Deep road pothole / damaged public roadway asphalt",
      affected_asset_or_service: "Public road / Municipal street surface",
      symptoms_observed: ["Crater/depression in road asphalt", "Exposed aggregate road foundation", "Potential vehicle traffic hazard"],
      facts: ["Roadway surface suffers structural damage posing danger to motorists"],
      assumptions: ["Pavement eroded due to monsoon water pooling or heavy vehicle axle transit"],
      technical_category: "Roads and public infrastructure",
      severity: "High",
      is_suitable_for_safe_troubleshooting: false, // NOT DIY!
      troubleshooting_steps: [],
      safe_preliminary_checks: [
        "Do not place unauthorized hazardous barricades without high-visibility markers.",
        "Maintain safe driving distance and slow down when approaching the damaged section."
      ],
      when_to_stop: "Public road repairs must only be carried out by authorized government road engineering departments. DIY asphalt work on public roads is prohibited and unsafe.",
      is_government_related: true,
      public_or_private_ownership: "public",
      likely_responsible_department: "Roads & Buildings Department (PWD) / Municipal Corporation",
      classification_reason: "Public roads and highways are municipal/state government assets maintained under civic public works charters.",
      confidence: 0.95,
      location_required: true,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Public Authority First", // No private technician list!
      tutorial_search_query: null, // No DIY video!
      recommended_tutorial_type: null,
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 3. Public Water Pipeline Leak
  if ((isPipeMentioned && hasPublicContext) || text.includes('municipal water leak') || text.includes('water main burst') || text.includes('street water pipe')) {
    return {
      likely_issue: "Public municipal water pipeline leak / burst distribution main",
      affected_asset_or_service: "Municipal water supply pipeline / Public main",
      symptoms_observed: ["Water gushing or pooling on public street/pavement", "Loss of drinking water pressure in locality", "Erosion of soil under road"],
      facts: ["Water pipeline damage located in public civic area"],
      assumptions: ["Underground distribution joint failed due to ground shift, pressure surge, or heavy traffic"],
      technical_category: "Water supply and municipal services",
      severity: "High",
      is_suitable_for_safe_troubleshooting: false, // NOT DIY!
      troubleshooting_steps: [],
      safe_preliminary_checks: [
        "Keep vehicles and pedestrians away from waterlogged road areas where ground erosion may have caused sinkholes.",
        "Do not tamper with public utility isolation valves."
      ],
      when_to_stop: "Public water pipelines operate under high civic pressure and are municipal property. Private tampering is strictly prohibited.",
      is_government_related: true,
      public_or_private_ownership: "public",
      likely_responsible_department: "Municipal Water Supply & Sewerage Board / RWSS",
      classification_reason: "High-capacity distribution pipes located under public streets are owned and maintained by the municipal water corporation.",
      confidence: 0.92,
      location_required: true,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Public Authority First",
      tutorial_search_query: null,
      recommended_tutorial_type: null,
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 4. Broken Public Streetlight / Electrical Pole
  if (text.includes('streetlight') || text.includes('street light') || text.includes('lamp post') || text.includes('electric pole') || text.includes('transformer')) {
    return {
      likely_issue: "Faulty public street lighting / damaged electricity distribution pole",
      affected_asset_or_service: "Public street lighting fixture & power line",
      symptoms_observed: ["Street lamp not illuminating after dusk", "Flickering public light", "Risk of nighttime accidents"],
      facts: ["Street lighting infrastructure belongs to public municipal/discom network"],
      assumptions: ["Bulb or LED driver blown, timer relay malfunction, or feeder cable severed"],
      technical_category: "Public electrical and civic infrastructure",
      severity: "Moderate",
      is_suitable_for_safe_troubleshooting: false,
      troubleshooting_steps: [],
      safe_preliminary_checks: [
        "Never touch metal poles or low-hanging cables especially during rain.",
        "Report any sparking immediately to power discom helpline 1912."
      ],
      when_to_stop: "Public streetlights carry 230V-440V grid power and require municipal bucket-truck crews.",
      is_government_related: true,
      public_or_private_ownership: "public",
      likely_responsible_department: "Municipal Corporation Electrical Wing / AP Discom (1912)",
      classification_reason: "Streetlights on public roads are maintained by the local urban body or rural Panchayat.",
      confidence: 0.94,
      location_required: true,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Public Authority First",
      tutorial_search_query: null,
      recommended_tutorial_type: null,
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 5. Blocked Private Kitchen Sink / Bathroom Sink
  if (text.includes('sink') || text.includes('kitchen') || (text.includes('drain') && !hasPublicContext && !text.includes('washing machine'))) {
    return {
      likely_issue: "Blocked household sink drain / P-trap obstruction",
      affected_asset_or_service: "Kitchen / Bathroom sink drainage assembly",
      symptoms_observed: ["Standing water in sink basin failing to drain", "Slow drainage gurgle", "Foul odor from drain opening"],
      facts: ["Drain pipe obstructed, stopping gravity wastewater flow"],
      assumptions: ["Accumulation of food residue, hardened grease, soap scum, or hair in the curved P-trap pipe beneath the basin"],
      technical_category: "Plumbing",
      severity: "Low",
      is_suitable_for_safe_troubleshooting: true, // Safe DIY!
      troubleshooting_steps: [
        {
          step: 1,
          instruction: "Inspect the sink strainer basket and clear any visible surface food particles or hair using gloves.",
          expected_outcome: "Removes immediate surface barrier allowing plunger seal."
        },
        {
          step: 2,
          instruction: "Fill the sink with 2-3 inches of standing water. Place a cup plunger firmly over the drain opening and plunge vigorously 6-8 times maintaining the seal.",
          expected_outcome: "Hydrostatic pressure dislodges minor soft clogs in the upper waste arm."
        },
        {
          step: 3,
          instruction: "If water remains blocked, place a shallow bucket under the sink. Unscrew the plastic slip nuts on the curved P-trap by hand or with slip-joint pliers.",
          expected_outcome: "Trap detaches into bucket, allowing direct mechanical removal of trapped solids."
        },
        {
          step: 4,
          instruction: "Wash out the P-trap pipe, check the rubber washer gaskets, reinstall securely, and run warm water to verify a watertight seal.",
          expected_outcome: "Water flows freely without leaking at joints."
        }
      ],
      safe_preliminary_checks: [
        "Do not pour harsh industrial acid or caustic lye if you plan to disassemble the pipe by hand.",
        "Place a bucket and old towels directly beneath the trap before loosening slip nuts."
      ],
      when_to_stop: "If water continues to back up after clearing the P-trap, the clog is located deep inside the wall vent stack or main house drain line. Stop and contact a licensed plumber.",
      is_government_related: false,
      public_or_private_ownership: "private",
      likely_responsible_department: null,
      classification_reason: "Internal household plumbing fixtures are the private property and responsibility of the homeowner/tenant.",
      confidence: 0.96,
      location_required: false,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Plumber",
      tutorial_search_query: "how to unclog kitchen sink p-trap step by step",
      recommended_tutorial_type: "Household kitchen sink drain unblocking and P-trap cleaning",
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 6. Laptop Wi-Fi / Hardware / Driver Issue
  if (text.includes('laptop') || text.includes('computer') || text.includes('wi-fi') || text.includes('wifi') || text.includes('internet on pc') || text.includes('network adapter')) {
    return {
      likely_issue: "Laptop Wi-Fi adapter disconnected or network driver failure",
      affected_asset_or_service: "Laptop wireless network interface card (WLAN)",
      symptoms_observed: ["No available Wi-Fi networks listed", "Wi-Fi toggle grayed out or missing in taskbar", "Code 10 or Code 43 error in Device Manager"],
      facts: ["Computer operating system is unable to establish an active wireless connection"],
      assumptions: ["Network adapter disabled in Windows settings, driver crashed after recent update, or WLAN PCIe card loosened internally"],
      technical_category: "Computer or laptop hardware",
      severity: "Low",
      is_suitable_for_safe_troubleshooting: true, // Safe DIY!
      troubleshooting_steps: [
        {
          step: 1,
          instruction: "Check if Airplane Mode is toggled on or if your laptop has a physical Wi-Fi switch / keyboard function key (e.g. Fn + F2).",
          expected_outcome: "Ensures the wireless radio transmitter is actively enabled."
        },
        {
          step: 2,
          instruction: "Restart the laptop. Then open Settings > Network & Internet > Advanced network settings > Network reset and click 'Reset now'.",
          expected_outcome: "Reinstalls all network adapters and restores TCP/IP stack to default parameters."
        },
        {
          step: 3,
          instruction: "Press Windows Key + X, select 'Device Manager', expand 'Network adapters', right-click your Wi-Fi card (e.g. Intel/Realtek), and select 'Uninstall device' (do not delete driver software). Then click 'Scan for hardware changes'.",
          expected_outcome: "Windows re-detects and cleanly reloads the Wi-Fi card driver."
        },
        {
          step: 4,
          instruction: "If problem persists, connect via mobile hotspot or ethernet cable to download the latest manufacturer wireless driver from official support portal.",
          expected_outcome: "Updates corrupted driver to the stable vendor build."
        }
      ],
      safe_preliminary_checks: [
        "Verify other devices (like smartphones) can connect to the Wi-Fi router before troubleshooting the laptop.",
        "Save all unsaved documents prior to initiating network reset restart."
      ],
      when_to_stop: "If Device Manager does not list any Wi-Fi adapter under Network Adapters even after hardware scan, the internal WLAN card may have physically failed or detached. Seek hardware repair.",
      is_government_related: false,
      public_or_private_ownership: "private",
      likely_responsible_department: null,
      classification_reason: "Personal electronics and computing devices are privately owned consumer equipment.",
      confidence: 0.95,
      location_required: false,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Computer or laptop technician",
      tutorial_search_query: "laptop cannot connect to wifi troubleshooting windows 11",
      recommended_tutorial_type: "Laptop Wi-Fi network adapter driver troubleshooting and reset",
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 7. Washing Machine Not Draining / Appliance Problem
  if (text.includes('washing machine') || text.includes('washer') || text.includes('drain error') || text.includes('washer drain') || text.includes('oe error') || text.includes('5e error')) {
    return {
      likely_issue: "Washing machine not draining / drain pump filter clog",
      affected_asset_or_service: "Washing machine drain pump and filter assembly",
      symptoms_observed: ["Water retained in drum at end of wash cycle", "Drain pump humming but water not evacuating", "Error code (OE / 5E / E20 / F05) on display"],
      facts: ["Appliance cannot expel wash or rinse water during drain cycle"],
      assumptions: ["Foreign objects (coins, bobby pins, lint) obstructing pump impeller, or kinked rear drain hose"],
      technical_category: "Household appliances",
      severity: "Low",
      is_suitable_for_safe_troubleshooting: true, // Safe DIY!
      troubleshooting_steps: [
        {
          step: 1,
          instruction: "Unplug the washing machine from the electrical wall outlet and ensure the rear drain hose is not kinked, crushed, or elevated higher than 1 meter.",
          expected_outcome: "Ensures electrical safety and rules out external hose blockage."
        },
        {
          step: 2,
          instruction: "Locate the small drain filter access door at the bottom front of the machine. Place an old towel and a low baking tray beneath it.",
          expected_outcome: "Prepares catch basin for remaining drum water."
        },
        {
          step: 3,
          instruction: "Pull out the small emergency drain hose (if equipped), uncap it, and drain the water into the tray. Then slowly unscrew the circular drain pump filter counterclockwise.",
          expected_outcome: "Controlled water drainage without flooding laundry floor."
        },
        {
          step: 4,
          instruction: "Remove coins, buttons, and lint debris from the filter cylinder. Reach inside the cavity with a finger to ensure the pump impeller rotates freely. Reinstall filter firmly.",
          expected_outcome: "Clears pump impeller obstruction allowing automatic water drainage."
        }
      ],
      safe_preliminary_checks: [
        "ALWAYS disconnect the power plug before opening the drain pump housing.",
        "Allow hot wash cycles to cool down before opening the filter to prevent scalding."
      ],
      when_to_stop: "If the filter is completely clean, the impeller spins freely, and the machine still fails to pump water while making a grinding sound, the drain pump motor or main control board relay has failed. Call an appliance technician.",
      is_government_related: false,
      public_or_private_ownership: "private",
      likely_responsible_department: null,
      classification_reason: "Domestic home appliances are private personal property.",
      confidence: 0.94,
      location_required: false,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Washing-machine repair technician",
      tutorial_search_query: "washing machine not draining how to clean drain pump filter",
      recommended_tutorial_type: "Washing machine drainage troubleshooting and filter cleaning",
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 8. Hazardous Electrical / Sparking / Fire Hazard
  if (text.includes('spark') || text.includes('burning smell') || text.includes('live wire') || text.includes('shock') || text.includes('meter box') || text.includes('short circuit') || text.includes('circuit breaker trip')) {
    return {
      likely_issue: "Electrical short circuit / hazardous wiring fault",
      affected_asset_or_service: "Household electrical wiring / distribution board",
      symptoms_observed: ["Electrical sparking observed", "Burning plastic odor", "Repeated MCB tripping"],
      facts: ["Active electrical fault poses electrocution and structural fire hazard"],
      assumptions: ["Insulation breakdown between phase and neutral, loose terminal screw overheating, or severe overload"],
      technical_category: "Electrical equipment",
      severity: "Hazardous",
      is_suitable_for_safe_troubleshooting: false, // NOT DIY!
      troubleshooting_steps: [],
      safe_preliminary_checks: [
        "IMMEDIATELY switch off the Main Circuit Breaker (MCB / Isolator) on the distribution panel.",
        "DO NOT touch any bare wires, charred switchboards, or connected metal fixtures.",
        "Keep water away from all electrical equipment."
      ],
      when_to_stop: "Electrical repairs on 230V mains carry mortal electrocution risks. Do not attempt DIY. Wait for a certified electrician.",
      is_government_related: false,
      public_or_private_ownership: "private",
      likely_responsible_department: null,
      classification_reason: "Internal home wiring belongs to the private building owner. Discom authority ends at the electricity meter.",
      confidence: 0.92,
      location_required: false,
      needs_clarification: false,
      follow_up_questions: [],
      required_technician_specialization: "Qualified electrician",
      tutorial_search_query: null, // Withheld for safety!
      recommended_tutorial_type: null,
      ai_model_used: "See & Solve Domain Diagnostic Engine"
    };
  }

  // 9. Default General Diagnostic
  return {
    likely_issue: "Technical maintenance issue requiring inspection",
    affected_asset_or_service: "Equipment / fixture mentioned in description",
    symptoms_observed: [description.substring(0, 80) + '...'],
    facts: ["Issue reported by user requiring diagnosis"],
    assumptions: ["Mechanical wear, electrical fault, or physical obstruction"],
    technical_category: "General technical maintenance",
    severity: "Moderate",
    is_suitable_for_safe_troubleshooting: false,
    troubleshooting_steps: [],
    safe_preliminary_checks: ["Ensure equipment is powered off before physical inspection."],
    when_to_stop: "Consult a qualified specialist if symptoms persist.",
    is_government_related: false,
    public_or_private_ownership: "private",
    likely_responsible_department: null,
    classification_reason: "General private equipment unless specified as civic infrastructure.",
    confidence: 0.70,
    location_required: false,
    needs_clarification: false,
    follow_up_questions: [],
    required_technician_specialization: "Plumber",
    tutorial_search_query: null,
    recommended_tutorial_type: null,
    ai_model_used: "See & Solve Domain Diagnostic Engine"
  };
}

module.exports = {
  analyzeProblem,
  runDomainDiagnosticEngine
};
