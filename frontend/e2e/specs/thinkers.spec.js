import { expect, test } from '@playwright/test';

const password = 'Thinkers123!';

async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('thinkers-language', 'en'));
});

test('authentication: login, logout, and protected route guards', async ({ page }) => {
  await page.goto('/student/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await login(page, 'student1@thinkers.demo');
  await expect(page).toHaveURL(/\/student\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Welcome, Noor Ahmad/i })).toBeVisible();

  await page.getByRole('button', { name: 'Profile' }).click();
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/logout') && response.ok()),
    page.getByRole('menuitem', { name: 'Logout' }).click(),
  ]);
  await page.goto('/student/dashboard');
  await expect(page).toHaveURL(/\/login$/);

  await login(page, 'student1@thinkers.demo');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/student\/dashboard$/);
});

test('student: browse, enroll, learn, use AI, and verify a certificate', async ({ page }) => {
  await login(page, 'student1@thinkers.demo');

  await page.goto('/courses');
  await expect(page.getByRole('heading', { name: 'Explore courses' })).toBeVisible();
  await page.getByPlaceholder('Search courses…').fill('Generative AI Foundations');
  await page.getByRole('heading', { name: 'Generative AI Foundations' }).click();
  await page.getByRole('button', { name: 'Enroll now' }).click();
  await expect(page).toHaveURL(/\/learn\/\d+/);
  await expect(page.getByRole('heading', { name: 'Generative AI Foundations', exact: true })).toBeVisible();
  await expect(page.getByText(/Lesson 1 of/)).toBeVisible();
  await page.getByRole('button', { name: /Complete & next|Mark complete/ }).click();
  await expect(page).toHaveURL(/\/lessons\/\d+/);

  await page.route('**/api/ai/chat', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { response: 'This is a safe test tutor response.', conversation_id: 9001, message: { id: 9002, created_at: new Date().toISOString() } } }),
  }));
  await page.goto('/ai');
  await page.getByLabel('Message Thinkers AI Tutor').fill('Explain this lesson');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('This is a safe test tutor response.')).toBeVisible();

  await page.goto('/student/dashboard');
  await expect(page.getByRole('heading', { name: 'Certificates' })).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Verify' }).first().click();
  const certificatePage = await popupPromise;
  await expect(certificatePage.getByRole('heading', { name: 'Valid Thinkers Certificate' })).toBeVisible();
  await expect(certificatePage.getByText('THINKERS-E2E-0001')).toBeVisible();
});

test('instructor: dashboard and course management', async ({ page }) => {
  await login(page, 'lina.haddad@thinkers.demo');
  await expect(page).toHaveURL(/\/instructor\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Instructor dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Curriculum' }).first().click();
  await expect(page).toHaveURL(/\/instructor\/courses\/\d+\/curriculum$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('This curriculum is read-only while under review or published.')).toBeVisible();
});

test('notifications: student can read one and mark all as read', async ({ page }) => {
  await login(page, 'student1@thinkers.demo');
  const bell = page.getByRole('button', { name: /Notifications, 2 unread/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByText('Quiz graded')).toBeVisible();
  await page.getByText('Quiz graded').click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.getByText('New lesson available')).toBeVisible();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByText('0 unread notifications')).toBeVisible();
});

test('instructor: create, edit, upload, and submit a course draft', async ({ page }) => {
  test.setTimeout(75_000);
  await login(page, 'lina.haddad@thinkers.demo');
  await page.getByRole('link', { name: 'Create course' }).click();
  await expect(page).toHaveURL(/\/instructor\/courses\/new$/);

  await expect(page.getByLabel('Category').locator('option')).not.toHaveCount(0);
  await page.getByLabel('Category').selectOption({ index: 0 });
  await page.getByLabel('Course title').fill('Secure Laravel Builder');
  await page.getByLabel('Subtitle').fill('A complete secure workflow');
  await page.getByRole('button', { name: /Course content/ }).click();
  await page.getByLabel('Short description').fill('Build a secure Laravel application from end to end.');
  await page.getByLabel('Full description').fill('A practical course for approved Thinkers instructors.');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page).toHaveURL(/\/instructor\/courses\/\d+\/builder$/);
  const courseId = page.url().match(/courses\/(\d+)/)[1];

  await page.getByRole('button', { name: /Course basics/ }).click();
  await Promise.all([
    page.waitForResponse(response => response.url().endsWith(`/api/manage/courses/${courseId}/thumbnail`) && response.ok()),
    page.locator('input[type="file"][accept*="image"]').setInputFiles({
      name: 'course.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
    }),
  ]);
  await page.goto(`/instructor/courses/${courseId}/curriculum`);
  page.once('dialog', dialog => dialog.accept('Getting started'));
  await page.getByLabel('Add section').click();
  await page.getByRole('button', { name: '+ Add lesson' }).click();
  page.once('dialog', dialog => dialog.accept('Welcome lesson'));
  await page.getByRole('button', { name: 'text', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome lesson' })).toBeVisible();

  await page.goto(`/instructor/courses/${courseId}/builder`);
  await page.getByRole('button', { name: /Submit for review/ }).click();
  await expect(page).toHaveURL(/\/instructor\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Secure Laravel Builder' })).toBeVisible();
});

test('admin: dashboard access and user management', async ({ page }) => {
  await login(page, 'admin@thinkers.demo');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();

  await page.getByRole('link', { name: 'Users', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible();
  await page.getByPlaceholder('Search name or email').fill('student1@thinkers.demo');
  await expect(page.getByText('student1@thinkers.demo')).toBeVisible();
  await page.getByRole('button', { name: 'View Noor Ahmad' }).click();
  await expect(page.getByRole('heading', { name: 'Noor Ahmad' })).toBeVisible();
});

test('admin control center: approvals, revenue, orders, audit, and notifications', async ({ page }) => {
  await login(page, 'admin@thinkers.demo');

  await page.getByRole('link', { name: 'Instructor Requests' }).click();
  await expect(page.getByRole('heading', { name: 'Instructor requests' })).toBeVisible();
  const applicant = page.locator('article').filter({ hasText: 'pending.instructor@thinkers.demo' });
  await applicant.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Approve instructor' }).click();
  await expect(page.getByText('Instructor request approved.')).toBeVisible();

  await page.getByRole('link', { name: 'Revenue' }).click();
  await expect(page.getByRole('heading', { name: 'Revenue analytics' })).toBeVisible();

  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page.getByRole('heading', { name: 'Order monitoring' })).toBeVisible();

  await page.getByRole('link', { name: 'Audit Activity' }).click();
  await expect(page.getByRole('heading', { name: 'Audit activity' })).toBeVisible();
  await expect(page.getByText('Instructor approved')).toBeVisible();

  await page.getByRole('button', { name: 'Notifications' }).click();
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
});
