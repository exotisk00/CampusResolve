import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  subscribeToDepartmentComplaints,
  updateComplaintStatus,
  subscribeToUserComplaints,
} from '../src/services/complaintsService.js';
import { auth, db } from '../src/lib/firebase.js';
import { createTestTracker } from './test_harness.js';

console.log('========================================================================');
console.log('TASK 06: STAFF DASHBOARD & WORKFLOW END-TO-END TEST');
console.log('Target Firebase Project:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('Staff User: Danish Kumar (danish22@gmail.com - Plumbing)');
console.log('========================================================================\n');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function runDashboardTests() {
  const timestamp = Date.now();
  const tracker = createTestTracker();
  let unsubscribePlumbing = null;

  console.log('  Active Test Run ID:', tracker.testRunId);

  try {
    // -----------------------------------------------------------------
    // 1. Staff Login Verification (Danish Kumar)
    // -----------------------------------------------------------------
  console.log('[Test 1] Authenticating Danish Kumar (Plumbing Staff)...');
  const staffCred = await signInWithEmailAndPassword(auth, 'danish22@gmail.com', 'CampusStaff2026!');
  const staffUid = staffCred.user.uid;
  console.log('  ✓ Staff authenticated in Firebase Auth. UID:', staffUid);

  const staffDoc = await getDoc(doc(db, 'users', staffUid));
  const staffProfile = staffDoc.data();
  console.log('  Staff Profile Loaded:');
  console.log('    Full Name: ', staffProfile.fullName);
  console.log('    Role:      ', staffProfile.role);
  console.log('    Department:', staffProfile.department);

  if (staffProfile.role !== 'staff' || staffProfile.department !== 'Plumbing') {
    throw new Error('Test 1 Failed: Profile does not match staff role or Plumbing department!');
  }
  console.log('  ✓ Test 1 PASSED: Danish Kumar profile verified for Plumbing staff.\n');

  // -----------------------------------------------------------------
  // 2. Department-Specific Subscription Verification
  // -----------------------------------------------------------------
  console.log('[Test 2] Subscribing Danish Kumar to Plumbing complaints queue...');
  let plumbingComplaints = [];
  let subscriptionFired = false;

  unsubscribePlumbing = subscribeToDepartmentComplaints(
    staffProfile.department,
    (items) => {
      plumbingComplaints = items;
      subscriptionFired = true;
      console.log(`  [Live Snapshot] Received ${items.length} Plumbing complaints.`);
    },
    (err) => {
      console.error('  ✗ Unexpected subscription error:', err);
    }
  );

  await new Promise((r) => setTimeout(r, 1500));
  if (!subscriptionFired) {
    throw new Error('Test 2 Failed: Initial department snapshot did not fire!');
  }
  console.log('  ✓ Test 2 PASSED: Real-time subscription established successfully.\n');

  // -----------------------------------------------------------------
  // 3. Department Isolation Check (Attempt unauthorized subscription)
  // -----------------------------------------------------------------
  console.log('[Test 3] Testing unauthorized department access (Electrical) as Danish...');
  let electricalRejected = false;

  const unsubElectrical = subscribeToDepartmentComplaints(
    'Electrical',
    (items) => {
      console.error('  ✗ SECURITY BREACH: Received Electrical tickets when unauthorized!', items.length);
    },
    (err) => {
      if (err.code === 'permission-denied') {
        electricalRejected = true;
        console.log('  ✓ Correctly rejected by Firestore rules: code = "permission-denied"');
      }
    }
  );

  await new Promise((r) => setTimeout(r, 1500));
  if (unsubElectrical) unsubElectrical();

  if (!electricalRejected) {
    throw new Error('Test 3 Failed: Unauthorized department access was NOT rejected!');
  }
  console.log('  ✓ Test 3 PASSED: Department isolation strictly maintained.\n');

  // -----------------------------------------------------------------
  // 4. Live Cross-Session Delivery (Student submits new Plumbing complaint)
  // -----------------------------------------------------------------
  console.log('[Test 4] Testing live real-time update arrival without reload...');
  const studentApp = initializeApp(firebaseConfig, `studentApp_${timestamp}`);
  const { getAuth: getStudentAuth, createUserWithEmailAndPassword: studentSignUp } = await import('firebase/auth');
  const { getFirestore: getStudentDb, doc: studentDoc, setDoc: studentSetDoc } = await import('firebase/firestore');

  const studentAuth = getStudentAuth(studentApp);
  const studentDb = getStudentDb(studentApp);

  const studentEmail = `student_dash_${timestamp}@test.com`;
  const studentPass = 'StudentPassword123!';
  const studentCred = await studentSignUp(studentAuth, studentEmail, studentPass);
  const studentUid = studentCred.user.uid;

  tracker.trackUser(studentUid);

  // Create student profile in Firestore
  await studentSetDoc(studentDoc(studentDb, 'users', studentUid), {
    uid: studentUid,
    fullName: 'Test Student Officer',
    email: studentEmail,
    role: 'student',
    department: null,
    campus: 'LPU Phagwara',
    createdAt: serverTimestamp(),
    isActive: true,
    testRunId: tracker.testRunId,
  });

  const testTicketId = `CR-PLUMB-${timestamp}`;
  const testComplaintText = `Severe pipeline valve leakage in Block 14 2nd floor washroom at ${timestamp}`;

  tracker.trackComplaint(testTicketId);

  console.log('  Student submitting new Plumbing ticket:', testTicketId);
  await studentSetDoc(
    studentDoc(studentDb, 'complaints', testTicketId),
    tracker.attachTestMarkers({
      ticketId: testTicketId,
      userId: studentUid,
      userEmail: studentEmail,
      originalComplaint: testComplaintText,
      language: 'English',
      department: 'Plumbing',
      extractedBlock: 'Block 14',
      extractedFloor: '2nd floor',
      extractedRoom: null,
      classificationMethod: 'gemini-ai',
      needsHumanReview: false,
      reasonForClassification: 'Washroom water pipeline leakage',
      status: 'Submitted',
      campus: 'LPU Phagwara',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  // Verify Danish receives this ticket live
  console.log('  Waiting for Danish snapshot listener to receive the ticket...');
  let receivedLive = false;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const found = plumbingComplaints.find((c) => (c.ticketId || c.id) === testTicketId);
    if (found) {
      receivedLive = true;
      console.log('  ✓ Live ticket received by Danish Kumar:');
      console.log('    Ticket ID: ', found.ticketId || found.id);
      console.log('    Status:    ', found.status);
      console.log('    Location:  ', found.extractedBlock, found.extractedFloor);
      break;
    }
  }

  if (!receivedLive) {
    throw new Error('Test 4 Failed: New complaint did not arrive live in staff subscription!');
  }
  console.log('  ✓ Test 4 PASSED: Live complaint received without page reload.\n');

  // -----------------------------------------------------------------
  // 5. Authorized Status Update & Note Append
  // -----------------------------------------------------------------
  console.log('[Test 5] Danish Kumar updates complaint status & adds note...');
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const staffNoteText = `[${dateStr} - Danish Kumar (Plumbing)]: Technician dispatched with replacement valve.`;

  await updateComplaintStatus(testTicketId, 'In Progress', staffNoteText);
  console.log('  ✓ Status updated to "In Progress" in Firestore.');

  // Verify the updated status in Firestore
  const updatedDocSnap = await getDoc(doc(db, 'complaints', testTicketId));
  const updatedData = updatedDocSnap.data();
  console.log('  Updated Record Verification:');
  console.log('    Status:    ', updatedData.status);
  console.log('    Staff Note:', updatedData.staffNote);

  if (updatedData.status !== 'In Progress' || !updatedData.staffNote.includes('Danish Kumar')) {
    throw new Error('Test 5 Failed: Status or staff note was not updated properly!');
  }
  console.log('  ✓ Test 5 PASSED: Staff status update and note appended successfully.\n');

  // -----------------------------------------------------------------
  // 6. Student Unauthorized Status Update Rejection
  // -----------------------------------------------------------------
  console.log('[Test 6] Verifying student CANNOT modify complaint status...');
  let studentUpdateBlocked = false;
  try {
    await updateDoc(studentDoc(studentDb, 'complaints', testTicketId), {
      status: 'Resolved',
    });
  } catch (err) {
    if (err.code === 'permission-denied') {
      studentUpdateBlocked = true;
      console.log('  ✓ Correctly rejected student update: code = "permission-denied"');
    }
  }

  if (!studentUpdateBlocked) {
    throw new Error('Test 6 Failed: Security Rules allowed student to modify complaint status!');
  }
  console.log('  ✓ Test 6 PASSED: Students strictly forbidden from updating status.\n');

  console.log('========================================================================');
  console.log('ALL 6 END-TO-END STAFF DASHBOARD TESTS PASSED (100%)!');
  console.log('========================================================================');
  return true;
} finally {
  console.log('\n[Teardown] Running automated test cleanup...');
  if (unsubscribePlumbing) {
    unsubscribePlumbing();
  }
  const cleanupRes = await tracker.cleanup();
  console.log('  Cleanup Result:', cleanupRes);
}
}

runDashboardTests().catch((err) => {
  console.error('\n✗ Test failed with error:', err);
  process.exit(1);
});
