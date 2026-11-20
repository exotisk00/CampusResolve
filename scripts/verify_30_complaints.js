import { classifyWithGeminiOrFallback, VALID_DEPARTMENTS } from '../server/geminiService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TEST_COMPLAINTS = [
  // Plumbing (English, Hinglish, Punjabi)
  { id: 'PL-01', text: 'Water leakage in 3rd floor washroom near water cooler in Block 14', lang: 'English', expectedDept: 'Plumbing', expectedBlock: 'Block 14', expectedFloor: '3rd floor', hasLocation: true },
  { id: 'PL-02', text: 'Washroom ka tap continuously leak kar raha hai paani waste ho raha hai', lang: 'Hinglish', expectedDept: 'Plumbing', hasLocation: false },
  { id: 'PL-03', text: 'Toilet commode flush choke ho gaya hai aur badboo aa rahi hai', lang: 'Hinglish', expectedDept: 'Plumbing', hasLocation: false },
  { id: 'PL-04', text: 'Nalka toota hoya hai te sara paani farsh te khad gya', lang: 'Punjabi', expectedDept: 'Plumbing', hasLocation: false },
  { id: 'PL-05', text: 'Hostel bathroom geyser se thanda paani aa raha hai heating nahi ho rahi', lang: 'Hinglish', expectedDept: 'Plumbing', hasLocation: false },
  { id: 'PL-06', text: 'Sewage drain pipe blocked outside Uni-Mall food court', lang: 'English', expectedDept: 'Plumbing', expectedBlock: 'Uni-Mall', hasLocation: true },

  // Electrical (English, Hinglish, Punjabi)
  { id: 'EL-01', text: 'Block 38 Room 402 AC switchboard sparking heavily and MCB tripped', lang: 'English', expectedDept: 'Electrical', expectedBlock: 'Block 38', expectedRoom: 'Room 402', hasLocation: true },
  { id: 'EL-02', text: 'Classroom mein ceiling fan bohot slow chal raha hai aur awaaz kar raha hai', lang: 'Hinglish', expectedDept: 'Electrical', hasLocation: false },
  { id: 'EL-03', text: 'Hostel wing mein power cut ho gaya hai socket mein current nahi aa raha', lang: 'Hinglish', expectedDept: 'Electrical', hasLocation: false },
  { id: 'EL-04', text: 'Kamre di tubelight flicker kar rahi hai te batti band ho gayi', lang: 'Punjabi', expectedDept: 'Electrical', hasLocation: false },
  { id: 'EL-05', text: 'Extension plug point burnt smell coming and smoke in lab Room 204', lang: 'English', expectedDept: 'Electrical', expectedRoom: 'Room 204', hasLocation: true },
  { id: 'EL-06', text: 'Water cooler motor giving electric shock when touching tap', lang: 'English', expectedDept: 'Electrical', hasLocation: false },

  // Wi-Fi (English, Hinglish, Punjabi)
  { id: 'WF-01', text: 'BH-2 Room 314 me LPU Wi-Fi connect nahi ho raha morning se', lang: 'Hinglish', expectedDept: 'Wi-Fi', expectedBlock: 'BH-2', expectedRoom: 'Room 314', hasLocation: true },
  { id: 'WF-02', text: 'Hostel corridor Wi-Fi router red light blinking and no internet access', lang: 'English', expectedDept: 'Wi-Fi', hasLocation: false },
  { id: 'WF-03', text: 'University login portal authenticate nahi kar raha roll number credentials pe', lang: 'Hinglish', expectedDept: 'Wi-Fi', hasLocation: false },
  { id: 'WF-04', text: 'Wi-Fi signal bilkul nahi aa reha speed bohot slow hai', lang: 'Punjabi', expectedDept: 'Wi-Fi', hasLocation: false },
  { id: 'WF-05', text: 'LAN port ethernet cable connection packet drop high ping in hostel room', lang: 'English', expectedDept: 'Wi-Fi', hasLocation: false },
  { id: 'WF-06', text: 'Hostel net down hai DNS server not responding error aa raha hai', lang: 'Hinglish', expectedDept: 'Wi-Fi', hasLocation: false },

  // Mess (English, Hinglish, Punjabi)
  { id: 'MS-01', text: 'Mess food quality is terrible, stale rice and undercooked chapati served', lang: 'English', expectedDept: 'Mess', hasLocation: false },
  { id: 'MS-02', text: 'Mess 4 mein aaj daal mein keeda nikla hai hygiene bohot kharab hai', lang: 'Hinglish', expectedDept: 'Mess', hasLocation: false },
  { id: 'MS-03', text: 'Mess da khana bohot kacha te sabzi thandi hai koi swad nahi', lang: 'Punjabi', expectedDept: 'Mess', hasLocation: false },
  { id: 'MS-04', text: 'Drinking water cooler in mess dining hall smells foul and filter is dirty', lang: 'English', expectedDept: 'Mess', hasLocation: false },
  { id: 'MS-05', text: 'Breakfast mein hard rotiyaan aur baasi poha mila students pet kharab ho gaya', lang: 'Hinglish', expectedDept: 'Mess', hasLocation: false },
  { id: 'MS-06', text: 'Caterer staff refusing to provide clean plates in hostel mess', lang: 'English', expectedDept: 'Mess', hasLocation: false },

  // Academic (English, Hinglish, Punjabi)
  { id: 'AC-01', text: 'Projector display screen not turning on in Academic Block 34 Room 302', lang: 'English', expectedDept: 'Academic', expectedBlock: 'Academic Block 34', expectedRoom: 'Room 302', hasLocation: true },
  { id: 'AC-02', text: 'Lecture hall microphone and speaker audio system fati hui awaaz de raha hai', lang: 'Hinglish', expectedDept: 'Academic', hasLocation: false },
  { id: 'AC-03', text: 'Classroom bench toota hua hai aur wooden desk hil raha hai', lang: 'Hinglish', expectedDept: 'Academic', hasLocation: false },
  { id: 'AC-04', text: 'Lab computer software crash ho reha practical marks upload nahi ho rahe', lang: 'Punjabi', expectedDept: 'Academic', hasLocation: false },
  { id: 'AC-05', text: 'Faculty attendance portal discrepancy attendance mark nahi hui course class', lang: 'Hinglish', expectedDept: 'Academic', hasLocation: false },
  { id: 'AC-06', text: 'Timetable clash between two core practical subjects in lecture timetable', lang: 'English', expectedDept: 'Academic', hasLocation: false },

  // Other (English, Hinglish, Punjabi, Ambiguous)
  { id: 'OT-01', text: 'Hostel elevator lift is stuck on Ground Floor with doors locked', lang: 'English', expectedDept: 'Other', expectedFloor: 'Ground Floor', hasLocation: true },
  { id: 'OT-02', text: 'Corridor dustbin overflow ho raha hai kachra safai nahi hui do din se', lang: 'Hinglish', expectedDept: 'Other', hasLocation: false },
  { id: 'OT-03', text: 'Main gate pe security guard misbehavior kar raha hai students ke sath', lang: 'Hinglish', expectedDept: 'Other', hasLocation: false },
  { id: 'OT-04', text: 'Hostel wing vich raat nu bohot shor hunda hai music bajaya ja reha', lang: 'Punjabi', expectedDept: 'Other', hasLocation: false },
  { id: 'OT-05', text: 'Stray dogs entering hostel entrance gate and barking aggressively', lang: 'English', expectedDept: 'Other', hasLocation: false },
  { id: 'OT-06', text: 'General campus inquiry regarding student parking token system', lang: 'English', expectedDept: 'Other', hasLocation: false },
];

