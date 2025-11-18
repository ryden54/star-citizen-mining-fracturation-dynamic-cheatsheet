// Mining gadgets data
// Gadgets are placed on rocks to modify their properties
// Only rock instability and resistance affect fracturing calculations

const gadgetData = {
    'boremax': {
        name: 'BoreMax',
        manufacturer: 'Thermyte Concern',
        rockInstability: -0.70,    // -70% rock instability
        rockResistance: 0.10,      // +10% rock resistance
        effects: [
            { text: 'Rock Resistance: +10%', type: 'con' },
            { text: 'Rock Instability: -70%', type: 'pro' },
            { text: 'Cluster Modifier: +30%', type: 'pro' }
        ]
    },
    'okunis': {
        name: 'Okunis',
        manufacturer: 'Shubin Interstellar',
        rockInstability: -0.40,    // -40% rock instability
        rockResistance: 0.0,       // No resistance change
        effects: [
            { text: 'Rock Instability: -40%', type: 'pro' },
            { text: 'Opt. window size: +50%', type: 'pro' },
            { text: 'Opt. window rate: +100%', type: 'pro' },
            { text: 'Cluster Modifier: -20%', type: 'con' }
        ]
    },
    'optimax': {
        name: 'OptiMax',
        manufacturer: 'Greycat Industrial',
        rockInstability: 0.0,      // No instability change
        rockResistance: -0.30,     // -30% rock resistance
        effects: [
            { text: 'Rock Resistance: -30%', type: 'pro' },
            { text: 'Cluster Modifier: +60%', type: 'pro' },
            { text: 'Opt. window size: -30%', type: 'con' }
        ]
    },
    'sabir': {
        name: 'Sabir',
        manufacturer: 'Shubin Interstellar',
        rockInstability: 0.15,     // +15% rock instability
        rockResistance: -0.50,     // -50% rock resistance
        effects: [
            { text: 'Rock Resistance: -50%', type: 'pro' },
            { text: 'Rock Instability: +15%', type: 'con' },
            { text: 'Opt. window size: +50%', type: 'pro' }
        ]
    },
    'stalwart': {
        name: 'Stalwart',
        manufacturer: 'Thermyte Concern',
        rockInstability: 0.0,      // No rock instability change
        rockResistance: 0.0,       // No resistance change
        effects: [
            { text: 'Opt. window rate: +50%', type: 'pro' },
            { text: 'Cluster Modifier: +30%', type: 'pro' },
            { text: 'Laser Instability: +15%', type: 'con' },
            { text: 'Opt. window size: -30%', type: 'con' }
        ]
    },
    'waveshift': {
        name: 'WaveShift',
        manufacturer: 'Greycat Industrial',
        rockInstability: 0.0,      // No rock instability change
        rockResistance: 0.0,       // No resistance change
        effects: [
            { text: 'Opt. window size: +100%', type: 'pro' },
            { text: 'Laser Instability: -35%', type: 'pro' },
            { text: 'Opt. window rate: -30%', type: 'con' }
        ]
    }
};

// Export to global namespace (will be aggregated by index.js)
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.gadgetData = gadgetData;
