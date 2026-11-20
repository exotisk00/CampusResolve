import { extractLocationFromText, verifyLocationAgainstText } from '../server/locationExtractor.js';

console.log('================================================================');
console.log('  CampusResolve AI — Campus Location Extraction Test Suite');
console.log('  Testing English, Hinglish, and Romanised Punjabi Complaints');
console.log('================================================================\n');

const testCases = [
  // User Prompt Exact Test Case
  {
    id: 'REQ-01',
    lang: 'Hinglish',
    text: 'Block 14 ke washroom mein water leakage hai.',
    expectedBlock: 'Block 14',
    expectedFloor: null,
    expectedRoom: null,
  },
  // Hinglish without specific room/floor
  {
    id: 'HING-02',
    lang: 'Hinglish',
    text: 'Mere hostel room mein Wi-Fi nahi chal raha.',
    expectedBlock: null,
    expectedFloor: null,
    expectedRoom: null,
  },
  // Hinglish with Block & Room
  {
    id: 'HING-03',
    lang: 'Hinglish',
    text: 'BH-2 Room 314 me LPU Wi-Fi connect nahi ho raha hai morning se',
    expectedBlock: 'BH-2',
    expectedFloor: null,
    expectedRoom: 'Room 314',
  },
  // Hinglish with Block & Floor
  {
    id: 'HING-04',
    lang: 'Hinglish',
    text: 'Block 34 3rd floor washroom mein paani nahi aa raha.',
    expectedBlock: 'Block 34',
    expectedFloor: '3rd floor',
    expectedRoom: null,
  },
  // English with Block & Floor
  {
    id: 'ENG-01',
    lang: 'English',
    text: 'Water leakage in 3rd floor washroom near water cooler in Block 14',
    expectedBlock: 'Block 14',
    expectedFloor: '3rd floor',
    expectedRoom: null,
  },
  // English with Academic Block, Floor & Room
  {
    id: 'ENG-02',
    lang: 'English',
    text: 'Projector not displaying in Academic Block 38 2nd floor Room 204',
    expectedBlock: 'Academic Block 38',
    expectedFloor: '2nd floor',
    expectedRoom: 'Room 204',
  },
  // English with no location
  {
    id: 'ENG-03',
    lang: 'English',
    text: 'The food served in the hostel mess is completely cold and unhygienic.',
    expectedBlock: null,
    expectedFloor: null,
    expectedRoom: null,
  },
  // Romanised Punjabi with Block only
  {
    id: 'PUNJ-01',
    lang: 'Punjabi',
    text: 'Block 14 de washroom vich paani leak ho reha hai',
    expectedBlock: 'Block 14',
    expectedFloor: null,
    expectedRoom: null,
  },
  // Romanised Punjabi with GH Block & Room
  {
    id: 'PUNJ-02',
    lang: 'Punjabi',
    text: 'Room 102 vich lightan nahi chal rahiyan GH-1',
    expectedBlock: 'GH-1',
    expectedFloor: null,
    expectedRoom: 'Room 102',
  },
  // Romanised Punjabi with Manzil (Floor)
  {
    id: 'PUNJ-03',
    lang: 'Punjabi',
    text: 'Pehli manzil te tap toot gaya hai Block 28',
    expectedBlock: 'Block 28',
    expectedFloor: 'Pehli manzil',
    expectedRoom: null,
  },
  // False-positive numbers prevention: "10" is time, not floor or room
  {
    id: 'FP-01',
    lang: 'Hinglish',
    text: 'Raat 10 baje mess mein khana khatam ho gaya tha.',
    expectedBlock: null,
    expectedFloor: null,
    expectedRoom: null,
  },
  // False-positive numbers: "14" is student count, not Block 14
  {
    id: 'FP-02',
    lang: 'English',
    text: '14 students were waiting for the lab technician outside.',
    expectedBlock: null,
    expectedFloor: null,
    expectedRoom: null,
  },
];

let passed = 0;

for (const tc of testCases) {
  const result = extractLocationFromText(tc.text);
  const sanitized = verifyLocationAgainstText(tc.text, result);

  const blockMatch = sanitized.extractedBlock === tc.expectedBlock;
  const floorMatch = sanitized.extractedFloor === tc.expectedFloor;
  const roomMatch = sanitized.extractedRoom === tc.expectedRoom;

  const ok = blockMatch && floorMatch && roomMatch;

  if (ok) {
    passed++;
    console.log(`✅ [PASS] ${tc.id} (${tc.lang}): "${tc.text}"`);
    console.log(`   Block: ${sanitized.extractedBlock} | Floor: ${sanitized.extractedFloor} | Room: ${sanitized.extractedRoom}\n`);
  } else {
    console.log(`❌ [FAIL] ${tc.id} (${tc.lang}): "${tc.text}"`);
    console.log(`   Expected -> Block: ${tc.expectedBlock}, Floor: ${tc.expectedFloor}, Room: ${tc.expectedRoom}`);
    console.log(`   Actual   -> Block: ${sanitized.extractedBlock}, Floor: ${sanitized.extractedFloor}, Room: ${sanitized.extractedRoom}\n`);
  }
}

console.log('================================================================');
console.log(`  Location Extraction Results: ${passed} / ${testCases.length} Passed`);
console.log('================================================================\n');

if (passed === testCases.length) {
  process.exit(0);
} else {
  process.exit(1);
}
