// Captures one screenshot per documented page (plus a few multi-step flows)
// for the in-app Documentation pages. Requires both dev servers already
// running: `npm run dev` in /server (API on :5000) and `npm run dev` in
// /client (Vite on :5173). Run with: node scripts/captureDocs.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5173';
const OUT_ROOT = path.join(__dirname, '..', 'public', 'docs-media');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function login(page, { loginPath, loginId, password }) {
  await page.goto(BASE_URL + loginPath, { waitUntil: 'networkidle' });
  await page.fill('#loginId', loginId);
  await page.fill('#password', password);
  await Promise.all([
    page.waitForURL(/\/(admin|staff|student)\/dashboard/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState('networkidle');
}

async function shot(page, outDir, slug) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, `${slug}.png`), fullPage: true });
  console.log('  captured', slug);
}

async function gotoAndShot(page, outDir, slug, routePath) {
  await page.goto(BASE_URL + routePath, { waitUntil: 'networkidle' });
  await shot(page, outDir, slug);
}

const ROLES = [
  {
    role: 'admin',
    loginPath: '/login/admin',
    loginId: 'ADMIN',
    password: 'Admin@123',
    steps: [
      (page, outDir) => gotoAndShot(page, outDir, 'dashboard', '/admin/dashboard'),
      async (page, outDir) => {
        await page.goto(BASE_URL + '/admin/students', { waitUntil: 'networkidle' });
        await shot(page, outDir, 'students-list');
        await page.locator('button[title="View"]').first().click();
        await page.waitForTimeout(500);
        await shot(page, outDir, 'student-detail');
      },
      (page, outDir) => gotoAndShot(page, outDir, 'staff-list', '/admin/staff'),
      (page, outDir) => gotoAndShot(page, outDir, 'academic-structure', '/admin/academic'),
      (page, outDir) => gotoAndShot(page, outDir, 'attendance-shortage', '/admin/attendance'),
      (page, outDir) => gotoAndShot(page, outDir, 'timetable', '/admin/timetable'),
      (page, outDir) => gotoAndShot(page, outDir, 'exams', '/admin/exams'),
      (page, outDir) => gotoAndShot(page, outDir, 'promotion', '/admin/promotion'),
      (page, outDir) => gotoAndShot(page, outDir, 'leave', '/admin/leave'),
      (page, outDir) => gotoAndShot(page, outDir, 'announcements', '/admin/announcements'),
      (page, outDir) => gotoAndShot(page, outDir, 'reports', '/admin/reports'),
      (page, outDir) => gotoAndShot(page, outDir, 'activity-logs', '/admin/activity-logs'),
      (page, outDir) => gotoAndShot(page, outDir, 'backup', '/admin/backup'),
    ],
  },
  {
    role: 'staff',
    loginPath: '/login/staff',
    loginId: 'STF0007',
    password: 'Test@1234',
    steps: [
      (page, outDir) => gotoAndShot(page, outDir, 'dashboard', '/staff/dashboard'),
      async (page, outDir) => {
        await page.goto(BASE_URL + '/staff/attendance', { waitUntil: 'networkidle' });
        await shot(page, outDir, 'attendance-step1-subject');
        await page.locator('.subject-chip').first().click();
        await page.waitForTimeout(400);
        await shot(page, outDir, 'attendance-step2-batch');
        await page.locator('.subject-chip').first().click();
        await page.waitForTimeout(800);
        await shot(page, outDir, 'attendance-step3-roster');
      },
      (page, outDir) => gotoAndShot(page, outDir, 'marks-entry', '/staff/marks'),
      (page, outDir) => gotoAndShot(page, outDir, 'od-requests', '/staff/od-requests'),
      (page, outDir) => gotoAndShot(page, outDir, 'leave', '/staff/leave'),
      (page, outDir) => gotoAndShot(page, outDir, 'announcements', '/staff/announcements'),
    ],
  },
  {
    role: 'student',
    loginPath: '/login/student',
    loginId: 'STU0303',
    password: 'Test@1234',
    steps: [
      (page, outDir) => gotoAndShot(page, outDir, 'dashboard', '/student/dashboard'),
      (page, outDir) => gotoAndShot(page, outDir, 'attendance-calendar', '/student/attendance'),
      (page, outDir) => gotoAndShot(page, outDir, 'timetable', '/student/timetable'),
      (page, outDir) => gotoAndShot(page, outDir, 'results', '/student/results'),
      (page, outDir) => gotoAndShot(page, outDir, 'od-requests', '/student/od-requests'),
      (page, outDir) => gotoAndShot(page, outDir, 'leave', '/student/leave'),
      (page, outDir) => gotoAndShot(page, outDir, 'announcements', '/student/announcements'),
    ],
  },
];

async function run() {
  const browser = await chromium.launch();
  for (const roleDef of ROLES) {
    console.log(`\n=== ${roleDef.role} ===`);
    const outDir = path.join(OUT_ROOT, roleDef.role);
    ensureDir(outDir);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => window.localStorage.setItem('sms-theme', 'light'));
    const page = await context.newPage();
    await login(page, roleDef);

    for (const step of roleDef.steps) {
      // eslint-disable-next-line no-await-in-loop
      await step(page, outDir);
    }
    // eslint-disable-next-line no-await-in-loop
    await context.close();
  }
  await browser.close();
  console.log('\nAll documentation screenshots captured under public/docs-media/.');
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exitCode = 1;
});
