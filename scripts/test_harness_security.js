import 'dotenv/config';
import fs from 'fs';
import {
  createTestTracker,
  EXPECTED_PROJECT_ID,
  HISTORICAL_PROTECTED_TICKETS,
} from './test_harness.js';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

console.log('========================================================================');
console.log('TASK 07.1: TEST HARNESS & SAFETY CLEANUP VERIFICATION');
console.log('Target Firebase Project:', EXPECTED_PROJECT_ID);
console.log('========================================================================\n');

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  '/Users/anishkumar/CampusResolve-Secrets/serviceAccountKey.json';

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const app =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: EXPECTED_PROJECT_ID,
      });

const db = getFirestore(app);

async function runTestSuite() {
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, desc) {
    totalCount++;
    if (condition) {
      console.log(`  ✓ [PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // -----------------------------------------------------------------
  // 1. Cleanup Disabled by Default
  // -----------------------------------------------------------------
  console.log('[Test 1] Verifying cleanup is DISABLED by default without explicit env flags...');
  const trackerDefault = createTestTracker({
    env: {
      // Intentionally omitting ALLOW_TEST_CLEANUP and NODE_ENV
    },
  });

  const safetyDefault = trackerDefault.evaluateSafetyConditions();
  assert(!safetyDefault.allowed, 'Safety gate rejects cleanup when env flags are missing');
  assert(
    safetyDefault.reasons.some((r) => r.includes('ALLOW_TEST_CLEANUP')),
    'Identified missing ALLOW_TEST_CLEANUP flag'
  );

  const cleanupDefault = await trackerDefault.cleanup();
  assert(cleanupDefault.skipped === true, 'cleanup() returns skipped: true when safety fails');
  console.log('');

  // -----------------------------------------------------------------
  // 2. Wrong Project Rejection
  // -----------------------------------------------------------------
  console.log('[Test 2] Verifying wrong project ID rejection...');
  const trackerWrongProject = createTestTracker({
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_CLEANUP: 'true',
    },
  });

  const safetyWrongProject = trackerWrongProject.evaluateSafetyConditions('malicious-project-xyz');
  assert(!safetyWrongProject.allowed, 'Safety gate rejects mismatched project ID');
  assert(
    safetyWrongProject.reasons.some((r) => r.includes('malicious-project-xyz')),
    'Identified mismatched project ID reason'
  );
  console.log('');

  // -----------------------------------------------------------------
  // 3. Historical Record Protection
  // -----------------------------------------------------------------
  console.log('[Test 3] Verifying absolute immunity for historical production & legacy tickets...');
  const trackerImmunity = createTestTracker({
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_CLEANUP: 'true',
    },
  });

  // Try tracking all 5 historical tickets
  for (const ticketId of HISTORICAL_PROTECTED_TICKETS) {
    trackerImmunity.trackComplaint(ticketId);
  }

  assert(trackerImmunity.getTrackedCount().complaints === 0, 'Refuses to track any historical protected tickets');

  // Verify historical tickets exist and remain untouched in Firestore
  for (const ticketId of HISTORICAL_PROTECTED_TICKETS) {
    const docSnap = await db.collection('complaints').doc(ticketId).get();
    assert(docSnap.exists, `Historical ticket ${ticketId} exists and remains untouched`);
  }
  console.log('');

  // -----------------------------------------------------------------
  // 4. Missing Test Marker Rejection
  // -----------------------------------------------------------------
  console.log('[Test 4] Verifying rejection of records with missing/mismatched testRunId marker...');
  const trackerMarkerCheck = createTestTracker({
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_CLEANUP: 'true',
    },
  });

  const unmarkedTicketId = `CR-TEST-UNMARKED-${Date.now()}`;
  // Create a document without the current tracker's testRunId
  await db.collection('complaints').doc(unmarkedTicketId).set({
    ticketId: unmarkedTicketId,
    originalComplaint: 'This document has missing test markers',
    department: 'Plumbing',
    status: 'Submitted',
    campus: 'LPU Phagwara',
    // Notice: isAutomatedTest is missing, testRunId is mismatched
    testRunId: 'some_other_run_token_99999',
    createdAt: FieldValue.serverTimestamp(),
  });

  // Attempt to track and delete it
  trackerMarkerCheck.trackComplaint(unmarkedTicketId);
  const cleanupMarkerRes = await trackerMarkerCheck.cleanup();

  assert(cleanupMarkerRes.skippedTickets.includes(unmarkedTicketId), 'Skipped deletion due to mismatched testRunId');

  // Verify document still exists in Firestore (safety guard prevented deletion)
  const stillExistsSnap = await db.collection('complaints').doc(unmarkedTicketId).get();
  assert(stillExistsSnap.exists, 'Document with mismatched marker was safely preserved');

  // Cleanup the test fixture safely
  await db.collection('complaints').doc(unmarkedTicketId).delete();
  console.log('');

  // -----------------------------------------------------------------
  // 5. Current-Run Test Record Cleanup
  // -----------------------------------------------------------------
  console.log('[Test 5] Verifying current-run test record creation and safe cleanup...');
  const trackerLive = createTestTracker({
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_CLEANUP: 'true',
    },
  });

  const liveTestTicketId = `CR-TEST-LIVE-${Date.now()}`;
  const livePayload = trackerLive.attachTestMarkers({
    ticketId: liveTestTicketId,
    originalComplaint: 'Test complaint generated for live cleanup validation',
    department: 'Plumbing',
    status: 'Submitted',
    campus: 'LPU Phagwara',
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.collection('complaints').doc(liveTestTicketId).set(livePayload);
  trackerLive.trackComplaint(liveTestTicketId);

  // Verify document was written
  const beforeCleanupSnap = await db.collection('complaints').doc(liveTestTicketId).get();
  assert(beforeCleanupSnap.exists, 'Test document written to Firestore with test markers');
  assert(beforeCleanupSnap.data().isAutomatedTest === true, 'isAutomatedTest marker present');
  assert(beforeCleanupSnap.data().testRunId === trackerLive.testRunId, 'testRunId matches tracker');

  // Execute cleanup
  const cleanupLiveRes = await trackerLive.cleanup();
  assert(cleanupLiveRes.success === true, 'Cleanup reported success');
  assert(cleanupLiveRes.deletedComplaintsCount === 1, 'Exactly 1 test complaint deleted');

  // Verify document is deleted
  const afterCleanupSnap = await db.collection('complaints').doc(liveTestTicketId).get();
  assert(!afterCleanupSnap.exists, 'Test document successfully deleted from Cloud Firestore');
  console.log('');

  // -----------------------------------------------------------------
  // 6. Failed Test Cleanup Through Finally
  // -----------------------------------------------------------------
  console.log('[Test 6] Verifying failed test cleanup executes via finally block...');
  const trackerFailTest = createTestTracker({
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_CLEANUP: 'true',
    },
  });

  const failTicketId = `CR-TEST-FAIL-${Date.now()}`;
  let errorCaught = false;

  try {
    // Write test document
    await db.collection('complaints').doc(failTicketId).set(
      trackerFailTest.attachTestMarkers({
        ticketId: failTicketId,
        originalComplaint: 'Test complaint before intentional test assertion failure',
        department: 'Plumbing',
        status: 'Submitted',
        campus: 'LPU Phagwara',
        createdAt: FieldValue.serverTimestamp(),
      })
    );
    trackerFailTest.trackComplaint(failTicketId);

    // Simulate unexpected assertion failure
    throw new Error('SIMULATED_TEST_ASSERTION_ERROR');
  } catch (err) {
    if (err.message === 'SIMULATED_TEST_ASSERTION_ERROR') {
      errorCaught = true;
    }
  } finally {
    // Teardown in finally
    await trackerFailTest.cleanup();
  }

  assert(errorCaught, 'Simulated test assertion failure caught');
  const failDocSnap = await db.collection('complaints').doc(failTicketId).get();
  assert(!failDocSnap.exists, 'Test document successfully deleted despite test error in finally block');
  console.log('');

  // -----------------------------------------------------------------
  // 7. Repeated Cleanup Safety (Idempotence)
  // -----------------------------------------------------------------
  console.log('[Test 7] Verifying repeated cleanup call safety (idempotence)...');
  const secondCleanupRes = await trackerFailTest.cleanup();
  assert(secondCleanupRes.success === true, 'Repeated cleanup call succeeds safely');
  assert(
    secondCleanupRes.message.includes('already completed'),
    'Identified that cleanup was already completed'
  );
  console.log('');

  console.log('========================================================================');
  console.log(`ALL 7 SAFETY & CLEANUP TESTS PASSED: ${passedCount} / ${totalCount} (100%)!`);
  console.log('========================================================================');
}

runTestSuite().catch((err) => {
  console.error('\n✗ Test suite failed:', err);
  process.exit(1);
});
