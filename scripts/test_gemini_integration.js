import { classifyWithGeminiOrFallback, VALID_DEPARTMENTS } from '../server/geminiService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_CASES = [
  {
    text: 'Mere hostel room mein Wi-Fi nahi chal raha.',
    expectedDepartment: 'Wi-Fi',
    description: 'Hinglish Wi-Fi complaint',
  },
  {
    text: 'Block 14 ke washroom mein water leakage hai 3rd floor pe.',
    expectedDepartment: 'Plumbing',
    expectedBlock: 'Block 14',
    expectedFloor: '3rd floor',
    description: 'Hinglish Plumbing complaint with explicit location',
  },
  {
    text: 'Classroom mein ceiling fan bohot awaaz kar raha hai Room 302.',
    expectedDepartment: 'Electrical',
    expectedRoom: 'Room 302',
    description: 'Electrical fan complaint with room number',
  },
  {
    text: 'Mess di roti bohot kachi te sabzi thandi hai.',
    expectedDepartment: 'Mess',
    description: 'Punjabi Mess food complaint',
  },
  {
    text: 'Faculty projector is not working and audio mic is broken in Academic Block 38.',
    expectedDepartment: 'Academic',
    expectedBlock: 'Academic Block 38',
    description: 'English Academic issue',
  },
  {
    text: 'Hostel lift is stuck and guard is not helping.',
    expectedDepartment: 'Other',
    description: 'Hostel facility and guard issue',
  },
];

async function runTests() {
  console.log('================================================================');
  console.log('  CampusResolve AI — Backend Classification Integration Tests');
  console.log('  Target: Lovely Professional University (LPU), Phagwara Campus');
  console.log('================================================================\n');

  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE'
  );

  console.log(`🔑 GEMINI_API_KEY detected: ${hasKey ? 'YES' : 'NO (Testing resilient fallback)'}`);
  console.log(`⚙️  Active Engine: ${hasKey ? 'Gemini 2.5 Flash API' : 'Rule-Based Fallback Engine'}\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`[Test ${i + 1}/${TEST_CASES.length}] ${tc.description}`);
    console.log(`   Input: "${tc.text}"`);

    const result = await classifyWithGeminiOrFallback({ text: tc.text });

    // 1. Check exact original complaint preserved
    const textMatch = result.originalComplaint === tc.text;
    // 2. Check department validity
    const validDept = VALID_DEPARTMENTS.includes(result.department);
    const deptMatch = result.department === tc.expectedDepartment;
    // 3. Check schema types
    const validSchema =
      typeof result.needsHumanReview === 'boolean' &&
      typeof result.reasonForClassification === 'string' &&
      result.reasonForClassification.length > 0 &&
      typeof result.processingTimeMs === 'number' &&
      ['gemini-ai', 'rule-based-fallback'].includes(result.method);

    // 4. Check location extraction if expected
    let locationOk = true;
    if (tc.expectedBlock && result.extractedBlock !== tc.expectedBlock) {
      locationOk = false;
    }
    if (tc.expectedFloor && result.extractedFloor !== tc.expectedFloor) {
      locationOk = false;
    }
    if (tc.expectedRoom && result.extractedRoom !== tc.expectedRoom) {
      locationOk = false;
    }

    if (textMatch && validDept && deptMatch && validSchema && locationOk) {
      console.log(`   ✅ PASS: Classified as [${result.department}] in ${result.processingTimeMs}ms (Method: ${result.method})`);
      if (result.extractedBlock || result.extractedFloor || result.extractedRoom) {
        console.log(`      Extracted Location -> Block: ${result.extractedBlock || 'None'}, Floor: ${result.extractedFloor || 'None'}, Room: ${result.extractedRoom || 'None'}`);
      }
      console.log(`      Reason: ${result.reasonForClassification}`);
      passed++;
    } else {
      console.log(`   ❌ FAIL:`);
      console.log(`      Expected Dept: ${tc.expectedDepartment}, Got: ${result.department}`);
      console.log(`      Text Preserved: ${textMatch}, Valid Schema: ${validSchema}`);
      console.log(`      Result:`, result);
      failed++;
    }
    console.log('');
  }

  // Test 7: Empty input handling
  console.log(`[Test 7] Empty input handling`);
  const emptyRes = await classifyWithGeminiOrFallback({ text: '' });
  if (emptyRes.department === 'Other' && emptyRes.needsHumanReview === true) {
    console.log(`   ✅ PASS: Empty input safely handled (Department: Other, needsHumanReview: true)\n`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: Unexpected response for empty input:`, emptyRes);
    failed++;
  }

  console.log('================================================================');
  console.log(`  Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
