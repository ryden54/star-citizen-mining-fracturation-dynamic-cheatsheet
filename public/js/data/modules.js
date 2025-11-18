// Mining modules data
// Power multipliers: <1.0 = reduces extraction power, >1.0 = increases power
// Note: Charge window and charge rate benefits are not modeled in mass calculations
// (they only affect gameplay, not fracture capacity)

const moduleData = {
    'none': {
        name: '(None)',
        manufacturer: 'System',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 1.0,
        effects: []
    },

    // Greycat Industrial
    'fltr': {
        name: 'FLTR',
        manufacturer: 'Greycat Industrial',
        fracturingPowerModifier: 0.85,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Filters inert materials', type: 'pro' }]
    },
    'fltr-l': {
        name: 'FLTR-L',
        manufacturer: 'Greycat Industrial',
        fracturingPowerModifier: 0.90,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Filters inert materials', type: 'pro' }]
    },
    'fltr-xl': {
        name: 'FLTR-XL',
        manufacturer: 'Greycat Industrial',
        fracturingPowerModifier: 0.95,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Filters inert materials', type: 'pro' }]
    },
    'xtr': {
        name: 'XTR',
        manufacturer: 'Greycat Industrial',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 0.85,
        effects: [
            { text: 'Filters inert materials', type: 'pro' },
            { text: 'Opt. window: +15%', type: 'pro' }
        ]
    },
    'xtr-l': {
        name: 'XTR-L',
        manufacturer: 'Greycat Industrial',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 0.90,
        effects: [
            { text: 'Filters inert materials', type: 'pro' },
            { text: 'Opt. window: +22%', type: 'pro' }
        ]
    },

    // Thermyte Concern
    'focus': {
        name: 'Focus',
        manufacturer: 'Thermyte Concern',
        fracturingPowerModifier: 0.85,
        extractionPowerModifier: 1.30,
        effects: []
    },
    'focus-ii': {
        name: 'Focus II',
        manufacturer: 'Thermyte Concern',
        fracturingPowerModifier: 0.90,
        extractionPowerModifier: 1.37,
        effects: []
    },
    'focus-iii': {
        name: 'Focus III',
        manufacturer: 'Thermyte Concern',
        fracturingPowerModifier: 0.95,
        extractionPowerModifier: 1.40,
        effects: []
    },

    // Shubin Interstellar
    'rieger': {
        name: 'Rieger',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.15,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Opt. window: -10%', type: 'con' }]
    },
    'rieger-c2': {
        name: 'Rieger-C2',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.20,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Opt. window: -3%', type: 'con' }]
    },
    'rieger-c3': {
        name: 'Rieger-C3',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.25,
        extractionPowerModifier: 1.0,
        effects: [{ text: 'Opt. window: -1%', type: 'con' }]
    },
    'vaux': {
        name: 'Vaux',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 1.15,
        effects: [{ text: 'Opt. charge rate: -20%', type: 'con' }]
    },
    'vaux-c2': {
        name: 'Vaux-C2',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 1.20,
        effects: [{ text: 'Opt. charge rate: -15%', type: 'con' }]
    },
    'vaux-c3': {
        name: 'Vaux-C3',
        manufacturer: 'Shubin Interstellar',
        fracturingPowerModifier: 1.0,
        extractionPowerModifier: 1.25,
        effects: [{ text: 'Opt. charge rate: -5%', type: 'con' }]
    }
};

// Export to global namespace (will be aggregated by index.js)
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.moduleData = moduleData;
