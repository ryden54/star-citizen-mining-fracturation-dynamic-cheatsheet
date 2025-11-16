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
        let laserPower = laserData[ship.laser].fracturingPower;

        // Apply module power multipliers (multiplicative)
        let modulePowerMultiplier = 1.0;
        ship.modules.forEach(moduleKey => {
            if (moduleKey && moduleKey !== 'none') {
                modulePowerMultiplier *= moduleData[moduleKey].fracturingPowerModifier;
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
 * Calculate rock resistance after applying gadget modifiers
 * @param {number} baseResistance - Initial rock resistance (0.0 to 1.0)
 * @param {Array} gadgets - Array of gadget keys placed on the rock
 * @returns {number} Modified rock resistance
 */
function calculateRockResistance(baseResistance, gadgets) {
    const { gadgetData } = window.FracturationParty.data;

    // Apply gadget resistance modifiers additively
    let resistanceModifier = 0;
    gadgets.forEach(gadgetKey => {
        if (gadgetKey && gadgetData[gadgetKey]) {
            resistanceModifier += gadgetData[gadgetKey].rockResistance;
        }
    });

    // Apply the modifier: resistance * (1 + modifier)
    // Example: 50% resistance with Sabir (-50%) = 0.50 * (1 - 0.50) = 0.25 (25%)
    const modifiedResistance = baseResistance * (1 + resistanceModifier);

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, modifiedResistance));
}

/**
 * Calculate maximum fracturable mass for given resistance and ship configuration
 * @param {number} resistance - Base rock resistance (0.0 to 1.0) before gadget modifiers
 * @param {Array} ships - Array of ship configurations {laser, modules}
 * @param {Array} gadgets - Array of gadget keys placed on the rock
 * @returns {number} Maximum fracturable mass in kg (rounded)
 */
function calculateMaxMass(resistance, ships, gadgets = []) {
    const combinedPower = calculateCombinedPower(ships);
    const modifiers = calculateCombinedModifiers(ships);

    // Formula calibrated against in-game measurements (Prospector rental + Arbor MH1)
    // Baseline: 1 Arbor (1890 fracturing power) can fracture ~10000kg at 0% resistance
    const baselinePower = 1890;
    const baselineMass = 10000;

    // First apply gadget modifiers to rock resistance
    const rockResistanceAfterGadgets = calculateRockResistance(resistance, gadgets);

    // Then apply laser resistance modifiers (e.g., Helix/Hofstede reduce effective resistance)
    const effectiveResistance = rockResistanceAfterGadgets * modifiers.resistance;

    // Power scaling: more lasers = proportionally more capacity
    const powerMultiplier = combinedPower / baselinePower;

    // Resistance impact: LINEAR relationship (validated against in-game data)
    // At 0% resistance: factor = 1.0 (10000 kg)
    // At 50% resistance: factor = 0.5 (5000 kg)
    // At 100% resistance: factor = 0.0 (0 kg)
    const resistanceFactor = 1 - effectiveResistance;

    // Calculate max mass
    let maxMass = baselineMass * powerMultiplier * resistanceFactor;

    // Realistic cap: even with multiple ships, there's a practical limit
    maxMass = Math.min(maxMass, 100000);

    // Minimum threshold
    maxMass = Math.max(maxMass, 100);

    return Math.round(maxMass);
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.calculations = {
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateRockResistance,
    calculateMaxMass
};
