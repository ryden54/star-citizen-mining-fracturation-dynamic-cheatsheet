// Ship utility functions
// Functions for creating ships and determining laser compatibility

/**
 * Initialize a new ship with default lasers
 * @param {string} shipType - 'prospector', 'mole', or 'golem'
 * @returns {Object} New ship object
 */
function createShip(shipType) {
    const { shipData, laserData } = window.FracturationParty.data;
    const shipSpec = shipData[shipType];

    // Handle ships with fixed lasers (like Golem)
    if (shipSpec.fixedLaser) {
        const fixedLaserKey = shipSpec.fixedLaser;
        const laser = laserData[fixedLaserKey];
        return {
            type: shipType,
            lasers: [{
                laserType: fixedLaserKey,
                modules: Array(laser.moduleSlots).fill('none')
            }]
        };
    }

    // Handle ships with configurable lasers
    const defaultLaser = shipType === 'prospector' ? 'arbor' : 'arbor-mh2';
    const laser = laserData[defaultLaser];

    const lasers = [];
    for (let i = 0; i < shipSpec.laserCount; i++) {
        lasers.push({
            laserType: defaultLaser,
            modules: Array(laser.moduleSlots).fill('none')
        });
    }

    return {
        type: shipType,
        lasers: lasers
    };
}

/**
 * Get lasers compatible with specified ship type
 * @param {string} shipType - 'prospector', 'mole', or 'golem'
 * @returns {Object} Compatible lasers
 */
function getCompatibleLasers(shipType) {
    const { shipData, laserData } = window.FracturationParty.data;
    const ship = shipData[shipType];
    const compatibleLasers = {};

    for (const laserKey in laserData) {
        const laser = laserData[laserKey];

        // Check size compatibility
        if (laser.size !== ship.laserSize) {
            continue;
        }

        // If laser has compatibleShips property, check if current ship is in the list
        if (laser.compatibleShips && laser.compatibleShips.length > 0) {
            if (!laser.compatibleShips.includes(shipType)) {
                continue; // Skip this laser if ship is not in compatible list
            }
        }

        compatibleLasers[laserKey] = laser;
    }

    return compatibleLasers;
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.shipUtils = {
    createShip,
    getCompatibleLasers
};
