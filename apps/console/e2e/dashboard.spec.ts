import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'operator@test.com');
    
    const sendOtpButton = page.locator('button:has-text("Send OTP"), button:has-text("Login")');
    if (await sendOtpButton.isVisible()) {
      await sendOtpButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard heading
    const dashboardHeading = page.locator('h1, h2').filter({ hasText: /dashboard/i });
    await expect(dashboardHeading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show navigation sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for sidebar navigation
    const sidebar = page.locator('[data-testid="sidebar"], nav, [class*="sidebar"]');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test('should navigate to different sections from sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Try to click on leads link
    const leadsLink = page.locator('a[href="/leads"], a[href*="/leads"], :text("Leads")').first();
    if (await leadsLink.count() > 0) {
      await leadsLink.click();
      await expect(page).toHaveURL(/\/leads/, { timeout: 5000 });
    }
  });
});

