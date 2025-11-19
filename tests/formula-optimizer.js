// Script to find optimal fracture formula parameters
// Run with: node tests/formula-optimizer.js

import { REFERENCE_DATA_PROSPECTOR } from '../public/js/data/reference-prospector.js';
const referenceData = REFERENCE_DATA_PROSPECTOR;

const ARBOR_POWER = 1890; // Fracturing power from starcitizen.tools

console.log('═══════════════════════════════════════════════════════════');
console.log('   ANALYSIS: Finding optimal fracture formula parameters');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: Simple ratio approach
console.log('TEST 1: Simple ratio formula: power / (mass * resistance) >= threshold\n');

const ratios = [];
referenceData.test_cases.forEach(tc => {
    const ratio = ARBOR_POWER / (tc.masse_kg * (tc.resistance_pct / 100));
    ratios.push({
        id: tc.id,
        mass: tc.masse_kg,
        resistance: tc.resistance_pct,
        fracturable: tc.fracturable,
        difficulty: tc.difficulty,
        ratio: ratio.toFixed(3)
    });
});

console.table(ratios);

// Find threshold range
const fracturableRatios = ratios.filter(r => r.fracturable).map(r => parseFloat(r.ratio));
const nonFracturableRatios = ratios.filter(r => !r.fracturable).map(r => parseFloat(r.ratio));

const minFracturable = Math.min(...fracturableRatios);
const maxNonFracturable = Math.max(...nonFracturableRatios);

console.log(`\nRatio range for FRACTURABLE rocks: ${minFracturable.toFixed(3)} to ${Math.max(...fracturableRatios).toFixed(3)}`);
console.log(`Ratio range for NON-FRACTURABLE rocks: ${Math.min(...nonFracturableRatios).toFixed(3)} to ${maxNonFracturable.toFixed(3)}`);
console.log(`\nSuggested threshold: ${((minFracturable + maxNonFracturable) / 2).toFixed(3)}`);

// Test different thresholds
console.log('\n\nTEST 2: Testing different threshold values\n');
const thresholds = [0.7, 0.75, 0.8, 0.85, 0.9];
thresholds.forEach(threshold => {
    let correct = 0;
    let incorrect = 0;
    referenceData.test_cases.forEach(tc => {
        const ratio = ARBOR_POWER / (tc.masse_kg * (tc.resistance_pct / 100));
        const predicted = ratio >= threshold;
        if (predicted === tc.fracturable) {
            correct++;
        } else {
            incorrect++;
        }
    });
    const accuracy = (correct / referenceData.test_cases.length * 100).toFixed(1);
    console.log(`Threshold ${threshold}: ${correct}/${referenceData.test_cases.length} correct (${accuracy}%)`);
});

// Test 3: Exponential formula with different exponents
console.log('\n\nTEST 3: Exponential formula: maxMass = baseline * (1 - resistance)^exponent\n');

const baselines = [8000, 8500, 9000, 9500, 10000, 10500, 11000, 11500, 12000];
// Test fine-grained exponents to find 100% accurate formula
const exponents = [];
for (let exp = 0.8; exp <= 2.5; exp += 0.05) {
    exponents.push(parseFloat(exp.toFixed(2)));
}

let bestAccuracy = 0;
let bestParams = null;
const perfectFormulas = [];

baselines.forEach(baseline => {
    exponents.forEach(exponent => {
        let correct = 0;
        const margins = [];
        referenceData.test_cases.forEach(tc => {
            const resistance = tc.resistance_pct / 100;
            const maxMass = baseline * Math.pow(1 - resistance, exponent);
            const predicted = tc.masse_kg <= maxMass;
            if (predicted === tc.fracturable) {
                correct++;
            }
            if (tc.fracturable) {
                // Pour les roches fracturables, calculer la marge de sécurité
                const margin = ((maxMass - tc.masse_kg) / tc.masse_kg * 100);
                margins.push({
                    id: tc.id,
                    difficulty: tc.difficulty,
                    margin: margin.toFixed(1)
                });
            }
        });
        const accuracy = (correct / referenceData.test_cases.length * 100);
        if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestParams = { baseline, exponent, correct };
        }
        if (accuracy === 100) {
            console.log(`✓ baseline=${baseline}, exponent=${exponent}: ${correct}/${referenceData.test_cases.length} (100%)`);
            perfectFormulas.push({ baseline, exponent, margins });
        }
    });
});

