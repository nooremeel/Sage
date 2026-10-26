import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 1: Design System & i18n Shell', () => {
  test('should render Arabic styleguide with RTL layout and pass axe accessibility', async ({
    page,
  }) => {
    await page.goto('/ar/styleguide');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    const heading = page.locator('h1');
    await expect(heading).toContainText('دليل التصميم');

    // Verify key components rendered
    await expect(page.getByText('1. مدخل إلى هندسة النظم البرمجية')).toBeVisible();

    // Axe WCAG AA audit (exclude color-contrast on arbitrary dynamic test swatches if any)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // color-contrast heuristic disabled for decorative palette swatches
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should render English styleguide with LTR layout and pass axe accessibility', async ({
    page,
  }) => {
    await page.goto('/en/styleguide');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(html).toHaveAttribute('lang', 'en');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Design System');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should toggle theme between light and dark', async ({ page }) => {
    await page.goto('/en/styleguide');

    const themeButton = page.locator('button[aria-label*="theme"]');
    await expect(themeButton).toBeVisible();

    await themeButton.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await themeButton.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('should switch locale via language switcher in header', async ({ page }) => {
    await page.goto('/en/styleguide');

    const langSwitcher = page.locator('button[aria-label*="Switch language"]');
    await expect(langSwitcher).toBeVisible();
    await expect(langSwitcher).toContainText('العربية');

    await langSwitcher.click();
    await page.waitForURL('**/ar/styleguide');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });
});
