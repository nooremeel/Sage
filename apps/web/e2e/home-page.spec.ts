import { test, expect } from '@playwright/test';

test.describe('Academic Homepage, Category Explorer & Social Proof (Phase 11.10 & 11.11)', () => {
  test('renders scholarly hero, category explorer, featured courses, and testimonials in English', async ({ page }) => {
    await page.goto('/en');

    // 1. Hero Section
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible({ timeout: 10000 });
    await expect(headline).toContainText('Learn something worth knowing');

    const exploreBtn = page.getByRole('link', { name: /Explore Catalog/i });
    await expect(exploreBtn).toBeVisible();

    const browseArtsBtn = page.getByRole('link', { name: /Browse Classical Arts/i });
    await expect(browseArtsBtn).toBeVisible();

    // 2. Category Explorer
    const categoryExplorer = page.locator('[data-testid="category-explorer"]');
    await expect(categoryExplorer).toBeVisible();

    const catSoftware = page.locator('[data-testid="category-card-software-engineering"]');
    await expect(catSoftware).toBeVisible();
    await expect(catSoftware).toContainText('Software Engineering');

    const catArts = page.locator('[data-testid="category-card-islamic-arts"]');
    await expect(catArts).toBeVisible();
    await expect(catArts).toContainText('Classical Arts & Calligraphy');

    const catBiz = page.locator('[data-testid="category-card-business-leadership"]');
    await expect(catBiz).toBeVisible();
    await expect(catBiz).toContainText('Business & Technology Leadership');

    // 3. Featured Courses
    const featuredSection = page.locator('[data-testid="featured-courses"]');
    await expect(featuredSection).toBeVisible();
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();

    // 4. Pedagogical Pillars
    const pillarsSection = page.locator('[data-testid="pedagogical-pillars"]');
    await expect(pillarsSection).toBeVisible();
    await expect(page.getByText('Protected HLS Video Delivery')).toBeVisible();
    await expect(page.getByText('Interactive Anti-Leakage Quizzes')).toBeVisible();
    await expect(page.getByText('Authentic Verifiable Certificates')).toBeVisible();

    // 5. Testimonials
    const testimonialsSection = page.locator('[data-testid="student-testimonials"]');
    await expect(testimonialsSection).toBeVisible();
    await expect(page.getByText('Mariam Al-Mansoor')).toBeVisible();
    await expect(page.getByText('Tarek El-Khatib')).toBeVisible();

    // 6. Navigation cleanup: verify /styleguide is NOT in header nav
    const headerNav = page.locator('header nav');
    await expect(headerNav.getByRole('link', { name: /Styleguide/i })).toHaveCount(0);

    // Verify footer has academic links
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /Course Catalog/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Verify Credential/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Instructor Studio/i })).toBeVisible();
  });

  test('navigates to filtered catalog when clicking a category card', async ({ page }) => {
    await page.goto('/en');

    const catArts = page.locator('[data-testid="category-card-islamic-arts"]');
    await expect(catArts).toBeVisible({ timeout: 10000 });
    await catArts.click();

    await page.waitForURL('**/courses?category=islamic-arts');
    expect(page.url()).toContain('/courses?category=islamic-arts');
  });

  test('renders correctly in Arabic (RTL) with proper script and zero overflow', async ({ page }) => {
    await page.goto('/ar');

    // Check html lang and dir
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Check Arabic Hero Headline
    const headline = page.getByRole('heading', { level: 1 });
    await expect(headline).toBeVisible({ timeout: 10000 });
    await expect(headline).toContainText('تعلّم ما يستحق أن يُعرف');

    // Verify Arabic category cards
    await expect(page.getByText('الفنون الكلاسيكية والخط العربي')).toBeVisible();
    await expect(page.getByText('هندسة البرمجيات والنظم')).toBeVisible();

    // Verify Arabic testimonials
    await expect(page.getByText('مريم المنصور')).toBeVisible();
    await expect(page.getByText('طارق الخطيب')).toBeVisible();

    // Verify zero horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});
