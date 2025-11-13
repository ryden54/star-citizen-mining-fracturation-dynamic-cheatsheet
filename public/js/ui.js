// UI state and DOM manipulation

// UI State
let shipCount = 1;
let shipModules = {}; // Store modules for each ship: { 0: ['none', 'none', 'none'], 1: [...] }

/**
 * Add a new ship to the configuration
 */
function addShip() {
    shipCount++;
    updateShipsUI();
    updateTable();
}

/**
 * Remove a ship from the configuration
 * @param {number} index - Ship index to remove
 */
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

/**
 * Update the ships configuration UI
 * @param {Array|null} preservedConfig - Optional preserved laser configuration
 */
function updateShipsUI(preservedConfig = null) {
    const laserData = window.FracturationParty.data.laserData;
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
                    <select id="module-${i}-${slot}" class="module-select" onchange="FracturationParty.ui.updateTable()">
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
                ${shipCount > 1 ? `<button class="remove-ship-btn" onclick="FracturationParty.ui.removeShip(${i})" title="Remove ship">🗑️</button>` : ''}
            </div>
            <div class="laser-select-container">
                <label>Mining Head</label>
                <select id="laser-${i}" onchange="FracturationParty.ui.onLaserChange(${i})">
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

/**
 * Handle laser change event - resets modules when laser changes
 * @param {number} shipIndex - Index of the ship that changed
 */
function onLaserChange(shipIndex) {
    const laserData = window.FracturationParty.data.laserData;
    // Reset modules when laser changes
    const laser = document.getElementById(`laser-${shipIndex}`).value;
    const moduleSlots = laserData[laser].moduleSlots;
    shipModules[shipIndex] = Array(moduleSlots).fill('none');
    updateShipsUI();
    updateTable();
}

/**
 * Get current ship configuration from the UI
 * @returns {Array} Array of ship configurations {laser, modules}
 */
function getShipConfig() {
    const laserData = window.FracturationParty.data.laserData;
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

/**
 * Update the capacity table based on current configuration
 */
function updateTable() {
    const calculateMaxMass = window.FracturationParty.calculations.calculateMaxMass;
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

/**
 * Initialize the UI
 */
function initializeUI() {
    if (document.getElementById('ships-container')) {
        // Initialize first ship modules
        shipModules[0] = ['none', 'none', 'none'];
        updateShipsUI();
        updateTable();
    }
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.ui = {
    addShip,
    removeShip,
    onLaserChange,
    updateTable,
    initializeUI
};
