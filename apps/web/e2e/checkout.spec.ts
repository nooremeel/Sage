import { test, expect } from '@playwright/test';

test.describe('Scholarly Checkout & Simulated Payment (Phase 11.6)', () => {
  test('renders checkout order details and price breakdown in English (LTR)', async ({ page }) => {
    await page.goto('/en/checkout/ord-arch-001');

    // Verify Page Header & Reference
    await expect(page.getByRole('heading', { name: 'Scholarly Checkout' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Order Checkout')).toBeVisible();
    await expect(page.getByText(/SAGE-ORD-2026/).first()).toBeVisible();

    // Verify Course Summary
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();
    await expect(page.getByText('Nour Emil (نور إميل)')).toBeVisible();
    await expect(page.getByText('4 Lessons')).toBeVisible();

    // Verify Pricing Breakdown
    await expect(page.getByText('Original Price')).toBeVisible();
    await expect(page.getByText('Total Due')).toBeVisible();
    await expect(page.getByText('$49.00').first()).toBeVisible();

    // Verify Sandbox Test Cards
    await expect(page.getByText('1-Click Sandbox Test Cards')).toBeVisible();
    await expect(page.getByText('Scholarly Gold Card')).toBeVisible();
    await expect(page.getByText('Declined / Insufficient Funds')).toBeVisible();
    await expect(page.getByRole('button', { name: /Simulate Payment/i })).toBeVisible();
  });

  test('applies promotional coupon SAGE100 for 100% discount and claims free enrollment', async ({ page }) => {
    await page.goto('/en/checkout/ord-arch-002');

    await expect(page.getByRole('heading', { name: 'Scholarly Checkout' })).toBeVisible();

    // Apply SAGE100 coupon
    const couponInput = page.locator('#coupon-input');
    await couponInput.fill('SAGE100');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify 100% discount row & free total
    await expect(page.getByText('Coupon SAGE100 applied (100% off)')).toBeVisible();
    await expect(page.getByText('100% Scholarship Discount')).toBeVisible();
    await expect(page.getByText('$0.00 USD')).toBeVisible();

    // Verify action button changes to free enrollment claim
    const freeClaimBtn = page.getByRole('button', { name: 'Claim Free Enrollment' });
    await expect(freeClaimBtn).toBeVisible();
    await freeClaimBtn.click();

    // Verify completed receipt
    await expect(page.getByRole('heading', { name: 'Payment Confirmed!' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Official Order Receipt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Learning' })).toBeVisible();
  });

  test('applies promotional coupon SCHOLAR50 for 50% discount and simulates payment', async ({ page }) => {
    await page.goto('/en/checkout/ord-arch-003');

    // Click quick demo coupon for SCHOLAR50
    await page.getByRole('button', { name: 'SCHOLAR50 (50% Off)' }).click();

    // Verify 50% discount row
    await expect(page.getByText('Coupon SCHOLAR50 applied (50% off)')).toBeVisible();
    await expect(page.getByText('-$24.50')).toBeVisible();
    await expect(page.getByText('$24.50').first()).toBeVisible();

    // Simulate payment
    const payBtn = page.getByRole('button', { name: /Simulate Payment \(\$24\.50\)/i });
    await expect(payBtn).toBeVisible();
    await payBtn.click();

    // Verify receipt view
    await expect(page.getByRole('heading', { name: 'Payment Confirmed!' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Official Order Receipt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Learning' })).toBeVisible();
  });

  test('simulates card decline error with insufficient balance test card', async ({ page }) => {
    await page.goto('/en/checkout/ord-arch-004');

    // Select the declined test card option
    await page.getByText('Declined / Insufficient Funds').click();

    // Click Simulate Failure
    const failBtn = page.getByRole('button', { name: 'Simulate Failure' });
    await expect(failBtn).toBeVisible();
    await failBtn.click();

    // Verify error banner is visible
    await expect(page.getByRole('heading', { name: 'Payment Simulation Failed' })).toBeVisible({ timeout: 5000 });
  });

  test('renders checkout and receipt in Arabic (RTL)', async ({ page }) => {
    await page.goto('/ar/checkout/ord-arch-005');

    // Verify Arabic Headings & Direction
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'مراجعة ودفع رسوم الدورة' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('إتمام الطلب')).toBeVisible();
    await expect(page.getByText('ملخص الطلب')).toBeVisible();
    await expect(page.getByText('السعر الأصلي')).toBeVisible();
    await expect(page.getByText('الإجمالي المستحق')).toBeVisible();

    // Click SAGE100 quick button in Arabic
    await page.getByRole('button', { name: 'SAGE100 (100% Free)' }).click();
    await expect(page.getByText('منحة دراسية كاملة 100%')).toBeVisible();
    await expect(page.getByRole('button', { name: 'تأكيد الالتحاق المجاني بالكامل' })).toBeVisible();
  });
});
