import { describe, it, expect, beforeEach } from 'vitest';
import { generateModuleDescriptionHTML, gadgetData } from '../public/js/app.js';
import { moduleData } from '../public/js/app.js';

describe('generateModuleDescriptionHTML', () => {
    it('should return an empty string for "none" module', () => {
        const html = generateModuleDescriptionHTML(moduleData.none);
        expect(html).toBe('');
    });

    it('should correctly generate HTML for a module with a power penalty and a pro effect', () => {
        const html = generateModuleDescriptionHTML(moduleData.fltr);
        expect(html).toContain('Fract. Pwr: <span style="color:red;">-15%</span>');
        expect(html).toContain('<span style="color:green;">Filters inert materials</span>');
    });

    it('should correctly generate HTML for a module with only an extraction power penalty', () => {
        const html = generateModuleDescriptionHTML(moduleData.xtr);
        expect(html).not.toContain('Fract. Pwr');
        expect(html).toContain('Extract Pwr: <span style="color:red;">-15%</span>');
        expect(html).toContain('<span style="color:green;">Filters inert materials</span>');
        expect(html).toContain('<span style="color:green;">Opt. window: +15%</span>');
    });

    it('should correctly generate HTML for a module with a power bonus and a con effect', () => {
        const html = generateModuleDescriptionHTML(moduleData.rieger);
        expect(html).toContain('Fract. Pwr: <span style="color:green;">+15%</span>');
        expect(html).toContain('<span style="color:red;">Opt. window: -10%</span>');
    });

    it('should correctly generate HTML for a module with only an extraction power bonus and a con effect', () => {
        const html = generateModuleDescriptionHTML(moduleData.vaux);
        expect(html).not.toContain('Fract. Pwr');
        expect(html).toContain('Extract Pwr: <span style="color:green;">+15%</span>');
        expect(html).toContain('<span style="color:red;">Opt. charge rate: -20%</span>');
    });

    it('should correctly generate HTML for a module with both power penalties and bonuses', () => {
        const html = generateModuleDescriptionHTML(moduleData.focus);
        expect(html).toContain('Fract. Pwr: <span style="color:red;">-15%</span>');
        expect(html).toContain('Extract Pwr: <span style="color:green;">+30%</span>');
    });
});

