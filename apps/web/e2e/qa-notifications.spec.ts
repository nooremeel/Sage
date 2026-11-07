import { test, expect } from '@playwright/test';

test.describe('Real-Time Community: Lesson Q&A & Notification Center', () => {
  test('lesson Q&A displays threads and filters by instructor answers', async ({ page }) => {
    await page.goto('/en/courses/modern-web-architecture/lessons/les-arch-01-vid');

    // Wait for Q&A section
    const allTab = page.locator('[data-testid="tab-all-questions"]');
    await expect(allTab).toBeVisible({ timeout: 10000 });

    const threads = page.locator('[data-testid="qa-thread-item"]');
    await expect(threads.first()).toBeVisible();
    const allCount = await threads.count();
    expect(allCount).toBeGreaterThanOrEqual(1);

    // Switch to Instructor Answered tab
    const answeredTab = page.locator('[data-testid="tab-answered-questions"]');
    await answeredTab.click();

    // Verify all displayed threads have the verified instructor badge
    const answeredThreads = page.locator('[data-testid="qa-thread-item"]');
    const answeredCount = await answeredThreads.count();
    expect(answeredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < answeredCount; i++) {
      await expect(
        answeredThreads.nth(i).locator('[data-testid="verified-instructor-badge"]')
      ).toBeVisible();
    }
  });

  test('submitting a new Q&A question optimistically updates thread list', async ({ page }) => {
    await page.goto('/en/courses/modern-web-architecture/lessons/les-arch-01-vid');

    const askBtn = page.locator('[data-testid="ask-question-btn"]');
    await expect(askBtn).toBeVisible({ timeout: 10000 });
    await askBtn.click();

    const titleInput = page.locator('[data-testid="new-thread-title-input"]');
    await expect(titleInput).toBeVisible();

    const uniqueTitle = `Distributed Locking Strategies ${Date.now()}`;
    await titleInput.fill(uniqueTitle);

    const contentInput = page.locator('[data-testid="new-thread-content-input"]');
    await contentInput.fill('How does Redlock compare to single-instance Redis mutex in production?');

    const postBtn = page.locator('[data-testid="post-question-btn"]');
    await postBtn.click();

    // Verify new thread is rendered in the list
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
  });

  test('header notification bell displays unread count and allows marking all read', async ({ page }) => {
    await page.goto('/en');

    const bellBtn = page.locator('[data-testid="notification-bell-btn"]');
    await expect(bellBtn).toBeVisible({ timeout: 10000 });

    const badge = page.locator('[data-testid="notification-badge"]');
    await expect(badge).toBeVisible();
    const countText = await badge.innerText();
    expect(parseInt(countText, 10)).toBeGreaterThan(0);

    // Open notification panel
    await bellBtn.click();
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Verify notification items exist
    const items = page.locator('[data-testid="notification-item"]');
    await expect(items.first()).toBeVisible();

    // Mark all as read
    const markAllBtn = page.locator('[data-testid="mark-all-read-btn"]');
    await expect(markAllBtn).toBeVisible();
    await markAllBtn.click();

    // Verify badge disappears
    await expect(badge).not.toBeVisible({ timeout: 5000 });
  });

  test('bilingual RTL Q&A and notifications work seamlessly in Arabic', async ({ page }) => {
    await page.goto('/ar/courses/modern-web-architecture/lessons/les-arch-01-vid');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Arabic Q&A tabs
    const allTab = page.locator('[data-testid="tab-all-questions"]');
    await expect(allTab).toBeVisible({ timeout: 10000 });
    await expect(allTab).toContainText('جميع الأسئلة');

    // Arabic notification bell
    const bellBtn = page.locator('[data-testid="notification-bell-btn"]');
    await bellBtn.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('الإشعارات');
  });
});

