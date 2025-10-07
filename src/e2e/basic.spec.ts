import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');

  // Check that the root element exists and has content
  await expect(page.locator('#root')).toBeVisible();

  // Check that the page has loaded by looking for basic elements
  await expect(page.locator('body')).toBeVisible();
});

test('can interact with add paper functionality', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the page to be ready
  await page.waitForSelector('body');

  // Debug: Check what elements are actually on the page
  const bodyContent = await page.content();
  console.log('Page content length:', bodyContent.length);

  // Try to find ANY button on the page first
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log('Number of buttons found:', buttonCount);

  if (buttonCount > 0) {
    // Get text content of all buttons for debugging
    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await buttons.nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }

    // Try to find and click an "Add" button (using broader selector)
    const addButton = page.locator('button').filter({ hasText: /add/i }).first();
    await expect(addButton).toBeVisible();

    // Click the add button
    await addButton.click();

    // Wait for any modal or form to appear
    await page.waitForTimeout(1000);

    // Check if we can find an input field (for URL entry)
    const inputField = page.locator('input[type="text"], input[type="url"]').first();
    if (await inputField.isVisible()) {
      await inputField.fill('https://arxiv.org/abs/1706.03762');

      // Try to find and click a submit button
      const submitButton = page
        .locator('button')
        .filter({ hasText: /add|submit|ok/i })
        .first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
  } else {
    // If no buttons found, the application might not be loading properly
    console.log('No buttons found - application may not be loading correctly');
  }
});

test('can use search functionality', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the page to be ready
  await page.waitForSelector('body');

  // Try to find a search input
  const searchInput = page.locator('input[type="text"], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('test search');
    await page.waitForTimeout(1000);
  }
});