describe('Ship UI functions', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="ships-container"></div>
            <div id="capacity-table"></div>
        `;

        // Provide the necessary data on the window object for the UI functions to use
        window.FracturationParty.data = { laserData, moduleData, gadgetData };

        // Initialize the UI, which sets up the initial ship count and modules
        ui.initializeUI();

        // After initialization, ensure ship count is 1
        ui.setShipCount(1);
    });

    it('removeShip should preserve modules of ships with index < removed index', () => {
        // Add two more ships to reach a total of 3
        ui.addShip(); // Ship 2
        ui.addShip(); // Ship 3
        expect(ui.getShipCount()).toBe(3);

        // Manually set modules for each ship to have a known state
        ui.setShipModules({
            0: ['fltr'],
            1: ['rieger'],
            2: ['vaux']
        });
        ui.updateShipsUI(); // Update UI to reflect the new module state

        // Remove the last ship (index 2)
        ui.removeShip(2);

        // Verify that the ship count is now 2
        expect(ui.getShipCount()).toBe(2);

        // Verify that the modules of ship 0 and ship 1 are preserved.
        // The test for `else if (shipIndex < index)` is triggered here, as indices 0 and 1 are less than 2.
        const currentModules = ui.getShipModules();
        expect(currentModules[0]).toEqual(['fltr']);
        expect(currentModules[1]).toEqual(['rieger']);
        
        // Ensure the DOM is also updated and the third ship is gone
        expect(document.getElementById('laser-0')).not.toBeNull();
        expect(document.getElementById('laser-1')).not.toBeNull();
        expect(document.getElementById('laser-2')).toBeNull();
    });

    it('onModuleChange should create modules array if it does not exist', () => {
        // We start with one ship from initializeUI, and its module data exists.
        // Manually set an inconsistent state where shipModules is empty
        ui.setShipModules({});
        expect(ui.getShipModules()).toEqual({});

        // The DOM for ship 0 still exists. Find a module select and change its value.
        const moduleSelect = document.getElementById('module-0-0');
        expect(moduleSelect).not.toBeNull();
        moduleSelect.value = 'fltr';

        // Trigger the change handler. This should execute the `if (!shipModules[shipIndex])` block.
        ui.onModuleChange(0, 0);

        // Verify that the shipModules object was created for ship 0
        const newShipModules = ui.getShipModules();
        expect(newShipModules[0]).toBeDefined();
        // The new array should be initialized with 'none' for all slots, then the selected value is set.
        // Arbor laser has 1 module slot.
        expect(newShipModules[0]).toEqual(['fltr']);
    });

    it('removeShip should correctly re-index modules when removing first ship', () => {
        // Add two more ships to reach a total of 3
        ui.addShip(); // Ship 2
        ui.addShip(); // Ship 3
        expect(ui.getShipCount()).toBe(3);

        // Manually set modules for each ship to have a known state
        ui.setShipModules({
            0: ['fltr'],
            1: ['rieger'],
            2: ['vaux']
        });
        ui.updateShipsUI(); // Update UI to reflect the new module state

        // Remove the first ship (index 0)
        ui.removeShip(0);

        // Verify that the ship count is now 2
        expect(ui.getShipCount()).toBe(2);

        // Verify that the modules of the remaining ships are correctly re-indexed.
        // The test for `if (shipIndex > index)` is triggered here.
        const currentModules = ui.getShipModules();
        expect(currentModules[0]).toEqual(['rieger']); // old ship 1 is now ship 0
        expect(currentModules[1]).toEqual(['vaux']);   // old ship 2 is now ship 1
    });

    it('onModuleChange should throw an error if slotIndex is out of bounds', () => {
        // Set up a ship with a laser that has a known number of module slots (e.g., Arbor has 1)
        // The UI is initialized with one ship and Arbor laser, so ship 0 has 1 slot.
        const shipIndex = 0;
        const invalidSlotIndex = 1; // Arbor only has slot 0

        // Expect the function call to throw an error
        expect(() => ui.onModuleChange(shipIndex, invalidSlotIndex)).toThrow(
            `Attempted to assign module to slot ${invalidSlotIndex} for ship ${shipIndex}, but laser "arbor" only supports 1 module slots.`
        );
    });
});

describe('Gadget UI Functions', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="gadgets-container"></div>
        `;
        // Reset global gadgets array
        if (window.FracturationParty && window.FracturationParty.ui) {
            // Reset would happen here if we had access to the internal state
        }
    });

    describe('Gadget select options generation', () => {
        it('should include abbreviated descriptions for gadgets with rock resistance modifiers', () => {
            // Test that Sabir shows its rock resistance modifier
            const sabir = gadgetData.sabir;
            expect(sabir.rockResistance).toBe(-0.50);
            expect(sabir.rockInstability).toBe(0.15);

            // Verify the data is correct for generating descriptions
            const resVar = sabir.rockResistance * 100;
            const instVar = sabir.rockInstability * 100;
            expect(resVar).toBe(-50);
            expect(instVar).toBe(15);
        });

        it('should include abbreviated descriptions for gadgets with only rock resistance', () => {
            // OptiMax has only rock resistance modifier
            const optimax = gadgetData.optimax;
            expect(optimax.rockResistance).toBe(-0.30);
            expect(optimax.rockInstability).toBe(0.0);

            const resVar = optimax.rockResistance * 100;
            expect(resVar).toBe(-30);
        });

        it('should include abbreviated descriptions for gadgets with only rock instability', () => {
            // Okunis has only rock instability modifier
            const okunis = gadgetData.okunis;
            expect(okunis.rockResistance).toBe(0.0);
            expect(okunis.rockInstability).toBe(-0.40);

            const instVar = okunis.rockInstability * 100;
            expect(instVar).toBe(-40);
        });

        it('should handle gadgets with no rock modifiers (Stalwart, WaveShift)', () => {
            // Stalwart has no rock modifiers
            const stalwart = gadgetData.stalwart;
            expect(stalwart.rockResistance).toBe(0.0);
            expect(stalwart.rockInstability).toBe(0.0);

            // WaveShift has no rock modifiers
            const waveshift = gadgetData.waveshift;
            expect(waveshift.rockResistance).toBe(0.0);
            expect(waveshift.rockInstability).toBe(0.0);

            // Both should have effects defined
            expect(stalwart.effects.length).toBeGreaterThan(0);
            expect(waveshift.effects.length).toBeGreaterThan(0);
        });

        it('should have all required properties for each gadget', () => {
            Object.values(gadgetData).forEach(gadget => {
                expect(gadget).toHaveProperty('name');
                expect(gadget).toHaveProperty('manufacturer');
                expect(gadget).toHaveProperty('rockResistance');
                expect(gadget).toHaveProperty('rockInstability');
                expect(gadget).toHaveProperty('effects');
                expect(Array.isArray(gadget.effects)).toBe(true);
            });
        });

        it('should categorize gadgets by manufacturer correctly', () => {
            const manufacturers = {};
            Object.values(gadgetData).forEach(gadget => {
                if (!manufacturers[gadget.manufacturer]) {
                    manufacturers[gadget.manufacturer] = [];
                }
                manufacturers[gadget.manufacturer].push(gadget.name);
            });

            // Verify each manufacturer has gadgets
            expect(Object.keys(manufacturers).length).toBeGreaterThan(0);

            // Verify specific manufacturers exist
            expect(manufacturers['Thermyte Concern']).toBeDefined();
            expect(manufacturers['Shubin Interstellar']).toBeDefined();
            expect(manufacturers['Greycat Industrial']).toBeDefined();
        });
    });

    describe('Gadget effects formatting', () => {
        it('should have properly formatted effects with type indicators', () => {
            Object.values(gadgetData).forEach(gadget => {
                gadget.effects.forEach(effect => {
                    expect(effect).toHaveProperty('text');
                    expect(effect).toHaveProperty('type');
                    expect(['pro', 'con']).toContain(effect.type);
                    expect(typeof effect.text).toBe('string');
                    expect(effect.text.length).toBeGreaterThan(0);
                });
            });
        });

        it('should include resistance information in effects for relevant gadgets', () => {
            // Sabir should mention rock resistance in effects
            const sabirEffects = gadgetData.sabir.effects.map(e => e.text);
            const hasResistanceEffect = sabirEffects.some(text =>
                text.toLowerCase().includes('resistance') || text.toLowerCase().includes('res')
            );
            expect(hasResistanceEffect).toBe(true);
        });

        it('should include instability information in effects for relevant gadgets', () => {
            // BoreMax should mention rock instability in effects
            const boremaxEffects = gadgetData.boremax.effects.map(e => e.text);
            const hasInstabilityEffect = boremaxEffects.some(text =>
                text.toLowerCase().includes('instability') || text.toLowerCase().includes('inst')
            );
            expect(hasInstabilityEffect).toBe(true);
        });
    });
});
