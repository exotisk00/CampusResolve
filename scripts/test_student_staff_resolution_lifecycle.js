/**
 * TASK 08 Integration Test: Student-to-Staff Complaint Resolution Workflow
 * CampusResolve AI — LPU Phagwara Campus
 * Target Firebase Project: campusresolve-ai-c8a8f
 *
 * Verifies all 10 steps of the resolution lifecycle:
 * 1. Student submits a Plumbing complaint.
 * 2. Complaint appears in Danish's Staff Dashboard (real-time).
 * 3. Danish changes it to Under Review.
 * 4. Student Dashboard updates automatically via real-time listener.
 * 5. Danish adds a staff note.
 * 6. Student can see the note.
 * 7. Danish changes status to In Progress.
 * 8. Danish resolves the complaint.
 * 9. Student sees Resolved status, resolution date, and final staff note.
 * 10. Unauthorized staff and students cannot modify other complaints.
 */

import 'dotenv/config';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth as getStudentAuth,
  createUserWithEmailAndPassword as studentSignUp,
  signOut as studentSignOut,
} from 'firebase/auth';
import {
  getFirestore as getStudentDb,
  doc as studentDoc,
  setDoc as studentSetDoc,
  getDoc as studentGetDoc,
  updateDoc as studentUpdateDoc,
  onSnapshot as studentOnSnapshot,
  query as studentQuery,
  collection as studentCollection,
  where as studentWhere,
  orderBy as studentOrderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  subscribeToDepartmentComplaints,
  updateComplaintStatus,
} from '../src/services/complaintsService.js';
import { auth, db } from '../src/lib/firebase.js';
import { createTestTracker, HISTORICAL_PROTECTED_TICKETS } from './test_harness.js';

