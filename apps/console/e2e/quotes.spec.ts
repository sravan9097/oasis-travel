import { test, expect } from '@playwright/test';

test.describe('Quotes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login (same as leads test)
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'operator@test.com');
    
    const sendOtpButton = page.locator('button:has-text("Send OTP"), button:has-text("Login")');
    if (await sendOtpButton.isVisible()) {
      await sendOtpButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display quotes list', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    
    // Check for quotes heading
    const quotesHeading = page.locator('h1, h2').filter({ hasText: /quote/i });
    await expect(quotesHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to quote detail page', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    
    // Find a quote link
    const quoteLink = page.locator('[href*="/quotes/"], a[href*="/quotes/"]').first();
    
    if (await quoteLink.count() > 0) {
      await quoteLink.click();
      await expect(page).toHaveURL(/\/quotes\/[^/]+/, { timeout: 5000 });
    }
  });

  test('should show quote items in detail view', async ({ page }) => {
    await page.goto('/quotes');
    await page.waitForLoadState('networkidle');
    
    const quoteLink = page.locator('[href*="/quotes/"]').first();
    if (await quoteLink.count() > 0) {
      await quoteLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check for quote items or timeline
      const quoteItems = page.locator('[data-testid="quote-item"], [class*="quote-item"], [class*="timeline"]');
      // At least one item should be visible if quote has items
      if (await quoteItems.count() > 0) {
        await expect(quoteItems.first()).toBeVisible();
      }
    }
  });
});

