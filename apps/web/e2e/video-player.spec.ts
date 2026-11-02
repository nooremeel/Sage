import { test, expect } from '@playwright/test';

test.describe('Video Player & Lesson Streaming (Phase 11.1)', () => {
  test('renders player in LTR mode on English lesson view', async ({ page }) => {
    await page.goto('/en/courses/thuluth-calligraphy/lessons/les-thuluth-01-vid');

    // Breadcrumbs and title
    await expect(page.locator('h1')).toBeVisible();

    // Player container must be strictly dir="ltr"
    const playerContainer = page.locator('div[dir="ltr"]').filter({ has: page.locator('video') });
    await expect(playerContainer).toBeVisible();

    // Verify video element is present
    const video = playerContainer.locator('video');
    await expect(video).toBeVisible();

    // Scrubber timeline input
    const scrubber = playerContainer.locator('input[aria-label="Video timeline scrubber"]');
    await expect(scrubber).toBeVisible();

    // Volume input
    const volumeSlider = playerContainer.locator('input[aria-label="Volume level"]');
    await expect(volumeSlider).toBeVisible();

    // Open settings menu
    const settingsBtn = playerContainer.locator('button[aria-label="Playback settings"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();

    // Speed options visible
    await expect(playerContainer.getByText('Playback Speed')).toBeVisible();
    await expect(playerContainer.getByRole('button', { name: '1x' })).toBeVisible();
  });

  test('renders player with LTR controls and RTL page layout on Arabic lesson view', async ({ page }) => {
    await page.goto('/ar/courses/thuluth-calligraphy-ar/lessons/les-thuluth-01-vid');

    // HTML document must be rtl
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Title in Arabic with proper typography
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Player controls remain strictly LTR
    const playerContainer = page.locator('div[dir="ltr"]').filter({ has: page.locator('video') });
    await expect(playerContainer).toBeVisible();
    await expect(playerContainer).toHaveAttribute('dir', 'ltr');

    // Prev / Next navigation bar
    const nextBtn = page.getByRole('link').filter({ hasText: 'تشريح' });
    if (await nextBtn.count() > 0) {
      await expect(nextBtn.first()).toBeVisible();
    }
  });

  test('displays protected lesson notice on paid lesson for unenrolled visitor', async ({ page }) => {
    // Second lesson in modern-web-architecture is paid/protected
    await page.goto('/en/courses/modern-web-architecture/lessons/les-arch-03-vid');

    // Should display protected lesson notice with enroll button
    const enrollBtn = page.getByRole('link', { name: /Enroll Now/i });
    await expect(enrollBtn).toBeVisible();
  });
});

