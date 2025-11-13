// Laser data based on Star Citizen 4.x specifications
// Power values are extraction power from game data

const laserData = {
    'arbor': {
        fracturingPower: 1890,
        extractionPower: 1850,
        instability: 1.0,
        resistance: 1.0,
        moduleSlots: 3,
        name: 'Arbor MH1',
        description: 'Default laser. Trade-off: Balanced performance, no bonuses.'
    },
    'hofstede': {
        fracturingPower: 2100,
        extractionPower: 1295,
        instability: 0.5,
        resistance: 0.7,  // -30% resistance bonus
        moduleSlots: 3,
        name: 'Hofstede S1',
        description: 'Specialized in fracturing dense materials. Trade-off: Lower extraction speed.'
    },
    'helix': {
        fracturingPower: 3150,
        extractionPower: 1850,
        instability: 0.6,
        resistance: 0.7,   // -30% resistance bonus
        moduleSlots: 3,
        name: 'Helix I',
        description: 'High fracturing power for tough rocks. Trade-off: Consumes more power.'
    },
    'lancet': {
        fracturingPower: 2520,
        extractionPower: 1850,
        instability: 0.7,
        resistance: 1.0,
        moduleSlots: 3,
        name: 'Lancet MH1',
        description: 'Support laser that stabilizes fracturing. Trade-off: No power loss.'
    },
    'klein-s1': {
        fracturingPower: 2220,
        extractionPower: 2220,
        instability: 1.20, // +20% inert materials
        resistance: 0.55,  // -45% resistance
        moduleSlots: 3,
        name: 'Klein-S1',
        description: 'Excellent for very dense rocks. Trade-off: Increased inert materials.'
    },
    'impact-i': {
        fracturingPower: 2100,
        extractionPower: 2775,
        instability: 1.20, // +20% inert materials
        resistance: 1.10,  // +10% resistance
        moduleSlots: 3,
        name: 'Impact I',
        description: 'High extraction speed. Trade-off: Increased rock resistance and inert materials.'
    }
};

// Mining modules data
// Power multipliers: <1.0 = reduces extraction power, >1.0 = increases power
// Note: Charge window and charge rate benefits are not modeled in mass calculations
// (they only affect gameplay, not fracture capacity)
const moduleData = {
    'none': { name: '(None)', manufacturer: 'System', fracturingPowerModifier: 1.0, extractionPowerModifier: 1.0, effects: [] },
    // Greycat Industrial
    'fltr': { name: 'FLTR', manufacturer: 'Greycat Industrial', fracturingPowerModifier: 0.85, extractionPowerModifier: 1.0, effects: [{ text: 'Filters inert materials', type: 'pro' }] },
    'fltr-l': { name: 'FLTR-L', manufacturer: 'Greycat Industrial', fracturingPowerModifier: 0.90, extractionPowerModifier: 1.0, effects: [{ text: 'Filters inert materials', type: 'pro' }] },
    'fltr-xl': { name: 'FLTR-XL', manufacturer: 'Greycat Industrial', fracturingPowerModifier: 0.95, extractionPowerModifier: 1.0, effects: [{ text: 'Filters inert materials', type: 'pro' }] },
    'xtr': { name: 'XTR', manufacturer: 'Greycat Industrial', fracturingPowerModifier: 1.0, extractionPowerModifier: 0.85, effects: [{ text: 'Filters inert materials', type: 'pro' }, { text: 'Optimal Window: +15%', type: 'pro' }] },
    'xtr-l': { name: 'XTR-L', manufacturer: 'Greycat Industrial', fracturingPowerModifier: 1.0, extractionPowerModifier: 0.90, effects: [{ text: 'Filters inert materials', type: 'pro' }, { text: 'Optimal Window: +22%', type: 'pro' }] },
    // Thermyte Concern
    'focus': { name: 'Focus', manufacturer: 'Thermyte Concern', fracturingPowerModifier: 0.85, extractionPowerModifier: 1.30, effects: [] },
    'focus-ii': { name: 'Focus II', manufacturer: 'Thermyte Concern', fracturingPowerModifier: 0.90, extractionPowerModifier: 1.37, effects: [] },
    'focus-iii': { name: 'Focus III', manufacturer: 'Thermyte Concern', fracturingPowerModifier: 0.95, extractionPowerModifier: 1.40, effects: [] },
    // Shubin Interstellar
    'rieger': { name: 'Rieger', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.15, extractionPowerModifier: 1.0, effects: [{ text: 'Optimal Window: -10%', type: 'con' }] },
    'rieger-c2': { name: 'Rieger-C2', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.20, extractionPowerModifier: 1.0, effects: [{ text: 'Optimal Window: -3%', type: 'con' }] },
    'rieger-c3': { name: 'Rieger-C3', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.25, extractionPowerModifier: 1.0, effects: [{ text: 'Optimal Window: -1%', type: 'con' }] },
    'vaux': { name: 'Vaux', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.0, extractionPowerModifier: 1.15, effects: [{ text: 'Optimal Charge Rate: -20%', type: 'con' }] },
    'vaux-c2': { name: 'Vaux-C2', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.0, extractionPowerModifier: 1.20, effects: [{ text: 'Optimal Charge Rate: -15%', type: 'con' }] },
    'vaux-c3': { name: 'Vaux-C3', manufacturer: 'Shubin Interstellar', fracturingPowerModifier: 1.0, extractionPowerModifier: 1.25, effects: [{ text: 'Optimal Charge Rate: -5%', type: 'con' }] }
};

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.data = {
    laserData: laserData,
    moduleData: moduleData
};
