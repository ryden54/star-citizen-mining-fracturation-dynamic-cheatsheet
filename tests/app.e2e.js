import { test, expect } from './coverage-test.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;

test.describe('Star Citizen Mining Calculator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(fileUrl);
    });

    test('should load the page with correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Star Citizen fracturation party dynamic CheatSheet/);
        await expect(page.locator('h1')).toContainText('Star Citizen Fracturation Party Dynamic CheatSheet');
    });

    test('should display initial configuration with one Prospector', async ({ page }) => {
        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(1);
        await expect(shipItems.first().locator('.ship-header label').first()).toContainText('Ship #1');
    });

    test('should add a Prospector when clicking add button', async ({ page }) => {
        await page.click('button:has-text("Add a Ship")');

        const shipItems = page.locator('.ship-item');
        await expect(shipItems).toHaveCount(2);
        await expect(shipItems.nth(1).locator('.ship-header label').first()).toContainText('Ship #2');
    });

    test('should remove a Prospector when clicking individual remove button', async ({ page }) => {
        // Add two prospectors first
        await page.click('button:has-text("Add a Ship")');
        await page.click('button:has-text("Add a Ship")');

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
        await page.click('button:has-text("Add a Ship")');

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
        const laserSelect = page.locator('#laser-0-0');

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
        // Get laserData from the page's context to make the test dynamic
        const laserData = await page.evaluate(() => window.FracturationParty.data.laserData);

        // Filter to only size 1 lasers compatible with Prospector (excluding dedicated lasers like Pitman)
        const laserKeys = Object.keys(laserData).filter(key => {
            const laser = laserData[key];
            // Size must be 1
            if (laser.size !== 1) return false;
            // If laser has compatibleShips, 'prospector' must be in the list OR list must be empty
            if (laser.compatibleShips && laser.compatibleShips.length > 0) {
                return laser.compatibleShips.includes('prospector');
            }
            return true; // No restriction, available for all S1 ships
        });

        const laserSelect = page.locator('#laser-0-0');
        const options = laserSelect.locator('option');

        // 1. Check the count
        await expect(options).toHaveCount(laserKeys.length);

        // 2. Check the text of each option (order: Power, Resistance, Instability)
        const arborFracturingPower = laserData['arbor'].fracturingPower;
        for (let i = 0; i < laserKeys.length; i++) {
            const key = laserKeys[i];
            const laser = laserData[key];
            const descriptionParts = [];

            // 1. Fracturing Power first
            if (key !== 'arbor') {
                const variation = ((laser.fracturingPower - arborFracturingPower) / arborFracturingPower) * 100;
                descriptionParts.push(`Fract. Pwr: ${variation > 0 ? '+' : ''}${variation.toFixed(0)}%`);
            }

            // 2. Resistance second (affects fracturation)
            if (laser.resistance !== 1.0) {
                const resVar = (laser.resistance - 1.0) * 100;
                descriptionParts.push(`Res: ${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%`);
            }

            // 3. Instability/optimal window third (quality of life)
            if (laser.instability !== 1.0) {
                const instVar = (laser.instability - 1.0) * 100;
                descriptionParts.push(`Opt. window: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
            }

            let expectedText = laser.name;
            if (descriptionParts.length > 0) {
                expectedText += ` (${descriptionParts.join(', ')})`;
            }

            await expect(options.nth(i)).toHaveText(expectedText);
        }
    });

    test('should preserve laser selection when adding ships', async ({ page }) => {
        // Change first laser to Helix
        await page.locator('#laser-0-0').selectOption('helix');

        // Add another prospector
        await page.click('button:has-text("Add a Ship")');

        // First laser should still be Helix
        const firstLaser = page.locator('#laser-0-0');
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
        await page.click('button:has-text("Add a Ship")');
        await page.waitForTimeout(100);

        // Get new mass for double Arbor at 30% resistance
        const doubleShipRow = page.locator('table tr').filter({ hasText: '30%' });
        const doubleShipCell = doubleShipRow.locator('td').nth(1);
        const doubleShipText = await doubleShipCell.textContent();
        const doubleShipMass = parseInt(doubleShipText.replace(/[^\d]/g, ''));

        // Double ship should have higher capacity
        expect(doubleShipMass).toBeGreaterThan(singleShipMass);
    });

    test('should update module description on change', async ({ page }) => {
        const moduleSelect = page.locator('#module-0-0-0');
        await moduleSelect.selectOption('rieger');

        // Get moduleData from the page's context to make the test dynamic
        const moduleData = await page.evaluate(() => window.FracturationParty.data.moduleData);
        const riegerModule = moduleData.rieger;

        // Dynamically generate the expected HTML
        const powerVar = (riegerModule.fracturingPowerModifier - 1.0) * 100;
        const pwrColor = powerVar > 0 ? 'green' : 'red';
        const expectedPwrHtml = `Fract. Pwr: <span style="color:${pwrColor};">${powerVar > 0 ? '+' : ''}${powerVar.toFixed(0)}%</span>`;

        const effect = riegerModule.effects[0];
        const effectColor = effect.type === 'con' ? 'red' : 'green';
        const expectedEffectHtml = `<span style="color:${effectColor};">${effect.text}</span>`;

        const descriptionDiv = page.locator('#module-0-0-0 + .module-description');
        const innerHTML = await descriptionDiv.innerHTML();

        expect(innerHTML).toContain(expectedPwrHtml);
        expect(innerHTML).toContain(expectedEffectHtml);
    });

    test('should display Rock Setup section with Add Gadget button', async ({ page }) => {
        const rockSetupHeading = page.locator('h2:has-text("Rock Setup")');
        await expect(rockSetupHeading).toBeVisible();

        const addGadgetButton = page.locator('button:has-text("Add Gadget")');
        await expect(addGadgetButton).toBeVisible();
    });

    test('should add a gadget when clicking Add Gadget button', async ({ page }) => {
        const addGadgetButton = page.locator('button:has-text("Add Gadget")');
        await addGadgetButton.click();

        const gadgetItems = page.locator('.gadget-item');
        await expect(gadgetItems).toHaveCount(1);
        await expect(gadgetItems.first().locator('.gadget-header label')).toContainText('Gadget #1');
    });

    test('should show gadget select options with abbreviated descriptions', async ({ page }) => {
        await page.click('button:has-text("Add Gadget")');

        const gadgetSelect = page.locator('#gadget-0');
        await expect(gadgetSelect).toBeVisible();

        // Check that options have descriptions
        const optionsText = await gadgetSelect.locator('option').allTextContents();

        // Sabir should have description with resistance and instability
        const sabirOption = optionsText.find(text => text.includes('Sabir'));
        expect(sabirOption).toBeTruthy();
        expect(sabirOption).toContain('Res:');
        expect(sabirOption).toContain('Instability:');

        // OptiMax should have description with resistance
        const optimaxOption = optionsText.find(text => text.includes('OptiMax'));
        expect(optimaxOption).toBeTruthy();
        expect(optimaxOption).toContain('Res:');

        // Stalwart should have a description (Opt. window rate)
        const stalwartOption = optionsText.find(text => text.includes('Stalwart'));
        expect(stalwartOption).toBeTruthy();
        expect(stalwartOption).toContain('Opt. window rate');

        // WaveShift should have a description (Opt. window size)
        const waveshiftOption = optionsText.find(text => text.includes('WaveShift'));
        expect(waveshiftOption).toBeTruthy();
        expect(waveshiftOption).toContain('Opt. window size');
    });

    test('should remove a gadget when clicking remove button', async ({ page }) => {
        // Add two gadgets
        await page.click('button:has-text("Add Gadget")');
        await page.click('button:has-text("Add Gadget")');

        let gadgetItems = page.locator('.gadget-item');
        await expect(gadgetItems).toHaveCount(2);

        // Remove the first gadget
        const removeButton = page.locator('.remove-gadget-btn').first();
        await removeButton.click();

        gadgetItems = page.locator('.gadget-item');
        await expect(gadgetItems).toHaveCount(1);
        await expect(gadgetItems.first().locator('.gadget-header label')).toContainText('Gadget #1');
    });

    test('should display gadget effects in description', async ({ page }) => {
        await page.click('button:has-text("Add Gadget")');

        // Get gadgetData from the page's context
        const gadgetData = await page.evaluate(() => window.FracturationParty.data.gadgetData);
        const sabirGadget = gadgetData.sabir;

        // Check that effects are displayed
        const descriptionDiv = page.locator('.gadget-item .gadget-description').first();
        const innerHTML = await descriptionDiv.innerHTML();

        // Check for effect text and colors
        sabirGadget.effects.forEach(effect => {
            const effectColor = effect.type === 'pro' ? 'green' : 'red';
            const expectedHtml = `<span style="color:${effectColor};">${effect.text}</span>`;
            expect(innerHTML).toContain(effect.text);
        });
    });

    test('should update capacity table when adding gadgets', async ({ page }) => {
        // Get initial capacity at 50% resistance
        const initialCapacity = await page.locator('table tr:has-text("50%") td:nth-child(2)').textContent();

        // Add a resistance-reducing gadget (Sabir reduces rock resistance by 50%)
        await page.click('button:has-text("Add Gadget")');

        const gadgetSelect = page.locator('#gadget-0');
        await gadgetSelect.selectOption('sabir');

        // Wait for table to update
        await page.waitForTimeout(100);

        // Get new capacity - should be higher with resistance-reducing gadget
        const newCapacity = await page.locator('table tr:has-text("50%") td:nth-child(2)').textContent();

        expect(newCapacity).not.toBe(initialCapacity);
    });

    test('should change gadget type and update description', async ({ page }) => {
        await page.click('button:has-text("Add Gadget")');

        const gadgetSelect = page.locator('#gadget-0');

        // Initially Sabir (default)
        await expect(gadgetSelect).toHaveValue('sabir');

        // Change to OptiMax
        await gadgetSelect.selectOption('optimax');
        await expect(gadgetSelect).toHaveValue('optimax');

        // Check that description updated
        const gadgetData = await page.evaluate(() => window.FracturationParty.data.gadgetData);
        const optimaxGadget = gadgetData.optimax;

        const descriptionDiv = page.locator('.gadget-item .gadget-description').first();
        const innerHTML = await descriptionDiv.innerHTML();

        // OptiMax should show its specific effects
        optimaxGadget.effects.forEach(effect => {
            expect(innerHTML).toContain(effect.text);
        });
    });

    test('should show altered resistance column when laser has resistance modifier', async ({ page }) => {
        // Select Helix laser which has 0.7 resistance modifier (-30%)
        const laserSelect = page.locator('#laser-0-0');
        await laserSelect.selectOption('helix');

        // Wait for table to update
        await page.waitForTimeout(100);

        // Table should now show "Natural Resistance" and "Altered Resistance" columns
        const tableHeaders = await page.locator('table th').allTextContents();

        expect(tableHeaders.length).toBe(3);
        expect(tableHeaders[0]).toContain('Natural Resistance');
        expect(tableHeaders[1]).toContain('Altered Resistance');
        expect(tableHeaders[2]).toContain('Maximum Mass');
    });

    test('should calculate altered resistance correctly with laser modifier only', async ({ page }) => {
        // Select Helix laser (0.7 resistance = -30%)
        const laserSelect = page.locator('#laser-0-0');
        await laserSelect.selectOption('helix');

        await page.waitForTimeout(100);

        // Check 50% natural resistance row
        const row = page.locator('table tr:has-text("50%")').first();
        const cells = await row.locator('td').allTextContents();

        // Natural: 50%, Altered: 50% * 0.7 = 35%
        expect(cells[0]).toContain('50%');
        expect(cells[1]).toContain('35%');
    });

    test('should calculate altered resistance correctly with both gadget and laser modifiers', async ({ page }) => {
        // Add Sabir gadget (-50% rock resistance)
        await page.click('button:has-text("Add Gadget")');
        const gadgetSelect = page.locator('#gadget-0');
        await gadgetSelect.selectOption('sabir');

        // Select Helix laser (0.7 resistance = -30%)
        const laserSelect = page.locator('#laser-0-0');
        await laserSelect.selectOption('helix');

        await page.waitForTimeout(100);

        // Check 50% natural resistance row
        const row = page.locator('table tr:has-text("50%")').first();
        const cells = await row.locator('td').allTextContents();

        // Natural: 50%
        // After Sabir: 50% * (1 - 0.5) = 25%
        // After Helix: 25% * 0.7 = 17.5% ≈ 18%
        expect(cells[0]).toContain('50%');
        expect(cells[1]).toMatch(/1[78]%/); // Accept 17% or 18% due to rounding
    });

    test('should not show altered resistance column with Arbor laser and no gadgets', async ({ page }) => {
        // Arbor has resistance = 1.0 (no modifier)
        const laserSelect = page.locator('#laser-0-0');
        await expect(laserSelect).toHaveValue('arbor');

        // Table should only show 2 columns
        const tableHeaders = await page.locator('table th').allTextContents();

        expect(tableHeaders.length).toBe(2);
        expect(tableHeaders[0]).toContain('Resistance');
        expect(tableHeaders[1]).toContain('Maximum Mass');
    });

    test('should display capacity chart canvas', async ({ page }) => {
        const canvas = page.locator('#capacity-chart');
        await expect(canvas).toBeVisible();

        // Verify canvas has an ID and is a canvas element
        await expect(canvas).toHaveAttribute('id', 'capacity-chart');

        // Verify canvas is not blank by checking if it has been drawn on
        const hasContent = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            if (!canvas) return false;

            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check if any pixel is non-white/transparent (not blank canvas)
            let pixelCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                // If any pixel is not white (255,255,255,255), canvas has content
                if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255 || data[i+3] !== 255) {
                    pixelCount++;
                }
            }
            // Canvas should have significant content (at least 1000 colored pixels)
            return pixelCount > 1000;
        });

        expect(hasContent).toBe(true);
    });

    test('should update chart when laser selection changes', async ({ page }) => {
        // Get initial canvas data URL
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        expect(initialData).toBeTruthy();

        // Change laser type
        const laserSelect = page.locator('#laser-0-0');
        await laserSelect.selectOption('helix');

        // Wait for chart update
        await page.waitForTimeout(100);

        // Get new canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed
        expect(updatedData).not.toBe(initialData);
    });

    test('should update chart when adding ships', async ({ page }) => {
        // Get initial canvas data
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Add a ship
        await page.click('button:has-text("Add a Ship")');
        await page.waitForTimeout(100);

        // Get updated canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed (more capacity with 2 ships)
        expect(updatedData).not.toBe(initialData);
    });

    test('should update chart when adding gadgets', async ({ page }) => {
        // Get initial canvas data
        const initialData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Add a gadget
        await page.click('button:has-text("Add Gadget")');
        await page.waitForTimeout(100);

        // Select Sabir gadget (reduces resistance)
        const gadgetSelect = page.locator('select[id^="gadget-"]').first();
        await gadgetSelect.selectOption('sabir');
        await page.waitForTimeout(100);

        // Get updated canvas data
        const updatedData = await page.evaluate(() => {
            const canvas = document.getElementById('capacity-chart');
            return canvas ? canvas.toDataURL() : null;
        });

        // Chart should have changed (more capacity with Sabir)
        expect(updatedData).not.toBe(initialData);
    });

    test('should have chart methods accessible', async ({ page }) => {
        const hasChartModule = await page.evaluate(() => {
            return window.FracturationParty &&
                   window.FracturationParty.chart &&
                   typeof window.FracturationParty.chart.drawCapacityChart === 'function' &&
                   typeof window.FracturationParty.chart.generateChartData === 'function';
        });

        expect(hasChartModule).toBe(true);
    });

    test('should generate valid chart data', async ({ page }) => {
        const chartData = await page.evaluate(() => {
            const ships = [{ laser: 'arbor', modules: [] }];
            return window.FracturationParty.chart.generateChartData(ships);
        });

        expect(Array.isArray(chartData)).toBe(true);
        expect(chartData.length).toBeGreaterThan(0);
        expect(chartData[0]).toHaveProperty('resistance');
        expect(chartData[0]).toHaveProperty('maxMass');
    });

    test('should display Golem in ship select options', async ({ page }) => {
        // Click on the ship type select
        const shipSelect = page.locator('#ship-type-0');
        await expect(shipSelect).toBeVisible();

        // Get all options
        const options = await shipSelect.locator('option').allTextContents();

        // Verify Golem is in the list
        const hasGolem = options.some(option => option.includes('Golem'));
        expect(hasGolem).toBe(true);

        // Verify Golem mentions fixed laser
        const golemOption = options.find(option => option.includes('Golem'));
        expect(golemOption).toContain('1 fixed laser S1');
        expect(golemOption).toContain('32 SCU');
    });

    test('should create Golem with fixed Pitman laser', async ({ page }) => {
        // Change ship type to Golem
        await page.selectOption('#ship-type-0', 'golem');

        // Wait for UI update
        await page.waitForTimeout(100);

        // Verify the laser is displayed as fixed (not a select element)
        const laserSelect = page.locator('#laser-0-0');
        await expect(laserSelect).not.toBeVisible();

        // Verify the fixed laser display exists
        const fixedLaserDiv = page.locator('.laser-select-container div').filter({ hasText: 'Pitman Mining Laser' });
        await expect(fixedLaserDiv).toBeVisible();
        await expect(fixedLaserDiv).toContainText('Fixed equipment');
    });

    test('should display Pitman laser with module slots for Golem', async ({ page }) => {
        // Change ship type to Golem
        await page.selectOption('#ship-type-0', 'golem');

        // Wait for UI update
        await page.waitForTimeout(100);

        // Verify Pitman has 2 module slots
        const module1 = page.locator('#module-0-0-0');
        const module2 = page.locator('#module-0-0-1');

        await expect(module1).toBeVisible();
        await expect(module2).toBeVisible();
    });

    test('should calculate correct capacity for Golem with Pitman', async ({ page }) => {
        // Change ship type to Golem
        await page.selectOption('#ship-type-0', 'golem');

        // Wait for UI and calculations to update
        await page.waitForTimeout(200);

        // Verify table is displayed with values
        const table = page.locator('#capacity-table table');
        await expect(table).toBeVisible();

        // Get a row value (resistance 0%) - use first() since all rows contain "0%"
        const row = table.locator('tr').filter({ hasText: '0%' }).first();
        await expect(row).toBeVisible();

        // Should have a maximum mass value
        const massCell = row.locator('td').last();
        const massText = await massCell.textContent();
        expect(massText).toMatch(/\d+.*kg/);
    });

    test('should maintain ship order: Golem, Prospector, MOLE', async ({ page }) => {
        const shipSelect = page.locator('#ship-type-0');
        const options = await shipSelect.locator('option').allTextContents();

        // Verify order
        const golemIndex = options.findIndex(opt => opt.includes('Golem'));
        const prospectorIndex = options.findIndex(opt => opt.includes('Prospector'));
        const moleIndex = options.findIndex(opt => opt.includes('MOLE'));

        expect(golemIndex).toBeLessThan(prospectorIndex);
        expect(prospectorIndex).toBeLessThan(moleIndex);
    });

    test('should not show Pitman laser for Prospector', async ({ page }) => {
        // Ensure we're on Prospector (default)
        const shipType = await page.locator('#ship-type-0').inputValue();

        // If not prospector, switch to it
        if (shipType !== 'prospector') {
            await page.selectOption('#ship-type-0', 'prospector');
            await page.waitForTimeout(100);
        }

        // For Prospector with configurable lasers, the laser select should exist
        const laserSelect = page.locator('#laser-0-0');
        await expect(laserSelect).toBeVisible();

        // Get all laser options
        const laserOptions = await laserSelect.locator('option').allTextContents();

        // Verify Pitman is NOT in the list for Prospector
        const hasPitman = laserOptions.some(option => option.includes('Pitman'));
        expect(hasPitman).toBe(false);

        // Verify other S1 lasers are available
        const hasArbor = laserOptions.some(option => option.includes('Arbor MH1'));
        const hasHelix = laserOptions.some(option => option.includes('Helix I'));
        expect(hasArbor).toBe(true);
        expect(hasHelix).toBe(true);
    });
});
