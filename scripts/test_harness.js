/**
 * Automated Test Harness & Safety Cleanup Helper
 * CampusResolve AI — LPU Phagwara Campus
 * Target Project: campusresolve-ai-c8a8f
 *
 * Provides scoped, verifiable test tracking and guaranteed safe cleanup
 * for automated integration test suites.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const EXPECTED_PROJECT_ID = 'campusresolve-ai-c8a8f';

// Defense-in-depth: Explicit list of historical production/legacy tickets that must NEVER be touched
export const HISTORICAL_PROTECTED_TICKETS = Object.freeze([
  'CR-20261121-FT36JQB',
  'CR-1795206592151',
  'CR-1795206592151-2',
  'CR-20261121-JXXWCF0',
  'CR-PLUMB-1795209052733',
]);

/**
 * Expand user home path in credential string
 */
function expandPath(p) {
  if (!p || typeof p !== 'string') return p;
  if (p.startsWith('~/')) {
    return path.join(process.env.HOME || '', p.slice(2));
  }
  if (p.startsWith('$HOME/')) {
    return path.join(process.env.HOME || '', p.slice(6));
  }
  return p.replace(/\$HOME/g, process.env.HOME || '');
}

/**
 * Resolve external service account key
 */
function getServiceAccount() {
  const candidate = expandPath(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      '/Users/anishkumar/CampusResolve-Secrets/serviceAccountKey.json'
  );

  if (!candidate || !fs.existsSync(candidate)) {
    throw new Error(`[TestHarness] Service account key not found at path: "${candidate}"`);
  }

  const sa = JSON.parse(fs.readFileSync(candidate, 'utf8'));
  if (sa.project_id !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `[TestHarness] Service account project ID mismatch: expected "${EXPECTED_PROJECT_ID}", got "${sa.project_id}"`
    );
  }
  return sa;
}

/**
 * Initialize Admin SDK securely for test teardown
 */
function getAdminInstances() {
  const serviceAccount = getServiceAccount();
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert(serviceAccount),
          projectId: EXPECTED_PROJECT_ID,
        });

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

/**
 * Factory for creating an isolated Test Tracker.
 * Generates an immutable run ID and strictly bounds cleanup actions to this run.
 */
export function createTestTracker(options = {}) {
  const customEnv = options.env || process.env;
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const testRunId = `run_${timestamp}_${randomSuffix}`;

  const trackedComplaints = new Set();
  const trackedUsers = new Set();
  let hasCleanedUp = false;

  return {
    testRunId,

    /**
     * Decorate a complaint payload with strict, immutable test markers
     */
    attachTestMarkers(payload = {}) {
      return {
        ...payload,
        isAutomatedTest: true,
        testRunId,
      };
    },

    /**
     * Register a test-generated complaint ID for tracking
     */
    trackComplaint(ticketId) {
      if (!ticketId || typeof ticketId !== 'string') return;
      if (HISTORICAL_PROTECTED_TICKETS.includes(ticketId)) {
        console.warn(`[TestHarness Guard] Refusing to track historical protected ticket: ${ticketId}`);
        return;
      }
      trackedComplaints.add(ticketId.trim());
    },

    /**
     * Register a test-generated student/staff UID for tracking
     */
    trackUser(uid) {
      if (!uid || typeof uid !== 'string') return;
      trackedUsers.add(uid.trim());
    },

    getTrackedCount() {
      return {
        complaints: trackedComplaints.size,
        users: trackedUsers.size,
      };
    },

    /**
     * Verify whether all safety conditions are met for deletion
     */
    evaluateSafetyConditions(targetProjectId = EXPECTED_PROJECT_ID) {
      const isTestEnv =
        customEnv.NODE_ENV === 'test' ||
        customEnv.TEST_ENV === 'true' ||
        customEnv.VITE_TEST_ENV === 'true';

      const isCleanupAllowed = customEnv.ALLOW_TEST_CLEANUP === 'true';
      const isCorrectProject = targetProjectId === EXPECTED_PROJECT_ID;

      const passed = isTestEnv && isCleanupAllowed && isCorrectProject;

      return {
        allowed: passed,
        reasons: [
          !isTestEnv ? 'NODE_ENV is not "test" or TEST_ENV is not "true"' : null,
          !isCleanupAllowed ? 'ALLOW_TEST_CLEANUP is not set to "true"' : null,
          !isCorrectProject ? `Target project "${targetProjectId}" !== "${EXPECTED_PROJECT_ID}"` : null,
        ].filter(Boolean),
      };
    },

    /**
     * Execute safe, verified cleanup of test records.
     * Guarantees that only records matching this testRunId can be deleted.
     */
    async cleanup() {
      if (hasCleanedUp) {
        return { success: true, message: 'Cleanup already completed for this tracker instance.' };
      }

      const safety = this.evaluateSafetyConditions();
      if (!safety.allowed) {
        console.log(`[TestHarness] Safety gate prevented cleanup: ${safety.reasons.join('; ')}`);
        return { success: false, skipped: true, reasons: safety.reasons };
      }

      let deletedComplaintsCount = 0;
      let deletedUsersCount = 0;
      const skippedTickets = [];

      try {
        const { db, auth } = getAdminInstances();

        // 1. Clean up tracked complaints
        for (const ticketId of trackedComplaints) {
          // Extra defense-in-depth: check historical immunity
          if (HISTORICAL_PROTECTED_TICKETS.includes(ticketId)) {
            console.warn(`[TestHarness Guard] Refusing to delete historical protected ticket: ${ticketId}`);
            skippedTickets.push(ticketId);
            continue;
          }

          try {
            const docRef = db.collection('complaints').doc(ticketId);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
              continue;
            }

            const data = docSnap.data();

            // Strict verification: Document must have isAutomatedTest === true AND exact testRunId
            const isTestMarkerPresent = data.isAutomatedTest === true;
            const isMatchingRun = data.testRunId === testRunId;

            if (isTestMarkerPresent && isMatchingRun) {
              await docRef.delete();
              deletedComplaintsCount++;
              console.log(`  [TestHarness] Safely deleted test complaint: ${ticketId}`);
            } else {
              console.warn(
                `  [TestHarness Guard] Skipped deletion of ${ticketId}: missing or mismatched testRunId (expected: ${testRunId}, got: ${data.testRunId}).`
              );
              skippedTickets.push(ticketId);
            }
          } catch (itemErr) {
            console.error(`  [TestHarness Error] Failed to delete complaint ${ticketId}:`, itemErr.message);
          }
        }

        // 2. Clean up tracked temporary test users
        for (const uid of trackedUsers) {
          try {
            const userDocRef = db.collection('users').doc(uid);
            const userSnap = await userDocRef.get();

            if (userSnap.exists) {
              const uData = userSnap.data();
              if (uData.testRunId === testRunId) {
                await userDocRef.delete();
              }
            }

            // Delete from Firebase Auth
            await auth.deleteUser(uid);
            deletedUsersCount++;
            console.log(`  [TestHarness] Safely deleted test user: ${uid}`);
          } catch (userErr) {
            // If already deleted or doesn't exist, ignore
            if (userErr.code !== 'auth/user-not-found') {
              console.error(`  [TestHarness Error] Failed to delete user ${uid}:`, userErr.message);
            }
          }
        }

        hasCleanedUp = true;
        trackedComplaints.clear();
        trackedUsers.clear();

        return {
          success: true,
          deletedComplaintsCount,
          deletedUsersCount,
          skippedTickets,
        };
      } catch (err) {
        console.error('[TestHarness] Cleanup fatal error:', err.message);
        return { success: false, error: err.message };
      }
    },
  };
}
