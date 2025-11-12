// Calculation functions for mining capacity

/**
 * Calculate combined power from all ships with their laser and module configurations
 * @param {Array} ships - Array of ship configurations {laser, modules}
 * @returns {number} Total combined power
 */
function calculateCombinedPower(ships) {
    const { laserData, moduleData } = window.FracturationParty.data;
    // Power is additive - sum of all laser extraction powers (with module multipliers)
    let totalPower = 0;
    ships.forEach(ship => {
        let laserPower = laserData[ship.laser].power;

        // Apply module power multipliers (multiplicative)
        let modulePowerMultiplier = 1.0;
        ship.modules.forEach(moduleKey => {
            if (moduleKey && moduleKey !== 'none') {
                modulePowerMultiplier *= moduleData[moduleKey].power;
            }
        });

        totalPower += laserPower * modulePowerMultiplier;
    });
    return totalPower;
}

/**
 * Calculate combined modifiers (instability and resistance) from all ships
 * @param {Array} ships - Array of ship configurations {laser, modules}
 * @returns {Object} {instability: number, resistance: number}
 */
function calculateCombinedModifiers(ships) {
    const { laserData } = window.FracturationParty.data;
    // Modifiers multiply (diminishing returns)
    let instabilityMod = 1.0;
    let resistanceMod = 1.0;

    ships.forEach(ship => {
        instabilityMod *= laserData[ship.laser].instability;
        resistanceMod *= laserData[ship.laser].resistance;
    });

    return { instability: instabilityMod, resistance: resistanceMod };
}

/**
 * Calculate maximum fracturable mass for given resistance and ship configuration
 * @param {number} resistance - Rock resistance (0.0 to 1.0)
 * @param {Array} ships - Array of ship configurations {laser, modules}
 * @returns {number} Maximum fracturable mass in kg (rounded)
 */
function calculateMaxMass(resistance, ships) {
    const combinedPower = calculateCombinedPower(ships);
    const modifiers = calculateCombinedModifiers(ships);

    // New realistic formula based on Star Citizen 4.x community data
    // Baseline: 1 Arbor (1850 power) can fracture ~8000kg at 0% resistance
    const baselinePower = 1850;
    const baselineMass = 8000;

    // Apply resistance modifiers from lasers (e.g., Helix/Hofstede reduce effective resistance)
    const effectiveResistance = resistance * modifiers.resistance;

    // Power scaling: more lasers = proportionally more capacity
    const powerMultiplier = combinedPower / baselinePower;

    // Resistance impact: exponential curve (resistance has strong impact at high values)
    // At 0% resistance: factor = 1.0
    // At 50% resistance: factor ≈ 0.25
    // At 80% resistance: factor ≈ 0.04
    const resistanceFactor = Math.pow(1 - effectiveResistance, 2.5);

    // Calculate max mass
    let maxMass = baselineMass * powerMultiplier * resistanceFactor;

    // Realistic cap: even with multiple ships, there's a practical limit
    maxMass = Math.min(maxMass, 50000);

    // Minimum threshold
    maxMass = Math.max(maxMass, 100);

    return Math.round(maxMass);
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.calculations = {
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateMaxMass
};
