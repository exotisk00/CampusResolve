import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { subscribeToDepartmentComplaints } from '../src/services/complaintsService.js';
import { auth as staffAuth, db as staffDb } from '../src/lib/firebase.js';

console.log('====================================================');
console.log('TASK 01: REAL-TIME DEPARTMENT COMPLAINT SUBSCRIPTION TEST');
console.log('Target Firebase Project:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('====================================================\n');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function runTests() {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@test.com`;
  const plumbingStaffEmail = `staff_plumbing_${timestamp}@test.com`;
  const password = 'TestPassword123!';

  // Separate Firebase App instance for the student (representing student's browser session)
  const studentApp = initializeApp(firebaseConfig, `studentApp_${timestamp}`);
  const studentAuth = getAuth(studentApp);
  const studentDb = getFirestore(studentApp);

  console.log('[Step 1] Creating test student session...');
  const studentCred = await createUserWithEmailAndPassword(studentAuth, studentEmail, password);
  const studentUid = studentCred.user.uid;
  await setDoc(doc(studentDb, 'users', studentUid), {
    uid: studentUid,
    fullName: 'Test Student',
    email: studentEmail,
    role: 'student',
    department: null,
    campus: 'LPU Phagwara',
    createdAt: serverTimestamp(),
    isActive: true,
  });
  console.log('  ✓ Student created and authenticated in student session:', studentUid);

  console.log('[Step 2] Creating test Plumbing staff session...');
  const staffCred = await createUserWithEmailAndPassword(staffAuth, plumbingStaffEmail, password);
  const staffUid = staffCred.user.uid;
  await setDoc(doc(staffDb, 'users', staffUid), {
    uid: staffUid,
    fullName: 'Plumbing Staff Officer',
    email: plumbingStaffEmail,
    role: 'staff',
    department: 'Plumbing',
    campus: 'LPU Phagwara',
    createdAt: serverTimestamp(),
    isActive: true,
  });
  console.log('  ✓ Plumbing staff profile created in Firestore (role: staff, department: Plumbing)\n');

  // Test 1: Subscribe to Plumbing complaints as Plumbing staff (authorized)
  console.log('[Test 1] Testing authorized subscription: department = "Plumbing"...');
  let plumbingUpdatesCount = 0;
  let receivedComplaints = [];

  const unsubscribePlumbing = subscribeToDepartmentComplaints(
    'Plumbing',
    (complaints) => {
      plumbingUpdatesCount++;
      receivedComplaints = complaints;
      console.log(`  [Snapshot Event #${plumbingUpdatesCount}] Received ${complaints.length} Plumbing complaints.`);
    },
    (err) => {
      console.error('  ✗ Unexpected error in Plumbing subscription:', err);
    }
  );

  // Wait 1.5s for initial snapshot
  await new Promise((r) => setTimeout(r, 1500));
  if (plumbingUpdatesCount >= 1) {
    console.log('  ✓ Test 1 PASSED: Plumbing staff successfully received initial Plumbing complaints.\n');
  } else {
    throw new Error('Test 1 Failed: Initial snapshot did not arrive!');
  }

  // Test 2: Try unauthorized subscription to Electrical department
  console.log('[Test 2] Testing unauthorized subscription: department = "Electrical" as Plumbing staff...');
  let unauthorizedErrorReceived = false;
  let unauthorizedErrorCode = null;

  const unsubscribeElectrical = subscribeToDepartmentComplaints(
    'Electrical',
    (complaints) => {
      console.error('  ✗ SECURITY BREACH: Received Electrical complaints when unauthorized!', complaints.length);
    },
    (err) => {
      unauthorizedErrorReceived = true;
      unauthorizedErrorCode = err.code || err.message;
      console.log('  ✓ Correctly rejected by Firestore Security Rules!');
      console.log('    Captured error code:', unauthorizedErrorCode);
    }
  );

  await new Promise((r) => setTimeout(r, 1500));
  if (unsubscribeElectrical) unsubscribeElectrical();

  if (!unauthorizedErrorReceived) {
    throw new Error('Test 2 Failed: Unauthorized department subscription was NOT rejected by Firestore!');
  }
  console.log('  ✓ Test 2 PASSED: Staff CANNOT access unauthorized departments.\n');

  // Test 3: Real-time update - Student creates a new Plumbing complaint
  console.log('[Test 3] Testing real-time update delivery without refresh...');
  const testTicketId = `CR-${timestamp}`;
  const testComplaintText = `Water leakage in Block 14 washroom pipeline at timestamp ${timestamp}`;

  console.log('  Student submitting new Plumbing complaint ticket:', testTicketId);
  const complaintDocRef = doc(studentDb, 'complaints', testTicketId);
  await setDoc(complaintDocRef, {
    ticketId: testTicketId,
    userId: studentUid,
    userEmail: studentEmail,
    originalComplaint: testComplaintText,
    language: 'English',
    department: 'Plumbing',
    extractedBlock: 'Block 14',
    extractedFloor: null,
    extractedRoom: null,
    classificationMethod: 'rule-based-fallback',
    needsHumanReview: false,
    reasonForClassification: 'Washroom water pipe leakage',
    status: 'Submitted',
    campus: 'LPU Phagwara',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('  ✓ Student wrote complaint to Firestore.');

  // Check if Plumbing staff received the real-time update
  console.log('  Waiting for Plumbing staff onSnapshot listener to receive new complaint...');
  let matchedNewComplaint = false;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const found = receivedComplaints.find((c) => c.ticketId === testTicketId || c.originalComplaint === testComplaintText);
    if (found) {
      matchedNewComplaint = true;
      console.log('  ✓ Live snapshot received by staff member!');
      console.log('    Ticket ID:', found.ticketId);
      console.log('    Department:', found.department);
      console.log('    Status:', found.status);
      console.log('    Original Complaint:', found.originalComplaint);
      break;
    }
  }

  if (!matchedNewComplaint) {
    throw new Error('Test 3 Failed: New complaint did not arrive via real-time subscription!');
  }
  console.log('  ✓ Test 3 PASSED: New complaint received live via Firestore onSnapshot!\n');

  // Test 4: Verify unsubscribe function works properly
  console.log('[Test 4] Testing unsubscribe function...');
  unsubscribePlumbing();
  const countAtUnsubscribe = plumbingUpdatesCount;

  // Student submits another complaint
  const secondTicketId = `CR-${timestamp}-2`;
  await setDoc(doc(studentDb, 'complaints', secondTicketId), {
    ticketId: secondTicketId,
    userId: studentUid,
    userEmail: studentEmail,
    originalComplaint: `Second water leak at ${timestamp}`,
    language: 'English',
    department: 'Plumbing',
    extractedBlock: 'Block 14',
    extractedFloor: null,
    extractedRoom: null,
    classificationMethod: 'rule-based-fallback',
    needsHumanReview: false,
    reasonForClassification: 'Second water leak',
    status: 'Submitted',
    campus: 'LPU Phagwara',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await new Promise((r) => setTimeout(r, 2000));
  if (plumbingUpdatesCount === countAtUnsubscribe) {
    console.log('  ✓ No new events received after calling unsubscribe().');
    console.log('  ✓ Test 4 PASSED: Unsubscribe function properly tears down listener.\n');
  } else {
    throw new Error('Test 4 Failed: Received event after unsubscribe!');
  }

  // Test 5: Verify invalid department validation
  console.log('[Test 5] Testing invalid department input handling...');
  let invalidDeptError = null;
  const dummyUnsub = subscribeToDepartmentComplaints('InvalidDeptXYZ', () => {}, (err) => {
    invalidDeptError = err;
  });
  if (dummyUnsub && typeof dummyUnsub === 'function') {
    dummyUnsub();
  }
  if (invalidDeptError && invalidDeptError.message.includes('Invalid department')) {
    console.log('  ✓ Correctly rejected invalid department input:', invalidDeptError.message);
    console.log('  ✓ Test 5 PASSED: Client-side validation protects against invalid queries.\n');
  } else {
    throw new Error('Test 5 Failed: Invalid department was not rejected!');
  }

  console.log('====================================================');
  console.log('ALL 5 SUBSCRIPTION VERIFICATION TESTS PASSED (100%)!');
  console.log('====================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n✗ Test failed with error:', err);
  process.exit(1);
});
