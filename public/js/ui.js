// UI state and DOM manipulation

// UI State
let ships = []; // Array of ships: [{ type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['none'] }] }]
let gadgets = []; // Store gadgets placed on rock: ['sabir', 'optimax', ...]

// Legacy compatibility
let shipCount = 0;
let shipModules = {};

/**
 * Initialize a new ship with default lasers
 * @param {string} shipType - 'prospector' or 'mole'
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

/**
 * Sync legacy shipCount and shipModules with new ships array
 */
function syncLegacyState() {
    shipCount = ships.length;
    shipModules = {};
    ships.forEach((ship, shipIdx) => {
        // For legacy: flatten all laser modules into shipModules[shipIdx]
        if (ship.lasers.length > 0) {
            shipModules[shipIdx] = ship.lasers[0].modules;
        }
    });
}

/**
 * Add a new ship to the configuration
 */
function addShip() {
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
 * Generate laser stats HTML
 * @param {Object} laser - Laser data
 * @param {string} laserKey - Laser key
 * @param {number} referencePower - Reference fracturing power for comparison
 * @param {string} shipType - Ship type for reference laser determination
 * @returns {string} HTML for laser stats
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

    // 3. Instability/optimal window THIRD (quality of life)
    if (laser.instability !== 1.0) {
        const instVar = (laser.instability - 1.0) * 100;
        const instColor = instVar > 0 ? 'green' : 'red';
        statsParts.push(`Opt. window: <span style="color:${instColor};">${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%</span>`);
    }

    return statsParts.join(', ');
}

/**
 * Update the ships configuration UI
 * @param {Array|null} preservedConfig - Optional preserved laser configuration (unused in new architecture)
 * @param {string|null} focusedElementId - Optional ID of the element to re-focus after update
 */
