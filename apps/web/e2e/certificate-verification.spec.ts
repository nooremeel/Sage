import { test, expect } from '@playwright/test';

test.describe('Public Certificate Verification & Scholarly Print Engine (Phase 11.7)', () => {
  test('renders valid certificate in English (LTR) with official seal and QR code', async ({ page }) => {
    await page.goto('/en/verify/SAGE-2026-ALPHA1');

    // 1. Verification Seal Status Banner
    await expect(page.getByRole('heading', { name: 'Verified by Sage Platform' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Verify Authenticity • Serial Number:')).toBeVisible();
    await expect(page.getByText('SAGE-2026-ALPHA1').first()).toBeVisible();

    // 2. Archival Certificate Elements
    await expect(page.getByRole('heading', { name: 'Certificate of Completion' })).toBeVisible();
    await expect(page.getByText('Official Credential of Academic Distinction')).toBeVisible();
    await expect(page.getByText('This is to certify that')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nour Student (طالب علم معتمد)' })).toBeVisible();
    await expect(page.getByText('has successfully completed the scholarly course')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Classical Arabic Calligraphy — The Thuluth Script' })).toBeVisible();

    // 3. Instructor Signature & QR Code Block
    await expect(page.getByText('Master Hassan Al-Baghdadi (أستاذ حسن البغدادي)').first()).toBeVisible();
    await expect(page.locator('svg[aria-label^="QR Code for"]')).toBeVisible();

    // 4. Action Bar
    await expect(page.getByRole('button', { name: /Print \/ Save PDF/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Course' })).toBeVisible();
  });

  test('renders valid certificate in Arabic (RTL) with localized calligraphy headings', async ({ page }) => {
    await page.goto('/ar/verify/SAGE-2026-ALPHA1');

    // Verify RTL Direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Verification Seal Banner
    await expect(page.getByRole('heading', { name: 'معتمدة وموثقة عبر منصة سايج' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('التحقق من صحة الشهادة • الرقم التسلسلي:')).toBeVisible();

    // Archival Certificate Arabic Typography
    await expect(page.getByRole('heading', { name: 'شهادة إتمام معتمدة' })).toBeVisible();
    await expect(page.getByText('وثيقة رسمية للإنجاز الأكاديمي والتميّز')).toBeVisible();
    await expect(page.getByText('تشهد منصة سايج بأن')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nour Student (طالب علم معتمد)' })).toBeVisible();
    await expect(page.getByText('قد أتم بنجاح متطلبات الدورة الأكاديمية')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'فنون الخط العربي الكلاسيكي — خط الثلث' })).toBeVisible();
  });

  test('renders academic not-found card for invalid or unknown certificate serial', async ({ page }) => {
    await page.goto('/en/verify/INVALID-SERIAL-XYZ999');

    // Verify Invalid Certificate Card
    await expect(page.getByRole('heading', { name: 'Invalid Certificate' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('The certificate serial number you provided could not be verified in our records.')).toBeVisible();
    await expect(page.getByText('INVALID-SERIAL-XYZ999')).toBeVisible();

    // Verify Back to Course catalog link
    await expect(page.getByRole('link', { name: 'Back to Course' })).toBeVisible();
  });
});
