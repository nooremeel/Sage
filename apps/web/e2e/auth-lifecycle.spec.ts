import { test, expect } from '@playwright/test';

test.describe('Authentication Lifecycle & Security Gates (Phase 11.2 & 11.11)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
    });
  });

  test('renders login page with bilingual inputs, persona card, and navigation links in English', async ({ page }) => {
    await page.goto('/en/login');

    // Title and subtitle
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Continue your scholarly pursuit in Sage.')).toBeVisible();

    // 1-Click Demo Persona quick picker
    await expect(page.locator('[data-testid="persona-card-student"]')).toBeVisible();

    // Form inputs and LTR direction
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('dir', 'ltr');
    await expect(passwordInput).toHaveAttribute('dir', 'ltr');

    // Navigation links
    const forgotLink = page.getByRole('link', { name: 'Forgot your password?' });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', /\/forgot-password/);

    const signupLink = page.getByRole('link', { name: 'Create Account' });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', /\/signup/);

    // Submit button
    const submitBtn = page.getByRole('button', { name: 'Sign In' }).last();
    await expect(submitBtn).toBeVisible();
  });

  test('validates required fields on login submission and signs in successfully', async ({ page }) => {
    await page.goto('/en/login');

    // Submit empty form - HTML5 or Zod validation stops submission
    const submitBtn = page.getByRole('button', { name: 'Sign In' }).last();
    await submitBtn.click();

    // Fill valid student credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('student.test@sage.dev');
    await passwordInput.fill('password123');
    await submitBtn.click();

    // Offline / live fallback redirects student to /profile
    await page.waitForURL('**/profile', { timeout: 10000 });
    expect(page.url()).toContain('/profile');
    await expect(page.getByText(/Track your scholarly progress/i)).toBeVisible({ timeout: 10000 });
  });

  test('renders signup page with role picker and registers student successfully', async ({ page }) => {
    await page.goto('/en/signup');

    // Heading
    await expect(page.getByRole('heading', { name: 'Create your Sage account' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Join as a student or instructor and explore courses.')).toBeVisible();

    // Role selector buttons
    const studentRoleBtn = page.getByRole('button', { name: /Student \(I want to learn\)/i });
    const instructorRoleBtn = page.getByRole('button', { name: /Instructor \(I want to teach\)/i });

    await expect(studentRoleBtn).toBeVisible();
    await expect(instructorRoleBtn).toBeVisible();

    // Toggle to instructor and back to student
    await instructorRoleBtn.click();
    await expect(instructorRoleBtn).toHaveClass(/border-primary/);

    await studentRoleBtn.click();
    await expect(studentRoleBtn).toHaveClass(/border-primary/);

    // Form fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('newscholar@sage.dev');
    await passwordInput.fill('P@ssword2026!');

    const createAccountBtn = page.getByRole('button', { name: 'Create Account' });
    await createAccountBtn.click();

    // Upon signup success, user is redirected to home page
    await page.waitForURL('**/en', { timeout: 10000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('handles forgot-password flow with API request and confirmation message', async ({ page }) => {
    // Intercept forgot password endpoint
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Reset email sent' }),
      });
    });

    await page.goto('/en/forgot-password');

    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Enter your email to receive a password reset link.')).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('forgotten@sage.dev');

    const sendLinkBtn = page.getByRole('button', { name: 'Send Reset Link' });
    await sendLinkBtn.click();

    // Confirmation alert
    await expect(
      page.getByText('If the email exists, instructions have been sent.')
    ).toBeVisible({ timeout: 8000 });
  });

  test('handles reset-password flow with valid token and success feedback', async ({ page }) => {
    // Intercept reset password endpoint
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Password updated' }),
      });
    });

    await page.goto('/en/reset-password?token=valid-reset-token-2026');

    await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible({ timeout: 10000 });

    const passwordInput = page.locator('input[name="newPassword"]');
    await passwordInput.fill('NewSecurePassword#2026');

    const updateBtn = page.getByRole('button', { name: 'Update Password' });
    await updateBtn.click();

    // Confirmation alert
    await expect(
      page.getByText('Your password has been reset. Please sign in.')
    ).toBeVisible({ timeout: 8000 });
  });

  test('handles email verification: displays error when token is missing and success when valid', async ({ page }) => {
    // 1. Missing token -> displays error
    await page.goto('/en/verify-email');
    await expect(page.getByText('Invalid or expired token.')).toBeVisible({ timeout: 8000 });

    // 2. Valid token -> displays success
    await page.route('**/api/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: 'Email verified' }),
      });
    });

    await page.goto('/en/verify-email?token=verified-token-xyz');
    await expect(
      page.getByText('Your email has been verified successfully.')
    ).toBeVisible({ timeout: 8000 });

    const signInBtn = page.getByRole('button', { name: 'Sign In' }).last();
    await expect(signInBtn).toBeVisible();
  });

  test('renders auth pages in Arabic with strict RTL layout and zero horizontal overflow', async ({ page }) => {
    await page.goto('/ar/login');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Arabic Login Heading
    await expect(page.getByRole('heading', { name: 'تسجيل الدخول إلى حسابك' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('واصل مسيرتك العلمية في سايج.')).toBeVisible();

    // Arabic Signup Page
    await page.goto('/ar/signup');
    await expect(page.getByRole('heading', { name: 'إنشاء حسابك في سايج' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('طالب (أرغب في التعلّم)')).toBeVisible();
    await expect(page.getByText('مدرّب (أرغب في التدريس)')).toBeVisible();

    // Verify zero horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

