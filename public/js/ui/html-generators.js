// HTML generation utilities
// Pure functions for generating HTML strings with stats and colors

/**
 * Generate laser comparison stats HTML
 * @param {Object} laser - Laser data object
 * @param {string} laserKey - Laser key in laserData
 * @param {number} referencePower - Reference fracturing power for comparison
 * @param {string} shipType - Ship type for determining reference laser
 * @returns {string} HTML string with colored stats
 */
function generateLaserStatsHTML(laser, laserKey, referencePower, shipType) {
    const referenceLaser = shipType === 'prospector' ? 'arbor' : 'arbor-mh2';
    const statsParts = [];

    // 1. Fracturing Power FIRST (most important for fracturation)
    if (laserKey !== referenceLaser) {
        const variation = ((laser.fracturingPower - referencePower) / referencePower) * 100;
        const pwrColor = variation > 0 ? 'green' : 'red';
        statsParts.push(`Fract. Pwr: <span style="color:${pwrColor};">${variation > 0 ? '+' : ''}${variation.toFixed(0)}%</span>`);
    }

    // 2. Resistance SECOND (directly affects fracturation calculations)
    if (laser.resistance !== 1.0) {
        const resVar = (laser.resistance - 1.0) * 100;
        const resColor = resVar < 0 ? 'green' : 'red';
        statsParts.push(`Res: <span style="color:${resColor};">${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%</span>`);
    }

    // 3. Instability THIRD (affects inert materials - higher is worse)
    if (laser.instability !== 1.0) {
        const instVar = (laser.instability - 1.0) * 100;
        const instColor = instVar > 0 ? 'red' : 'green'; // Reversed: higher instability is bad
        statsParts.push(`Instability: <span style="color:${instColor};">${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%</span>`);
    }

    return statsParts.join(', ');
}

/**
 * Generate module description HTML with stats and effects
 * @param {Object} module - Module data object
 * @returns {string} HTML string with colored stats and effects
 */
function generateModuleDescriptionHTML(module) {
    if (!module || module.name === '(None)') {
        return '';
    }

    const moduleStats = [];

    // Fracturing Power
    const powerVar = (module.fracturingPowerModifier - 1.0) * 100;
    if (powerVar !== 0) {
        const pwrColor = powerVar > 0 ? 'green' : 'red';
        moduleStats.push(`Fract. Pwr: <span style="color:${pwrColor};">${powerVar > 0 ? '+' : ''}${powerVar.toFixed(0)}%</span>`);
    }

    // Extraction Power
    const extractVar = (module.extractionPowerModifier - 1.0) * 100;
    if (extractVar !== 0) {
        const extColor = extractVar > 0 ? 'green' : 'red';
        moduleStats.push(`Extract Pwr: <span style="color:${extColor};">${extractVar > 0 ? '+' : ''}${extractVar.toFixed(0)}%</span>`);
    }

    // Other effects
    module.effects.forEach(effect => {
        let effectColor = '#bbb';
        if (effect.type === 'pro') effectColor = 'green';
        if (effect.type === 'con') effectColor = 'red';
        moduleStats.push(`<span style="color:${effectColor};">${effect.text}</span>`);
    });

    return moduleStats.join(', ');
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.htmlGenerators = {
    generateLaserStatsHTML,
    generateModuleDescriptionHTML
};
