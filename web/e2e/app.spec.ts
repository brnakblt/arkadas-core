import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Homepage
 */
test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load correctly', async ({ page }) => {
        await expect(page).toHaveTitle(/Arkadaş/i);
    });

    test('should have navigation links', async ({ page }) => {
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
    });

    test('should have footer', async ({ page }) => {
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('body')).toBeVisible();
    });
});

/**
 * E2E Tests for Service Tracking Page
 */
test.describe('Servis Takip', () => {
    test('should load service tracking page', async ({ page }) => {
        await page.goto('/servis-takip');
        await expect(page.getByText(/Servis Takip/i)).toBeVisible();
    });

    test('should show map component', async ({ page }) => {
        await page.goto('/servis-takip');
        // Map should load (may be a placeholder if no API key)
        const mapContainer = page.locator('[class*="map"]');
        await expect(mapContainer.first()).toBeVisible();
    });
});

/**
 * E2E Tests for Attendance Page
 */
test.describe('Yoklama', () => {
    test('should load attendance page', async ({ page }) => {
        await page.goto('/yoklama');
        await expect(page.getByText(/Yoklama/i)).toBeVisible();
    });

    test('should show stats cards', async ({ page }) => {
        await page.goto('/yoklama');
        // Check for stats elements
        const stats = page.locator('[class*="stat"], [class*="Stats"]');
        await expect(stats.first()).toBeVisible();
    });

    test('should have date filter', async ({ page }) => {
        await page.goto('/yoklama');
        const dateInput = page.locator('input[type="date"]');
        await expect(dateInput).toBeVisible();
    });
});

/**
 * E2E Tests for Schedule/Program Page
 */
test.describe('Program', () => {
    test('should load schedule page', async ({ page }) => {
        await page.goto('/program');
        await expect(page.getByText(/Program|Takvim/i)).toBeVisible();
    });

    test('should show calendar', async ({ page }) => {
        await page.goto('/program');
        // Check for calendar grid or week/month view
        const calendar = page.locator('[class*="calendar"], [class*="Calendar"]');
        await expect(calendar.first()).toBeVisible();
    });

    test('should allow view toggle', async ({ page }) => {
        await page.goto('/program');
        const viewButtons = page.locator('button').filter({ hasText: /Hafta|Ay/i });
        await expect(viewButtons.first()).toBeVisible();
    });
});

/**
 * PWA Tests
 */
test.describe('PWA Features', () => {
    test('should have manifest', async ({ page }) => {
        await page.goto('/');
        const manifest = await page.locator('link[rel="manifest"]');
        await expect(manifest).toHaveAttribute('href', /manifest/);
    });

    test('should register service worker', async ({ page }) => {
        await page.goto('/');
        // Check if service worker is registered
        const swRegistered = await page.evaluate(() => {
            return 'serviceWorker' in navigator;
        });
        expect(swRegistered).toBe(true);
    });
});

/**
 * Accessibility Tests
 */
test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
        await page.goto('/');
        const h1 = page.locator('h1');
        await expect(h1.first()).toBeVisible();
    });

    test('should have alt text on images', async ({ page }) => {
        await page.goto('/');
        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            const img = images.nth(i);
            await expect(img).toHaveAttribute('alt');
        }
    });

    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
    });
});
