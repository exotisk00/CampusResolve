import { execSync } from 'child_process';
import fs from 'fs';
import {
  validateStaffInputs,
  parseArgs,
  resolveServiceAccountCredentials,
  EXPECTED_PROJECT_ID,
  VALID_DEPARTMENTS,
} from './provision_staff.js';

console.log('========================================================================');
console.log('TEST SUITE: STAFF CLI PROVISIONING TOOL SECURITY & VALIDATION');
console.log('Target Firebase Project:', EXPECTED_PROJECT_ID);
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// -------------------------------------------------------------
// Test 1: Department Validation
// -------------------------------------------------------------
console.log('[Test 1] Validating department filtering logic...');
for (const dept of VALID_DEPARTMENTS) {
  const res = validateStaffInputs({
    email: 'test@lpu.in',
    name: 'Test Staff',
    department: dept,
  });
  assert(res.isValid, `Valid department "${dept}" accepted`);
}

const invalidDepartments = ['Admin', 'Engineering', 'Security', 'plumbing', 'random', ''];
for (const inv of invalidDepartments) {
  const res = validateStaffInputs({
    email: 'test@lpu.in',
    name: 'Test Staff',
    department: inv,
  });
  assert(!res.isValid, `Invalid department "${inv}" rejected`);
}
console.log('');

// -------------------------------------------------------------
// Test 2: Missing Input Validation
// -------------------------------------------------------------
console.log('[Test 2] Validating missing input rejection...');
const missingEmail = validateStaffInputs({ name: 'Aman', department: 'Plumbing' });
assert(!missingEmail.isValid && missingEmail.errors[0].includes('email'), 'Missing email rejected');

const missingName = validateStaffInputs({ email: 'aman@lpu.in', department: 'Plumbing' });
assert(!missingName.isValid && missingName.errors[0].includes('display name'), 'Missing display name rejected');

const missingDept = validateStaffInputs({ email: 'aman@lpu.in', name: 'Aman' });
assert(!missingDept.isValid && missingDept.errors[0].includes('department'), 'Missing department rejected');

const shortPass = validateStaffInputs({
  email: 'aman@lpu.in',
  name: 'Aman',
  department: 'Plumbing',
  password: '123',
});
assert(!shortPass.isValid && shortPass.errors[0].includes('8 characters'), 'Short password (< 8 chars) rejected');
console.log('');

// -------------------------------------------------------------
// Test 3: CLI Argument Parsing
// -------------------------------------------------------------
console.log('[Test 3] Validating CLI argument parsing...');
const parsed = parseArgs([
  '--email=staff@lpu.in',
  '--name=Staff Name',
  '--department=Wi-Fi',
  '--password=SuperSecretPass123!',
  '--dry-run',
]);
assert(parsed.email === 'staff@lpu.in', 'Parsed --email flag');
assert(parsed.name === 'Staff Name', 'Parsed --name flag');
assert(parsed.department === 'Wi-Fi', 'Parsed --department flag');
assert(parsed.password === 'SuperSecretPass123!', 'Parsed --password flag');
assert(parsed.dryRun === true, 'Parsed --dry-run flag');
console.log('');

// -------------------------------------------------------------
// Test 4: Project ID Mismatch Rejection
// -------------------------------------------------------------
console.log('[Test 4] Validating Project ID mismatch protection...');
let threwMismatch = false;
try {
  const badKeyPath = '/tmp/test_bad_service_key.json';
  fs.writeFileSync(
    badKeyPath,
    JSON.stringify({
      project_id: 'malicious-other-project-id',
      client_email: 'attacker@malicious.iam.gserviceaccount.com',
    })
  );
  resolveServiceAccountCredentials(badKeyPath);
} catch (err) {
  threwMismatch = err.message.includes('PROJECT ID MISMATCH REJECTED');
}
assert(threwMismatch, 'Service account with non-matching project ID rejected');
console.log('');

// -------------------------------------------------------------
// Test 5: CLI Execution & Zero Secrets Leakage Check
// -------------------------------------------------------------
console.log('[Test 5] Validating CLI execution output & zero secrets leakage...');

// 5a: Dry run execution
const secretTestPassword = 'TopSecretPassword987654!';
const dryRunOutput = execSync(
  `node scripts/provision_staff.js --email=tester@lpu.in --name="Tester" --department=Plumbing --password="${secretTestPassword}" --dry-run`,
  { encoding: 'utf8' }
);

assert(dryRunOutput.includes('DRY-RUN VALIDATION SUCCESSFUL'), 'CLI dry-run completed successfully');
assert(!dryRunOutput.includes(secretTestPassword), 'Secret password is NEVER printed in dry-run stdout');
assert(!dryRunOutput.includes('private_key'), 'Private key is NEVER printed in dry-run stdout');

// 5b: Invalid department via CLI
let cliInvalidDeptFailed = false;
let cliErrorOutput = '';
try {
  execSync('node scripts/provision_staff.js --email=tester@lpu.in --name="Tester" --department=InvalidDept', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
} catch (err) {
  cliInvalidDeptFailed = true;
  cliErrorOutput = err.stderr || err.stdout;
}
assert(cliInvalidDeptFailed, 'CLI exited with non-zero code on invalid department');
assert(cliErrorOutput.includes('Invalid department "InvalidDept"'), 'CLI output detailed invalid department error');

// 5c: Missing arguments via CLI
let cliMissingArgsFailed = false;
try {
  execSync('node scripts/provision_staff.js --email=tester@lpu.in', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
} catch (err) {
  cliMissingArgsFailed = true;
}
assert(cliMissingArgsFailed, 'CLI exited with non-zero code on missing arguments');
console.log('');

console.log('========================================================================');
console.log(`ALL TESTS PASSED: ${passedTests} / ${totalTests} checks passed (100%)!`);
console.log('========================================================================');
process.exit(0);
