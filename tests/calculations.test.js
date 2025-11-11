import { describe, it, expect } from 'vitest';
import {
    laserData,
    moduleData,
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateMaxMass
} from '../public/script.js';

// Helper function to create ship configurations
function createShip(laser, modules = ['none', 'none', 'none']) {
    return { laser, modules };
}

function createShips(...lasers) {
    return lasers.map(laser => createShip(laser));
}

describe('Laser Data', () => {
    it('should have all laser types defined', () => {
        expect(laserData).toBeDefined();
        expect(laserData.arbor).toBeDefined();
        expect(laserData.hofstede).toBeDefined();
        expect(laserData.helix).toBeDefined();
        expect(laserData.lancet).toBeDefined();
    });

    it('should have correct properties for each laser', () => {
        Object.values(laserData).forEach(laser => {
            expect(laser).toHaveProperty('power');
            expect(laser).toHaveProperty('instability');
            expect(laser).toHaveProperty('resistance');
            expect(laser).toHaveProperty('name');
        });
    });
});

describe('calculateCombinedPower', () => {
    it('should return 1850 for single Arbor laser', () => {
        const power = calculateCombinedPower(createShips('arbor'));
        expect(power).toBe(1850);
    });

    it('should add power values for multiple lasers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'arbor'));
        expect(power).toBe(3700); // 1850 + 1850
    });

    it('should correctly sum different laser powers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'helix')); // 1850 + 1850
        expect(power).toBe(3700);
    });

    it('should handle three lasers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'hofstede', 'helix')); // 1850 + 1295 + 1850
        expect(power).toBe(4995);
    });

    it('should apply module power multipliers', () => {
        // Single Arbor with 1 Rieger module (+115% = 2.15x)
        const power = calculateCombinedPower([createShip('arbor', ['rieger', 'none', 'none'])]);
        expect(power).toBeCloseTo(1850 * 2.15, 0); // 3977.5
    });

    it('should stack multiple module multipliers', () => {
        // Single Arbor with 3 Rieger modules (2.15 * 2.15 * 2.15)
        const power = calculateCombinedPower([createShip('arbor', ['rieger', 'rieger', 'rieger'])]);
        expect(power).toBeCloseTo(1850 * 2.15 * 2.15 * 2.15, 0); // ~18351
    });
});

describe('calculateCombinedModifiers', () => {
    it('should return 1.0 for single Arbor laser', () => {
        const modifiers = calculateCombinedModifiers(createShips('arbor'));
        expect(modifiers.instability).toBe(1.0);
        expect(modifiers.resistance).toBe(1.0);
    });

    it('should multiply modifier values', () => {
        const modifiers = calculateCombinedModifiers(createShips('hofstede', 'hofstede')); // 0.5 * 0.5, 0.7 * 0.7
        expect(modifiers.instability).toBe(0.25);
        expect(modifiers.resistance).toBeCloseTo(0.49); // 0.7 * 0.7
    });

    it('should calculate modifiers for mixed lasers', () => {
        const modifiers = calculateCombinedModifiers(createShips('arbor', 'lancet')); // 1.0 * 0.7, 1.0 * 1.0
        expect(modifiers.instability).toBeCloseTo(0.7);
        expect(modifiers.resistance).toBeCloseTo(1.0);
    });
});

describe('calculateMaxMass', () => {
    it('should calculate realistic max mass for single Arbor at 0% resistance', () => {
        const maxMass = calculateMaxMass(0.0, createShips('arbor'));
        // New formula: baseline 8000kg at 0% resistance
        expect(maxMass).toBeGreaterThan(7500);
        expect(maxMass).toBeLessThan(8500);
    });

    it('should calculate max mass for single Arbor at 0.25 resistance', () => {
        const maxMass = calculateMaxMass(0.25, createShips('arbor'));
        // With new formula: ~3897kg at 25% resistance (0.75^2.5 * 8000)
        expect(maxMass).toBeGreaterThan(3700);
        expect(maxMass).toBeLessThan(4100);
    });

    it('should increase max mass with lower resistance', () => {
        const maxMass1 = calculateMaxMass(0.10, createShips('arbor'));
        const maxMass2 = calculateMaxMass(0.20, createShips('arbor'));
        expect(maxMass1).toBeGreaterThan(maxMass2);
    });

    it('should increase max mass with more power', () => {
        const maxMassSingle = calculateMaxMass(0.25, createShips('arbor'));
        const maxMassDouble = calculateMaxMass(0.25, createShips('arbor', 'arbor'));
        expect(maxMassDouble).toBeGreaterThan(maxMassSingle);
        // Double Arbor should roughly double capacity
        expect(maxMassDouble).toBeCloseTo(maxMassSingle * 2, -2);
    });

    it('should cap max mass at 50000kg', () => {
        const maxMass = calculateMaxMass(0.01, createShips('helix', 'helix', 'helix'));
        expect(maxMass).toBeLessThanOrEqual(50000);
    });

    it('should never return negative mass', () => {
        const maxMass = calculateMaxMass(1.0, createShips('arbor'));
        expect(maxMass).toBeGreaterThanOrEqual(100);
    });

    it('should increase max mass with power-boosting modules', () => {
        // Single Arbor without modules
        const maxMassNoModules = calculateMaxMass(0.25, createShips('arbor'));
        // Single Arbor with Rieger module (+115% power)
        const maxMassWithModule = calculateMaxMass(0.25, [createShip('arbor', ['rieger', 'none', 'none'])]);
        expect(maxMassWithModule).toBeGreaterThan(maxMassNoModules * 2);
    });
});

describe('Real-world scenarios', () => {
    it('should handle two rental Prospectors (Arbor lasers)', () => {
        const config = createShips('arbor', 'arbor');
        const maxMass = calculateMaxMass(0.30, config);
        expect(maxMass).toBeGreaterThan(0);
        // Should approximately double the capacity
        const singleMass = calculateMaxMass(0.30, createShips('arbor'));
        expect(maxMass).toBeCloseTo(singleMass * 2, -2);
    });

    it('should handle upgraded setup (Helix lasers)', () => {
        const config = createShips('helix', 'helix');
        const maxMass = calculateMaxMass(0.40, config);

        const weakerConfig = createShips('arbor', 'arbor');
        const weakerMaxMass = calculateMaxMass(0.40, weakerConfig);

        expect(maxMass).toBeGreaterThan(weakerMaxMass);
    });

    it('should reflect Lancet support laser benefits', () => {
        const config = createShips('helix', 'lancet');
        const modifiers = calculateCombinedModifiers(config);

        // Lancet reduces instability for better control
        expect(modifiers.instability).toBeLessThan(1.0);
        // Helix provides resistance reduction
        expect(modifiers.resistance).toBeLessThan(1.0);
    });

    it('should handle ships with mixed modules configuration', () => {
        // One Arbor with Rieger, one Arbor with no modules
        const config = [
            createShip('arbor', ['rieger', 'none', 'none']),
            createShip('arbor', ['none', 'none', 'none'])
        ];
        const maxMass = calculateMaxMass(0.30, config);

        // Should be more than 2 Arbors without modules, but less than 2 Arbors both with Rieger
        const twoPlain = calculateMaxMass(0.30, createShips('arbor', 'arbor'));
        const twoRieger = calculateMaxMass(0.30, [
            createShip('arbor', ['rieger', 'none', 'none']),
            createShip('arbor', ['rieger', 'none', 'none'])
        ]);

        expect(maxMass).toBeGreaterThan(twoPlain);
        expect(maxMass).toBeLessThan(twoRieger);
    });
});
