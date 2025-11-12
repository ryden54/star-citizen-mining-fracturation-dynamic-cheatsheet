// Laser data based on Star Citizen 4.x specifications
// Power values are extraction power from game data

const laserData = {
    'arbor': {
        power: 1850,
        instability: 1.0,
        resistance: 1.0,
        moduleSlots: 3,
        name: 'Arbor (default)',
        description: 'Standard rental laser - balanced but limited power'
    },
    'hofstede': {
        power: 1295,
        instability: 0.5,
        resistance: 0.7,  // -30% resistance bonus
        moduleSlots: 3,
        name: 'Hofstede S1',
        description: 'Lower power but excellent resistance reduction'
    },
    'helix': {
        power: 1850,
        instability: 0.6,  // -40% inert materials
        resistance: 0.7,   // -30% resistance bonus
        moduleSlots: 3,
        name: 'Helix I',
        description: 'Same extraction power as Arbor but better modifiers'
    },
    'lancet': {
        power: 1850,
        instability: 0.7,
        resistance: 1.0,
        moduleSlots: 3,
        name: 'Lancet MH1',
        description: 'Support laser - reduces instability for team mining'
    }
};

// Mining modules data
// Power multipliers: <1.0 = reduces extraction power, >1.0 = increases power
// Note: Charge window and charge rate benefits are not modeled in mass calculations
// (they only affect gameplay, not fracture capacity)
const moduleData = {
    'none': { power: 1.0, name: '(None)', description: 'No module' },
    // Greycat Industrial - Reduce power for wider optimal charge window (easier to use)
    'fltr': { power: 0.85, name: 'FLTR', description: '-15% power (easier green zone)' },
    'fltr-l': { power: 0.90, name: 'FLTR-L', description: '-10% power (easier green zone)' },
    'fltr-xl': { power: 0.95, name: 'FLTR-XL', description: '-5% power (easier green zone)' },
    'xtr': { power: 0.85, name: 'XTR', description: '-15% power, +15% optimal window' },
    'xtr-l': { power: 0.90, name: 'XTR-L', description: '-10% power, +22% optimal window' },
    'xtr-xl': { power: 0.95, name: 'XTR-XL', description: '-5% power, +25% optimal window' },
    // Thermyte Concern - Reduce power for faster charge (quicker fracturing)
    'focus': { power: 0.85, name: 'Focus', description: '-15% power, +30% charge speed' },
    'focus-ii': { power: 0.90, name: 'Focus II', description: '-10% power, +37% charge speed' },
    'focus-iii': { power: 0.95, name: 'Focus III', description: '-5% power, +40% charge speed' },
    // Shubin Interstellar - Pure power boost (harder rocks, but harder to control)
    'rieger': { power: 1.15, name: 'Rieger', description: '+15% power (harder to control)' },
    'rieger-c2': { power: 1.20, name: 'Rieger-C2', description: '+20% power (harder to control)' },
    'rieger-c3': { power: 1.25, name: 'Rieger-C3', description: '+25% power (harder to control)' },
    'vaux': { power: 1.15, name: 'Vaux', description: '+15% power (extraction focus)' },
    'vaux-c2': { power: 1.20, name: 'Vaux-C2', description: '+20% power (extraction focus)' },
    'vaux-c3': { power: 1.25, name: 'Vaux-C3', description: '+25% power (extraction focus)' }
};

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.data = {
    laserData: laserData,
    moduleData: moduleData
};
