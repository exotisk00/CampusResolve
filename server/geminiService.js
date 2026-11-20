import { GoogleGenAI, Type } from '@google/genai';
import { classifyComplaint as ruleBasedClassifier } from '../src/services/classifier.js';
import { extractLocationFromText, verifyLocationAgainstText } from './locationExtractor.js';

export const VALID_DEPARTMENTS = [
  'Plumbing',
  'Electrical',
  'Wi-Fi',
  'Mess',
  'Academic',
  'Other',
];

const SYSTEM_INSTRUCTION = `You are the AI Complaint Classification Engine for CampusResolve AI, exclusively deployed at Lovely Professional University (LPU), Phagwara campus.

Your task is to classify campus complaints submitted by LPU students or staff into EXACTLY ONE of the following 6 departments:
1. Plumbing: Water leakage, broken taps, flush issues, toilet clogs, geyser water leaks, pipe bursts, bathroom drainage.
2. Electrical: Power cuts, sparkling switchboards, tripped MCBs, faulty fans, flickering tubelights, AC failure, heater/cooler motor shock, broken sockets.
3. Wi-Fi: Campus internet down, slow Wi-Fi, hostel router blinking red, portal login authentication issues, DNS problems, LAN cable ports.
4. Mess: Bad food quality, stale or undercooked roti/dal, insects in mess food, cold meals, mess contractor complaints, dirty dining plates.
5. Academic: Classroom projectors not working, mic/speaker failure, broken classroom benches/podium, lab computers, attendance discrepancies, lecture timetable issues.
6. Other: Security guards, campus lifts/elevators, garbage disposal, laundry/dhobi, stray dogs/monkeys, lost & found, parking, noise complaints.

Guidelines:
1. Languages: You must understand English, Hinglish (Hindi written in English), and Romanised Punjabi (Punjabi written in English).
2. Original Text: The "originalComplaint" field MUST match the input complaint exactly, word-for-word, without any translation, spell-correction, or alteration.
3. Location Extraction:
   - Extract "extractedBlock" (e.g. "Block 14", "BH-2", "GH-1", "Academic Block 38"), "extractedFloor" (e.g. "3rd floor", "ground floor"), and "extractedRoom" (e.g. "Room 302", "Cabin 401") ONLY IF explicitly stated in the complaint text.
   - If a location field is NOT stated in the text, set it to null. NEVER guess or invent missing location information!
4. Human Review Flag:
   - Set "needsHumanReview" to true if the complaint is vague, ambiguous, mentions issues spanning multiple departments without a clear primary issue, or contains conflicting details.
   - Set "needsHumanReview" to false if the complaint clearly belongs to one specific department.
5. Reason:
   - Provide a clear, concise one-sentence explanation in "reasonForClassification" explaining why this department was selected based on the specific keywords and intent.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalComplaint: { type: Type.STRING },
    department: {
      type: Type.STRING,
      enum: VALID_DEPARTMENTS,
    },
    extractedBlock: { type: Type.STRING, nullable: true },
    extractedFloor: { type: Type.STRING, nullable: true },
    extractedRoom: { type: Type.STRING, nullable: true },
    needsHumanReview: { type: Type.BOOLEAN },
    reasonForClassification: { type: Type.STRING },
  },
  required: [
    'originalComplaint',
    'department',
    'needsHumanReview',
    'reasonForClassification',
  ],
};

/**
 * Classifies a complaint using Gemini AI, with automatic fallback to rule-based classifier.
 *
 * @param {object} params
 * @param {string} params.text - The raw complaint text
 * @param {string} [params.language] - Optional language hint
 * @param {string} [params.block] - Optional user-provided block
 * @param {string} [params.floor] - Optional user-provided floor
 * @param {string} [params.roomNumber] - Optional user-provided room
 * @returns {Promise<object>} Structured classification output
 */
export async function classifyWithGeminiOrFallback({
  text,
  language = 'auto',
  block = '',
  floor = '',
  roomNumber = '',
}) {
  const startTime = Date.now();
  const rawComplaint = text ? text.trim() : '';

  if (!rawComplaint) {
    return {
      originalComplaint: '',
      department: 'Other',
      extractedBlock: null,
      extractedFloor: null,
      extractedRoom: null,
      needsHumanReview: true,
      reasonForClassification: 'Empty complaint text provided.',
      method: 'rule-based-fallback',
      fallbackReason: 'Empty input',
      processingTimeMs: Date.now() - startTime,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

  // 1. If GEMINI_API_KEY is not configured or placeholder, immediately run fallback
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    const fallbackResult = executeRuleBasedFallback(rawComplaint, block, floor, roomNumber);
    return {
      ...fallbackResult,
      method: 'rule-based-fallback',
      fallbackReason: 'GEMINI_API_KEY is not configured in backend .env',
      processingTimeMs: Date.now() - startTime,
    };
  }

  // 2. Attempt Gemini Classification with 8-second timeout
  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Please classify this LPU campus complaint:
"${rawComplaint}"
Language hint: ${language}
${block ? `User provided block: ${block}` : ''}
${floor ? `User provided floor: ${floor}` : ''}
${roomNumber ? `User provided room: ${roomNumber}` : ''}`;

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API request timed out (8s limit)')), 8000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const responseText = response.text ? response.text.trim() : '';

    if (!responseText) {
      throw new Error('Received empty response from Gemini API');
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`Failed to parse Gemini JSON response: ${parseErr.message}`);
    }

    // Validate structured response
    if (!parsed.department || !VALID_DEPARTMENTS.includes(parsed.department)) {
      throw new Error(`Invalid department returned by model: "${parsed.department}"`);
    }

    // Strictly verify candidate location against verbatim complaint text to eliminate hallucinations
    const verifiedLocation = verifyLocationAgainstText(rawComplaint, {
      extractedBlock: parsed.extractedBlock || (block ? block.trim() : null),
      extractedFloor: parsed.extractedFloor || (floor ? floor.trim() : null),
      extractedRoom: parsed.extractedRoom || (roomNumber ? roomNumber.trim() : null),
    });

    // Preserve exact original input text
    const cleanOutput = {
      originalComplaint: rawComplaint,
      department: parsed.department,
      extractedBlock: verifiedLocation.extractedBlock,
      extractedFloor: verifiedLocation.extractedFloor,
      extractedRoom: verifiedLocation.extractedRoom,
      needsHumanReview: Boolean(parsed.needsHumanReview),
      reasonForClassification:
        parsed.reasonForClassification ||
        `Classified as ${parsed.department} by Gemini 2.5 Flash model.`,
      method: 'gemini-ai',
      processingTimeMs: Date.now() - startTime,
    };

    return cleanOutput;
  } catch (error) {
    console.warn(`[GeminiService] API call failed: ${error.message}. Activating rule-based fallback.`);
    const fallbackResult = executeRuleBasedFallback(rawComplaint, block, floor, roomNumber);
    return {
      ...fallbackResult,
      method: 'rule-based-fallback',
      fallbackReason: error.message || 'Gemini API call failed',
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Executes the rule-based classifier with location extraction.
 */
function executeRuleBasedFallback(rawComplaint, block, floor, roomNumber) {
  const ruleResult = ruleBasedClassifier(rawComplaint);
  const verifiedLocation = verifyLocationAgainstText(rawComplaint, {
    extractedBlock: block ? block.trim() : null,
    extractedFloor: floor ? floor.trim() : null,
    extractedRoom: roomNumber ? roomNumber.trim() : null,
  });

  // Check ambiguity: If score is 0 or multiple departments have top scores
  const allScores = ruleResult.matchDetails?.allScores || {};
  const scoreValues = Object.values(allScores).sort((a, b) => b - a);
  const isAmbiguous =
    ruleResult.rawScore === 0 ||
    (scoreValues.length > 1 && scoreValues[0] > 0 && scoreValues[0] === scoreValues[1]);

  let reason = '';
  if (ruleResult.rawScore === 0) {
    reason = 'No clear keywords matched known categories; routed to Other for manual staff triage.';
  } else if (ruleResult.matchDetails?.matchedRules?.length > 0) {
    const topMatches = ruleResult.matchDetails.matchedRules.slice(0, 2).join(', ');
    reason = `Matched rule-based campus signals: [${topMatches}] pointing to ${ruleResult.department}.`;
  } else {
    reason = `Categorized into ${ruleResult.department} based on standard campus classification rules.`;
  }

  return {
    originalComplaint: rawComplaint,
    department: ruleResult.department,
    extractedBlock: verifiedLocation.extractedBlock,
    extractedFloor: verifiedLocation.extractedFloor,
    extractedRoom: verifiedLocation.extractedRoom,
    needsHumanReview: isAmbiguous,
    reasonForClassification: reason,
  };
}
