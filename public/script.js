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

let shipCount = 1;
let shipModules = {}; // Store modules for each ship: { 0: ['none', 'none', 'none'], 1: [...] }

function addShip() {
    shipCount++;
    updateShipsUI();
    updateTable();
}

function removeShip(index) {
    if (shipCount > 1) {
        // Save current configuration before removing
        const currentConfig = [];
        for (let i = 0; i < shipCount; i++) {
            const laserSelect = document.getElementById(`laser-${i}`);
            if (laserSelect) {
                currentConfig.push(laserSelect.value);
            }
        }

        // Remove the ship at the specified index
        currentConfig.splice(index, 1);

        // Remove modules for this ship and reindex
        delete shipModules[index];
        const newModules = {};
        Object.keys(shipModules).forEach(key => {
            const shipIndex = parseInt(key);
            if (shipIndex > index) {
                newModules[shipIndex - 1] = shipModules[shipIndex];
            } else if (shipIndex < index) {
                newModules[shipIndex] = shipModules[shipIndex];
            }
        });
        shipModules = newModules;

        shipCount--;

        // Update UI with the modified configuration
        updateShipsUI(currentConfig);
        updateTable();
    }
}

function updateShipsUI(preservedConfig = null) {
    const container = document.getElementById('ships-container');

    // Save current configuration before rebuilding UI (if not provided)
    const currentConfig = preservedConfig || [];
    if (!preservedConfig) {
        for (let i = 0; i < shipCount; i++) {
            const laserSelect = document.getElementById(`laser-${i}`);
            if (laserSelect) {
                currentConfig.push(laserSelect.value);
            } else {
                currentConfig.push('arbor'); // Default for new ships
            }

            // Save module configuration
            if (!shipModules[i]) {
                shipModules[i] = ['none', 'none', 'none'];
            }
        }
    }

    container.innerHTML = '';

    for (let i = 0; i < shipCount; i++) {
        const shipDiv = document.createElement('div');
        shipDiv.className = 'ship-item';

        // Get the number of module slots for this laser
        const laser = currentConfig[i] || 'arbor';
        const moduleSlots = laserData[laser].moduleSlots;

        // Generate module select dropdowns
        let modulesHTML = '';
        for (let slot = 0; slot < moduleSlots; slot++) {
            modulesHTML += `
                <div class="module-slot">
                    <label>Module ${slot + 1}</label>
                    <select id="module-${i}-${slot}" class="module-select" onchange="updateTable()">
                        <option value="none">(None)</option>
                        <optgroup label="Greycat - Easier Control">
                            <option value="fltr">FLTR (-15% power, easier)</option>
                            <option value="fltr-l">FLTR-L (-10% power, easier)</option>
                            <option value="fltr-xl">FLTR-XL (-5% power, easier)</option>
                            <option value="xtr">XTR (-15% power, +15% window)</option>
                            <option value="xtr-l">XTR-L (-10% power, +22% window)</option>
                            <option value="xtr-xl">XTR-XL (-5% power, +25% window)</option>
                        </optgroup>
                        <optgroup label="Thermyte - Faster Charge">
                            <option value="focus">Focus (-15% power, +30% speed)</option>
                            <option value="focus-ii">Focus II (-10% power, +37% speed)</option>
                            <option value="focus-iii">Focus III (-5% power, +40% speed)</option>
                        </optgroup>
                        <optgroup label="Shubin - More Power">
                            <option value="rieger">Rieger (+15% power)</option>
                            <option value="rieger-c2">Rieger-C2 (+20% power)</option>
                            <option value="rieger-c3">Rieger-C3 (+25% power)</option>
                            <option value="vaux">Vaux (+15% power)</option>
                            <option value="vaux-c2">Vaux-C2 (+20% power)</option>
                            <option value="vaux-c3">Vaux-C3 (+25% power)</option>
                        </optgroup>
                    </select>
                </div>
            `;
        }

        shipDiv.innerHTML = `
            <div class="ship-header">
                <label>Prospector #${i + 1}</label>
                ${shipCount > 1 ? `<button class="remove-ship-btn" onclick="removeShip(${i})" title="Remove ship">🗑️</button>` : ''}
            </div>
            <div class="laser-select-container">
                <label>Mining Head</label>
                <select id="laser-${i}" onchange="onLaserChange(${i})">
                    <option value="arbor">Arbor (default)</option>
                    <option value="hofstede">Hofstede S1 (Inst: -50%, Res: -30%)</option>
                    <option value="helix">Helix I (Inst: -40%, Res: -30%)</option>
                    <option value="lancet">Lancet MH1 (Inst: -30%)</option>
                </select>
            </div>
            <div class="modules-container">
                ${modulesHTML}
            </div>
        `;
        container.appendChild(shipDiv);

        // Restore previous laser selection
        const laserSelect = document.getElementById(`laser-${i}`);
        if (currentConfig[i]) {
            laserSelect.value = currentConfig[i];
        }

        // Restore previous module selections
        if (shipModules[i]) {
            for (let slot = 0; slot < moduleSlots; slot++) {
                const moduleSelect = document.getElementById(`module-${i}-${slot}`);
                if (moduleSelect && shipModules[i][slot]) {
                    moduleSelect.value = shipModules[i][slot];
                }
            }
        }
    }
}

