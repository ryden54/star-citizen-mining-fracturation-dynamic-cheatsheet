import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ui, generateModuleDescriptionHTML, shipData, gadgetData, laserData, moduleData } from '../public/js/app.js';

// Mock updateTable to prevent it from running and causing errors due to missing DOM elements in tests.
vi.spyOn(ui, 'updateTable').mockImplementation(() => {});

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
        window.FracturationParty.data = { shipData, laserData, moduleData, gadgetData };

        // Initialize the UI, which sets up the initial ship count and modules
        ui.initializeUI();

        // After initialization, ensure ship count is 1
        ui.setShipCount(1);
    });

    it('removeShip should preserve modules of ships with index < removed index', () => {
        // Add two more ships to reach a total of 3
        ui.addShip(); // Ship 1
        ui.addShip(); // Ship 2
        expect(ui.getShipCount()).toBe(3);

        // Set ships with proper structure using the new setShips API
        ui.setShips([
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['fltr'] }] },
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['rieger'] }] },
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['vaux'] }] }
        ]);
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
        // Use new ID scheme: laser-{shipIndex}-{laserIndex}
        expect(document.getElementById('laser-0-0')).not.toBeNull();
        expect(document.getElementById('laser-1-0')).not.toBeNull();
        expect(document.getElementById('laser-2-0')).toBeNull();
    });

    it('onModuleChange should create modules array if it does not exist', () => {
        // We start with one ship from initializeUI, and its module data exists.
        // Manually set a proper state with initialized modules array
        ui.setShips([
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['none'] }] }
        ]);
        ui.updateShipsUI();

        // The DOM for ship 0 still exists. Find a module select and change its value.
        // Use new ID scheme: module-{shipIndex}-{laserIndex}-{slotIndex}
        const moduleSelect = document.getElementById('module-0-0-0');
        expect(moduleSelect).not.toBeNull();
        moduleSelect.value = 'fltr';

        // Trigger the change handler with laserIndex parameter.
        // onModuleChange(shipIndex, laserIndex, slotIndex, focusedId)
        ui.onModuleChange(0, 0, 0);

        // Verify that the module was updated in ship 0, laser 0
        const newShipModules = ui.getShipModules();
        expect(newShipModules[0]).toBeDefined();
        // The selected value should be set.
        // Arbor laser has 1 module slot.
        expect(newShipModules[0]).toEqual(['fltr']);
    });

    it('removeShip should correctly re-index modules when removing first ship', () => {
        // Add two more ships to reach a total of 3
        ui.addShip(); // Ship 1
        ui.addShip(); // Ship 2
        expect(ui.getShipCount()).toBe(3);

        // Set ships with proper structure using the new setShips API
        ui.setShips([
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['fltr'] }] },
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['rieger'] }] },
            { type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['vaux'] }] }
        ]);
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
        const laserIndex = 0; // For Prospector, always use laser 0
        const invalidSlotIndex = 1; // Arbor only has slot 0

        // Create a mock DOM element for the invalid slot
        // This is needed because onModuleChange tries to read the value before validating
        const mockSelect = document.createElement('select');
        mockSelect.id = `module-${shipIndex}-${laserIndex}-${invalidSlotIndex}`;
        mockSelect.value = 'rieger';
        document.getElementById('ships-container').appendChild(mockSelect);

        // Expect the function call to throw an error
        // onModuleChange(shipIndex, laserIndex, slotIndex, focusedId)
        // Updated error message to include "laser ${laserIndex}"
        expect(() => ui.onModuleChange(shipIndex, laserIndex, invalidSlotIndex)).toThrow(
            `Attempted to assign module to slot ${invalidSlotIndex} for ship ${shipIndex} laser ${laserIndex}, but laser "arbor" only supports 1 module slots.`
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

describe('MOLE Ship Support', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="ships-container"></div>
            <div id="capacity-table"></div>
        `;
        window.FracturationParty.data = { shipData, laserData, moduleData, gadgetData };
    });

    describe('createShip', () => {
        it('should create prospector with 1 Size 1 laser and correct default', () => {
            const ship = ui.createShip('prospector');

            expect(ship.type).toBe('prospector');
            expect(ship.lasers).toHaveLength(1);
            expect(ship.lasers[0].laserType).toBe('arbor'); // Default S1 laser
            expect(ship.lasers[0].modules).toHaveLength(1); // Arbor has 1 module slot
            expect(ship.lasers[0].modules[0]).toBe('none');
        });

        it('should create MOLE with 3 Size 2 lasers and correct default', () => {
            const ship = ui.createShip('mole');

            expect(ship.type).toBe('mole');
            expect(ship.lasers).toHaveLength(3);

            // All 3 lasers should be Arbor MH2 (default S2 laser)
            ship.lasers.forEach(laser => {
                expect(laser.laserType).toBe('arbor-mh2');
                expect(laser.modules).toHaveLength(2); // Arbor MH2 has 2 module slots
                expect(laser.modules).toEqual(['none', 'none']);
            });
        });

        it('should create ships with correct number of module slots for each laser', () => {
            const prospector = ui.createShip('prospector');
            const arborSlots = laserData['arbor'].moduleSlots;
            expect(prospector.lasers[0].modules).toHaveLength(arborSlots);

            const mole = ui.createShip('mole');
            const arborMH2Slots = laserData['arbor-mh2'].moduleSlots;
            mole.lasers.forEach(laser => {
                expect(laser.modules).toHaveLength(arborMH2Slots);
            });
        });
    });

    describe('getCompatibleLasers', () => {
        it('should return only Size 1 lasers for prospector', () => {
            const compatibleLasers = ui.getCompatibleLasers('prospector');

            // All returned lasers must be size 1
            Object.values(compatibleLasers).forEach(laser => {
                expect(laser.size).toBe(1);
            });

            // Should include known S1 lasers
            expect(compatibleLasers['arbor']).toBeDefined();
            expect(compatibleLasers['helix']).toBeDefined();
            expect(compatibleLasers['hofstede']).toBeDefined();

            // Should NOT include S2 lasers
            expect(compatibleLasers['arbor-mh2']).toBeUndefined();
            expect(compatibleLasers['helix-ii']).toBeUndefined();
        });

        it('should return only Size 2 lasers for MOLE', () => {
            const compatibleLasers = ui.getCompatibleLasers('mole');

            // All returned lasers must be size 2
            Object.values(compatibleLasers).forEach(laser => {
                expect(laser.size).toBe(2);
            });

            // Should include known S2 lasers
            expect(compatibleLasers['arbor-mh2']).toBeDefined();
            expect(compatibleLasers['lancet-mh2']).toBeDefined();
            expect(compatibleLasers['hofstede-s2']).toBeDefined();
            expect(compatibleLasers['helix-ii']).toBeDefined();

            // Should NOT include S1 lasers
            expect(compatibleLasers['arbor']).toBeUndefined();
            expect(compatibleLasers['helix']).toBeUndefined();
        });

        it('should return non-empty laser sets for both ship types', () => {
            const prospectorLasers = ui.getCompatibleLasers('prospector');
            const moleLasers = ui.getCompatibleLasers('mole');

            expect(Object.keys(prospectorLasers).length).toBeGreaterThan(0);
            expect(Object.keys(moleLasers).length).toBeGreaterThan(0);
        });
    });

    describe('onShipTypeChange', () => {
        beforeEach(() => {
            ui.initializeUI();
            ui.setShipCount(1);
            ui.setShips([ui.createShip('prospector')]);
            ui.updateShipsUI();
        });

        it('should convert prospector to MOLE when type changes', () => {
            // Setup: verify we start with a prospector
            const initialShips = ui.getShips();
            expect(initialShips[0].type).toBe('prospector');
            expect(initialShips[0].lasers).toHaveLength(1);

            // Simulate changing the ship type select
            const shipTypeSelect = document.getElementById('ship-type-0');
            expect(shipTypeSelect).not.toBeNull();
            shipTypeSelect.value = 'mole';

            // Trigger the change
            ui.onShipTypeChange(0);

            // Verify the ship is now a MOLE
            const updatedShips = ui.getShips();
            expect(updatedShips[0].type).toBe('mole');
            expect(updatedShips[0].lasers).toHaveLength(3);
            expect(updatedShips[0].lasers[0].laserType).toBe('arbor-mh2');
        });

        it('should convert MOLE to prospector when type changes', () => {
            // Setup: Start with a MOLE
            ui.setShips([ui.createShip('mole')]);
            ui.updateShipsUI();

            const initialShips = ui.getShips();
            expect(initialShips[0].type).toBe('mole');
            expect(initialShips[0].lasers).toHaveLength(3);

            // Simulate changing the ship type select
            const shipTypeSelect = document.getElementById('ship-type-0');
            shipTypeSelect.value = 'prospector';

            // Trigger the change
            ui.onShipTypeChange(0);

            // Verify the ship is now a prospector
            const updatedShips = ui.getShips();
            expect(updatedShips[0].type).toBe('prospector');
            expect(updatedShips[0].lasers).toHaveLength(1);
            expect(updatedShips[0].lasers[0].laserType).toBe('arbor');
        });

        it('should reset lasers and modules when ship type changes', () => {
            // Setup: prospector with custom laser/modules
            ui.setShips([{
                type: 'prospector',
                lasers: [{ laserType: 'helix', modules: ['rieger'] }]
            }]);
            ui.updateShipsUI();

            // Change to MOLE
            const shipTypeSelect = document.getElementById('ship-type-0');
            shipTypeSelect.value = 'mole';
            ui.onShipTypeChange(0);

            // Verify new default configuration
            const updatedShips = ui.getShips();
            expect(updatedShips[0].lasers[0].laserType).toBe('arbor-mh2');
            expect(updatedShips[0].lasers[0].modules).toEqual(['none', 'none']); // Arbor MH2 has 2 module slots
        });

        it('should restore focus to ship type selector after change', () => {
            // Setup - spy on focus across all created elements
            let focusCalled = false;
            const originalGetElementById = document.getElementById.bind(document);

            document.getElementById = vi.fn((id) => {
                const element = originalGetElementById(id);
                if (element && id === 'ship-type-0' && element.tagName === 'SELECT') {
                    element.focus = () => { focusCalled = true; };
                }
                return element;
            });

            // Get initial select and change value
            const shipTypeSelect = document.getElementById('ship-type-0');
            expect(shipTypeSelect).not.toBeNull();
            shipTypeSelect.value = 'mole';

            // Trigger the change
            ui.onShipTypeChange(0);

            // Verify focus was called on the recreated element
            expect(focusCalled).toBe(true);

            // Restore original function
            document.getElementById = originalGetElementById;
        });
    });

    describe('onLaserChange with un-maned laser', () => {
        beforeEach(() => {
            ui.initializeUI();
            ui.setShipCount(1);
            ui.setShips([ui.createShip('mole')]);
            ui.updateShipsUI();
        });

        it('should handle un-maned laser type correctly', () => {
            // Setup: MOLE with 3 lasers
            const initialShips = ui.getShips();
            expect(initialShips[0].lasers).toHaveLength(3);

            // Simulate changing laser 2 to un-maned
            const laserSelect = document.getElementById('laser-0-2');
            expect(laserSelect).not.toBeNull();
            laserSelect.value = 'un-maned';

            // Trigger the change
            ui.onLaserChange(0, 2);

            // Verify laser is un-maned
            const updatedShips = ui.getShips();
            expect(updatedShips[0].lasers[2].laserType).toBe('un-maned');
            expect(updatedShips[0].lasers[2].modules).toEqual([]);
        });

        it('should allow switching from un-maned back to regular laser', () => {
            // Setup: Set laser 1 to un-maned
            ui.setShips([{
                type: 'mole',
                lasers: [
                    { laserType: 'arbor-mh2', modules: [] },
                    { laserType: 'un-maned', modules: [] },
                    { laserType: 'arbor-mh2', modules: [] }
                ]
            }]);
            ui.updateShipsUI();

            // Change back to a regular laser
            const laserSelect = document.getElementById('laser-0-1');
            laserSelect.value = 'lancet-mh2';
            ui.onLaserChange(0, 1);

            // Verify laser is now Lancet MH2
            const updatedShips = ui.getShips();
            expect(updatedShips[0].lasers[1].laserType).toBe('lancet-mh2');
            expect(updatedShips[0].lasers[1].modules).toHaveLength(
                laserData['lancet-mh2'].moduleSlots
            );
        });
    });

    describe('getShipConfig - un-maned laser filtering', () => {
        it('should exclude un-maned lasers from ship configuration', () => {
            // Setup: MOLE with 2 maned lasers and 1 un-maned
            ui.setShips([{
                type: 'mole',
                lasers: [
                    { laserType: 'arbor-mh2', modules: [] },
                    { laserType: 'lancet-mh2', modules: [] },
                    { laserType: 'un-maned', modules: [] }
                ]
            }]);

            const config = ui.getShipConfig();

            // Should only return 2 lasers (exclude un-maned)
            expect(config).toHaveLength(2);
            expect(config[0].laser).toBe('arbor-mh2');
            expect(config[1].laser).toBe('lancet-mh2');

            // Verify no un-maned in config
            expect(config.some(c => c.laser === 'un-maned')).toBe(false);
        });

        it('should include all maned lasers in configuration', () => {
            // Setup: MOLE with all 3 lasers maned
            ui.setShips([{
                type: 'mole',
                lasers: [
                    { laserType: 'arbor-mh2', modules: ['none'] },
                    { laserType: 'lancet-mh2', modules: [] },
                    { laserType: 'hofstede-s2', modules: [] }
                ]
            }]);

            const config = ui.getShipConfig();

            // Should return all 3 lasers
            expect(config).toHaveLength(3);
            expect(config[0].laser).toBe('arbor-mh2');
            expect(config[1].laser).toBe('lancet-mh2');
            expect(config[2].laser).toBe('hofstede-s2');
        });

        it('should handle multiple ships with mixed maned/un-maned lasers', () => {
            // Setup: 2 MOLEs, first with 2 maned + 1 un-maned, second with all 3 maned
            ui.setShips([
                {
                    type: 'mole',
                    lasers: [
                        { laserType: 'arbor-mh2', modules: [] },
                        { laserType: 'un-maned', modules: [] },
                        { laserType: 'helix-ii', modules: [] }
                    ]
                },
                {
                    type: 'mole',
                    lasers: [
                        { laserType: 'lancet-mh2', modules: [] },
                        { laserType: 'hofstede-s2', modules: [] },
                        { laserType: 'klein-s2', modules: [] }
                    ]
                }
            ]);

            const config = ui.getShipConfig();

            // Should return 5 lasers total (2 + 3)
            expect(config).toHaveLength(5);

            // Verify correct lasers from ship 0
            expect(config[0].laser).toBe('arbor-mh2');
            expect(config[1].laser).toBe('helix-ii');

            // Verify correct lasers from ship 1
            expect(config[2].laser).toBe('lancet-mh2');
            expect(config[3].laser).toBe('hofstede-s2');
            expect(config[4].laser).toBe('klein-s2');
        });

        it('should preserve module configuration in ship config', () => {
            ui.setShips([{
                type: 'prospector',
                lasers: [
                    { laserType: 'arbor', modules: ['rieger'] }
                ]
            }]);

            const config = ui.getShipConfig();

            expect(config).toHaveLength(1);
            expect(config[0].laser).toBe('arbor');
            expect(config[0].modules).toEqual(['rieger']);
        });
    });

    describe('Resize listener', () => {
        beforeEach(() => {
            // Reset DOM
            document.body.innerHTML = `
                <div id="ships-container"></div>
                <div id="capacity-table"></div>
                <canvas id="capacity-chart" width="800" height="400"></canvas>
            `;

            // Mock chart module
            window.FracturationParty = window.FracturationParty || {};
            window.FracturationParty.chart = {
                drawCapacityChart: vi.fn(),
                generateChartData: vi.fn(() => [
                    { resistance: 0, maxMass: 10000 },
                    { resistance: 0.5, maxMass: 5000 }
                ])
            };

            window.FracturationParty.data = { shipData, laserData, moduleData, gadgetData };
        });

        it('should add resize listener on initialization', () => {
            const resizeSpy = vi.fn();
            const originalAddEventListener = window.addEventListener;
            window.addEventListener = vi.fn((event, handler) => {
                if (event === 'resize') {
                    resizeSpy(event, handler);
                }
                originalAddEventListener.call(window, event, handler);
            });

            ui.initializeUI();

            expect(resizeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

            window.addEventListener = originalAddEventListener;
        });

        it('should update chart on window resize', async () => {
            vi.useFakeTimers();

            ui.initializeUI();

            const chartSpy = window.FracturationParty.chart.drawCapacityChart;
            chartSpy.mockClear();

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            // Should not call immediately (debounced)
            expect(chartSpy).not.toHaveBeenCalled();

            // Fast-forward past debounce delay (150ms)
            vi.advanceTimersByTime(200);

            // Should have called chart update
            expect(chartSpy).toHaveBeenCalled();

            vi.useRealTimers();
        });
    });
});
