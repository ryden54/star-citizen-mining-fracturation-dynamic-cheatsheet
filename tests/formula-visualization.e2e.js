import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Formula Visualization Page', () => {
    let pageUrl;

    test.beforeEach(async () => {
        // Construct absolute file path to the visualization page
        const htmlPath = join(__dirname, '..', 'public', 'formula-visualization.html');
        pageUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    });

    test('should load the visualization page correctly', async ({ page }) => {
        await page.goto(pageUrl);

        // Check page title
        await expect(page).toHaveTitle(/Fracture Formula Visualization/);

        // Check header is visible
        const header = page.locator('h1');
        await expect(header).toBeVisible();
        await expect(header).toContainText('Fracture Formula Visualization');

        // Check subtitle
        const subtitle = page.locator('.subtitle');
        await expect(subtitle).toBeVisible();
        await expect(subtitle).toContainText('Star Citizen Mining - Prospector (Arbor MH1)');
    });

    test('should display statistics cards', async ({ page }) => {
        await page.goto(pageUrl);

        // Wait for stats to be populated
        await page.waitForSelector('.stat-card', { timeout: 5000 });

        // Check all 4 stat cards are present
        const statCards = page.locator('.stat-card');
        await expect(statCards).toHaveCount(4);

        // Check stat labels
        await expect(page.locator('.stat-label').nth(0)).toContainText('Total Measurements');
        await expect(page.locator('.stat-label').nth(1)).toContainText('Fracturable');
        await expect(page.locator('.stat-label').nth(2)).toContainText('Impossible');
        await expect(page.locator('.stat-label').nth(3)).toContainText('Formula Accuracy');

        // Check stat values are populated
        await expect(page.locator('.stat-value').nth(0)).toContainText('59');
        await expect(page.locator('.stat-value').nth(3)).toContainText('100%');
    });

    test('should display the chart canvas', async ({ page }) => {
        await page.goto(pageUrl);

        // Check canvas exists
        const canvas = page.locator('#fractureChart');
        await expect(canvas).toBeVisible();

        // Verify canvas has dimensions (Chart.js rendered)
        const boundingBox = await canvas.boundingBox();
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
    });

    test('should display the formula info banner', async ({ page }) => {
        await page.goto(pageUrl);

        const formulaInfo = page.locator('.formula-info');
        await expect(formulaInfo).toBeVisible();
        await expect(formulaInfo).toContainText('max_mass = 9500 × (1 - resistance)');
        await expect(formulaInfo).toContainText('Use mouse wheel to zoom');
    });

    test('should display custom legend', async ({ page }) => {
        await page.goto(pageUrl);

        const legend = page.locator('#legend');
        await expect(legend).toBeVisible();

        // Check legend items
        const legendItems = page.locator('.legend-item');
        await expect(legendItems).toHaveCount(5);

        // Verify legend labels
        await expect(legend).toContainText('Easy Zone');
        await expect(legend).toContainText('Medium Zone');
        await expect(legend).toContainText('Hard Zone');
        await expect(legend).toContainText('Challenging Zone');
        await expect(legend).toContainText('Formula Line');
    });

    test('should support zoom functionality on chart', async ({ page }) => {
        await page.goto(pageUrl);

        // Wait for chart to be fully rendered
        await page.waitForTimeout(500);

        const canvas = page.locator('#fractureChart');
        await expect(canvas).toBeVisible();

        // Get canvas bounding box
        const box = await canvas.boundingBox();

        // Simulate mouse wheel zoom in (scroll down on canvas)
        await canvas.hover();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100); // Zoom in

        // Wait for zoom animation
        await page.waitForTimeout(300);

        // Simulate zoom out
        await page.mouse.wheel(0, 100); // Zoom out

        // Wait for zoom animation
        await page.waitForTimeout(300);

        // Chart should still be visible after zoom operations
        await expect(canvas).toBeVisible();
    });

    test('should display footer with metadata', async ({ page }) => {
        await page.goto(pageUrl);

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
        await expect(footer).toContainText('Generated with Claude Code');
        await expect(footer).toContainText('59 in-game measurements');
        await expect(footer).toContainText('Accuracy: 100%');
    });

    test('should have working Chart.js instance', async ({ page }) => {
        await page.goto(pageUrl);

        // Wait for chart initialization
        await page.waitForTimeout(500);

        // Check that Chart.js is loaded and chart instance exists
        const hasChart = await page.evaluate(() => {
            const canvas = document.getElementById('fractureChart');
            return canvas && window.Chart && window.Chart.getChart(canvas) !== undefined;
        });

        expect(hasChart).toBeTruthy();
    });

    test('should load reference data correctly', async ({ page }) => {
        await page.goto(pageUrl);

        // Check that reference data is available globally
        const dataLoaded = await page.evaluate(() => {
            return window.REFERENCE_DATA_PROSPECTOR !== undefined &&
                   window.REFERENCE_DATA_PROSPECTOR.test_cases !== undefined &&
                   window.REFERENCE_DATA_PROSPECTOR.test_cases.length === 59;
        });

        expect(dataLoaded).toBeTruthy();
    });

    test('should have zoom plugin loaded', async ({ page }) => {
        await page.goto(pageUrl);

        // Verify zoom plugin is available
        const hasZoomPlugin = await page.evaluate(() => {
            return window.Chart !== undefined &&
                   window.Chart.registry !== undefined &&
                   window.Chart.registry.plugins.get('zoom') !== undefined;
        });

        expect(hasZoomPlugin).toBeTruthy();
    });
});
