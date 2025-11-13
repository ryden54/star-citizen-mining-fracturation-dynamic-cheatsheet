import { describe, it, expect } from 'vitest';
import {
    laserData,
    moduleData,
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateMaxMass
} from '../public/js/app.js';

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
            expect(laser).toHaveProperty('fracturingPower');
            expect(laser).toHaveProperty('extractionPower');
            expect(laser).toHaveProperty('instability');
            expect(laser).toHaveProperty('resistance');
            expect(laser).toHaveProperty('name');
        });
    });
});

describe('calculateCombinedPower', () => {
    it('should return the correct power for a single laser', () => {
        const power = calculateCombinedPower(createShips('arbor'));
        expect(power).toBe(laserData.arbor.fracturingPower);
    });

    it('should add power values for multiple lasers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'arbor'));
        const expectedPower = laserData.arbor.fracturingPower * 2;
        expect(power).toBe(expectedPower);
    });

    it('should correctly sum different laser powers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'helix'));
        const expectedPower = laserData.arbor.fracturingPower + laserData.helix.fracturingPower;
        expect(power).toBe(expectedPower);
    });

    it('should handle three lasers', () => {
        const power = calculateCombinedPower(createShips('arbor', 'hofstede', 'helix'));
        const expectedPower = laserData.arbor.fracturingPower + laserData.hofstede.fracturingPower + laserData.helix.fracturingPower;
        expect(power).toBe(expectedPower);
    });

    it('should apply module power multipliers', () => {
        const ships = [createShip('arbor', ['rieger', 'none', 'none'])];
        const power = calculateCombinedPower(ships);
        const expectedPower = laserData.arbor.fracturingPower * moduleData.rieger.fracturingPowerModifier;
        expect(power).toBeCloseTo(expectedPower);
    });

    it('should stack multiple module multipliers', () => {
        const ships = [createShip('arbor', ['rieger', 'rieger', 'rieger'])];
        const power = calculateCombinedPower(ships);
        const expectedPower = laserData.arbor.fracturingPower * Math.pow(moduleData.rieger.fracturingPowerModifier, 3);
        expect(power).toBeCloseTo(expectedPower);
    });

    it('should not apply fracturing power modifiers from modules that only affect extraction', () => {
        const ships = [createShip('arbor', ['vaux', 'none', 'none'])];
        const power = calculateCombinedPower(ships);
        // Vaux only affects extraction, so fracturing power should be unchanged
        expect(power).toBe(laserData.arbor.fracturingPower);
    });
});

describe('calculateCombinedModifiers', () => {
    it('should return 1.0 for single Arbor laser', () => {
        const modifiers = calculateCombinedModifiers(createShips('arbor'));
        expect(modifiers.instability).toBe(laserData.arbor.instability);
        expect(modifiers.resistance).toBe(laserData.arbor.resistance);
    });

    it('should multiply modifier values', () => {
        const modifiers = calculateCombinedModifiers(createShips('hofstede', 'hofstede'));
        const expectedInstability = laserData.hofstede.instability * laserData.hofstede.instability;
        const expectedResistance = laserData.hofstede.resistance * laserData.hofstede.resistance;
        expect(modifiers.instability).toBeCloseTo(expectedInstability);
        expect(modifiers.resistance).toBeCloseTo(expectedResistance);
    });

    it('should calculate modifiers for mixed lasers', () => {
        const modifiers = calculateCombinedModifiers(createShips('arbor', 'lancet'));
        const expectedInstability = laserData.arbor.instability * laserData.lancet.instability;
        const expectedResistance = laserData.arbor.resistance * laserData.lancet.resistance;
        expect(modifiers.instability).toBeCloseTo(expectedInstability);
        expect(modifiers.resistance).toBeCloseTo(expectedResistance);
    });
});

describe('calculateMaxMass', () => {
    it('should calculate realistic max mass for single Arbor at 0% resistance', () => {
        const maxMass = calculateMaxMass(0.0, createShips('arbor'));
        // The formula is based on a baseline of 8000kg for an Arbor, so it should be close to that.
        expect(maxMass).toBeCloseTo(8000, -2); // Within a tolerance of 100kg
    });

    it('should calculate max mass for single Arbor at 0.25 resistance', () => {
        const maxMass = calculateMaxMass(0.25, createShips('arbor'));
        const expectedMass = 8000 * Math.pow(1 - 0.25, 2.5);
        expect(maxMass).toBeCloseTo(expectedMass, -2);
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
        const maxMassNoModules = calculateMaxMass(0.25, createShips('arbor'));
        const maxMassWithModule = calculateMaxMass(0.25, [createShip('arbor', ['rieger', 'none', 'none'])]);
        const expectedMass = maxMassNoModules * moduleData.rieger.fracturingPowerModifier;
        expect(maxMassWithModule).toBeGreaterThan(maxMassNoModules);
        expect(maxMassWithModule).toBeCloseTo(expectedMass, -2);
    });
});

describe('Real-world scenarios', () => {
    it('should handle two rental Prospectors (Arbor lasers)', () => {
        const config = createShips('arbor', 'arbor');
        const maxMass = calculateMaxMass(0.30, config);
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
        const expectedInstability = laserData.helix.instability * laserData.lancet.instability;
        expect(modifiers.instability).toBe(expectedInstability);
    });

    it('should handle ships with mixed modules configuration', () => {
        const config = [
            createShip('arbor', ['rieger', 'none', 'none']),
            createShip('arbor', ['none', 'none', 'none'])
        ];
        const maxMass = calculateMaxMass(0.30, config);
        const twoPlain = calculateMaxMass(0.30, createShips('arbor', 'arbor'));
        const twoRieger = calculateMaxMass(0.30, [
            createShip('arbor', ['rieger', 'none', 'none']),
            createShip('arbor', ['rieger', 'none', 'none'])
        ]);
        expect(maxMass).toBeGreaterThan(twoPlain);
        expect(maxMass).toBeLessThan(twoRieger);
    });

    it('should handle power-reducing modules correctly', () => {
        const maxMassWithFLTR = calculateMaxMass(0.25, [createShip('arbor', ['fltr', 'none', 'none'])]);
        const maxMassNoModule = calculateMaxMass(0.25, createShips('arbor'));
        const expectedMass = maxMassNoModule * moduleData.fltr.fracturingPowerModifier;
        expect(maxMassWithFLTR).toBeLessThan(maxMassNoModule);
        expect(maxMassWithFLTR).toBeCloseTo(expectedMass, -2);
    });
});
