// Ship specifications
const shipData = {
    'golem': {
        name: 'Golem',
        manufacturer: 'Drake Interplanetary',
        capacity: 32,
        laserCount: 1,
        laserSize: 1,
        fixedLaser: 'pitman',
        order: 1
    },
    'prospector': {
        name: 'Prospector',
        manufacturer: 'MISC',
        capacity: 32,
        laserCount: 1,
        laserSize: 1,
        order: 2
    },
    'mole': {
        name: 'MOLE',
        manufacturer: 'Argo Astronautics',
        capacity: 96,
        laserCount: 3,
        laserSize: 2,
        order: 3
    }
};

// Export to global namespace (will be aggregated by index.js)
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.shipData = shipData;
