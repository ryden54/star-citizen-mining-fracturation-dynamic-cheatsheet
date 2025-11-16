import { describe, it, expect } from 'vitest';
import {
    laserData,
    moduleData,
    gadgetData,
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateRockResistance,
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
        // The formula is based on a baseline of 10000kg for an Arbor (validated against in-game data)
        expect(maxMass).toBeCloseTo(10000, -2); // Within a tolerance of 100kg
    });

    it('should calculate max mass for single Arbor at 0.25 resistance', () => {
        const maxMass = calculateMaxMass(0.25, createShips('arbor'));
        // Linear formula: 10000 * (1 - 0.25) = 7500
        const expectedMass = 10000 * (1 - 0.25);
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

describe('Gadget Data', () => {
    it('should have all gadget types defined', () => {
        expect(gadgetData).toBeDefined();
        expect(gadgetData.boremax).toBeDefined();
        expect(gadgetData.okunis).toBeDefined();
        expect(gadgetData.optimax).toBeDefined();
        expect(gadgetData.sabir).toBeDefined();
        expect(gadgetData.stalwart).toBeDefined();
        expect(gadgetData.waveshift).toBeDefined();
    });

    it('should have correct properties for each gadget', () => {
        Object.values(gadgetData).forEach(gadget => {
            expect(gadget).toHaveProperty('name');
            expect(gadget).toHaveProperty('manufacturer');
            expect(gadget).toHaveProperty('rockInstability');
            expect(gadget).toHaveProperty('rockResistance');
            expect(gadget).toHaveProperty('effects');
            expect(Array.isArray(gadget.effects)).toBe(true);
        });
    });
});

describe('calculateRockResistance', () => {
    it('should return base resistance with no gadgets', () => {
        const resistance = calculateRockResistance(0.5, []);
        expect(resistance).toBe(0.5);
    });

    it('should reduce resistance with Sabir gadget', () => {
        const baseResistance = 0.5;
        const resistance = calculateRockResistance(baseResistance, ['sabir']);
        // Sabir has -50% rock resistance, so: 0.5 * (1 - 0.5) = 0.25
        expect(resistance).toBeCloseTo(0.25);
    });

    it('should reduce resistance with OptiMax gadget', () => {
        const baseResistance = 0.5;
        const resistance = calculateRockResistance(baseResistance, ['optimax']);
        // OptiMax has -30% rock resistance, so: 0.5 * (1 - 0.3) = 0.35
        expect(resistance).toBeCloseTo(0.35);
    });

    it('should increase resistance with BoreMax gadget', () => {
        const baseResistance = 0.5;
        const resistance = calculateRockResistance(baseResistance, ['boremax']);
        // BoreMax has +10% rock resistance, so: 0.5 * (1 + 0.1) = 0.55
        expect(resistance).toBeCloseTo(0.55);
    });

    it('should not change resistance with Okunis gadget', () => {
        const baseResistance = 0.5;
        const resistance = calculateRockResistance(baseResistance, ['okunis']);
        // Okunis has 0% rock resistance modifier
        expect(resistance).toBe(0.5);
    });

    it('should stack multiple gadgets additively', () => {
        const baseResistance = 0.5;
        const resistance = calculateRockResistance(baseResistance, ['sabir', 'optimax']);
        // Sabir: -50%, OptiMax: -30%, total: -80%
        // 0.5 * (1 - 0.5 - 0.3) = 0.5 * 0.2 = 0.1
        expect(resistance).toBeCloseTo(0.1);
    });

    it('should clamp resistance at 0 when gadgets reduce it below 0', () => {
        const baseResistance = 0.3;
        const resistance = calculateRockResistance(baseResistance, ['sabir', 'optimax']);
        // 0.3 * (1 - 0.5 - 0.3) = 0.3 * 0.2 = 0.06, should be >= 0
        expect(resistance).toBeGreaterThanOrEqual(0);
    });

    it('should clamp resistance at 1 when gadgets increase it above 1', () => {
        const baseResistance = 0.95;
        const resistance = calculateRockResistance(baseResistance, ['boremax']);
        // 0.95 * 1.1 = 1.045, should be clamped to 1
        expect(resistance).toBeLessThanOrEqual(1);
    });
});

describe('calculateMaxMass with gadgets', () => {
    it('should maintain backward compatibility with no gadgets parameter', () => {
        const maxMassNoGadgets = calculateMaxMass(0.5, createShips('arbor'));
        const maxMassEmptyArray = calculateMaxMass(0.5, createShips('arbor'), []);
        expect(maxMassNoGadgets).toBe(maxMassEmptyArray);
    });

    it('should increase max mass when using resistance-reducing gadget', () => {
        const maxMassNoGadget = calculateMaxMass(0.5, createShips('arbor'), []);
        const maxMassWithSabir = calculateMaxMass(0.5, createShips('arbor'), ['sabir']);
        // Sabir reduces rock resistance by 50%, making it easier to fracture
        expect(maxMassWithSabir).toBeGreaterThan(maxMassNoGadget);
    });

    it('should decrease max mass when using resistance-increasing gadget', () => {
        const maxMassNoGadget = calculateMaxMass(0.5, createShips('arbor'), []);
        const maxMassWithBoreMax = calculateMaxMass(0.5, createShips('arbor'), ['boremax']);
        // BoreMax increases rock resistance by 10%, making it harder to fracture
        expect(maxMassWithBoreMax).toBeLessThan(maxMassNoGadget);
    });

    it('should calculate correctly with multiple gadgets', () => {
        const maxMassNoGadgets = calculateMaxMass(0.6, createShips('arbor'), []);
        const maxMassWithGadgets = calculateMaxMass(0.6, createShips('arbor'), ['sabir', 'optimax']);
        // Both Sabir and OptiMax reduce resistance, so max mass should increase significantly
        expect(maxMassWithGadgets).toBeGreaterThan(maxMassNoGadgets);
    });

    it('should work with gadgets that do not affect resistance', () => {
        const maxMassNoGadget = calculateMaxMass(0.5, createShips('arbor'), []);
        const maxMassWithStalwart = calculateMaxMass(0.5, createShips('arbor'), ['stalwart']);
        // Stalwart doesn't affect rock resistance, only laser instability and window
        expect(maxMassWithStalwart).toBe(maxMassNoGadget);
    });

    it('should combine laser resistance modifiers with gadget resistance modifiers', () => {
        // Helix has 0.7 resistance modifier (-30%)
        // Sabir reduces rock resistance by 50%
        const baseResistance = 0.5;
        const rockResistanceAfterGadget = baseResistance * (1 - 0.5); // 0.25
        const effectiveResistance = rockResistanceAfterGadget * 0.7; // 0.175

        const maxMass = calculateMaxMass(baseResistance, createShips('helix'), ['sabir']);
        // Linear formula: 10000 * (helix_power/arbor_power) * (1 - effective_resistance)
        const expectedMass = 10000 * (laserData.helix.fracturingPower / 1890) * (1 - effectiveResistance);

        expect(maxMass).toBeCloseTo(expectedMass, -2);
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

    it('should handle realistic mining scenario with gadgets', () => {
        // Scenario: 2 Helix lasers with Rieger modules and a Sabir gadget on a 60% resistance rock
        const config = [
            createShip('helix', ['rieger', 'rieger', 'rieger']),
            createShip('helix', ['rieger', 'rieger', 'rieger'])
        ];
        const maxMassNoGadget = calculateMaxMass(0.60, config, []);
        const maxMassWithSabir = calculateMaxMass(0.60, config, ['sabir']);

        // Sabir reduces resistance by 50%, so 60% becomes 30%
        // With linear formula, the difference should be significant
        // Without Sabir: (1 - 0.60*0.7*0.7) = 0.706 factor
        // With Sabir: (1 - 0.30*0.7*0.7) = 0.853 factor
        // Ratio: 0.853 / 0.706 = ~1.21x
        expect(maxMassWithSabir).toBeGreaterThan(maxMassNoGadget);
    });

    it('should handle multiple gadgets on difficult rock', () => {
        // Scenario: Very high resistance rock (80%) with optimal gadget setup
        const config = createShips('helix', 'helix');
        const maxMassNoGadgets = calculateMaxMass(0.80, config, []);
        const maxMassWithGadgets = calculateMaxMass(0.80, config, ['sabir', 'optimax']);

        // With Sabir (-50%) and OptiMax (-30%), the effective resistance is much lower
        // This should dramatically increase the max mass
        expect(maxMassWithGadgets).toBeGreaterThan(maxMassNoGadgets);
    });
});

describe('In-game reference data validation (Prospector rental)', () => {
    // Load reference data from in-game screenshots
    const referenceData = {
        "metadata": {
            "description": "Données de référence extraites de captures d'écran in-game (Star Citizen Live)",
            "ship": "Prospector (location)",
            "laser": "Arbor MH1 (laser par défaut)",
            "modules": "Aucun module installé",
            "gadgets": "Aucun gadget actif",
            "location": "Surface de lunes (pas d'astéroïdes)",
            "date": "2025-11-16"
        },
        "test_cases": [
            { "id": 1, "masse_kg": 8414, "resistance_pct": 40, "fracturable": false },
            { "id": 2, "masse_kg": 4814, "resistance_pct": 44, "fracturable": true },
            { "id": 3, "masse_kg": 5294, "resistance_pct": 10, "fracturable": true },
            { "id": 4, "masse_kg": 4814, "resistance_pct": 55, "fracturable": false },
            { "id": 5, "masse_kg": 7759, "resistance_pct": 39, "fracturable": false },
            { "id": 6, "masse_kg": 3540, "resistance_pct": 28, "fracturable": true },
            { "id": 7, "masse_kg": 7097, "resistance_pct": 36, "fracturable": false },
            { "id": 8, "masse_kg": 1456, "resistance_pct": 39, "fracturable": true },
            { "id": 9, "masse_kg": 5314, "resistance_pct": 54, "fracturable": false },
            { "id": 10, "masse_kg": 5678, "resistance_pct": 62, "fracturable": false },
            { "id": 11, "masse_kg": 1138, "resistance_pct": 38, "fracturable": true },
            { "id": 12, "masse_kg": 6418, "resistance_pct": 31, "fracturable": true },
            { "id": 13, "masse_kg": 3366, "resistance_pct": 20, "fracturable": true }
        ]
    };

    // Helper function to check if a rock is fracturable
    function canFracture(rockMass, rockResistance, ships, gadgets = []) {
        const maxMass = calculateMaxMass(rockResistance, ships, gadgets);
        return rockMass <= maxMass;
    }

    // Test configuration: single Prospector with default Arbor laser, no modules
    const prospectorConfig = createShips('arbor');

    it('should load reference data correctly', () => {
        expect(referenceData.test_cases).toHaveLength(13);
        expect(referenceData.metadata.ship).toBe('Prospector (location)');
    });

    it('should validate fracture formula against all in-game measurements', () => {
        const allResults = [];
        let correctPredictions = 0;
        let incorrectPredictions = 0;
        const mismatches = [];

        // Analyze all test cases
        referenceData.test_cases.forEach(testCase => {
            const rockMass = testCase.masse_kg;
            const rockResistance = testCase.resistance_pct / 100;
            const expectedFracturable = testCase.fracturable;

            const maxMass = calculateMaxMass(rockResistance, prospectorConfig, []);
            const predictedFracturable = canFracture(rockMass, rockResistance, prospectorConfig, []);
            const match = predictedFracturable === expectedFracturable;

            if (match) {
                correctPredictions++;
            } else {
                incorrectPredictions++;
                mismatches.push({
                    id: testCase.id,
                    mass: rockMass,
                    resistance_pct: testCase.resistance_pct,
                    expected: expectedFracturable ? 'OUI' : 'NON',
                    predicted: predictedFracturable ? 'OUI' : 'NON',
                    maxMass,
                    diff: maxMass - rockMass,
                    diff_pct: ((maxMass - rockMass) / rockMass * 100).toFixed(1)
                });
            }

            allResults.push({
                id: testCase.id,
                mass: rockMass,
                resistance_pct: testCase.resistance_pct,
                expected: expectedFracturable ? 'OUI' : 'NON',
                predicted: predictedFracturable ? 'OUI' : 'NON',
                match: match ? '✓' : '✗',
                maxMass,
                margin: maxMass - rockMass,
                margin_pct: ((maxMass - rockMass) / rockMass * 100).toFixed(1)
            });
        });

        // Display complete analysis report
        console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
        console.log('║          VALIDATION FORMULE DE FRACTURATION - PROSPECTOR RENTAL            ║');
        console.log('╚════════════════════════════════════════════════════════════════════════════╝');
        console.log(`\nConfiguration: ${referenceData.metadata.ship} - ${referenceData.metadata.laser}`);
        console.log(`Données: ${referenceData.metadata.location} (${referenceData.metadata.date})\n`);

        console.log('=== RÉSULTATS POUR TOUS LES CAS DE TEST ===\n');
        console.table(allResults);

        const accuracy = (correctPredictions / referenceData.test_cases.length * 100).toFixed(1);
        console.log('\n=== RÉSUMÉ ===');
        console.log(`✓ Prédictions correctes: ${correctPredictions}/${referenceData.test_cases.length}`);
        console.log(`✗ Prédictions incorrectes: ${incorrectPredictions}/${referenceData.test_cases.length}`);
        console.log(`📊 Précision: ${accuracy}%`);

        if (mismatches.length > 0) {
            console.log('\n=== ÉCARTS DÉTECTÉS ===\n');
            console.table(mismatches);

            // Analyze patterns in mismatches
            const falseNegatives = mismatches.filter(m => m.expected === 'OUI' && m.predicted === 'NON');
            const falsePositives = mismatches.filter(m => m.expected === 'NON' && m.predicted === 'OUI');

            console.log('\n=== ANALYSE DES ÉCARTS ===');
            console.log(`Faux négatifs (formule dit NON, jeu dit OUI): ${falseNegatives.length}`);
            console.log(`Faux positifs (formule dit OUI, jeu dit NON): ${falsePositives.length}`);

            if (falseNegatives.length > 0) {
                console.log('\n⚠️  La formule SOUS-ESTIME la capacité de fracturation');
                const avgDiff = falseNegatives.reduce((sum, m) => sum + parseFloat(m.diff_pct), 0) / falseNegatives.length;
                console.log(`   Écart moyen: ${avgDiff.toFixed(1)}%`);
            }

            if (falsePositives.length > 0) {
                console.log('\n⚠️  La formule SUR-ESTIME la capacité de fracturation');
                const avgDiff = falsePositives.reduce((sum, m) => sum + parseFloat(m.diff_pct), 0) / falsePositives.length;
                console.log(`   Écart moyen: ${avgDiff.toFixed(1)}%`);
            }

            console.log('\n');
        } else {
            console.log('\n✅ TOUS LES CAS DE TEST SONT CORRECTS!\n');
        }

        // Fail the test if there are any mismatches
        expect(incorrectPredictions).toBe(0);
    });
});
