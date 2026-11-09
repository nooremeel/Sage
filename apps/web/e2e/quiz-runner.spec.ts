import { test, expect } from '@playwright/test';

test.describe('Quiz Runner & Certification Unlock (Phase 11.2)', () => {
  test('does not display certificate claim or progress banner for unauthenticated visitors', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
      localStorage.removeItem('sage_claimed_cert_course-thuluth-002');
      localStorage.removeItem('sage_quiz_passed_course-thuluth-002');
    });
    await page.goto('/en/courses/thuluth-calligraphy/lessons/les-thuluth-04-quiz');

    await expect(page.getByText(/Course Completion/i)).not.toBeVisible();
    await expect(page.getByText('Official Serial: SAGE-2026-ALPHA1')).not.toBeVisible();
  });

  test('takes and passes quiz in English, unlocking certificate milestone', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-student-001',
          email: 'student@sage.dev',
          role: 'student',
          locale: 'en',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
      localStorage.removeItem('sage_claimed_cert_course-thuluth-002');
      localStorage.removeItem('sage_quiz_passed_course-thuluth-002');
      localStorage.removeItem('sage_quiz_attempts_quiz-thuluth-01');
    });
    await page.goto('/en/courses/thuluth-calligraphy/lessons/les-thuluth-04-quiz');

    // Verify initial state: course in progress (NOT prematurely completed)
    await expect(page.getByText(/Course Completion/i)).toBeVisible();
    await expect(page.getByText('Official Serial: SAGE-2026-ALPHA1')).not.toBeVisible();

    // Title and question checks
    const quizHeading = page.locator('h2').filter({ hasText: /Assessment/i });
    await expect(quizHeading).toBeVisible({ timeout: 10000 });

    // Verify passing requirement badge
    await expect(page.getByText('Passing Score: 80%')).toBeVisible();

    // Select Q1 option (Rhombic dot)
    const q1Option = page.locator('label').filter({ hasText: /rhombic dot/i });
    await expect(q1Option).toBeVisible();
    await q1Option.click();

    // Select Q2 option (70 degrees)
    const q2Option = page.locator('label').filter({ hasText: /70 degrees/i });
    await expect(q2Option).toBeVisible();
    await q2Option.click();

    // Select Q3 options (Arabic gum & Lamp oil soot)
    const q3Opt1 = page.locator('label').filter({ hasText: /Arabic gum/i });
    const q3Opt2 = page.locator('label').filter({ hasText: /Lamp oil soot/i });
    await expect(q3Opt1).toBeVisible();
    await expect(q3Opt2).toBeVisible();
    await q3Opt1.click();
    await q3Opt2.click();

    // Submit answers
    const submitBtn = page.getByRole('button', { name: /Submit Answers/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify celebration / passed view
    await expect(page.getByText(/Congratulations! You Passed!/i)).toBeVisible();
    await expect(page.getByText(/Lesson Completed/i)).toBeVisible();

    // Verify Claim Certificate celebration banner appears now
    const claimBtn = page.getByRole('button', { name: /Claim Certificate/i });
    await expect(claimBtn).toBeVisible();

    // Click claim button
    await claimBtn.click();

    // Now View Certificate link should be visible with serial
    const certLink = page.getByRole('link', { name: /View Certificate/i });
    await expect(certLink).toBeVisible();
  });

  test('renders quiz in Arabic with RTL layout and localized questions', async ({ page }) => {
    await page.goto('/ar/courses/thuluth-calligraphy-ar/lessons/les-thuluth-04-quiz');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Heading in Arabic
    await expect(page.locator('h2').filter({ hasText: /اختبار تقييم/ })).toBeVisible();

    // Question 1 in Arabic
    await expect(page.getByText(/الوحدة الأساسية المعتمدة/)).toBeVisible();
    await expect(page.locator('label').filter({ hasText: /ميزان النقطة المعينة/ })).toBeVisible();

    // Submit button in Arabic
    await expect(page.getByRole('button', { name: /تسليم الإجابات/ })).toBeVisible();
  });
});
