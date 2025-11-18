// Ship UI functions
// Functions for adding, removing, configuring ships and their lasers/modules

/**
 * Add a new ship to the configuration
 */
function addShip() {
    const { createShip } = window.FracturationParty.shipUtils;
    const { ships, syncLegacyState, updateURL } = window.FracturationParty.uiState;
    const { updateTable } = window.FracturationParty.rendering;

    // Always add a Prospector by default (user can change it after)
    ships.push(createShip('prospector'));
    syncLegacyState();
    updateShipsUI();
    updateTable();
    updateURL();
}

/**
 * Remove a ship from the configuration
 * @param {number} index - Ship index to remove
 */
function removeShip(index) {
    const { ships, syncLegacyState, updateURL } = window.FracturationParty.uiState;
    const { updateTable } = window.FracturationParty.rendering;

    if (ships.length > 1) {
        ships.splice(index, 1);
        syncLegacyState();
        updateShipsUI();
        updateTable();
        updateURL();
    }
}

/**
 * Handle ship type change event
 * @param {number} shipIndex - Index of the ship that changed
 */
function onShipTypeChange(shipIndex) {
    const { createShip } = window.FracturationParty.shipUtils;
    const { ships, syncLegacyState, updateURL } = window.FracturationParty.uiState;
    const { updateTable } = window.FracturationParty.rendering;

    const shipTypeSelect = document.getElementById(`ship-type-${shipIndex}`);
    const newType = shipTypeSelect.value;

    // Replace the ship with a new one of the selected type
    ships[shipIndex] = createShip(newType);
    syncLegacyState();
    updateShipsUI();
    updateTable();
    updateURL();

    // Restore focus to the ship type selector after UI update
    const updatedSelect = document.getElementById(`ship-type-${shipIndex}`);
    if (updatedSelect) {
        updatedSelect.focus();
    }
}

/**
 * Update the ships configuration UI
 * @param {Array|null} preservedConfig - Optional preserved laser configuration (unused in new architecture)
 * @param {string|null} focusedElementId - Optional ID of the element to re-focus after update
 */
