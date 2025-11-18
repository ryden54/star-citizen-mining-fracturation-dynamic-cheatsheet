import { test, expect } from './coverage-test.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;

test.describe('Chart Update Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(fileUrl);
    });

    test('should update chart when changing laser', async ({ page }) => {
        // Get initial canvas data
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        expect(initialData).toBeTruthy();

        // Change laser
        await page.selectOption('#laser-0-0', 'helix');
        await page.waitForTimeout(200);

        // Get updated canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed
        expect(updatedData).not.toBe(initialData);
    });

    test('should update chart when changing module', async ({ page }) => {
        // Get initial canvas data
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Change module
        await page.selectOption('#module-0-0-0', 'rieger');
        await page.waitForTimeout(200);

        // Get updated canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed
        expect(updatedData).not.toBe(initialData);
    });

    test('should update chart when changing gadget', async ({ page }) => {
        // Add a gadget first
        await page.click('button:has-text("Add Gadget")');
        await page.waitForTimeout(100);

        // Get canvas data with default gadget
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Change gadget type
        await page.selectOption('#gadget-0', 'optimax');
        await page.waitForTimeout(200);

        // Get updated canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed
        expect(updatedData).not.toBe(initialData);
    });

    test('chart should reflect current configuration', async ({ page }) => {
        // Configure a specific setup
        await page.selectOption('#laser-0-0', 'hofstede');
        await page.selectOption('#module-0-0-0', 'vaux');
        await page.click('button:has-text("Add Gadget")');
        await page.selectOption('#gadget-0', 'sabir');

        await page.waitForTimeout(200);

        // Verify chart is drawn with content
        const hasContent = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            if (!canvas) return false;

            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check if any pixel is non-white/transparent
            let pixelCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255 || data[i+3] !== 255) {
                    pixelCount++;
                }
            }
            return pixelCount > 1000;
        });

        expect(hasContent).toBe(true);
    });
});