console.log(`\nBest exponential formula: baseline=${bestParams.baseline}, exponent=${bestParams.exponent}`);
console.log(`Accuracy: ${bestAccuracy.toFixed(1)}% (${bestParams.correct}/${referenceData.test_cases.length})`);

// Test 4: Verify the best exponential formula in detail
console.log('\n\nTEST 4: Detailed analysis with best exponential parameters\n');
if (bestParams) {
    const results = [];
    referenceData.test_cases.forEach(tc => {
        const resistance = tc.resistance_pct / 100;
        const maxMass = bestParams.baseline * Math.pow(1 - resistance, bestParams.exponent);
        const predicted = tc.masse_kg <= maxMass;
        const match = predicted === tc.fracturable;
        results.push({
            id: tc.id,
            mass: tc.masse_kg,
            res: tc.resistance_pct,
            expected: tc.fracturable ? 'OUI' : 'NON',
            predicted: predicted ? 'OUI' : 'NON',
            match: match ? '✓' : '✗',
            maxMass: Math.round(maxMass),
            margin: Math.round(maxMass - tc.masse_kg),
            margin_pct: ((maxMass - tc.masse_kg) / tc.masse_kg * 100).toFixed(1)
        });
    });
    console.table(results);
}

// Test 5: Compare all perfect formulas by their safety margins
console.log('\n\nTEST 5: Comparing safety margins for all 100% accurate formulas\n');

console.log('Expected safety margins based on difficulty:');
console.log('- "easy": large margin (>50%)');
console.log('- "challenging": small margin (5-20%)');
console.log('- "hard": very small margin (<20%)\n');

perfectFormulas.forEach((formula, index) => {
    console.log(`\n--- Formula #${index + 1}: baseline=${formula.baseline}, exponent=${formula.exponent} ---`);
    console.table(formula.margins);

    // Calculate average margin for each difficulty level
    const easyMargins = formula.margins.filter(m => m.difficulty === 'easy').map(m => parseFloat(m.margin));
    const hardMargins = formula.margins.filter(m => m.difficulty === 'hard').map(m => parseFloat(m.margin));
    const challengingMargins = formula.margins.filter(m => m.difficulty === 'challenging').map(m => parseFloat(m.margin));

    if (easyMargins.length > 0) {
        const avgEasy = easyMargins.reduce((a, b) => a + b, 0) / easyMargins.length;
        console.log(`  Average "easy" margin: ${avgEasy.toFixed(1)}%`);
    }
    if (hardMargins.length > 0) {
        const avgHard = hardMargins.reduce((a, b) => a + b, 0) / hardMargins.length;
        console.log(`  Average "hard" margin: ${avgHard.toFixed(1)}%`);
    }
    if (challengingMargins.length > 0) {
        const avgChallenging = challengingMargins.reduce((a, b) => a + b, 0) / challengingMargins.length;
        console.log(`  Average "challenging" margin: ${avgChallenging.toFixed(1)}%`);
    }
});

console.log('\n\n═══ RECOMMENDATIONS ═══\n');
console.log('1. Formulas with lower exponents (1.0-1.5) give larger safety margins');
console.log('2. Formulas with higher exponents (2.0-2.5) give tighter margins');
console.log('3. The "best" formula depends on:');
console.log('   - Matching in-game difficulty labels to calculated margins');
console.log('   - Consistency across different rock types');
console.log('   - Behavior at extreme values (very low/high resistance)\n');
console.log('4. CRITICAL: We need more data points to distinguish between formulas!');
console.log('   Suggested measurements:');
console.log('   - Rocks at 0-5% resistance (baseline validation)');
console.log('   - Rocks at 45-55% resistance (differentiate formulas)');
console.log('   - Edge cases near the fracture/impossible boundary');
console.log('   - Tests with different lasers (Helix, Hofstede) to validate power scaling\n');

console.log('\n═══════════════════════════════════════════════════════════\n');
