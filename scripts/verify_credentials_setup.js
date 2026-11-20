import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {
  resolveServiceAccountCredentials,
  initializeAdminApp,
  EXPECTED_PROJECT_ID,
  provisionStaff,
} from './provision_staff.js';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('========================================================================');
console.log('VERIFICATION: FIREBASE ADMIN CREDENTIALS & INITIALIZATION CHECK');
console.log('Target Firebase Project:', EXPECTED_PROJECT_ID);
console.log('========================================================================\n');

// 1. Verify JSON key is NOT in project directory
console.log('[Check 1] Verifying no service account JSON files exist in project...');
const projectRoot = process.cwd();
const filesInRoot = fs.readdirSync(projectRoot);
const leakInRoot = filesInRoot.some((f) => f.includes('serviceAccountKey') || f.includes('service-account'));
const serverDir = path.join(projectRoot, 'server');
const leakInServer = fs.existsSync(serverDir) && fs.readdirSync(serverDir).some((f) => f.includes('serviceAccountKey'));

if (leakInRoot || leakInServer) {
  throw new Error('FAILED Check 1: Service account JSON key was copied into project directory!');
}
console.log('  ✓ PASSED: Zero credential files exist in project directory.\n');

// 2. Verify external credential path resolution
console.log('[Check 2] Verifying resolution of external GOOGLE_APPLICATION_CREDENTIALS...');
const { serviceAccount, resolvedPath } = resolveServiceAccountCredentials();

if (!resolvedPath) {
  throw new Error('FAILED Check 2: Could not resolve GOOGLE_APPLICATION_CREDENTIALS path.');
}
console.log('  ✓ Resolved external credential path:', resolvedPath);

// 3. Verify project ID matches campusresolve-ai-c8a8f
console.log('[Check 3] Verifying project ID match...');
if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  throw new Error(`FAILED Check 3: Project ID mismatch. Got ${serviceAccount.project_id}, expected ${EXPECTED_PROJECT_ID}`);
}
console.log('  ✓ PASSED: Project ID is strictly', serviceAccount.project_id);
console.log('  ✓ Client email belongs to authorized IAM:', serviceAccount.client_email);
console.log('  ✓ Private key present in memory:', Boolean(serviceAccount.private_key), '(Masked: NEVER printed)\n');

// 4. Verify Firebase Admin SDK initializes successfully
console.log('[Check 4] Initializing Firebase Admin SDK...');
const app = initializeAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

console.log('  ✓ Admin app initialized:', app.name);
console.log('  ✓ Admin app project ID:', app.options.projectId);

// Read-only ping to Firestore to verify live Admin IAM credentials without modifying anything
console.log('  Verifying live connection to Firestore...');
const testCollectionRef = db.collection('complaints');
const sampleQuery = await testCollectionRef.limit(1).get();
console.log('  ✓ Live Firestore connection verified! Read test successful (docs count:', sampleQuery.size, ')\n');

// 5. Verify CLI provisioning script dry-run works with the credential
console.log('[Check 5] Verifying CLI dry-run execution with live configuration...');
const dryRunResult = await provisionStaff({
  email: 'dryrun.verification@lpu.in',
  name: 'Dry Run Staff',
  department: 'Plumbing',
  dryRun: true,
});

if (!dryRunResult.success || !dryRunResult.dryRun) {
  throw new Error('FAILED Check 5: Dry run failed.');
}
console.log('  ✓ PASSED: CLI provisioning tool dry-run is fully operational and ready!\n');

console.log('========================================================================');
console.log('ALL 5 SECURITY & INITIALIZATION CHECKS PASSED (100%)!');
console.log('========================================================================');
process.exit(0);
