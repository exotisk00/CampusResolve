/**
 * Campus Staff Provisioning CLI Tool
 * CampusResolve AI — LPU Phagwara Campus
 * Target Project: campusresolve-ai-c8a8f
 *
 * Secure server-side administrative script to provision Campus Staff accounts
 * using the Firebase Admin SDK.
 *
 * Usage:
 *   node scripts/provision_staff.js --email=<email> --name="<name>" --department=<department> [--password=<password>] [--key=<serviceAccountKey.json>]
 *
 * Examples:
 *   node scripts/provision_staff.js --email=plumbing.lead@lpu.in --name="Aman Verma" --department=Plumbing
 *   node scripts/provision_staff.js --email=wifi.admin@lpu.in --name="Rajesh Singh" --department=Wi-Fi --dry-run
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const EXPECTED_PROJECT_ID = 'campusresolve-ai-c8a8f';

export const VALID_DEPARTMENTS = [
  'Plumbing',
  'Electrical',
  'Wi-Fi',
  'Mess',
  'Academic',
  'Other',
];

/**
 * Validate input arguments before executing any provisioning actions.
 */
export function validateStaffInputs({ email, name, department, password }) {
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Staff email address is required (--email=<email>).');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push(`Invalid email format: "${email}". Must be a valid email address.`);
    }
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Staff display name is required (--name="<Full Name>").');
  }

  if (!department || typeof department !== 'string' || !department.trim()) {
    errors.push(
      `Campus department is required (--department=<dept>).\nMust be one of: ${VALID_DEPARTMENTS.join(', ')}`
    );
  } else if (!VALID_DEPARTMENTS.includes(department.trim())) {
    errors.push(
      `Invalid department "${department}".\nMust be exactly one of: ${VALID_DEPARTMENTS.join(', ')}`
    );
  }

  if (password && (typeof password !== 'string' || password.length < 8)) {
    errors.push('Temporary password must be at least 8 characters long.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse CLI arguments into a structured options object.
 */
export function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    email: '',
    name: '',
    department: '',
    password: '',
    keyPath: '',
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg === '-e' && argv[i + 1]) {
      options.email = argv[++i];
    } else if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (arg === '-n' && argv[i + 1]) {
      options.name = argv[++i];
    } else if (arg.startsWith('--department=')) {
      options.department = arg.split('=')[1];
    } else if (arg === '-d' && argv[i + 1]) {
      options.department = argv[++i];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (arg === '-p' && argv[i + 1]) {
      options.password = argv[++i];
    } else if (arg.startsWith('--key=')) {
      options.keyPath = arg.split('=')[1];
    } else if (arg === '-k' && argv[i + 1]) {
      options.keyPath = argv[++i];
    }
  }

  return options;
}

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
 * Locate and verify the service account credentials.
 * Ensures the target project is EXPECTED_PROJECT_ID before initializing.
 */
export function resolveServiceAccountCredentials(explicitKeyPath = '') {
  const candidatePaths = [
    explicitKeyPath,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'server/serviceAccountKey.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
  ]
    .filter(Boolean)
    .map(expandPath);

  let serviceAccount = null;
  let resolvedPath = null;

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, 'utf8');
        serviceAccount = JSON.parse(content);
        resolvedPath = candidate;
        break;
      } catch (err) {
        throw new Error(`Failed to parse service account key file at ${candidate}: ${err.message}`);
      }
    }
  }

  if (serviceAccount) {
    const targetProject = serviceAccount.project_id;
    if (targetProject !== EXPECTED_PROJECT_ID) {
      throw new Error(
        `PROJECT ID MISMATCH REJECTED:\nService account targets "${targetProject}", but this tool strictly requires "${EXPECTED_PROJECT_ID}".`
      );
    }
    return { serviceAccount, resolvedPath };
  }

  // If no file found, check if running with ADC or default project check
  return { serviceAccount: null, resolvedPath: null };
}

/**
 * Initialize Firebase Admin instance safely.
 */