function updateShipsUI(preservedConfig = null, focusedElementId = null) {
    const { shipData, laserData, moduleData } = window.FracturationParty.data;
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
                descriptionParts.push(`Opt. window: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
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
                            <select id="laser-${shipIndex}-${laserIndex}" onchange="FracturationParty.ui.onLaserChange(${shipIndex}, ${laserIndex})">
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
                        <select id="module-${shipIndex}-${laserIndex}-${slot}" class="module-select" onchange="FracturationParty.ui.onModuleChange(${shipIndex}, ${laserIndex}, ${slot})">
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
                            <select id="laser-${shipIndex}-${laserIndex}" onchange="FracturationParty.ui.onLaserChange(${shipIndex}, ${laserIndex})">
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
                    <select id="ship-type-${shipIndex}" onchange="FracturationParty.ui.onShipTypeChange(${shipIndex})">
                        ${shipTypeOptionsHTML}
                    </select>
                </div>
                ${ships.length > 1 ? `<button class="remove-ship-btn" onclick="FracturationParty.ui.removeShip(${shipIndex})" title="Remove ship">🗑️</button>` : ''}
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

/**
 * Add a new gadget to the rock configuration
 */
function addGadget() {
    gadgets.push('sabir'); // Default gadget
    updateGadgetsUI();
    updateTable();
    updateURL();
}

/**
 * Remove a gadget from the rock configuration
 * @param {number} index - Gadget index to remove
 */
function removeGadget(index) {
    gadgets.splice(index, 1);
    updateGadgetsUI();
    updateTable();
    updateURL();
}

/**
 * Handle gadget type change event
 * @param {number} index - Index of the gadget that changed
 * @param {string|null} focusedId - ID of the element to re-focus
 */
function onGadgetChange(index, focusedId = null) {
    const gadgetSelect = document.getElementById(`gadget-${index}`);
    focusedId = focusedId || gadgetSelect?.id; // Use current element's ID if not provided

    if (gadgetSelect) {
        gadgets[index] = gadgetSelect.value;
        updateGadgetsUI(focusedId);
        updateTable();
        updateURL();
    }
}

/**
 * Update the gadgets configuration UI
 * @param {string|null} focusedElementId - Optional ID of the element to re-focus after update
 */
function updateGadgetsUI(focusedElementId = null) {
    const { gadgetData } = window.FracturationParty.data;
    const container = document.getElementById('gadgets-container');

    if (!container) return;

    // Generate gadget options grouped by manufacturer with abbreviated descriptions
    const gadgetsByManufacturer = {};
    for (const key in gadgetData) {
        const gadget = gadgetData[key];
        if (!gadgetsByManufacturer[gadget.manufacturer]) {
            gadgetsByManufacturer[gadget.manufacturer] = [];
        }

        // Build abbreviated description showing key modifiers
        const descriptionParts = [];
        if (gadget.rockResistance !== 0) {
            const resVar = gadget.rockResistance * 100;
            descriptionParts.push(`Res: ${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%`);
        }
        if (gadget.rockInstability !== 0) {
            const instVar = gadget.rockInstability * 100;
            descriptionParts.push(`Instability: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
        }

        // For gadgets without rock modifiers, show their main effect
        if (descriptionParts.length === 0) {
            if (key === 'stalwart') {
                descriptionParts.push('Opt. window rate: +50%');
            } else if (key === 'waveshift') {
                descriptionParts.push('Opt. window size: +100%');
            }
        }

        const fullDescription = descriptionParts.length > 0 ? ` (${descriptionParts.join(', ')})` : '';

        gadgetsByManufacturer[gadget.manufacturer].push({
            key,
            ...gadget,
            fullDescription
        });
    }

    let gadgetOptionsHTML = '';
    for (const manufacturer in gadgetsByManufacturer) {
        gadgetOptionsHTML += `<optgroup label="${manufacturer}">`;
        gadgetsByManufacturer[manufacturer].forEach(gadget => {
            gadgetOptionsHTML += `<option value="${gadget.key}">${gadget.name}${gadget.fullDescription}</option>`;
        });
        gadgetOptionsHTML += `</optgroup>`;
    }

    container.innerHTML = '';

    gadgets.forEach((gadgetKey, index) => {
        const gadget = gadgetData[gadgetKey];
        const gadgetDiv = document.createElement('div');
        gadgetDiv.className = 'gadget-item';

        // Generate description HTML for effects
        const effectsHTML = gadget.effects.map(effect => {
            let effectColor = '#bbb';
            if (effect.type === 'pro') effectColor = 'green';
            if (effect.type === 'con') effectColor = 'red';
            return `<span style="color:${effectColor};">${effect.text}</span>`;
        }).join(', ');

        gadgetDiv.innerHTML = `
            <div class="gadget-header">
                <label>Gadget #${index + 1}</label>
                <button class="remove-gadget-btn" onclick="FracturationParty.ui.removeGadget(${index})" title="Remove gadget">🗑️</button>
            </div>
            <div class="gadget-select-container">
                <label>Type</label>
                <select id="gadget-${index}" onchange="FracturationParty.ui.onGadgetChange(${index})">
                    ${gadgetOptionsHTML}
                </select>
            </div>
            <div class="gadget-description">
                ${effectsHTML}
            </div>
        `;
        container.appendChild(gadgetDiv);

        // Set the selected value
        document.getElementById(`gadget-${index}`).value = gadgetKey;
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
 * Generates the HTML for a module's description.
 * @param {object} module - The module object from moduleData.
 * @returns {string} The generated HTML string.
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

/**
 * Get current ship configuration from the UI
 * Flattens all lasers from all ships into a single array for calculations
 * Skips un-maned lasers
 * @returns {Array} Array of laser configurations {laser, modules}
 */
function getShipConfig() {
    const config = [];
    ships.forEach(ship => {
        ship.lasers.forEach(laser => {
            // Skip un-maned lasers (not operated by crew)
            if (laser.laserType !== 'un-maned') {
                config.push({
                    laser: laser.laserType,
                    modules: laser.modules
                });
            }
        });
    });
    return config;
}

/**
 * Update the capacity table based on current configuration
 */
function updateTable() {
    const { calculateMaxMass, calculateRockResistance, calculateCombinedModifiers } = window.FracturationParty.calculations;
    const { gadgetData } = window.FracturationParty.data;
    const config = getShipConfig();
    const resistanceLevels = [0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80];

    // Check if any gadget modifies rock resistance
    let hasGadgetResistanceModifier = false;
    gadgets.forEach(gadgetKey => {
        if (gadgetKey && gadgetData[gadgetKey] && gadgetData[gadgetKey].rockResistance !== 0) {
            hasGadgetResistanceModifier = true;
        }
    });

    // Check if any laser modifies resistance
    const laserModifiers = calculateCombinedModifiers(config);
    const hasLaserResistanceModifier = laserModifiers.resistance !== 1.0;

    // Show altered resistance column if either gadgets or lasers modify resistance
    const hasResistanceModifier = hasGadgetResistanceModifier || hasLaserResistanceModifier;

    let html = '<table>';

    // Table header
    if (hasResistanceModifier) {
        html += '<tr><th>Natural Resistance</th><th>Altered Resistance</th><th>Maximum Mass for Joined Fracturation</th></tr>';
    } else {
        html += '<tr><th>Resistance</th><th>Maximum Mass for Joined Fracturation</th></tr>';
    }

    // Table rows
    resistanceLevels.forEach(resistance => {
        // Pass gadgets array to calculateMaxMass
        // Resistance displayed is the INITIAL rock resistance (before any modifiers)
        const maxMass = calculateMaxMass(resistance, config, gadgets);

        if (hasResistanceModifier) {
            // Calculate altered resistance: first gadgets (additive), then lasers (multiplicative)
            const rockResistanceAfterGadgets = calculateRockResistance(resistance, gadgets);
            const alteredResistance = rockResistanceAfterGadgets * laserModifiers.resistance;

            html += `<tr>`;
            html += `<td><strong>${(resistance * 100).toFixed(0)}%</strong></td>`;
            html += `<td><strong>${(alteredResistance * 100).toFixed(0)}%</strong></td>`;
            html += `<td>${maxMass > 0 ? maxMass.toLocaleString() : 'N/A'} kg</td>`;
            html += `</tr>`;
        } else {
            html += `<tr><td><strong>${(resistance * 100).toFixed(0)}%</strong></td><td>${maxMass > 0 ? maxMass.toLocaleString() : 'N/A'} kg</td></tr>`;
        }
    });

    html += '</table>';
    document.getElementById('capacity-table').innerHTML = html;

    // Update chart
    updateChart();
}

/**
 * Update the capacity chart
 */
function updateChart() {
    const canvas = document.getElementById('capacity-chart');
    if (!canvas || !window.FracturationParty.chart) {
        console.warn('Chart canvas or chart module not available');
        return;
    }

    try {
        const chartData = window.FracturationParty.chart.generateChartData(ships, gadgets);
        window.FracturationParty.chart.drawCapacityChart(canvas, chartData);
        console.log('Chart updated with', chartData.length, 'data points');
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

/**
 * Update URL hash with current configuration
 */
function updateURL() {
    if (window.FracturationParty.urlState) {
        window.FracturationParty.urlState.updateURLHash(ships, gadgets);
    }
}

/**
 * Load configuration from URL hash if available
 * @returns {boolean} True if config was loaded from URL, false otherwise
 */
function loadFromURL() {
    if (!window.FracturationParty.urlState) {
        return false;
    }

    const config = window.FracturationParty.urlState.loadFromURLHash();
    if (config && config.ships && config.gadgets) {
        ships = config.ships;
        gadgets = config.gadgets;
        syncLegacyState();
        return true;
    }

    return false;
}

/**
 * Initialize the UI
 */
function initializeUI() {
    if (document.getElementById('ships-container')) {
        // Try to load configuration from URL first
        const loadedFromURL = loadFromURL();

        // Initialize with one prospector if ships is empty and nothing loaded from URL
        if (ships.length === 0 && !loadedFromURL) {
            ships.push(createShip('prospector'));
            syncLegacyState();
        }

        updateShipsUI();
        updateGadgetsUI();
        updateTable();

        // Update URL with initial state (if not loaded from URL)
        if (!loadedFromURL) {
            updateURL();
        }

        // Add resize listener to redraw chart when window size changes
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Debounce resize events to avoid excessive redraws
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateChart();
            }, 150);
        });
    }
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.ui = {
    addShip,
    removeShip,
    onShipTypeChange,
    onLaserChange,
    onModuleChange,
    addGadget,
    removeGadget,
    onGadgetChange,
    generateModuleDescriptionHTML,
    updateTable,
    updateChart,
    initializeUI,
    updateShipsUI,
    // Test helpers
    getShipModules: () => shipModules,
    setShipModules: (newModules) => { shipModules = newModules; },
    getShipCount: () => shipCount,
    setShipCount: (newCount) => { shipCount = newCount; },
    getShips: () => ships,
    setShips: (newShips) => { ships = newShips; syncLegacyState(); },
    // MOLE feature test helpers
    createShip,
    getCompatibleLasers,
    getShipConfig
};
