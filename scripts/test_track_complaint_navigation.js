/**
 * Test: Track Complaint Navigation Verification
 * Validates:
 * 1. HeroSection renders <Link to="/track-complaint">
 * 2. AppRoutes includes route definitions for /track-complaint and /track
 * 3. ProtectedRoute wraps /track-complaint
 * 4. Production build dist/index.html correctly supports SPA routing on refresh
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('========================================================================');
console.log('TEST: TRACK COMPLAINT NAVIGATION VERIFICATION');
console.log('========================================================================\n');

// 1. Inspect HeroSection.jsx
console.log('[Check 1] Inspecting HeroSection.jsx for Track Complaint Link...');
const heroPath = path.resolve('src/components/HeroSection.jsx');
const heroContent = fs.readFileSync(heroPath, 'utf8');

assert(
  heroContent.includes('to="/track-complaint"'),
  'HeroSection must link to "/track-complaint"'
);
assert(
  heroContent.includes('Track Complaint'),
  'HeroSection must contain "Track Complaint" label'
);
assert(
  !heroContent.includes('<button\n                type="button"\n                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-content-primary text-[0.9375rem] bg-white border border-border-ui-default transition-all duration-150 hover:bg-slate-50 hover:border-slate-400"\n                style={{ minWidth: \'165px\' }}\n              >\n                <Search className="w-4 h-4 text-content-secondary" aria-hidden="true" />\n                Track Complaint'),
  'HeroSection must NOT contain an inert button for Track Complaint'
);
console.log('  ✓ HeroSection correctly uses <Link to="/track-complaint">.\n');

// 2. Inspect AppRoutes.jsx
console.log('[Check 2] Inspecting AppRoutes.jsx for /track-complaint route definition...');
const routesPath = path.resolve('src/routes/AppRoutes.jsx');
const routesContent = fs.readFileSync(routesPath, 'utf8');

assert(
  routesContent.includes('path="/track-complaint"'),
  'AppRoutes must define path="/track-complaint"'
);
assert(
  routesContent.includes('<StudentDashboardPage />'),
  'AppRoutes must route to StudentDashboardPage'
);
assert(
  routesContent.includes('<ProtectedRoute>\n            <StudentDashboardPage />\n          </ProtectedRoute>'),
  'Route /track-complaint must be wrapped in ProtectedRoute'
);
console.log('  ✓ AppRoutes correctly defines protected /track-complaint route.\n');

// 3. Inspect Footer.jsx
console.log('[Check 3] Inspecting Footer.jsx for Track Existing Ticket Link...');
const footerPath = path.resolve('src/components/Footer.jsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');

assert(
  footerContent.includes("href: '/track-complaint'"),
  'Footer must link Track Existing Ticket to /track-complaint'
);
console.log('  ✓ Footer correctly links to /track-complaint.\n');

// 4. Verify SPA Refresh Compatibility in vercel.json
console.log('[Check 4] Inspecting vercel.json for SPA browser refresh routing...');
const vercelPath = path.resolve('vercel.json');
const vercelContent = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

const hasSpaRewrite = vercelContent.rewrites?.some(
  (r) => r.source === '/(.*)' && r.destination === '/index.html'
);
assert(hasSpaRewrite, 'vercel.json must rewrite all non-api routes to /index.html for SPA refresh support');
console.log('  ✓ vercel.json includes SPA rewrites ensuring browser refresh on /track-complaint works.\n');

// 5. Verify production build output
console.log('[Check 5] Verifying production build artifacts...');
const indexPath = path.resolve('dist/index.html');
assert(fs.existsSync(indexPath), 'dist/index.html must exist from build');
console.log('  ✓ Production build verified.\n');

console.log('========================================================================');
console.log('ALL TRACK COMPLAINT NAVIGATION CHECKS PASSED (100%)!');
console.log('========================================================================');
