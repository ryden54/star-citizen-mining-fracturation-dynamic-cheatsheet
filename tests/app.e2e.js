import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = 'file://' + path.resolve(__dirname, '..', 'public', 'index.html');

test.describe('Star Citizen Mining Calculator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(indexPath);
    });

    test('should load the page with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Star Citizen fracturation party dynamic CheatSheet/);
        await expect(page.locator('h1')).toContainText('Star Citizen Fracturation Party Dynamic CheatSheet');
    });

    test('should display initial configuration with one Prospector', async ({ page }) => {
        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(1);
        await expect(shipItems.first().locator('label')).toContainText('Prospector #1');
    });

    test('should add a Prospector when clicking add button', async ({ page }) => {
        await page.click('button:has-text("Add a Prospector")');

        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(2);
        await expect(page.locator('label').nth(1)).toContainText('Prospector #2');
    });

    test('should remove a Prospector when clicking individual remove button', async ({ page }) => {
        // Add two prospectors first
        await page.click('button:has-text("Add a Prospector")');
        await page.click('button:has-text("Add a Prospector")');

        let shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(3);

        // Remove one using the individual remove button
        const removeButton = page.locator('.remove-ship-btn').first();
        await removeButton.click();

        shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(2);
    });

    test('should not show remove button when only one Prospector', async ({ page }) => {
        // With only one prospector, there should be no remove button
        const removeButton = page.locator('.remove-ship-btn');
        await expect(removeButton).toHaveCount(0);

        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(1);
    });

    test('should show remove buttons when multiple Prospectors exist', async ({ page }) => {
        // Add a second prospector
        await page.click('button:has-text("Add a Prospector")');

        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(2);

        // Both ships should have remove buttons
        const removeButtons = page.locator('.remove-ship-btn');
        await expect(removeButtons).toHaveCount(2);
    });

    test('should display capacity table on load', async ({ page }) => {
        const table = page.locator('table');
        await expect(table).toBeVisible();

        // Check for resistance levels
        await expect(table.locator('td').first()).toContainText('0%');
    });

    test('should update capacity table when changing laser selection', async ({ page }) => {
        const laserSelect = page.locator('#laser-0');

        // Get initial max mass value for 0% resistance with Arbor (1850 power)
        const initialCell = page.locator('table tr').nth(1).locator('td').nth(1);
        const initialText = await initialCell.textContent();

        // Change laser to Hofstede (1295 power - less than Arbor)
        await laserSelect.selectOption('hofstede');

        // Wait for table to update
        await page.waitForTimeout(100);

        // Get new max mass value
        const updatedCell = page.locator('table tr').nth(1).locator('td').nth(1);
        const updatedText = await updatedCell.textContent();

        // Values should be different (Hofstede has less power but better modifiers)
        expect(updatedText).not.toBe(initialText);
    });

    test('should show all laser options in dropdown', async ({ page }) => {
        const laserSelect = page.locator('#laser-0');
        const options = laserSelect.locator('option');

        await expect(options).toHaveCount(4);
        await expect(options.nth(0)).toHaveText('Arbor (default)');
        await expect(options.nth(1)).toHaveText('Hofstede S1 (Inst: -50%, Res: -30%)');
        await expect(options.nth(2)).toHaveText('Helix I (Inst: -40%, Res: -30%)');
        await expect(options.nth(3)).toHaveText('Lancet MH1 (Inst: -30%)');
    });

    test('should preserve laser selection when adding ships', async ({ page }) => {
        // Change first laser to Helix
        await page.locator('#laser-0').selectOption('helix');

        // Add another prospector
        await page.click('button:has-text("Add a Prospector")');

        // First laser should still be Helix
        const firstLaser = page.locator('#laser-0');
        await expect(firstLaser).toHaveValue('helix');
    });

    test('should display capacity values in table', async ({ page }) => {
        const table = page.locator('table');

        // Check that table has data cells with mass values
        const massCell = table.locator('td').filter({ hasText: 'kg' }).first();
        await expect(massCell).toBeVisible();
    });

    test('should show disclaimer about approximate values', async ({ page }) => {
        const disclaimer = page.locator('.info-box');
        await expect(disclaimer).toBeVisible();
        await expect(disclaimer).toContainText('approximations');
        await expect(disclaimer).toContainText('Star Citizen 4.x');
    });

    test('should increase capacity with multiple ships', async ({ page }) => {
        // Get mass for single Arbor at 30% resistance
        const singleShipRow = page.locator('table tr').filter({ hasText: '30%' });
        const singleShipCell = singleShipRow.locator('td').nth(1);
        const singleShipText = await singleShipCell.textContent();
        const singleShipMass = parseInt(singleShipText.replace(/[^\d]/g, ''));

        // Add second prospector
        await page.click('button:has-text("Add a Prospector")');
        await page.waitForTimeout(100);

        // Get new mass for double Arbor at 30% resistance
        const doubleShipRow = page.locator('table tr').filter({ hasText: '30%' });
        const doubleShipCell = doubleShipRow.locator('td').nth(1);
        const doubleShipText = await doubleShipCell.textContent();
        const doubleShipMass = parseInt(doubleShipText.replace(/[^\d]/g, ''));

        // Double ship should have higher capacity
        expect(doubleShipMass).toBeGreaterThan(singleShipMass);
    });
});