export function initializeAdminApp(explicitKeyPath = '') {
  if (getApps().length > 0) {
    return getApp();
  }

  const { serviceAccount } = resolveServiceAccountCredentials(explicitKeyPath);

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: EXPECTED_PROJECT_ID,
    });
  }

  // Fallback: Check if environment variable specifies project ID
  const envProjectId =
    process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

  if (envProjectId && envProjectId !== EXPECTED_PROJECT_ID) {
    throw new Error(
      `PROJECT ID MISMATCH REJECTED:\nEnvironment targets "${envProjectId}", but this tool strictly requires "${EXPECTED_PROJECT_ID}".`
    );
  }

  return initializeApp({
    projectId: EXPECTED_PROJECT_ID,
  });
}

/**
 * Provision staff member using Firebase Admin SDK.
 *
 * @param {object} params
 * @param {string} params.email - Staff email
 * @param {string} params.name - Full name
 * @param {string} params.department - One of VALID_DEPARTMENTS
 * @param {string} [params.password] - Temporary password (min 8 chars)
 * @param {boolean} [params.dryRun] - Dry run flag
 * @param {string} [params.explicitKeyPath] - Custom service account key path
 */
export async function provisionStaff({
  email,
  name,
  department,
  password,
  dryRun = false,
  explicitKeyPath = '',
}) {
  // 1. Validate inputs
  const validation = validateStaffInputs({ email, name, department, password });
  if (!validation.isValid) {
    return {
      success: false,
      errorType: 'VALIDATION_ERROR',
      errors: validation.errors,
    };
  }

  const trimmedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();
  const validDepartment = department.trim();

  // 2. Dry-run mode: Return validation success without touching Firebase
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      data: {
        email: trimmedEmail,
        fullName: trimmedName,
        department: validDepartment,
        role: 'staff',
        projectId: EXPECTED_PROJECT_ID,
      },
    };
  }

  // 3. Initialize and verify Admin app & project ID
  let app;
  try {
    app = initializeAdminApp(explicitKeyPath);
  } catch (initErr) {
    return {
      success: false,
      errorType: 'PROJECT_MISMATCH_OR_CREDENTIAL_ERROR',
      errors: [initErr.message],
    };
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  // 4. Duplicate checks: Prevent accidental overwrite or promotion of existing accounts
  try {
    const existingAuthUser = await auth.getUserByEmail(trimmedEmail);
    if (existingAuthUser) {
      return {
        success: false,
        errorType: 'DUPLICATE_ACCOUNT',
        errors: [
          `An authentication account with email "${trimmedEmail}" already exists (UID: ${existingAuthUser.uid}).`,
          'Existing student or user accounts cannot be overwritten or automatically promoted to staff.',
        ],
      };
    }
  } catch (authErr) {
    if (authErr.code !== 'auth/user-not-found') {
      return {
        success: false,
        errorType: 'AUTH_CHECK_FAILED',
        errors: [authErr.message],
      };
    }
  }

  // Check Firestore users collection for existing profile with same email
  try {
    const existingDocSnap = await db
      .collection('users')
      .where('email', '==', trimmedEmail)
      .limit(1)
      .get();

    if (!existingDocSnap.empty) {
      return {
        success: false,
        errorType: 'DUPLICATE_PROFILE',
        errors: [
          `A Firestore profile with email "${trimmedEmail}" already exists.`,
          'Cannot create duplicate staff profile for an existing email.',
        ],
      };
    }
  } catch (firestoreCheckErr) {
    // If running in an unauthenticated or test environment without live admin access
    return {
      success: false,
      errorType: 'FIRESTORE_ACCESS_FAILED',
      errors: [firestoreCheckErr.message],
    };
  }

  // 5. Generate secure temporary password if none provided
  // (Password is NEVER printed to stdout or logs)
  const securePassword = password || crypto.randomBytes(16).toString('hex') + '!Aa1';

  // 6. Create Firebase Authentication account
  let createdUserRecord;
  try {
    createdUserRecord = await auth.createUser({
      email: trimmedEmail,
      displayName: trimmedName,
      password: securePassword,
      emailVerified: true,
    });
  } catch (createAuthErr) {
    return {
      success: false,
      errorType: 'AUTH_CREATION_FAILED',
      errors: [createAuthErr.message],
    };
  }

  const staffUid = createdUserRecord.uid;

  // 7. Write staff profile to Firestore users/{uid}
  try {
    await db.collection('users').doc(staffUid).set({
      uid: staffUid,
      fullName: trimmedName,
      email: trimmedEmail,
      role: 'staff',
      department: validDepartment,
      campus: 'LPU Phagwara',
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      provisionedVia: 'staff-cli-tool',
    });

    return {
      success: true,
      data: {
        uid: staffUid,
        email: trimmedEmail,
        fullName: trimmedName,
        role: 'staff',
        department: validDepartment,
        campus: 'LPU Phagwara',
        projectId: EXPECTED_PROJECT_ID,
      },
    };
  } catch (firestoreWriteErr) {
    // 8. Partial failure handling & recovery instructions
    return {
      success: false,
      errorType: 'PARTIAL_FAILURE',
      staffUid,
      errors: [
        `[CRITICAL PARTIAL FAILURE] Authentication account created (UID: ${staffUid}), but Firestore profile creation failed: ${firestoreWriteErr.message}`,
      ],
      recoveryInstructions: [
        `1. Open Firebase Console -> Firestore Database -> collection 'users'.`,
        `2. Create document with ID "${staffUid}".`,
        `3. Set fields: { uid: "${staffUid}", role: "staff", department: "${validDepartment}", fullName: "${trimmedName}", email: "${trimmedEmail}", campus: "LPU Phagwara", isActive: true }.`,
        `4. OR delete the orphaned Auth user: admin.auth().deleteUser("${staffUid}").`,
      ],
    };
  }
}

