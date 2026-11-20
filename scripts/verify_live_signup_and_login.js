import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env.local
const envLocalContent = fs.readFileSync(path.join(rootDir, '.env.local'), 'utf-8');
const env = {};
envLocalContent.split('\n').forEach((line) => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

console.log('================================================================');
console.log('  CampusResolve AI — Live Firebase Signup & Login Verification');
console.log('  Target Project:', env.VITE_FIREBASE_PROJECT_ID);
console.log('================================================================\n');

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function runVerification() {
  let passed = 0;
  let total = 0;

  function assert(title, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.log(`❌ [FAIL] ${title}`);
      if (details) console.log(`   ${details}`);
    }
  }

  // TEST 1: Existing registered user profile check
  try {
    const existingEmail = 'anishkumarlpu6118@gmail.com';
    assert(
      '1. Target Project Verification',
      env.VITE_FIREBASE_PROJECT_ID === 'campusresolve-ai-c8a8f',
      `Connected to ${env.VITE_FIREBASE_PROJECT_ID}`
    );
  } catch (err) {
    assert('1. Target Project Verification', false, err.message);
  }

  // TEST 2: Existing email returns email-already-in-use
  try {
    let gotAlreadyInUse = false;
    try {
      await createUserWithEmailAndPassword(auth, 'anishkumarlpu6118@gmail.com', 'SomePassword123!');
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-in-use') {
        gotAlreadyInUse = true;
      }
    }
    assert(
      '2. Duplicate Email Detection',
      gotAlreadyInUse,
      'Firebase correctly returns auth/email-already-in-use for existing registered user'
    );
  } catch (err) {
    assert('2. Duplicate Email Detection', false, err.message);
  }

  // TEST 3: Brand new email registration
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const newEmail = `student_${uniqueId}@lpu.in`;
  const newPassword = 'SecurePassword2026!';
  const newName = 'Priya Sharma';
  let createdUser = null;

  try {
    const cred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    createdUser = cred.user;
    await updateProfile(createdUser, { displayName: newName });

    // Create Firestore profile
    await setDoc(doc(db, 'users', createdUser.uid), {
      uid: createdUser.uid,
      fullName: newName,
      email: newEmail.toLowerCase().trim(),
      role: 'student',
      department: null,
      createdAt: serverTimestamp(),
      campus: 'LPU Phagwara',
      isActive: true,
    });

    assert(
      '3. Brand New Account Signup',
      Boolean(createdUser.uid),
      `Successfully registered new account: ${newEmail} (UID: ${createdUser.uid})`
    );
  } catch (err) {
    assert('3. Brand New Account Signup', false, err.message);
  }

  // TEST 4: Fetch user profile as authenticated user
  try {
    const userDocSnap = await getDoc(doc(db, 'users', createdUser.uid));
    const userData = userDocSnap.data();
    assert(
      '4. Firestore Profile Persistence',
      userDocSnap.exists() && userData.fullName === newName && userData.role === 'student',
      `Profile persisted with fullName="${userData?.fullName}", role="${userData?.role}", campus="${userData?.campus}"`
    );
  } catch (err) {
    assert('4. Firestore Profile Persistence', false, err.message);
  }

  // TEST 5: Create a live complaint in Firestore
  const ticketId = `CR-${Date.now()}-TEST`;
  try {
    await setDoc(doc(db, 'complaints', ticketId), {
      ticketId,
      userId: createdUser.uid,
      userEmail: newEmail,
      originalComplaint: 'Hostel room mein Wi-Fi disconnected hai block 14 mein.',
      language: 'Hinglish',
      department: 'Wi-Fi',
      extractedBlock: '14',
      extractedFloor: null,
      extractedRoom: null,
      classificationMethod: 'rule-based-fallback',
      needsHumanReview: false,
      reasonForClassification: 'Detected connectivity issue in student hostel.',
      status: 'Submitted',
      campus: 'LPU Phagwara',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    assert(
      '5. Complaint Persistence under Security Rules',
      true,
      `Complaint document ${ticketId} saved to Cloud Firestore`
    );
  } catch (err) {
    assert('5. Complaint Persistence under Security Rules', false, err.message);
  }

  // TEST 6: Student queries their own complaints
  try {
    const q = query(collection(db, 'complaints'), where('userId', '==', createdUser.uid));
    const querySnap = await getDocs(q);
    assert(
      '6. Student Complaint Query & Isolation',
      querySnap.size === 1 && querySnap.docs[0].id === ticketId,
      `Query returned ${querySnap.size} ticket(s) belonging strictly to ${createdUser.uid}`
    );
  } catch (err) {
    assert('6. Student Complaint Query & Isolation', false, err.message);
  }

  // TEST 7: Log in with newly created credentials
  try {
    const loginCred = await signInWithEmailAndPassword(auth, newEmail, newPassword);
    assert(
      '7. Live Authentication Login',
      loginCred.user.uid === createdUser.uid,
      `Successfully logged in as ${newEmail}`
    );
  } catch (err) {
    assert('7. Live Authentication Login', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`  Verification Summary: ${passed} / ${total} Checks Passed`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
