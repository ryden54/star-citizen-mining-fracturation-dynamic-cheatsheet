import { describe, it, expect } from 'vitest';
import { generateModuleDescriptionHTML } from '../public/js/app.js';
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