/**
 * Print CLI Help message
 */
function printHelp() {
  console.log(`
========================================================================
  CampusResolve AI — Staff Account Provisioning Tool
  Target Firebase Project: ${EXPECTED_PROJECT_ID}
========================================================================

Usage:
  node scripts/provision_staff.js [options]

Required Options:
  --email=<email>         Staff university/official email address
  --name="<Full Name>"    Staff legal display name
  --department=<dept>     Assigned campus department
                          Allowed values:
                          ${VALID_DEPARTMENTS.join(', ')}

Optional Options:
  --password=<pass>       Temporary password (min 8 characters)
                          If omitted, a secure temporary password is assigned.
  --key=<path>            Path to serviceAccountKey.json
  --dry-run               Validate configuration and inputs without writing
  --help, -h              Show this help message

Security Guarantees:
  * Never outputs passwords, private keys, or credentials to terminal.
  * Enforces project ID match with "${EXPECTED_PROJECT_ID}".
  * Prevents duplicate account creation and student role escalation.
  * Validates department against the 6 authorized campus departments.
========================================================================
`);
}

// CLI Execution entry point
const isDirectRun = process.argv[1] && process.argv[1].endsWith('provision_staff.js');

if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.email && !args.name && !args.department && !args.dryRun)) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  provisionStaff({
    email: args.email,
    name: args.name,
    department: args.department,
    password: args.password,
    dryRun: args.dryRun,
    explicitKeyPath: args.keyPath,
  })
    .then((result) => {
      if (result.success) {
        console.log('\n========================================================');
        if (result.dryRun) {
          console.log('✓ DRY-RUN VALIDATION SUCCESSFUL (No writes performed)');
          console.log('  Target Project:', result.data.projectId);
          console.log('  Email:         ', result.data.email);
          console.log('  Full Name:     ', result.data.fullName);
          console.log('  Department:    ', result.data.department);
          console.log('  Assigned Role: ', result.data.role);
        } else {
          console.log('✓ STAFF ACCOUNT PROVISIONED SUCCESSFULLY');
          console.log('  Target Project:', result.data.projectId);
          console.log('  UID:           ', result.data.uid);
          console.log('  Email:         ', result.data.email);
          console.log('  Full Name:     ', result.data.fullName);
          console.log('  Department:    ', result.data.department);
          console.log('  Role:          ', result.data.role);
          console.log('\nNote: For security, passwords and keys are never printed.');
          console.log('The staff member can now sign in or reset password via login page.');
        }
        console.log('========================================================\n');
        process.exit(0);
      } else {
        console.error('\n✗ STAFF PROVISIONING FAILED');
        console.error('  Error Type:', result.errorType);
        result.errors.forEach((e) => console.error('  *', e));

        if (result.recoveryInstructions) {
          console.error('\nRecovery Instructions:');
          result.recoveryInstructions.forEach((step) => console.error('  ', step));
        }
        console.error('========================================================\n');
        process.exit(1);
      }
    })
    .catch((fatalErr) => {
      console.error('\n✗ Fatal error during execution:', fatalErr.message);
      process.exit(1);
    });
}
