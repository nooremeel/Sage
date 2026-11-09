import { test, expect } from '@playwright/test';

test.describe('Scholarly Course Catalog, Search & Filtering (Phase 11.4 & 11.10)', () => {
  test('renders catalog header, search bar, filter chips, and course cards in English', async ({ page }) => {
    await page.goto('/en/courses');

    // 1. Header
    const heading = page.getByRole('heading', { level: 1, name: 'Scholarly Catalog' });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Explore curated bilingual courses designed for depth, rigor, and craft.')).toBeVisible();

    // 2. Search Bar
    const searchInput = page.getByPlaceholder('Search by course title, topic, or keyword...');
    await expect(searchInput).toBeVisible();
    const searchBtn = page.getByRole('button', { name: 'Search' });
    await expect(searchBtn).toBeVisible();

    // 3. Discipline / Category Chips
    await expect(page.getByRole('link', { name: 'All Disciplines' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Software Engineering' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Classical Arts & Calligraphy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Business & Leadership' })).toBeVisible();

    // 4. Level & Price Filters
    await expect(page.getByRole('link', { name: 'All Levels', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Beginner', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Intermediate', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Advanced', exact: true })).toBeVisible();

    await expect(page.getByRole('link', { name: 'All Pricing', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Free', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Paid', exact: true })).toBeVisible();

    // 5. Course Cards
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();
    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();
  });

  test('filters catalog courses by discipline when clicking category chips', async ({ page }) => {
    await page.goto('/en/courses');

    // Click Classical Arts category chip
    const artsChip = page.getByRole('link', { name: 'Classical Arts & Calligraphy' });
    await expect(artsChip).toBeVisible({ timeout: 10000 });
    await artsChip.click();

    // URL updates with category query param
    await page.waitForURL('**/courses?category=islamic-arts');
    expect(page.url()).toContain('category=islamic-arts');

    // Verify Calligraphy course is displayed
    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();

    // Return to all disciplines
    const allChip = page.getByRole('link', { name: 'All Disciplines' });
    await allChip.click();
    await page.waitForURL('**/courses');
    expect(page.url()).not.toContain('category=islamic-arts');
  });

  test('filters catalog courses by academic level', async ({ page }) => {
    await page.goto('/en/courses');

    // Filter by Advanced level
    const advancedChip = page.getByRole('link', { name: 'Advanced', exact: true });
    await expect(advancedChip).toBeVisible({ timeout: 10000 });
    await advancedChip.click();

    await page.waitForURL('**/courses?level=advanced');
    expect(page.url()).toContain('level=advanced');

    // Modern Web Architecture should be present
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();
  });

  test('searches for courses via keyword search input', async ({ page }) => {
    await page.goto('/en/courses');

    const searchInput = page.getByPlaceholder('Search by course title, topic, or keyword...');
    await searchInput.fill('Calligraphy');

    const searchBtn = page.getByRole('button', { name: 'Search' });
    await searchBtn.click();

    await page.waitForURL('**/courses?q=Calligraphy');
    expect(page.url()).toContain('q=Calligraphy');

    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();
  });

  test('displays scholarly empty state when search matches zero courses', async ({ page }) => {
    await page.goto('/en/courses?q=xyznonexistentquery99999');

    // Empty state heading and explanation
    await expect(page.getByRole('heading', { name: 'No courses found' })).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('There are no published courses matching your selected filter criteria.')
    ).toBeVisible();

    // Clear filters action
    const clearLink = page.getByRole('link', { name: 'Clear all filters' });
    await expect(clearLink).toBeVisible();
    await clearLink.click();

    await page.waitForURL('**/courses');
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();
  });

  test('navigates from course card to course detail page', async ({ page }) => {
    await page.goto('/en/courses');

    // Click on Thuluth Calligraphy course card
    const courseCardLink = page.locator('a[href*="/courses/thuluth-calligraphy"]').first();
    await expect(courseCardLink).toBeVisible({ timeout: 10000 });
    await courseCardLink.click();

    // Wait for course detail page
    await page.waitForURL('**/courses/thuluth-calligraphy');
    expect(page.url()).toContain('/courses/thuluth-calligraphy');

    // Detail page elements
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Classical Arabic Calligraphy');
    await expect(page.getByText('Curriculum Outline')).toBeVisible();
  });

  test('renders course catalog in Arabic with strict RTL layout and zero horizontal overflow', async ({ page }) => {
    await page.goto('/ar/courses');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Arabic title and search bar
    await expect(page.getByRole('heading', { level: 1, name: 'فهرس الدورات الأكاديمية' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('ابحث باسم الدورة أو الموضوع أو الكلمات المفتاحية...')).toBeVisible();

    // Arabic category chips
    await expect(page.getByRole('link', { name: 'جميع التخصصات' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'الفنون الكلاسيكية والخط العربي' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'هندسة البرمجيات' })).toBeVisible();

    // Arabic course card
    await expect(page.getByText('أسرار الخط العربي: هندسة خط الثلث الكلاسيكي')).toBeVisible();

    // Verify zero horizontal scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

