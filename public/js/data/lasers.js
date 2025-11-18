// Laser data based on Star Citizen 4.x specifications
// Power values are extraction power from game data

const laserData = {
    // Size 1 lasers (Prospector/Golem-compatible)
    'arbor': {
        fracturingPower: 1890,
        extractionPower: 1850,
        instability: 1.0,
        resistance: 1.0,
        moduleSlots: 1,
        size: 1,
        name: 'Arbor MH1',
        description: 'Default laser. Trade-off: Balanced performance, no bonuses.'
    },
    'hofstede': {
        fracturingPower: 2100,
        extractionPower: 1295,
        instability: 0.5,
        resistance: 0.7,  // -30% resistance bonus
        moduleSlots: 1,
        size: 1,
        name: 'Hofstede S1',
        description: 'Specialized in fracturing dense materials. Trade-off: Lower extraction speed.'
    },
    'helix': {
        fracturingPower: 3150,
        extractionPower: 1850,
        instability: 0.6,
        resistance: 0.7,   // -30% resistance bonus
        moduleSlots: 2,
        size: 1,
        name: 'Helix I',
        description: 'High fracturing power for tough rocks. Trade-off: Consumes more power.'
    },
    'lancet': {
        fracturingPower: 2520,
        extractionPower: 1850,
        instability: 0.7,
        resistance: 1.0,
        moduleSlots: 1,
        size: 1,
        name: 'Lancet MH1',
        description: 'Support laser that stabilizes fracturing. Trade-off: No power loss.'
    },
    'klein-s1': {
        fracturingPower: 2220,
        extractionPower: 2220,
        instability: 1.20, // +20% inert materials
        resistance: 0.55,  // -45% resistance
        moduleSlots: 0,
        size: 1,
        name: 'Klein-S1',
        description: 'Excellent for very dense rocks. Trade-off: Increased inert materials.'
    },
    'impact-i': {
        fracturingPower: 2100,
        extractionPower: 2775,
        instability: 1.20, // +20% inert materials
        resistance: 1.10,  // +10% resistance
        moduleSlots: 2,
        size: 1,
        name: 'Impact I',
        description: 'High extraction speed. Trade-off: Increased rock resistance and inert materials.'
    },
    'pitman': {
        fracturingPower: 3150,
        extractionPower: 1850,
        instability: 1.0,
        resistance: 1.0,
        moduleSlots: 2,
        size: 1,
        name: 'Pitman Mining Laser',
        description: 'Dedicated laser for the Golem. Designed for beginners with easy operator experience.',
        isFixed: true,
        compatibleShips: ['golem']
    },

    // Size 2 lasers (MOLE-compatible)
    'arbor-mh2': {
        fracturingPower: 2400,
        extractionPower: 2590,
        instability: 0.65,      // -35% laser instability
        resistance: 1.25,       // +25% resistance
        moduleSlots: 2,
        size: 2,
        name: 'Arbor MH2',
        description: 'Default MOLE laser. Trade-off: Balanced performance, slightly higher resistance.'
    },
    'lancet-mh2': {
        fracturingPower: 3600,
        extractionPower: 2590,
        instability: 0.90,      // -10% laser instability
        resistance: 1.0,
        moduleSlots: 2,
        size: 2,
        name: 'Lancet MH2',
        description: 'Support laser that stabilizes fracturing. Trade-off: No special bonuses.'
    },
    'hofstede-s2': {
        fracturingPower: 3360,
        extractionPower: 1295,
        instability: 1.10,      // +10% laser instability
        resistance: 0.70,       // -30% resistance
        moduleSlots: 2,
        size: 2,
        name: 'Hofstede-S2',
        description: 'Specialized in fracturing dense materials. Trade-off: Lower extraction speed, increased instability.'
    },
    'klein-s2': {
        fracturingPower: 3600,
        extractionPower: 2775,
        instability: 1.35,      // +35% laser instability
        resistance: 0.55,       // -45% resistance
        moduleSlots: 1,
        size: 2,
        name: 'Klein-S2',
        description: 'Excellent for very dense rocks. Trade-off: High instability, few module slots.'
    },
    'helix-ii': {
        fracturingPower: 4080,
        extractionPower: 2590,
        instability: 1.0,
        resistance: 0.70,       // -30% resistance
        moduleSlots: 3,
        size: 2,
        name: 'Helix II',
        description: 'High fracturing power for tough rocks. Trade-off: Consumes more power.'
    },
    'impact-ii': {
        fracturingPower: 3360,
        extractionPower: 3145,
        instability: 0.90,      // -10% laser instability
        resistance: 1.10,       // +10% resistance
        moduleSlots: 3,
        size: 2,
        name: 'Impact II',
        description: 'High extraction speed. Trade-off: Increased rock resistance.'
    }
};

// Export to global namespace (will be aggregated by index.js)
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.laserData = laserData;