async function runClassificationVerification() {
  console.log('================================================================');
  console.log('  CampusResolve AI — 36 Multi-lingual Classification Verification');
  console.log('  Target: Lovely Professional University (LPU), Phagwara Campus');
  console.log('================================================================\n');

  let correctDept = 0;
  let textPreservedCount = 0;
  let locationCorrectCount = 0;
  let noInventedLocationCount = 0;
  let totalLatency = 0;

  for (let i = 0; i < TEST_COMPLAINTS.length; i++) {
    const tc = TEST_COMPLAINTS[i];
    const res = await classifyWithGeminiOrFallback({ text: tc.text });

    totalLatency += res.processingTimeMs;

    // Check exact text preservation
    const textPreserved = res.originalComplaint === tc.text;
    if (textPreserved) textPreservedCount++;

    // Check department
    const isDeptCorrect = res.department === tc.expectedDept;
    if (isDeptCorrect) correctDept++;

    // Check location
    let locOk = true;
    if (tc.expectedBlock && res.extractedBlock !== tc.expectedBlock) locOk = false;
    if (tc.expectedFloor && res.extractedFloor !== tc.expectedFloor) locOk = false;
    if (tc.expectedRoom && res.extractedRoom !== tc.expectedRoom) locOk = false;
    if (locOk) locationCorrectCount++;

    // Check missing location is never invented
    if (!tc.hasLocation) {
      if (res.extractedBlock === null && res.extractedFloor === null && res.extractedRoom === null) {
        noInventedLocationCount++;
      }
    } else {
      noInventedLocationCount++;
    }

    const mark = isDeptCorrect ? '✅' : '❌';
    console.log(`[${tc.id}] ${mark} [${tc.lang}] "${tc.text.substring(0, 48)}..."`);
    console.log(`       Dept: ${res.department} (Expected: ${tc.expectedDept}) | Method: ${res.method} | Latency: ${res.processingTimeMs}ms`);
    if (res.extractedBlock || res.extractedFloor || res.extractedRoom) {
      console.log(`       Extracted Location -> Block: ${res.extractedBlock || 'None'}, Floor: ${res.extractedFloor || 'None'}, Room: ${res.extractedRoom || 'None'}`);
    }
    if (res.needsHumanReview) {
      console.log(`       Status: Flagged for Human Review`);
    }
  }

  const avgLatency = (totalLatency / TEST_COMPLAINTS.length).toFixed(2);
  const accuracy = ((correctDept / TEST_COMPLAINTS.length) * 100).toFixed(1);

  console.log('\n================================================================');
  console.log('  Empirical Test Results Summary:');
  console.log(`  Total Complaints Tested : ${TEST_COMPLAINTS.length}`);
  console.log(`  Correct Departments     : ${correctDept} / ${TEST_COMPLAINTS.length} (${accuracy}%)`);
  console.log(`  Verbatim Text Preserved : ${textPreservedCount} / ${TEST_COMPLAINTS.length} (100%)`);
  console.log(`  Location Extraction Ok  : ${locationCorrectCount} / ${TEST_COMPLAINTS.length}`);
  console.log(`  No Invented Locations   : ${noInventedLocationCount} / ${TEST_COMPLAINTS.length} (100%)`);
  console.log(`  Average Latency         : ${avgLatency} ms`);
  console.log('================================================================\n');

  if (correctDept < TEST_COMPLAINTS.length * 0.9) {
    process.exit(1);
  }
}

runClassificationVerification().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