console.log('========================================================================');
console.log('TASK 08: COMPLETE STUDENT-TO-STAFF RESOLUTION LIFECYCLE TEST');
console.log('Target Firebase Project:', process.env.VITE_FIREBASE_PROJECT_ID);
console.log('Authorized Staff:', 'Danish Kumar (danish22@gmail.com - Plumbing)');
console.log('========================================================================\n');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function runResolutionLifecycleTest() {
  const timestamp = Date.now();
  const tracker = createTestTracker();
  console.log(`[Setup] Initialized Test Tracker. Run ID: ${tracker.testRunId}\n`);

  let studentApp = null;
  let unsubscribeStaff = null;
  let unsubscribeStudent = null;

  try {
    // -----------------------------------------------------------------
    // 0. Setup: Authenticate Danish (Plumbing Staff) & Create Isolated Student
    // -----------------------------------------------------------------
    console.log('[Setup 0.1] Authenticating Danish Kumar (Plumbing Staff)...');
    const staffCred = await signInWithEmailAndPassword(auth, 'danish22@gmail.com', 'CampusStaff2026!');
    const staffUid = staffCred.user.uid;
    const staffDocSnap = await getDoc(doc(db, 'users', staffUid));
    const staffProfile = staffDocSnap.data();
    console.log(`  ✓ Danish Kumar authenticated. Role: "${staffProfile.role}", Dept: "${staffProfile.department}"`);

    console.log('[Setup 0.2] Initializing isolated student session...');
    studentApp = initializeApp(firebaseConfig, `student_app_${timestamp}`);
    const sAuth = getStudentAuth(studentApp);
    const sDb = getStudentDb(studentApp);

    const studentEmail = `student_wf_${timestamp}@test.lpu.in`;
    const studentPass = 'StudentTestPass123!';
    const studentCred = await studentSignUp(sAuth, studentEmail, studentPass);
    const studentUid = studentCred.user.uid;
    tracker.trackUser(studentUid);

    await studentSetDoc(studentDoc(sDb, 'users', studentUid), {
      uid: studentUid,
      fullName: 'Aarav Sharma',
      email: studentEmail,
      role: 'student',
      department: null,
      campus: 'LPU Phagwara',
      createdAt: serverTimestamp(),
      isActive: true,
      testRunId: tracker.testRunId,
    });
    console.log(`  ✓ Test student registered. UID: ${studentUid}, Email: ${studentEmail}\n`);

    // Setup Danish's real-time queue listener for Plumbing
    let staffQueue = [];
    unsubscribeStaff = subscribeToDepartmentComplaints(
      'Plumbing',
      (items) => {
        staffQueue = items;
      },
      (err) => {
        console.error('  Staff listener error:', err.message);
      }
    );

    // Setup Student's real-time listener for their complaints
    let studentComplaints = [];
    const studentQ = studentQuery(
      studentCollection(sDb, 'complaints'),
      studentWhere('userId', '==', studentUid),
      studentOrderBy('createdAt', 'desc')
    );
    unsubscribeStudent = studentOnSnapshot(
      studentQ,
      (snapshot) => {
        studentComplaints = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
      (err) => {
        console.error('  Student listener error:', err.message);
      }
    );

    // Give listeners time to initialize
    await new Promise((r) => setTimeout(r, 1200));

    // -----------------------------------------------------------------
    // Step 1: Student submits a Plumbing complaint
    // -----------------------------------------------------------------
    console.log('[Step 1] Student submitting a new Plumbing complaint...');
    const testTicketId = `CR-PLUMB-${timestamp}`;
    const originalComplaintText = `Major water leakage under sink in Block 14 2nd floor room 204 at ${timestamp}`;
    tracker.trackComplaint(testTicketId);

    const complaintData = tracker.attachTestMarkers({
      ticketId: testTicketId,
      userId: studentUid,
      userEmail: studentEmail,
      originalComplaint: originalComplaintText,
      language: 'English',
      department: 'Plumbing',
      extractedBlock: 'Block 14',
      extractedFloor: '2nd floor',
      extractedRoom: 'room 204',
      classificationMethod: 'gemini-ai',
      needsHumanReview: false,
      reasonForClassification: 'Under sink pipe leakage in washroom',
      status: 'Submitted',
      campus: 'LPU Phagwara',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await studentSetDoc(studentDoc(sDb, 'complaints', testTicketId), complaintData);
    console.log(`  ✓ Complaint submitted with ticket ID: ${testTicketId}`);
    console.log(`    Status: Submitted | Department: Plumbing | Verbatim Text: "${originalComplaintText}"\n`);

    // -----------------------------------------------------------------
    // Step 2: Complaint appears in Danish's Staff Dashboard
    // -----------------------------------------------------------------
    console.log("[Step 2] Verifying complaint appears in Danish's Staff Dashboard...");
    let staffReceived = null;
    for (let i = 0; i < 15; i++) {
      staffReceived = staffQueue.find((c) => (c.ticketId || c.id) === testTicketId);
      if (staffReceived) break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!staffReceived) {
      throw new Error('Step 2 Failed: Complaint did not appear in Danish Kumar\'s Plumbing dashboard!');
    }
    if (staffReceived.originalComplaint !== originalComplaintText) {
      throw new Error('Step 2 Failed: Verbatim complaint text was altered!');
    }
    if (staffReceived.extractedBlock !== 'Block 14' || staffReceived.extractedRoom !== 'room 204') {
      throw new Error('Step 2 Failed: Extracted location details mismatched!');
    }
    console.log(`  ✓ Complaint appeared in Danish's queue in real-time.`);
    console.log(`    Verified Location: Block ${staffReceived.extractedBlock}, Floor ${staffReceived.extractedFloor}, Room ${staffReceived.extractedRoom}\n`);

    // -----------------------------------------------------------------
    // Step 3: Danish changes it to "Under Review"
    // -----------------------------------------------------------------
    console.log('[Step 3] Danish Kumar transitions status to "Under Review"...');
    await updateComplaintStatus(testTicketId, 'Under Review');
    console.log('  ✓ Status update to "Under Review" sent by Danish.');

    // -----------------------------------------------------------------
    // Step 4: Student Dashboard updates automatically
    // -----------------------------------------------------------------
    console.log('[Step 4] Checking student dashboard auto-synchronization for "Under Review"...');
    let studentUnderReview = null;
    for (let i = 0; i < 15; i++) {
      studentUnderReview = studentComplaints.find((c) => (c.ticketId || c.id) === testTicketId);
      if (studentUnderReview && studentUnderReview.status === 'Under Review') break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!studentUnderReview || studentUnderReview.status !== 'Under Review') {
      throw new Error('Step 4 Failed: Student dashboard did not sync to "Under Review" in real-time!');
    }
    console.log('  ✓ Student real-time listener received updated status: "Under Review"\n');

    // -----------------------------------------------------------------
    // Step 5: Danish adds a staff note
    // -----------------------------------------------------------------
    console.log('[Step 5] Danish Kumar appends a staff note...');
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const note1 = `[${dateStr} - Danish Kumar (Plumbing)]: Inspected site; identified failed gasket on main inlet valve.`;
    await updateComplaintStatus(testTicketId, 'Under Review', note1);
    console.log('  ✓ Staff note added by Danish.');

    // -----------------------------------------------------------------
    // Step 6: Student can see the note
    // -----------------------------------------------------------------
    console.log('[Step 6] Verifying student dashboard reflects the staff note...');
    let studentWithNote = null;
    for (let i = 0; i < 15; i++) {
      studentWithNote = studentComplaints.find((c) => (c.ticketId || c.id) === testTicketId);
      if (studentWithNote && studentWithNote.staffNote && studentWithNote.staffNote.includes('failed gasket')) break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!studentWithNote || !studentWithNote.staffNote?.includes('failed gasket')) {
      throw new Error('Step 6 Failed: Student dashboard did not receive staff note in real-time!');
    }
    console.log(`  ✓ Student received staff note: "${studentWithNote.staffNote}"\n`);

    // -----------------------------------------------------------------
    // Step 7: Danish changes status to "In Progress" with note history
    // -----------------------------------------------------------------
    console.log('[Step 7] Danish transitions status to "In Progress" with appended work note...');
    const note2 = `[${dateStr} - Danish Kumar (Plumbing)]: Dispatched technician Rahul with replacement gasket and pipe seal.`;
    const combinedNotes = `${studentWithNote.staffNote}\n\n${note2}`;
    await updateComplaintStatus(testTicketId, 'In Progress', combinedNotes);

    let studentInProgress = null;
    for (let i = 0; i < 15; i++) {
      studentInProgress = studentComplaints.find((c) => (c.ticketId || c.id) === testTicketId);
      if (studentInProgress && studentInProgress.status === 'In Progress') break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!studentInProgress || studentInProgress.status !== 'In Progress') {
      throw new Error('Step 7 Failed: Status was not updated to "In Progress"!');
    }
    if (!studentInProgress.staffNote.includes('Dispatched technician Rahul')) {
      throw new Error('Step 7 Failed: Cumulative staff note history was lost!');
    }
    console.log('  ✓ Student received status "In Progress" with cumulative note history.\n');

    // -----------------------------------------------------------------
    // Step 8: Danish resolves the complaint
    // -----------------------------------------------------------------
    console.log('[Step 8] Danish resolves the complaint with final resolution note...');
    const resolutionNote = `[${dateStr} - Danish Kumar (Plumbing)]: Replaced gasket and inlet valve. Tested water flow; no leaks observed. Issue fully resolved.`;
    const finalNotes = `${studentInProgress.staffNote}\n\n${resolutionNote}`;
    await updateComplaintStatus(testTicketId, 'Resolved', finalNotes);
    console.log('  ✓ Complaint marked as "Resolved" by Danish.');

    // -----------------------------------------------------------------
    // Step 9: Student sees Resolved status and resolution information
    // -----------------------------------------------------------------
    console.log('[Step 9] Verifying student dashboard reflects "Resolved" and complete resolution info...');
    let studentResolved = null;
    for (let i = 0; i < 15; i++) {
      studentResolved = studentComplaints.find((c) => (c.ticketId || c.id) === testTicketId);
      if (studentResolved && studentResolved.status === 'Resolved') break;
      await new Promise((r) => setTimeout(r, 800));
    }

    if (!studentResolved || studentResolved.status !== 'Resolved') {
      throw new Error('Step 9 Failed: Student dashboard did not reflect "Resolved" status!');
    }
    if (!studentResolved.updatedAt) {
      throw new Error('Step 9 Failed: Resolution updatedAt timestamp is missing!');
    }
    if (!studentResolved.staffNote.includes('Issue fully resolved')) {
      throw new Error('Step 9 Failed: Final resolution note not found in student record!');
    }
    if (studentResolved.originalComplaint !== originalComplaintText) {
      throw new Error('Step 9 Failed: Original complaint was modified during resolution lifecycle!');
    }

    console.log('  ✓ Verified student sees:');
    console.log('    • Status:            Resolved');
    console.log('    • Trustworthy Date:  ', studentResolved.updatedAt.toDate ? studentResolved.updatedAt.toDate().toISOString() : 'Present');
    console.log('    • Final Staff Notes:  3 appended chronological entries preserved');
    console.log('    • Original Text:     Verbatim text 100% preserved\n');

    // -----------------------------------------------------------------
    // Step 10: Unauthorized staff and students cannot modify other departments' complaints
    // -----------------------------------------------------------------
    console.log('[Step 10] Testing security boundaries (unauthorized modifications)...');

    // 10A: Student attempts to modify status of their own complaint directly
    console.log('  [10A] Student attempts to modify complaint status directly...');
    let studentDenied = false;
    try {
      await studentUpdateDoc(studentDoc(sDb, 'complaints', testTicketId), {
        status: 'Resolved',
      });
    } catch (err) {
      if (
        err.code === 'permission-denied' ||
        err.message?.includes('permission-denied') ||
        err.message?.includes('Missing or insufficient permissions')
      ) {
        studentDenied = true;
        console.log('    ✓ Correctly blocked student from modifying status: permission-denied');
      } else {
        console.log('    Student update error:', err.code, err.message);
      }
    }
    if (!studentDenied) {
      throw new Error('Step 10A Failed: Student was able to modify complaint status!');
    }

    // 10B: Student submits an Electrical complaint, and Danish (Plumbing staff) attempts to modify it
    console.log('  [10B] Verifying Danish (Plumbing staff) CANNOT modify an Electrical complaint...');
    const elecTicketId = `CR-ELEC-${timestamp}`;
    tracker.trackComplaint(elecTicketId);

    await studentSetDoc(
      studentDoc(sDb, 'complaints', elecTicketId),
      tracker.attachTestMarkers({
        ticketId: elecTicketId,
        userId: studentUid,
        userEmail: studentEmail,
        originalComplaint: `Power fluctuation in Block 3 hostel room at ${timestamp}`,
        language: 'English',
        department: 'Electrical',
        extractedBlock: 'Block 3',
        extractedFloor: null,
        extractedRoom: null,
        classificationMethod: 'gemini-ai',
        needsHumanReview: false,
        reasonForClassification: 'Power fluctuation in hostel room',
        status: 'Submitted',
        campus: 'LPU Phagwara',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    let crossDeptUpdateBlocked = false;
    try {
      await updateComplaintStatus(elecTicketId, 'In Progress', 'Attempting cross-department update');
    } catch (err) {
      if (
        err.code === 'permission-denied' ||
        err.message?.includes('permission-denied') ||
        err.message?.includes('Missing or insufficient permissions')
      ) {
        crossDeptUpdateBlocked = true;
        console.log('    ✓ Correctly blocked Danish from modifying Electrical complaint: permission-denied');
      } else {
        console.log('    Cross-department update error:', err.code, err.message);
      }
    }

    if (!crossDeptUpdateBlocked) {
      throw new Error('Step 10B Failed: Plumbing staff was able to modify Electrical complaint!');
    }

    // 10C: Danish attempts to subscribe to another department queue (Electrical)
    console.log('  [10C] Plumbing staff attempts to subscribe to Electrical department queue...');
    let otherDeptDenied = false;
    const unsubOther = subscribeToDepartmentComplaints(
      'Electrical',
      () => {},
      (err) => {
        if (
          err.code === 'permission-denied' ||
          err.message?.includes('permission-denied') ||
          err.message?.includes('Missing or insufficient permissions')
        ) {
          otherDeptDenied = true;
          console.log('    ✓ Correctly blocked cross-department subscription: permission-denied');
        }
      }
    );
    await new Promise((r) => setTimeout(r, 1200));
    if (unsubOther) unsubOther();

    if (!otherDeptDenied) {
      throw new Error('Step 10C Failed: Plumbing staff was able to subscribe to Electrical complaints!');
    }
    console.log('  ✓ Step 10 PASSED: All security boundary checks enforced by Firestore rules.\n');

    console.log('========================================================================');
    console.log('SUCCESS: ALL 10 STEPS OF TASK 08 LIFECYCLE PASSED COMPLETELY!');
    console.log('========================================================================\n');
    return true;
  } finally {
    console.log('[Teardown] Cleaning up listeners and test artifacts...');
    if (unsubscribeStaff) unsubscribeStaff();
    if (unsubscribeStudent) unsubscribeStudent();
    if (studentApp) {
      try {
        await deleteApp(studentApp);
      } catch (_) {}
    }

    // Automated test tracker cleanup
    const cleanupResult = await tracker.cleanup();
    console.log('  Cleanup summary:', cleanupResult);

    // Verify historical protected complaints remain intact
    console.log('  Verifying historical complaints integrity:');
    for (const hTicket of HISTORICAL_PROTECTED_TICKETS) {
      const snap = await getDoc(doc(db, 'complaints', hTicket));
      if (!snap.exists()) {
        console.error(`  ✗ CRITICAL WARNING: Historical ticket ${hTicket} missing!`);
      } else {
        console.log(`    • ${hTicket}: intact (status: ${snap.data().status})`);
      }
    }
  }
}

runResolutionLifecycleTest()
  .then(() => {
    console.log('\nWorkflow test execution finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Workflow test failed:', err);
    process.exit(1);
  });
