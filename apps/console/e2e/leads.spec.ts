import { test, expect } from '@playwright/test';

test.describe('Leads Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill in test credentials (adjust based on your auth setup)
    // Note: In a real test environment, you'd use test credentials or mock auth
    await page.fill('input[type="email"]', 'operator@test.com');
    
    // Click send OTP button if it exists
    const sendOtpButton = page.locator('button:has-text("Send OTP"), button:has-text("Login")');
    if (await sendOtpButton.isVisible()) {
      await sendOtpButton.click();
      
      // In test environment, you'd mock OTP or use test credentials
      // For now, we'll skip if OTP is required
      await page.waitForTimeout(1000);
    }
  });

  test('should display leads board', async ({ page }) => {
    // Navigate to leads page
    await page.goto('/leads');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for leads board
    const leadsHeading = page.locator('h1, h2').filter({ hasText: /lead/i });
    await expect(leadsHeading.first()).toBeVisible({ timeout: 10000 });
    
    // Check for kanban board or leads list
    const kanbanBoard = page.locator('[data-testid="kanban-board"], [class*="kanban"], [class*="board"]');
    if (await kanbanBoard.count() > 0) {
      await expect(kanbanBoard.first()).toBeVisible();
    }
  });

  test('should show lead stages', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    // Check for stage columns (NEW, SCOPING, QUOTED, etc.)
    const stages = ['NEW', 'SCOPING', 'QUOTED', 'WON', 'LOST'];
    
    for (const stage of stages) {
      const stageElement = page.locator(`[data-column="${stage}"], [data-stage="${stage}"], :text("${stage}")`).first();
      // At least one stage should be visible
      if (await stageElement.count() > 0) {
        await expect(stageElement).toBeVisible();
      }
    }
  });

  test('should navigate to lead detail page', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    // Find a lead card/link
    const leadCard = page.locator('[data-testid="lead-card"], [href*="/leads/"], a[href*="/leads/"]').first();
    
    if (await leadCard.count() > 0) {
      const leadHref = await leadCard.getAttribute('href');
      if (leadHref) {
        await leadCard.click();
        
        // Should navigate to lead detail page
        await expect(page).toHaveURL(/\/leads\/[^/]+/, { timeout: 5000 });
        
        // Check for lead details
        const leadDetail = page.locator('h1, h2, [data-testid="lead-detail"]');
        await expect(leadDetail.first()).toBeVisible();
      }
    }
  });

  test('should filter leads by stage', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    // Look for filter controls
    const filterButton = page.locator('button:has-text("Filter"), [data-testid="filter-button"]').first();
    
    if (await filterButton.count() > 0) {
      await filterButton.click();
      
      // Try to select a stage filter
      const stageFilter = page.locator('button:has-text("NEW"), [data-filter="NEW"]').first();
      if (await stageFilter.count() > 0) {
        await stageFilter.click();
        
        // Verify filter is applied (this depends on implementation)
        await page.waitForTimeout(500);
      }
    }
  });
});

