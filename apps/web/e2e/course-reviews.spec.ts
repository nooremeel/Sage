import { test, expect } from '@playwright/test';

test.describe('Social Proof: Course Reviews & Academic Rating Breakdown', () => {
  test('displays average score, rating summary, and 5-bar distribution histogram', async ({ page }) => {
    await page.goto('/en/courses/modern-web-architecture');

    const reviewsSection = page.locator('[data-testid="reviews-section"]');
    await expect(reviewsSection).toBeVisible({ timeout: 10000 });

    const ratingSummary = page.locator('[data-testid="rating-summary"]');
    await expect(ratingSummary).toBeVisible();

    const avgNumber = page.locator('[data-testid="average-rating-number"]');
    await expect(avgNumber).toBeVisible();
    const avgText = await avgNumber.innerText();
    expect(parseFloat(avgText)).toBeGreaterThanOrEqual(4.0);

    // Verify 5-tier histogram exists
    const histogram = page.locator('[data-testid="rating-histogram"]');
    await expect(histogram).toBeVisible();

    for (const star of [5, 4, 3, 2, 1]) {
      const row = page.locator(`[data-testid="histogram-row-${star}"]`);
      await expect(row).toBeVisible();
      const bar = page.locator(`[data-testid="histogram-bar-${star}"]`);
      await expect(bar).toBeAttached();
    }

    // Stars with reviews (5-star, 4-star) have non-zero width and are visible
    await expect(page.locator('[data-testid="histogram-bar-5"]')).toBeVisible();
    await expect(page.locator('[data-testid="histogram-bar-4"]')).toBeVisible();
  });

  test('displays verified student reviews with authentic commentary', async ({ page }) => {
    await page.goto('/en/courses/modern-web-architecture');

    const reviews = page.locator('[data-testid="review-card"]');
    await expect(reviews.first()).toBeVisible({ timeout: 10000 });
    const count = await reviews.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify student verification badge
    const badge = page.locator('[data-testid="verified-student-badge"]').first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Verified Student');
  });

  test('allows filtering reviews by star rating', async ({ page }) => {
    await page.goto('/en/courses/modern-web-architecture');

    const allFilter = page.locator('[data-testid="filter-star-all"]');
    await expect(allFilter).toBeVisible({ timeout: 10000 });

    // Filter by 4 stars
    const star4Filter = page.locator('[data-testid="filter-star-4"]');
    await expect(star4Filter).toBeVisible();
    await star4Filter.click();

    // Verify all filtered reviews have rating 4.0
    const displayedReviews = page.locator('[data-testid="review-card"]');
    const filteredCount = await displayedReviews.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < filteredCount; i++) {
      await expect(displayedReviews.nth(i)).toContainText('4.0');
    }

    // Reset back to All
    await allFilter.click();
    const restoredCount = await page.locator('[data-testid="review-card"]').count();
    expect(restoredCount).toBeGreaterThan(filteredCount);
  });

  test('redirects unauthenticated visitor to login when clicking write review', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
    });
    await page.goto('/en/courses/modern-web-architecture');

    const writeBtn = page.locator('[data-testid="write-review-btn"]');
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await writeBtn.click();

    await page.waitForURL('**/login', { timeout: 8000 });
    expect(page.url()).toContain('/login');
  });

  test('enables writing and submitting a review with optimistic UI update', async ({ page }) => {
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
    });
    await page.goto('/en/courses/modern-web-architecture');

    const writeBtn = page.locator('[data-testid="write-review-btn"]');
    await expect(writeBtn).toBeVisible({ timeout: 10000 });
    await writeBtn.click();

    const form = page.locator('[data-testid="review-form"]');
    await expect(form).toBeVisible();

    // Select 5 stars
    const star5Btn = page.locator('[data-testid="review-rating-star-5"]');
    await star5Btn.click();

    const uniqueComment = `Phenomenal course on cache stampede and distributed locks! Test timestamp ${Date.now()}`;
    const commentInput = page.locator('[data-testid="review-comment-input"]');
    await commentInput.fill(uniqueComment);

    const submitBtn = page.locator('[data-testid="submit-review-btn"]');
    await submitBtn.click();

    // Verify optimistic review appears at top of review list
    await expect(page.getByText(uniqueComment)).toBeVisible({ timeout: 5000 });
  });

  test('bilingual RTL review section renders accurately in Arabic', async ({ page }) => {
    await page.goto('/ar/courses/modern-web-architecture');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const reviewsSection = page.locator('[data-testid="reviews-section"]');
    await expect(reviewsSection).toBeVisible({ timeout: 10000 });
    await expect(reviewsSection).toContainText('تقييمات وآراء الطلاب');
    await expect(reviewsSection).toContainText('توزيع التقييمات');

    const badge = page.locator('[data-testid="verified-student-badge"]').first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('طالب معتمد');
  });
});

