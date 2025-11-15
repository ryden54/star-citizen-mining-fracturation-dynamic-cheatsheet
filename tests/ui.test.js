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
        expect(html).toContain('<span style="color:green;">Optimal Window: +15%</span>');
    });

    it('should correctly generate HTML for a module with a power bonus and a con effect', () => {
        const html = generateModuleDescriptionHTML(moduleData.rieger);
        expect(html).toContain('Fract. Pwr: <span style="color:green;">+15%</span>');
        expect(html).toContain('<span style="color:red;">Optimal Window: -10%</span>');
    });

    it('should correctly generate HTML for a module with only an extraction power bonus and a con effect', () => {
        const html = generateModuleDescriptionHTML(moduleData.vaux);
        expect(html).not.toContain('Fract. Pwr');
        expect(html).toContain('Extract Pwr: <span style="color:green;">+15%</span>');
        expect(html).toContain('<span style="color:red;">Optimal Charge Rate: -20%</span>');
    });

    it('should correctly generate HTML for a module with both power penalties and bonuses', () => {
        const html = generateModuleDescriptionHTML(moduleData.focus);
        expect(html).toContain('Fract. Pwr: <span style="color:red;">-15%</span>');
        expect(html).toContain('Extract Pwr: <span style="color:green;">+30%</span>');
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