function onLaserChange(shipIndex) {
    // Reset modules when laser changes
    const laser = document.getElementById(`laser-${shipIndex}`).value;
    const moduleSlots = laserData[laser].moduleSlots;
    shipModules[shipIndex] = Array(moduleSlots).fill('none');
    updateShipsUI();
    updateTable();
}

function getShipConfig() {
    const config = [];
    for (let i = 0; i < shipCount; i++) {
        const laserSelect = document.getElementById(`laser-${i}`);
        const laser = laserSelect.value;

        // Get modules for this ship
        const modules = [];
        const moduleSlots = laserData[laser].moduleSlots;
        for (let slot = 0; slot < moduleSlots; slot++) {
            const moduleSelect = document.getElementById(`module-${i}-${slot}`);
            if (moduleSelect) {
                modules.push(moduleSelect.value);
                // Save to global state
                if (!shipModules[i]) shipModules[i] = [];
                shipModules[i][slot] = moduleSelect.value;
            }
        }

        config.push({ laser, modules });
    }
    return config;
}

function calculateCombinedPower(ships) {
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

function calculateCombinedModifiers(ships) {
    // Modifiers multiply (diminishing returns)
    let instabilityMod = 1.0;
    let resistanceMod = 1.0;

    ships.forEach(ship => {
        instabilityMod *= laserData[ship.laser].instability;
        resistanceMod *= laserData[ship.laser].resistance;
    });

    return { instability: instabilityMod, resistance: resistanceMod };
}

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


function updateTable() {
    const config = getShipConfig();
    const resistanceLevels = [0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80];

    let html = '<table>';
    html += '<tr><th>Resistance</th>';

    html += `<th>Maximum mass for joined fracturation</th>`;
    html += '</tr>';

    resistanceLevels.forEach(resistance => {
        const maxMass = calculateMaxMass(resistance, config);

        html += '<tr>';
        html += `<td><strong>${(resistance * 100).toFixed(0)}%</strong></td>`;
        html += `<td>${maxMass > 0 ? maxMass.toLocaleString() : 'N/A'} kg</td>`;
        html += '</tr>';
    });

    html += '</table>';
    document.getElementById('capacity-table').innerHTML = html;
}

// Attach functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.addShip = addShip;
    window.removeShip = removeShip;
    window.onLaserChange = onLaserChange;
    window.updateTable = updateTable;
}

// Initialization function
function initializeApp() {
    if (document.getElementById('ships-container')) {
        // Initialize first ship modules
        shipModules[0] = ['none', 'none', 'none'];
        updateShipsUI();
        updateTable();
    }
}

// Wait for DOM to be fully loaded before initializing
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        // DOM already loaded, initialize immediately
        initializeApp();
    }
}

// Export functions for testing (ES6 exports)
export {
    laserData,
    moduleData,
    calculateCombinedPower,
    calculateCombinedModifiers,
    calculateMaxMass
};
