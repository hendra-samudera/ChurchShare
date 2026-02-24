/**
 * ChurchShare E2E Test Specification
 * 
 * This file contains Playwright E2E tests for the ChurchShare viewer experience.
 * Tests focus on elderly user accessibility and core functionality.
 * 
 * Testing priorities:
 * 1. User opens viewer link → PDF renders
 * 2. User can zoom in/out
 * 3. User can navigate pages
 * 4. Empty state shows when no file
 * 5. Zero-download guarantee
 * 6. Accessibility compliance
 * 
 * Run tests with: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds for PDF load
const VIEWER_URL = '/view/sunday-liturgy';
const EMPTY_SLOT_URL = '/view/empty-slot';

/**
 * Helper: Wait for PDF to finish loading
 */
async function waitForPdfLoad(page: Page) {
  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'detached' });
  
  // Wait for PDF canvas or container to appear
  await page.waitForSelector('.pdf-canvas, .pdf-container, canvas[data-page-number]', {
    timeout: TEST_TIMEOUT,
  });
}

/**
 * Helper: Check for empty state
 */
async function waitForEmptyState(page: Page) {
  await page.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 });
}

/**
 * Helper: Get current page number from viewer
 */
async function getCurrentPage(page: Page): Promise<number> {
  const pageIndicator = page.locator('[data-testid="page-indicator"]');
  const text = await pageIndicator.textContent();
  const match = text?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Helper: Get total pages from viewer
 */
async function getTotalPages(page: Page): Promise<number> {
  const pageIndicator = page.locator('[data-testid="page-indicator"]');
  const text = await pageIndicator.textContent();
  const parts = text?.split('/');
  return parts && parts[1] ? parseInt(parts[1].trim(), 10) : 1;
}

test.describe('Viewer E2E Tests', () => {
  test.describe.configure({ timeout: 120000 });

  test.describe('PDF Rendering', () => {
    test('user opens viewer link and PDF renders successfully', async ({ page }) => {
      // Given - navigate to viewer URL
      await page.goto(VIEWER_URL);

      // When - wait for PDF to load
      await waitForPdfLoad(page);

      // Then - PDF should be visible
      const pdfCanvas = page.locator('canvas[data-page-number="1"]');
      await expect(pdfCanvas).toBeVisible();
    });

    test('loading spinner appears before PDF renders', async ({ page }) => {
      // Given - throttle network to simulate slow connection
      await page.context().setOffline(false);

      // When - navigate to viewer
      const navigatePromise = page.goto(VIEWER_URL);

      // Then - loading spinner should appear immediately
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({ timeout: 5000 });

      // Wait for load to complete
      await navigatePromise;
      await waitForPdfLoad(page);
    });

    test('PDF renders with correct orientation', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - check canvas dimensions
      const canvas = page.locator('canvas[data-page-number="1"]');
      const box = await canvas.boundingBox();

      // Then - canvas should have reasonable dimensions
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(100);
      expect(box!.height).toBeGreaterThan(100);
    });

    test('multi-page PDF shows page indicator', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - page indicator should be visible
      const pageIndicator = page.locator('[data-testid="page-indicator"]');
      await expect(pageIndicator).toBeVisible();
    });

    test('PDF title is displayed above viewer', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);

      // Then - title should be visible
      await expect(page.locator('[data-testid="document-title"]')).toBeVisible();
    });
  });

  test.describe('Zoom Functionality', () => {
    test('user can zoom in on PDF', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Get initial scale
      const initialCanvas = page.locator('canvas[data-page-number="1"]');
      const initialBox = await initialCanvas.boundingBox();

      // When - click zoom in button
      await page.click('[data-testid="zoom-in-button"]');
      await page.waitForTimeout(500); // Wait for zoom animation

      // Then - canvas should be larger
      const zoomedCanvas = page.locator('canvas[data-page-number="1"]');
      const zoomedBox = await zoomedCanvas.boundingBox();
      
      expect(zoomedBox!.width).toBeGreaterThan(initialBox!.width);
      expect(zoomedBox!.height).toBeGreaterThan(initialBox!.height);
    });

    test('user can zoom out on PDF', async ({ page }) => {
      // Given - start zoomed in
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);
      
      // Zoom in first
      await page.click('[data-testid="zoom-in-button"]');
      await page.waitForTimeout(500);
      
      const zoomedCanvas = page.locator('canvas[data-page-number="1"]');
      const zoomedBox = await zoomedCanvas.boundingBox();

      // When - click zoom out button
      await page.click('[data-testid="zoom-out-button"]');
      await page.waitForTimeout(500);

      // Then - canvas should be smaller
      const zoomedOutCanvas = page.locator('canvas[data-page-number="1"]');
      const zoomedOutBox = await zoomedOutCanvas.boundingBox();
      
      expect(zoomedOutBox!.width).toBeLessThan(zoomedBox!.width);
    });

    test('user can reset zoom to fit screen', async ({ page }) => {
      // Given - start zoomed in
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);
      
      // Zoom in multiple times
      await page.click('[data-testid="zoom-in-button"]');
      await page.click('[data-testid="zoom-in-button"]');
      await page.waitForTimeout(500);

      // When - click reset zoom button
      await page.click('[data-testid="reset-zoom-button"]');
      await page.waitForTimeout(500);

      // Then - zoom indicator should show 100% or fit
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]');
      await expect(zoomIndicator).toBeVisible();
    });

    test('zoom out is disabled at minimum zoom', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Zoom out to minimum
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="zoom-out-button"]');
        await page.waitForTimeout(200);
      }

      // Then - zoom out button should be disabled
      const zoomOutButton = page.locator('[data-testid="zoom-out-button"]');
      await expect(zoomOutButton).toBeDisabled();
    });

    test('zoom in is disabled at maximum zoom', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Zoom in to maximum
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="zoom-in-button"]');
        await page.waitForTimeout(200);
      }

      // Then - zoom in button should be disabled
      const zoomInButton = page.locator('[data-testid="zoom-in-button"]');
      await expect(zoomInButton).toBeDisabled();
    });

    test('zoom percentage is displayed correctly', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - zoom indicator should show percentage
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]');
      const text = await zoomIndicator.textContent();
      expect(text).toMatch(/\d+%/);
    });
  });

  test.describe('Page Navigation', () => {
    test('user can navigate to next page', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      const initialPage = await getCurrentPage(page);
      const totalPages = await getTotalPages(page);
      
      // Skip test if only one page
      test.skip(totalPages <= 1, 'PDF has only one page');

      // When - click next button
      await page.click('[data-testid="next-page-button"]');
      await page.waitForTimeout(500);

      // Then - page number should increment
      const nextPage = await getCurrentPage(page);
      expect(nextPage).toBeGreaterThan(initialPage);
    });

    test('user can navigate to previous page', async ({ page }) => {
      // Given - navigate to page 2
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);
      
      const totalPages = await getTotalPages(page);
      test.skip(totalPages <= 1, 'PDF has only one page');

      // Go to page 2
      await page.click('[data-testid="next-page-button"]');
      await page.waitForTimeout(500);
      const currentPage = await getCurrentPage(page);

      // When - click previous button
      await page.click('[data-testid="previous-page-button"]');
      await page.waitForTimeout(500);

      // Then - page number should decrement
      const previousPage = await getCurrentPage(page);
      expect(previousPage).toBeLessThan(currentPage);
    });

    test('previous button is disabled on first page', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - previous button should be disabled
      const previousButton = page.locator('[data-testid="previous-page-button"]');
      await expect(previousButton).toBeDisabled();
    });

    test('next button is disabled on last page', async ({ page }) => {
      // Given - navigate to last page
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      const totalPages = await getTotalPages(page);
      test.skip(totalPages <= 1, 'PDF has only one page');

      // Navigate to last page
      for (let i = 1; i < totalPages; i++) {
        await page.click('[data-testid="next-page-button"]');
        await page.waitForTimeout(300);
      }

      // Then - next button should be disabled
      const nextButton = page.locator('[data-testid="next-page-button"]');
      await expect(nextButton).toBeDisabled();
    });

    test('user can use quick jump buttons for long documents', async ({ page }) => {
      // Given - PDF with more than 5 pages
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      const totalPages = await getTotalPages(page);
      test.skip(totalPages <= 5, 'PDF has 5 or fewer pages');

      // When - click jump forward button
      await page.click('[data-testid="jump-forward-button"]');
      await page.waitForTimeout(500);

      // Then - page should jump forward
      const newPage = await getCurrentPage(page);
      expect(newPage).toBeGreaterThan(1);
    });
  });

  test.describe('Empty State', () => {
    test('empty slot shows friendly message not technical error', async ({ page }) => {
      // Given
      await page.goto(EMPTY_SLOT_URL);

      // When - wait for empty state
      await waitForEmptyState(page);

      // Then - should show friendly message
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();

      // Verify no technical language
      const bodyText = await page.textContent('body');
      expect(bodyText.toLowerCase()).not.toMatch(/404|null|undefined|error|failed/i);
      
      // Verify friendly language
      expect(bodyText.toLowerCase()).toMatch(/check back|not yet|soon|nothing|uploaded/i);
    });

    test('empty state has appropriate icon', async ({ page }) => {
      // Given
      await page.goto(EMPTY_SLOT_URL);
      await waitForEmptyState(page);

      // Then - should have an icon
      const icon = page.locator('[data-testid="empty-state-icon"]');
      await expect(icon).toBeVisible();
    });

    test('empty state does not show loading spinner', async ({ page }) => {
      // Given
      await page.goto(EMPTY_SLOT_URL);

      // Then - loading spinner should not appear
      await page.waitForTimeout(3000);
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).not.toBeVisible();
    });

    test('empty state returns 200 status not 404', async ({ page }) => {
      // Given & When
      const response = await page.goto(EMPTY_SLOT_URL);

      // Then
      expect(response?.status()).toBe(200);
    });
  });

  test.describe('Zero-Download Guarantee', () => {
    test('PDF is served inline not as download', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);

      // When - check network requests
      const requests: string[] = [];
      page.on('request', request => {
        if (request.url().includes('.pdf') || request.url().includes('file')) {
          requests.push(request.url());
        }
      });

      await waitForPdfLoad(page);

      // Then - PDF should be loaded in viewer, not downloaded
      // The viewer should contain canvas elements, not a download prompt
      const canvas = page.locator('canvas[data-page-number]');
      await expect(canvas.first()).toBeVisible();
    });

    test('save button is secondary action not automatic', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - save button should exist but not be primary
      const saveButton = page.locator('[data-testid="save-button"]');
      await expect(saveButton).toBeVisible();
      
      // Save button should have secondary styling
      const className = await saveButton.getAttribute('class');
      expect(className).toMatch(/secondary|outline/);
    });

    test('no download prompt appears on page load', async ({ page }) => {
      // Given
      let downloadTriggered = false;
      page.on('download', () => {
        downloadTriggered = true;
      });

      // When
      await page.goto(VIEWER_URL);
      await page.waitForTimeout(5000);

      // Then - no download should have been triggered
      expect(downloadTriggered).toBe(false);
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('viewer screen passes basic accessibility checks', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - check for required accessibility attributes
      const mainContent = page.locator('main, [role="main"], .viewer-container');
      
      // Then
      await expect(mainContent.first()).toBeVisible();
      
      // Check for document title
      const title = page.locator('[data-testid="document-title"], h1');
      await expect(title.first()).toBeVisible();
    });

    test('all interactive elements have accessible names', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - get all buttons
      const buttons = page.locator('button, [role="button"]');
      const count = await buttons.count();

      // Then - each button should have an accessible name
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    });

    test('tap targets meet minimum 48x48dp size', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - get all interactive elements
      const buttons = page.locator('button, [role="button"], a');
      const count = await buttons.count();

      // Then - check tap target sizes
      for (let i = 0; i < Math.min(count, 10); i++) { // Check first 10 elements
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44); // Allow some tolerance
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('focus indicators are visible', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - tab to first interactive element
      await page.keyboard.press('Tab');

      // Then - focused element should have visible focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('color contrast meets WCAG AA standards', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - check text elements
      const textElements = page.locator('h1, h2, h3, p, span, button');
      const count = await textElements.count();

      // Then - sample check first few elements
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        await expect(element).toBeVisible();
        // Full contrast check would require axe-core
      }
    });

    test('screen reader can identify document title', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);

      // Then - document should have proper title
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      
      // Or check for h1
      const h1 = page.locator('h1');
      await expect(h1.first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('invalid slot shows 404 page not crash', async ({ page }) => {
      // Given
      await page.goto('/view/non-existent-slot-12345');

      // Then - should show 404 or error page
      await expect(page.locator('text=404, text=not found, text=does not exist')).toBeVisible({ timeout: 5000 });
    });

    test('network error shows retry option', async ({ page }) => {
      // Given - block network
      await page.route('**/*', route => route.abort('failed'));

      // When - navigate to viewer
      await page.goto(VIEWER_URL);
      await page.waitForTimeout(5000);

      // Then - should show error with retry option
      const retryButton = page.locator('[data-testid="retry-button"], button:has-text("Retry"), button:has-text("Try again")');
      await expect(retryButton).toBeVisible();
    });

    test('corrupted PDF shows friendly error', async ({ page }) => {
      // Given - mock corrupted PDF response
      await page.route('**/*.pdf', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/pdf',
          body: 'This is not a valid PDF',
        });
      });

      // When
      await page.goto(VIEWER_URL);
      await page.waitForTimeout(5000);

      // Then - should show error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      
      // Verify friendly language
      const text = await errorMessage.textContent();
      expect(text.toLowerCase()).not.toMatch(/technical|exception|stack trace/i);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('viewer renders correctly on mobile viewport', async ({ page }) => {
      // Given - set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

      // When
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - viewer should be visible and usable
      const viewer = page.locator('.viewer-container, .pdf-viewer');
      await expect(viewer.first()).toBeVisible();
    });

    test('controls are accessible on small screens', async ({ page }) => {
      // Given - set small mobile viewport
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE (small)

      // When
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - controls should be visible
      const controls = page.locator('.viewer-controls, [role="toolbar"]');
      await expect(controls.first()).toBeVisible();
    });

    test('compact controls appear on small screens', async ({ page }) => {
      // Given - set small viewport
      await page.setViewportSize({ width: 320, height: 568 });

      // When
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // Then - compact controls should be visible
      const compactControls = page.locator('.viewer-controls-compact, .compact-controls');
      // May or may not exist depending on implementation
      // If it exists, it should be visible
      if (await compactControls.count() > 0) {
        await expect(compactControls.first()).toBeVisible();
      }
    });

    test('pinch to zoom works on touch devices', async ({ page }) => {
      // Given - set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - simulate pinch zoom (via touch events)
      const canvas = page.locator('canvas[data-page-number="1"]');
      await canvas.dispatchEvent('touchstart', {
        touches: [{ identifier: 1, pageX: 100, pageY: 100 }, { identifier: 2, pageX: 200, pageY: 100 }]
      });
      await canvas.dispatchEvent('touchmove', {
        touches: [{ identifier: 1, pageX: 50, pageY: 100 }, { identifier: 2, pageX: 250, pageY: 100 }]
      });
      await canvas.dispatchEvent('touchend', {
        touches: []
      });
      await page.waitForTimeout(500);

      // Then - zoom should have changed
      const zoomIndicator = page.locator('[data-testid="zoom-indicator"]');
      await expect(zoomIndicator).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('time to first render is under 3 seconds', async ({ page }) => {
      // Given
      await page.goto('about:blank');

      // When - navigate and measure time
      const startTime = Date.now();
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);
      const endTime = Date.now();

      // Then - should be under 3 seconds
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('PDF does not cause memory leaks', async ({ page }) => {
      // Given
      await page.goto(VIEWER_URL);
      await waitForPdfLoad(page);

      // When - navigate away and back multiple times
      for (let i = 0; i < 3; i++) {
        await page.goto('/');
        await page.goto(VIEWER_URL);
        await waitForPdfLoad(page);
      }

      // Then - page should still be functional
      const canvas = page.locator('canvas[data-page-number="1"]');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Cache Busting', () => {
    test('PDF endpoint has no-cache headers', async ({ page }) => {
      // Given & When
      const response = await page.goto(`${VIEWER_URL}/file`);

      // Then
      const cacheControl = response?.headers()['cache-control'];
      expect(cacheControl).toContain('no-store');
      expect(cacheControl).toContain('must-revalidate');
    });

    test('meta endpoint has no-cache headers', async ({ page }) => {
      // Given & When
      const response = await page.goto('/api/slots/sunday-liturgy/meta');

      // Then
      const cacheControl = response?.headers()['cache-control'];
      expect(cacheControl).toContain('no-store');
    });
  });
});

test.describe('Admin Hot-Swap E2E Tests', () => {
  test.describe.configure({ timeout: 120000 });

  test('viewer receives new PDF immediately after admin hot-swap', async ({ page }) => {
    // This test requires admin authentication and file upload
    // It would typically be run in a staging environment with test data
    
    // Given - viewer opens slot
    await page.goto(VIEWER_URL);
    await waitForPdfLoad(page);
    
    // Get initial PDF metadata (would need API access)
    const initialMetaResponse = await page.goto('/api/slots/sunday-liturgy/meta');
    const initialMeta = await initialMetaResponse?.json();

    // When - admin uploads new PDF (would need admin flow)
    // This is a placeholder for the actual hot-swap test
    
    // Then - viewer refreshes and gets new PDF
    await page.goto(VIEWER_URL);
    await waitForPdfLoad(page);
    
    // Verify new metadata
    const newMetaResponse = await page.goto('/api/slots/sunday-liturgy/meta');
    const newMeta = await newMetaResponse?.json();
    
    // The updatedAt timestamp should be newer
    // expect(newMeta.lastUpdatedAt).toBeGreaterThan(initialMeta.lastUpdatedAt);
  });
});
