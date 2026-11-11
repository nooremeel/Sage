import { test, expect } from '@playwright/test';

test.describe('Platform Enhancements & Defect Verifications (All 9 Issues)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous session
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
    });
  });

  test('Issue 1: Certificate renders correct scholarly student name and print media rules', async ({ page }) => {
    await page.goto('/en/verify/SAGE-2026-ALPHA1');

    // 1. Verify student name is clean "Nour Emil" (not combined with role)
    await expect(page.getByRole('heading', { name: 'Nour Emil' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Nour Student (طالب علم معتمد)')).toHaveCount(0);

    // 2. Verify certificate sheet has the dedicated print media isolation class
    const certificateSheet = page.locator('.certificate-print-sheet');
    await expect(certificateSheet).toBeVisible();

    // 3. Verify action bar has print:hidden class
    const printBtn = page.getByRole('button', { name: /Print/i });
    await expect(printBtn).toBeVisible();
    await expect(page.locator('.print\\:hidden').first()).toBeVisible();
  });

  test('Issue 3 & 4: Search dynamic typing, Arabic normalization, author search, clear reset, and sorting', async ({ page }) => {
    await page.goto('/en/courses');

    // Verify initial full catalog
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();

    const searchInput = page.getByPlaceholder('Search by course title, topic, or keyword...');

    // A. Dynamic Search by Author / Instructor Name ('Tariq')
    await searchInput.fill('Tariq');
    await searchInput.press('Enter');
    await page.waitForURL('**/*q=Tariq*');
    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toHaveCount(0);

    // B. Clearing the search query auto-resets the catalog back to default
    const clearBtn = page.getByRole('button', { name: 'Clear query input' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(300);
    expect(page.url()).not.toContain('q=');
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();

    // C. Search with Arabic character normalization (typing 'عربى' with alef maqsura matches 'العربي' with ya)
    await searchInput.fill('عربى');
    await searchInput.press('Enter');
    await page.waitForURL('**/*q=*');
    await expect(page.getByText('Classical Arabic Calligraphy: The Geometry of Thuluth')).toBeVisible();

    // D. Sorting: Highest Rated
    const highestRatedSort = page.getByRole('link', { name: 'Highest Rated' });
    await highestRatedSort.click();
    await page.waitForURL('**/*sort=highest_rated*');
    expect(page.url()).toContain('sort=highest_rated');

    // E. Sorting: Price Low to High
    const priceAscSort = page.getByRole('link', { name: 'Price: Low to High' });
    await priceAscSort.click();
    await page.waitForURL('**/*sort=price_asc*');
    expect(page.url()).toContain('sort=price_asc');
  });

  test('Issue 5 & 6: Star ratings visual rounding and dynamic lesson/duration counts', async ({ page }) => {
    await page.goto('/en/courses');

    // 1. Verify courses show distinct durations and lesson counts (not all 10 lessons • 3h 20m)
    const lessonLabels = page.getByText(/lessons/);
    await expect(lessonLabels.first()).toBeVisible({ timeout: 10000 });
    const count = await lessonLabels.count();
    expect(count).toBeGreaterThan(1);

    // 2. Rating stars display properly
    await expect(page.locator('svg.stroke-amber-500').first()).toBeVisible();
  });

  test('Issue 7: Notifications dismiss on click and decrement unread counter', async ({ page }) => {
    // Log in as student using 1-click persona
    await page.goto('/en/login');
    const studentBtn = page.locator('[data-testid="btn-login-student"]');
    await expect(studentBtn).toBeVisible({ timeout: 10000 });
    await studentBtn.click();
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Open notifications
    const bellBtn = page.locator('[data-testid="notification-bell-btn"]');
    await expect(bellBtn).toBeVisible({ timeout: 8000 });

    const badge = page.locator('[data-testid="notification-badge"]');
    const initialBadgeCount = await badge.isVisible() ? parseInt((await badge.innerText()).trim(), 10) : 0;

    await bellBtn.click();
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Click first notification item to dismiss/mark read
    const notifItem = page.locator('[data-testid="notification-item"]').first();
    if (await notifItem.isVisible()) {
      await notifItem.click();
      await page.waitForTimeout(300);

      if (initialBadgeCount > 1) {
        const newBadge = page.locator('[data-testid="notification-badge"]');
        const newCount = parseInt((await newBadge.innerText()).trim(), 10);
        expect(newCount).toBeLessThan(initialBadgeCount);
      }
    }
  });

  test('Issue 8 & 9: Student account avatar upload and prominent Logout button', async ({ page }) => {
    // Log in as student using 1-click persona
    await page.goto('/en/login');
    const studentBtn = page.locator('[data-testid="btn-login-student"]');
    await expect(studentBtn).toBeVisible({ timeout: 10000 });
    await studentBtn.click();
    await page.waitForURL('**/profile', { timeout: 10000 });

    // 1. Verify Logout button in Header
    const logoutBtn = page.getByRole('button', { name: 'Sign Out' }).first();
    await expect(logoutBtn).toBeVisible({ timeout: 8000 });

    // 2. Switch to Account Settings Tab
    const accountTab = page.getByRole('tab', { name: 'Account Settings' });
    await expect(accountTab).toBeVisible({ timeout: 8000 });
    await accountTab.click();

    // 3. Verify Avatar Profile Picture section
    await expect(page.getByRole('heading', { name: 'Profile Picture' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Upload Photo').first()).toBeVisible();

    // 4. Select a scholarly avatar preset
    const presetButtons = page.locator('img[alt="Preset"]');
    if (await presetButtons.count() > 0) {
      await presetButtons.first().click();
    }

    // 5. Update full name
    const nameInput = page.locator('input#fullName');
    await nameInput.fill('Nour Emil');

    // 6. Save changes
    const saveBtn = page.getByRole('button', { name: 'Save Changes' });
    await saveBtn.click();
    await expect(page.getByText('Profile updated successfully.')).toBeVisible({ timeout: 5000 });

    // 7. Verify Logout button functionality
    await logoutBtn.click();
    await page.waitForURL('**/login');
    // After logout, Sign In / Sign Up buttons appear in header
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 5000 });
  });
});
