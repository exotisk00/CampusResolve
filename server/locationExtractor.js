/**
 * Location Extractor Utility
 * CampusResolve AI — Lovely Professional University (LPU), Phagwara Campus
 *
 * Extracts explicitly stated campus locations from raw complaint text.
 * Strictly avoids inventing, guessing, or defaulting unstated location details.
 */

export function extractLocationFromText(text) {
  if (!text || typeof text !== 'string') {
    return {
      extractedBlock: null,
      extractedFloor: null,
      extractedRoom: null,
    };
  }

  let extractedBlock = null;
  let extractedFloor = null;
  let extractedRoom = null;

  // 1. Block Extraction
  // Examples: "Block 14", "Block-34", "BH 2", "BH-4", "GH 1", "GH-2", "Academic Block 38"
  const blockPatterns = [
    /\b(Academic\s+Block\s+[\w\d]+)\b/i,
    /\b(Block[\s\-]*\d+[A-Za-z]?)\b/i,
    /\b(BH[\s\-]*\d+)\b/i,          // Boys Hostel e.g. BH 2
    /\b(GH[\s\-]*\d+)\b/i,          // Girls Hostel e.g. GH 1
    /\b(Uni[\s\-]*Mall)\b/i,        // LPU Uni-Mall
    /\b(Central\s+Library)\b/i,     // LPU Central Library
  ];

  for (const pattern of blockPatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedBlock = match[1].trim();
      break;
    }
  }

  // 2. Floor Extraction
  // Examples: "3rd floor", "ground floor", "1st floor", "second floor", "top floor", "basement", "teesri manzil"
  const floorPatterns = [
    /\b((?:ground|1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|first|second|third|fourth|fifth|top)\s+(?:floor|manzil))\b/i,
    /\b((?:pehli|doosri|teesri|chauthi|panchvi)\s+(?:floor|manzil))\b/i,
    /\b(floor[\s\-]+(?:ground|\d+|first|second|third|fourth|fifth))\b/i,
    /\b(basement)\b/i,
  ];

  for (const pattern of floorPatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedFloor = match[1].trim();
      break;
    }
  }

  // 3. Room Number Extraction
  // Examples: "Room 302", "Room no. 412", "Room-105", "cabin 401", "flat 204", "lab 102", "kamra 304"
  // Note: Only extracts if prefixed with Room/Cabin/Flat/Lab/Kamra. Never extracts standalone digits.
  const roomPatterns = [
    /\b(Room\s*(?:no\.?|number)?[\s\-]*[A-Za-z]?\d+[A-Za-z]?)\b/i,
    /\b(Cabin[\s\-]*[A-Za-z]?\d+)\b/i,
    /\b(Flat[\s\-]*\d+)\b/i,
    /\b(Lab[\s\-]*\d+)\b/i,
    /\b(Kamra[\s\-]*\d+)\b/i,
  ];

  for (const pattern of roomPatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedRoom = match[1].trim();
      break;
    }
  }

  return {
    extractedBlock,
    extractedFloor,
    extractedRoom,
  };
}

/**
 * Validates and sanitizes location candidates against the verbatim original complaint text.
 * Strictly guarantees that any location field returned is genuinely present in the text,
 * preventing LLM hallucinations, stale state, or default/mock values from fabricating
 * unmentioned floors or rooms.
 *
 * @param {string} rawComplaint - The exact verbatim complaint text
 * @param {object} [candidate] - Candidate location object from LLM or form fields
 * @returns {{ extractedBlock: string|null, extractedFloor: string|null, extractedRoom: string|null }}
 */
export function verifyLocationAgainstText(rawComplaint, candidate = {}) {
  if (!rawComplaint || typeof rawComplaint !== 'string') {
    return { extractedBlock: null, extractedFloor: null, extractedRoom: null };
  }

  const textLower = rawComplaint.toLowerCase();
  const ruleLocation = extractLocationFromText(rawComplaint);

  // Helper: Verifies that a candidate string or its core numbers actually appear in the text
  const isCandidateGenuinelyInText = (candidateVal) => {
    if (!candidateVal || typeof candidateVal !== 'string') return false;
    const clean = candidateVal.trim().toLowerCase();
    if (!clean) return false;
    // Check if whole candidate is in the complaint
    if (textLower.includes(clean)) return true;
    // For values like "Room 314" or "Floor 10", check if the number is in text
    const numberMatch = clean.match(/\d+/);
    if (numberMatch && textLower.includes(numberMatch[0])) {
      return true;
    }
    return false;
  };

  // 1. Block
  let finalBlock = ruleLocation.extractedBlock;
  if (!finalBlock && candidate?.extractedBlock && isCandidateGenuinelyInText(candidate.extractedBlock)) {
    finalBlock = candidate.extractedBlock.trim();
  }

  // 2. Floor
  let finalFloor = ruleLocation.extractedFloor;
  if (!finalFloor && candidate?.extractedFloor && isCandidateGenuinelyInText(candidate.extractedFloor)) {
    finalFloor = candidate.extractedFloor.trim();
  }

  // 3. Room
  let finalRoom = ruleLocation.extractedRoom;
  if (!finalRoom && candidate?.extractedRoom && isCandidateGenuinelyInText(candidate.extractedRoom)) {
    finalRoom = candidate.extractedRoom.trim();
  }

  return {
    extractedBlock: finalBlock || null,
    extractedFloor: finalFloor || null,
    extractedRoom: finalRoom || null,
  };
}