function updateShipsUI(preservedConfig = null, focusedElementId = null) {
    const { shipData, laserData, moduleData } = window.FracturationParty.data;
    const { createShip, getCompatibleLasers } = window.FracturationParty.shipUtils;
    const { ships, syncLegacyState } = window.FracturationParty.uiState;
    const { generateLaserStatsHTML, generateModuleDescriptionHTML } = window.FracturationParty.htmlGenerators;
    const container = document.getElementById('ships-container');

    if (!container) return;

    // Initialize ships if empty
    if (ships.length === 0) {
        ships.push(createShip('prospector'));
        syncLegacyState();
    }

    // --- Pre-generate module options HTML ---
    const modulesByManufacturer = {};
    for (const key in moduleData) {
        if (key === 'none') continue;
        const module = moduleData[key];
        if (!modulesByManufacturer[module.manufacturer]) {
            modulesByManufacturer[module.manufacturer] = [];
        }

        // Build abbreviated description showing key modifiers
        const descriptionParts = [];

        // Fracturing Power FIRST (most important for fracturation)
        const fracturingVar = (module.fracturingPowerModifier - 1.0) * 100;
        if (fracturingVar !== 0) {
            descriptionParts.push(`Fract. Pwr: ${fracturingVar > 0 ? '+' : ''}${fracturingVar.toFixed(0)}%`);
        }

        // Extraction Power second (still related to mining efficiency)
        const extractionVar = (module.extractionPowerModifier - 1.0) * 100;
        if (extractionVar !== 0) {
            descriptionParts.push(`Extr. Pwr: ${extractionVar > 0 ? '+' : ''}${extractionVar.toFixed(0)}%`);
        }

        // Other effects from the effects array (Opt. window, etc.)
        module.effects.forEach(effect => {
            if (effect.text.includes('Opt. window:')) {
                descriptionParts.push(effect.text);
            } else if (effect.text.includes('Opt. charge rate:')) {
                descriptionParts.push(effect.text);
            }
        });

        const fullDescription = descriptionParts.length > 0 ? ` (${descriptionParts.join(', ')})` : '';

        modulesByManufacturer[module.manufacturer].push({
            key,
            ...module,
            fullDescription
        });
    }
    let moduleOptionsHTML = '<option value="none">(None)</option>';
    for (const manufacturer in modulesByManufacturer) {
        moduleOptionsHTML += `<optgroup label="${manufacturer}">`;
        modulesByManufacturer[manufacturer].forEach(module => {
            moduleOptionsHTML += `<option value="${module.key}">${module.name}${module.fullDescription}</option>`;
        });
        moduleOptionsHTML += `</optgroup>`;
    }

    // --- Rebuild UI ---
    container.innerHTML = '';

    ships.forEach((ship, shipIndex) => {
        const shipDiv = document.createElement('div');
        shipDiv.className = 'ship-item';

        const shipSpec = shipData[ship.type];
        const shipName = shipSpec.name;

        // Get lasers compatible with this ship's type
        const compatibleLasers = getCompatibleLasers(ship.type);

        // Get reference laser and power for this ship type
        const referenceLaser = ship.type === 'prospector' ? 'arbor' : 'arbor-mh2';
        const referencePower = laserData[referenceLaser].fracturingPower;

        // --- Pre-generate laser options HTML for this ship type ---
        let laserOptionsHTML = '';
        for (const laserKey in compatibleLasers) {
            const laser = compatibleLasers[laserKey];
            const descriptionParts = [];

            if (laserKey !== referenceLaser) {
                const variation = ((laser.fracturingPower - referencePower) / referencePower) * 100;
                descriptionParts.push(`Fract. Pwr: ${variation > 0 ? '+' : ''}${variation.toFixed(0)}%`);
            }

            if (laser.resistance !== 1.0) {
                const resVar = (laser.resistance - 1.0) * 100;
                descriptionParts.push(`Res: ${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%`);
            }

            if (laser.instability !== 1.0) {
                const instVar = (laser.instability - 1.0) * 100;
                descriptionParts.push(`Instability: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
            }

            let fullDescription = descriptionParts.length > 0 ? ` (${descriptionParts.join(', ')})` : '';
            laserOptionsHTML += `<option value="${laserKey}">${laser.name}${fullDescription}</option>`;
        }

        // Check if this ship has a fixed laser
        const hasFixedLaser = shipSpec.fixedLaser ? true : false;

        // Build lasers HTML
        let lasersHTML = '';
        ship.lasers.forEach((laserConfig, laserIndex) => {
            const laserKey = laserConfig.laserType;

            // Add "un-maned" option for secondary lasers (laserIndex > 0)
            const laserSelectOptions = laserIndex > 0
                ? `<option value="un-maned">(Un-maned)</option>${laserOptionsHTML}`
                : laserOptionsHTML;

            // Handle un-maned lasers (no description or modules)
            if (laserKey === 'un-maned') {
                lasersHTML += `
                    <div class="laser-config" id="laser-config-${shipIndex}-${laserIndex}">
                        ${ship.lasers.length > 1 ? `<h4>Laser ${laserIndex + 1}</h4>` : ''}

                        <div class="laser-select-container">
                            <label>Mining Head</label>
                            <select id="laser-${shipIndex}-${laserIndex}" onchange="FracturationParty.shipUI.onLaserChange(${shipIndex}, ${laserIndex})">
                                ${laserSelectOptions}
                            </select>
                        </div>

                        <div class="laser-description">
                            <div class="laser-text" style="font-style: italic; color: var(--text-secondary);">This laser position is not manned.</div>
                        </div>
                    </div>
                `;
                return; // Skip to next laser
            }

            const laser = laserData[laserKey];
            const moduleSlots = laser.moduleSlots;

            // Generate laser stats
            const statsHTML = generateLaserStatsHTML(laser, laserKey, referencePower, ship.type);

            // Build modules HTML for this laser
            let modulesHTML = '';
            for (let slot = 0; slot < moduleSlots; slot++) {
                const moduleKey = laserConfig.modules[slot] || 'none';
                const module = moduleData[moduleKey];
                const moduleDescriptionHTML = generateModuleDescriptionHTML(module);

                modulesHTML += `
                    <div class="module-slot">
                        <label>Module ${slot + 1}</label>
                        <select id="module-${shipIndex}-${laserIndex}-${slot}" class="module-select" onchange="FracturationParty.shipUI.onModuleChange(${shipIndex}, ${laserIndex}, ${slot})">
                            ${moduleOptionsHTML}
                        </select>
                        <div class="module-description">${moduleDescriptionHTML}</div>
                    </div>
                `;
            }

            // Laser configuration block
            if (hasFixedLaser) {
                // Fixed laser: display as read-only with info
                lasersHTML += `
                    <div class="laser-config" id="laser-config-${shipIndex}-${laserIndex}">
                        ${ship.lasers.length > 1 ? `<h4>Laser ${laserIndex + 1}</h4>` : ''}

                        <div class="laser-select-container">
                            <label>Mining Head</label>
                            <div style="padding: 8px; background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 4px;">
                                <strong>${laser.name}</strong> <span style="color: var(--text-secondary); font-style: italic;">(Fixed equipment)</span>
                            </div>
                        </div>

                        <div class="laser-description">
                            <div class="laser-stats">${statsHTML}</div>
                            <div class="laser-text">${laser.description}</div>
                        </div>

                        <div class="modules-container">
                            ${modulesHTML}
                        </div>
                    </div>
                `;
            } else {
                // Configurable laser: display as dropdown
                lasersHTML += `
                    <div class="laser-config" id="laser-config-${shipIndex}-${laserIndex}">
                        ${ship.lasers.length > 1 ? `<h4>Laser ${laserIndex + 1}</h4>` : ''}

                        <div class="laser-select-container">
                            <label>Mining Head</label>
                            <select id="laser-${shipIndex}-${laserIndex}" onchange="FracturationParty.shipUI.onLaserChange(${shipIndex}, ${laserIndex})">
                                ${laserSelectOptions}
                            </select>
                        </div>

                        <div class="laser-description">
                            <div class="laser-stats">${statsHTML}</div>
                            <div class="laser-text">${laser.description}</div>
                        </div>

                        <div class="modules-container">
                            ${modulesHTML}
                        </div>
                    </div>
                `;
            }
        });

        // Generate ship type options dynamically, sorted by order
        const sortedShips = Object.entries(shipData)
            .sort(([, a], [, b]) => (a.order || 999) - (b.order || 999));

        let shipTypeOptionsHTML = '';
        for (const [shipKey, shipSpec] of sortedShips) {
            const laserInfo = shipSpec.fixedLaser
                ? `1 fixed laser S${shipSpec.laserSize}`
                : `${shipSpec.laserCount} laser${shipSpec.laserCount > 1 ? 's' : ''} S${shipSpec.laserSize}`;
            shipTypeOptionsHTML += `<option value="${shipKey}">${shipSpec.name} (${laserInfo}, ${shipSpec.capacity} SCU)</option>`;
        }

        shipDiv.innerHTML = `
            <div class="ship-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <label style="min-width: 80px; white-space: nowrap;">Ship #${shipIndex + 1}</label>
                    <select id="ship-type-${shipIndex}" onchange="FracturationParty.shipUI.onShipTypeChange(${shipIndex})">
                        ${shipTypeOptionsHTML}
                    </select>
                </div>
                ${ships.length > 1 ? `<button class="remove-ship-btn" onclick="FracturationParty.shipUI.removeShip(${shipIndex})" title="Remove ship">🗑️</button>` : ''}
            </div>
            ${lasersHTML}
        `;
        container.appendChild(shipDiv);

        // Set the ship type selector value
        const shipTypeSelect = document.getElementById(`ship-type-${shipIndex}`);
        if (shipTypeSelect) {
            shipTypeSelect.value = ship.type;
        }

        // Set the selected values for lasers and modules
        ship.lasers.forEach((laserConfig, laserIndex) => {
            // Only set laser select value if the ship doesn't have a fixed laser
            if (!hasFixedLaser) {
                const laserSelect = document.getElementById(`laser-${shipIndex}-${laserIndex}`);
                if (laserSelect) {
                    laserSelect.value = laserConfig.laserType;
                }
            }

            // Skip module setting for un-maned lasers
            if (laserConfig.laserType === 'un-maned') {
                return;
            }

            const moduleSlots = laserData[laserConfig.laserType].moduleSlots;
            for (let slot = 0; slot < moduleSlots; slot++) {
                const moduleSelect = document.getElementById(`module-${shipIndex}-${laserIndex}-${slot}`);
                if (moduleSelect && laserConfig.modules[slot]) {
                    moduleSelect.value = laserConfig.modules[slot];
                }
            }
        });
    });

    // Restore focus if an element ID was provided
    if (focusedElementId) {
        const elementToFocus = document.getElementById(focusedElementId);
        if (elementToFocus) {
            elementToFocus.focus();
        }
    }
}

/**
 * Handle laser change event - resets modules when laser changes
 * @param {number} shipIndex - Index of the ship that changed
 * @param {number} laserIndex - Index of the laser that changed
 * @param {string|null} focusedId - ID of the element to re-focus
 */
function onLaserChange(shipIndex, laserIndex, focusedId = null) {
    const { laserData } = window.FracturationParty.data;
    const { ships, syncLegacyState, updateURL } = window.FracturationParty.uiState;
    const { updateTable } = window.FracturationParty.rendering;

    const laserSelect = document.getElementById(`laser-${shipIndex}-${laserIndex}`);
    focusedId = focusedId || laserSelect?.id; // Use current element's ID if not provided

    const newLaserType = laserSelect.value;

    // Handle un-maned laser (no crew operating this laser)
    if (newLaserType === 'un-maned') {
        ships[shipIndex].lasers[laserIndex] = {
            laserType: 'un-maned',
            modules: []
        };
    } else {
        const laser = laserData[newLaserType];
        const moduleSlots = laser.moduleSlots;

        // Update the ships array
        ships[shipIndex].lasers[laserIndex] = {
            laserType: newLaserType,
            modules: Array(moduleSlots).fill('none')
        };
    }

    syncLegacyState();
    updateShipsUI(null, focusedId);
    updateTable();
    updateURL();
}

/**
 * Handle module change event
 * @param {number} shipIndex - Index of the ship that changed
 * @param {number} laserIndex - Index of the laser that changed
 * @param {number} slotIndex - Index of the module slot that changed
 * @param {string|null} focusedId - ID of the element to re-focus
 */
function onModuleChange(shipIndex, laserIndex, slotIndex, focusedId = null) {
    const { ships, syncLegacyState, updateURL } = window.FracturationParty.uiState;
    const { updateTable } = window.FracturationParty.rendering;

    const moduleSelect = document.getElementById(`module-${shipIndex}-${laserIndex}-${slotIndex}`);
    focusedId = focusedId || moduleSelect?.id; // Use current element's ID if not provided

    const newModuleValue = moduleSelect.value;

    // Validate slotIndex
    if (slotIndex >= ships[shipIndex].lasers[laserIndex].modules.length) {
        const laserType = ships[shipIndex].lasers[laserIndex].laserType;
        const maxModuleSlots = window.FracturationParty.data.laserData[laserType].moduleSlots;
        throw new Error(`Attempted to assign module to slot ${slotIndex} for ship ${shipIndex} laser ${laserIndex}, but laser "${laserType}" only supports ${maxModuleSlots} module slots.`);
    }

    // Update the ships array
    ships[shipIndex].lasers[laserIndex].modules[slotIndex] = newModuleValue;

    syncLegacyState();
    updateShipsUI(null, focusedId);
    updateTable();
    updateURL();
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.shipUI = {
    addShip,
    removeShip,
    onShipTypeChange,
    updateShipsUI,
    onLaserChange,
    onModuleChange
};
