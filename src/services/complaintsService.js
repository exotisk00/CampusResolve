/**
 * Firestore Complaints Service
 * CampusResolve AI — LPU Phagwara Campus
 *
 * Handles creation and retrieval of complaint tickets in Cloud Firestore.
 *
 * Collection structure:
 *   complaints/{ticketId}
 *     ├── ticketId        — Unique readable ID: CR-YYYYMMDD-XXXXXXX
 *     ├── userId          — Firebase Auth UID of submitter
 *     ├── userEmail       — Email of submitter (read-only after submission)
 *     ├── originalComplaint — Exact complaint text, never altered
 *     ├── language        — Selected language hint
 *     ├── department      — Classified department (one of 6)
 *     ├── extractedBlock  — Block extracted from text or null
 *     ├── extractedFloor  — Floor extracted from text or null
 *     ├── extractedRoom   — Room extracted from text or null
 *     ├── classificationMethod — 'gemini-ai' | 'rule-based-fallback'
 *     ├── needsHumanReview — boolean
 *     ├── reasonForClassification — Classification explanation
 *     ├── status          — 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected'
 *     ├── createdAt       — Firestore server timestamp
 *     └── updatedAt       — Firestore server timestamp
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const VALID_DEPARTMENTS = [
  'Plumbing',
  'Electrical',
  'Wi-Fi',
  'Mess',
  'Academic',
  'Other',
];

/**
 * Generates a unique, human-readable ticket ID.
 * Format: CR-YYYYMMDD-XXXXXXX (7-char random hex)
 */
function generateTicketId() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `CR-${dateStr}-${randomPart}`;
}

/**
 * Save a new complaint ticket to Firestore.
 *
 * @param {object} params
 * @param {string} params.userId - Firebase Auth UID
 * @param {string} params.userEmail - User's email
 * @param {string} params.originalComplaint - Verbatim complaint text
 * @param {string} params.language - Language hint
 * @param {object} params.classificationResult - Full backend classification result
 * @returns {Promise<{ ticketId: string, docId: string }>}
 */
export async function saveComplaint({
  userId,
  userEmail,
  originalComplaint,
  language,
  classificationResult,
}) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  if (!userId || !originalComplaint) {
    throw new Error('userId and originalComplaint are required to save a complaint.');
  }

  const ticketId = generateTicketId();

  const complaintData = {
    ticketId,
    userId,
    userEmail: userEmail || null,

    // Core complaint — preserved verbatim
    originalComplaint,
    language: language || 'auto',

    // AI Classification Fields
    department: classificationResult?.department || 'Other',
    extractedBlock: classificationResult?.extractedBlock || null,
    extractedFloor: classificationResult?.extractedFloor || null,
    extractedRoom: classificationResult?.extractedRoom || null,
    classificationMethod: classificationResult?.method || 'rule-based-fallback',
    needsHumanReview: classificationResult?.needsHumanReview ?? true,
    reasonForClassification: classificationResult?.reasonForClassification || '',

    // Workflow status (initial)
    status: 'Submitted',

    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // Campus context
    campus: 'LPU Phagwara',
  };

  // Use ticketId as the Firestore document ID for direct lookups
  const docRef = doc(db, 'complaints', ticketId);
  await setDoc(docRef, complaintData);

  return { ticketId, docId: ticketId };
}

/**
 * Fetch all complaints submitted by a specific user (student view).
 *
 * @param {string} userId - Firebase Auth UID
 * @param {number} [maxResults=50] - Maximum complaints to fetch
 * @returns {Promise<Array>}
 */
export async function getComplaintsByUser(userId, maxResults = 50) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  if (!userId) throw new Error('userId is required');

  const q = query(
    collection(db, 'complaints'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to complaints for a specific user.
 * Automatically triggers callback whenever status or complaints update in Firestore.
 *
 * @param {string} userId - Firebase Auth UID
 * @param {(complaints: Array) => void} onUpdate - Callback invoked with new data
 * @param {(error: Error) => void} [onError] - Optional error handler
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToUserComplaints(userId, onUpdate, onError) {
  if (!isFirebaseConfigured || !userId || !db) {
    if (onError) onError(new Error('FIREBASE_NOT_CONFIGURED'));
    return () => {};
  }

  const q = query(
    collection(db, 'complaints'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(items);
    },
    (err) => {
      console.error('[complaintsService] Subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch a single complaint by ticket ID.
 *
 * @param {string} ticketId - The CR-YYYYMMDD-XXXXXXX format ticket ID
 * @returns {Promise<object|null>}
 */
export async function getComplaintById(ticketId) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const docRef = doc(db, 'complaints', ticketId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Fetch complaints by department (for staff dashboards).
 * NOTE: Security Rules ensure only authorized staff can call this.
 *
 * @param {string} department - One of the 6 valid departments
 * @param {number} [maxResults=100]
 * @returns {Promise<Array>}
 */
export async function getComplaintsByDepartment(department, maxResults = 100) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  if (!VALID_DEPARTMENTS.includes(department)) {
    throw new Error(`Invalid department: ${department}`);
  }

  const q = query(
    collection(db, 'complaints'),
    where('department', '==', department),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to complaints for a specific department.
 * Used by staff members to receive live complaint tickets for their assigned department.
 *
 * @param {string} department - One of VALID_DEPARTMENTS (Plumbing, Electrical, Wi-Fi, Mess, Academic, Other)
 * @param {(complaints: Array) => void} onUpdate - Callback invoked with new data
 * @param {(error: Error) => void} [onError] - Optional error handler
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToDepartmentComplaints(department, onUpdate, onError) {
  if (!isFirebaseConfigured || !db) {
    if (onError) onError(new Error('FIREBASE_NOT_CONFIGURED'));
    return () => {};
  }

  if (!VALID_DEPARTMENTS.includes(department)) {
    const err = new Error(`Invalid department: "${department}". Must be one of: ${VALID_DEPARTMENTS.join(', ')}`);
    console.error('[complaintsService] Invalid department for subscription:', department);
    if (onError) onError(err);
    return () => {};
  }

  const q = query(
    collection(db, 'complaints'),
    where('department', '==', department)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort newest first by createdAt timestamp
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime());
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime());
        return timeB - timeA;
      });
      onUpdate(items);
    },
    (err) => {
      console.error('[complaintsService] Department subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update complaint status.
 * NOTE: Security Rules enforce that only staff with matching department can update.
 *
 * @param {string} ticketId
 * @param {string} newStatus - Must be one of COMPLAINT_STATUSES
 * @param {string} [note] - Optional staff note
 * @returns {Promise<void>}
 */
export async function updateComplaintStatus(ticketId, newStatus, note = '') {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  if (!COMPLAINT_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: "${newStatus}". Must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
  }

  const docRef = doc(db, 'complaints', ticketId);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(note ? { staffNote: note } : {}),
  });
}
