import { test, expect } from '@playwright/test';

test('app loads and shows welcome message', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('text=Researchers')).toBeVisible();
  await expect(page.locator('text=Local-first research workspace')).toBeVisible();
});

test('can add a demo paper', async ({ page }) => {
  await page.goto('/');

  // Click the "Add demo" button
  await page.click('button:has-text("Add demo")');

  // Wait for the search to update
  await page.waitForTimeout(1000);

  // Should see the demo paper in the grid
  await expect(page.locator('[data-id]')).toHaveCount(1);
  await expect(page.locator('text=Example Paper')).toBeVisible();
});

test('can search papers', async ({ page }) => {
  await page.goto('/');

  // Add a demo paper first
  await page.click('button:has-text("Add demo")');
  await page.waitForTimeout(1000);

  // Search for the paper
  await page.fill('input[placeholder="Search"]', 'Example');
  await page.click('button:has-text("Search")');

  await expect(page.locator('text=Example Paper')).toBeVisible();
});
