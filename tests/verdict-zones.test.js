// Test to verify that verdict zones match actual in-game difficulty labels
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';

// Load calculations module to get thresholds
import '../public/js/calculations.js';

describe('Verdict Zones', () => {
    let referenceData, THRESHOLDS;
    const baseline = 9500;

    beforeAll(async () => {
        // Load reference data from JS module
        const dataModule = await import('../public/js/data/reference-prospector.js');
        referenceData = dataModule.REFERENCE_DATA_PROSPECTOR;

        // Import calculations module in Node.js environment
        const calculationsCode = readFileSync('./public/js/calculations.js', 'utf-8');
        // Simulate browser environment
        global.window = { FracturationParty: { data: {} } };
        eval(calculationsCode);
        THRESHOLDS = global.window.FracturationParty.calculations.VERDICT_THRESHOLDS;
    });

    function calculateMarginPercentage(mass, resistance) {
        const maxMass = baseline * (1 - resistance / 100);
        return ((maxMass - mass) / maxMass) * 100;
    }

    function predictDifficulty(marginPct) {
        if (marginPct >= THRESHOLDS.easy.min) return 'easy';
        if (marginPct >= THRESHOLDS.medium.min) return 'medium';
        if (marginPct >= THRESHOLDS.hard.min) return 'hard';
        if (marginPct >= THRESHOLDS.challenging.min) return 'challenging';
        return 'impossible';
    }

    it('should correctly predict difficulty for all fracturable rocks', () => {
        const fracturableCases = referenceData.test_cases.filter(tc => tc.fracturable);
        const mismatches = [];

        fracturableCases.forEach(tc => {
            const marginPct = calculateMarginPercentage(tc.masse_kg, tc.resistance_pct);
            const predicted = predictDifficulty(marginPct);

            if (predicted !== tc.difficulty) {
                mismatches.push({
                    id: tc.id,
                    mass: tc.masse_kg,
                    resistance: tc.resistance_pct,
                    marginPct: marginPct.toFixed(2) + '%',
                    expected: tc.difficulty,
                    predicted: predicted
                });
            }
        });

        if (mismatches.length > 0) {
            console.log('\n❌ Verdict zone mismatches:');
            console.table(mismatches);
        }

        expect(mismatches).toHaveLength(0);
    });

    it('should have no gaps or overlaps in difficulty thresholds', () => {
        expect(THRESHOLDS.challenging.max).toBe(THRESHOLDS.hard.min);
        expect(THRESHOLDS.hard.max).toBe(THRESHOLDS.medium.min);
        expect(THRESHOLDS.medium.max).toBe(THRESHOLDS.easy.min);
    });

    it('should match challenging difficulty for case #12 and #27', () => {
        const case12 = referenceData.test_cases.find(tc => tc.id === 12);
        const case27 = referenceData.test_cases.find(tc => tc.id === 27);

        const margin12 = calculateMarginPercentage(case12.masse_kg, case12.resistance_pct);
        const margin27 = calculateMarginPercentage(case27.masse_kg, case27.resistance_pct);

        expect(predictDifficulty(margin12)).toBe('challenging');
        expect(predictDifficulty(margin27)).toBe('challenging');
        expect(margin12).toBeGreaterThanOrEqual(THRESHOLDS.challenging.min);
        expect(margin12).toBeLessThan(THRESHOLDS.challenging.max);
        expect(margin27).toBeGreaterThanOrEqual(THRESHOLDS.challenging.min);
        expect(margin27).toBeLessThan(THRESHOLDS.challenging.max);
    });

    it('should match hard difficulty for case #2', () => {
        const case2 = referenceData.test_cases.find(tc => tc.id === 2);
        const margin = calculateMarginPercentage(case2.masse_kg, case2.resistance_pct);

        expect(predictDifficulty(margin)).toBe('hard');
        expect(margin).toBeGreaterThanOrEqual(THRESHOLDS.hard.min);
        expect(margin).toBeLessThan(THRESHOLDS.hard.max);
    });

    it('should match medium difficulty for cases #19, #31, #58', () => {
        const mediumCases = [19, 31, 58];

        mediumCases.forEach(id => {
            const testCase = referenceData.test_cases.find(tc => tc.id === id);
            const margin = calculateMarginPercentage(testCase.masse_kg, testCase.resistance_pct);

            expect(predictDifficulty(margin)).toBe('medium');
            expect(margin).toBeGreaterThanOrEqual(THRESHOLDS.medium.min);
            expect(margin).toBeLessThan(THRESHOLDS.medium.max);
        });
    });

    it('should match easy difficulty for all remaining fracturable cases', () => {
        const easyCases = referenceData.test_cases.filter(tc =>
            tc.fracturable && tc.difficulty === 'easy'
        );

        easyCases.forEach(tc => {
            const margin = calculateMarginPercentage(tc.masse_kg, tc.resistance_pct);
            expect(predictDifficulty(margin)).toBe('easy');
            expect(margin).toBeGreaterThanOrEqual(THRESHOLDS.easy.min);
        });
    });

    it('should display actual margin ranges for each difficulty', () => {
        const fracturableCases = referenceData.test_cases.filter(tc => tc.fracturable);
        const byDifficulty = {};

        fracturableCases.forEach(tc => {
            const margin = calculateMarginPercentage(tc.masse_kg, tc.resistance_pct);
            if (!byDifficulty[tc.difficulty]) {
                byDifficulty[tc.difficulty] = [];
            }
            byDifficulty[tc.difficulty].push(margin);
        });

        console.log('\n📊 Actual margin ranges from measurements:');
        Object.entries(byDifficulty).forEach(([difficulty, margins]) => {
            const min = Math.min(...margins).toFixed(2);
            const max = Math.max(...margins).toFixed(2);
            const avg = (margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(2);
            console.log(`  ${difficulty.padEnd(12)}: ${min}% - ${max}% (avg: ${avg}%, ${margins.length} cases)`);
        });

        // This is just informational, always passes
        expect(true).toBe(true);
    });
});
