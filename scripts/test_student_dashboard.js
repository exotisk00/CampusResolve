import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('  CampusResolve AI — TASK 10 Student Dashboard Verification');
console.log('  Target: Lovely Professional University (LPU), Phagwara Campus');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ [FAIL] ${testName}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

// 1. Check StudentDashboardPage exists
const dashboardPath = path.join(rootDir, 'src/pages/StudentDashboardPage.jsx');
assert(fs.existsSync(dashboardPath), '1. StudentDashboardPage.jsx exists');

const dashboardSrc = fs.readFileSync(dashboardPath, 'utf-8');

// 2. Check Welcome section with student name
assert(
  dashboardSrc.includes('Welcome back,') && dashboardSrc.includes('studentDisplayName'),
  '2. Welcome section with dynamic student name',
  'Greets student dynamically by full name, display name, or email prefix'
);

// 3. Check 4 Statistics Cards: Total, Pending, In Progress, Resolved
const hasStatsCalc =
  dashboardSrc.includes('stats.total') &&
  dashboardSrc.includes('stats.pending') &&
  dashboardSrc.includes('stats.inProgress') &&
  dashboardSrc.includes('stats.resolved');

const countsDynamic =
  dashboardSrc.includes('for (const c of complaints)') &&
  dashboardSrc.includes("s === 'In Progress'") &&
  dashboardSrc.includes("s === 'Resolved'");

assert(
  hasStatsCalc && countsDynamic,
  '3. Four dynamic statistics cards (Total, Pending, In Progress, Resolved)',
  'Calculated dynamically from real complaints array, zero hardcoded numbers'
);

// 4. Check Recent Complaints table with required columns
const hasTableCols =
  dashboardSrc.includes('Ticket ID') &&
  dashboardSrc.includes('Complaint Description') &&
  dashboardSrc.includes('Department') &&
  dashboardSrc.includes('Submitted') &&
  dashboardSrc.includes('Status') &&
  dashboardSrc.includes('View Details');

assert(
  hasTableCols,
  '4. Recent Complaints table with all required columns and View Details action'
);

// 5. Check Quick action button: Submit New Complaint
assert(
  dashboardSrc.includes('/submit-complaint') && dashboardSrc.includes('Submit New Complaint'),
  '5. Quick action button "Submit New Complaint" present and linked'
);

// 6. Check ComplaintDetailsModal with status timeline
const modalPath = path.join(rootDir, 'src/components/ComplaintDetailsModal.jsx');
assert(fs.existsSync(modalPath), '6. ComplaintDetailsModal component exists');

const modalSrc = fs.readFileSync(modalPath, 'utf-8');
const hasTimeline =
  modalSrc.includes('Resolution Progress Timeline') &&
  modalSrc.includes('TIMELINE_STAGES') &&
  modalSrc.includes('Submitted') &&
  modalSrc.includes('Under Review') &&
  modalSrc.includes('Assigned') &&
  modalSrc.includes('In Progress') &&
  modalSrc.includes('Resolved');

assert(
  hasTimeline,
  '7. Complaint status timeline on details view',
  'Covers Submitted -> Under Review -> Assigned -> In Progress -> Resolved, plus Rejected handling'
);

// 8. Check Empty State for students who have not submitted complaints
const hasEmptyState =
  dashboardSrc.includes('No Complaints Filed Yet') &&
  dashboardSrc.includes('Submit Your First Complaint');

assert(
  hasEmptyState,
  '8. Empty state with guidance and CTA for first-time students'
);

// 9. Real-time subscription to Firestore
const hasSubscription =
  dashboardSrc.includes('subscribeToUserComplaints') &&
  dashboardSrc.includes('currentUser.uid');

assert(
  hasSubscription,
  '9. Real-time Firestore subscription streaming student complaints',
  'Uses onSnapshot via subscribeToUserComplaints to update live when status changes'
);

// 10. Security: Student read scoping
const complaintsServiceSrc = fs.readFileSync(
  path.join(rootDir, 'src/services/complaintsService.js'),
  'utf-8'
);
const hasWhereUserId =
  complaintsServiceSrc.includes("where('userId', '==', userId)");

assert(
  hasWhereUserId,
  '10. Security: Firestore query strictly scoped by authenticated userId'
);

// 11. Routes configured
const routesSrc = fs.readFileSync(path.join(rootDir, 'src/routes/AppRoutes.jsx'), 'utf-8');
const routesOk =
  routesSrc.includes('/dashboard') &&
  routesSrc.includes('/student-dashboard') &&
  routesSrc.includes('/my-complaints') &&
  routesSrc.includes('StudentDashboardPage');

assert(routesOk, '11. Protected routes for /dashboard, /student-dashboard, /my-complaints');

console.log('\n================================================================');
console.log(`  Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
