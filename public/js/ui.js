// UI state and DOM manipulation

// UI State
let shipCount = 1;
let shipModules = {}; // Store modules for each ship: { 0: ['none', 'none', 'none'], 1: [...] }
let gadgets = []; // Store gadgets placed on rock: ['sabir', 'optimax', ...]

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
        const currentConfig = [];
        for (let i = 0; i < shipCount; i++) {
            const laserSelect = document.getElementById(`laser-${i}`);
            if (laserSelect) {
                currentConfig.push(laserSelect.value);
            }
        }
        currentConfig.splice(index, 1);

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
        updateShipsUI(currentConfig);
        updateTable();
    }
}

/**
 * Update the ships configuration UI
 * @param {Array|null} preservedConfig - Optional preserved laser configuration
 * @param {string|null} focusedElementId - Optional ID of the element to re-focus after update
 */
function updateShipsUI(preservedConfig = null, focusedElementId = null) {
    const { laserData, moduleData } = window.FracturationParty.data;
    const container = document.getElementById('ships-container');

    // --- Pre-generate dynamic dropdown options ---
    let laserOptionsHTML = '';
    const arborFracturingPower = laserData['arbor'].fracturingPower;
    for (const laserKey in laserData) {
        const laser = laserData[laserKey];
        const descriptionParts = [];
        if (laserKey !== 'arbor') {
            const variation = ((laser.fracturingPower - arborFracturingPower) / arborFracturingPower) * 100;
            descriptionParts.push(`${variation > 0 ? '+' : ''}${variation.toFixed(0)}% Pwr`);
        }
        if (laser.instability !== 1.0) {
            const instVar = (laser.instability - 1.0) * 100;
            descriptionParts.push(`Opt. Window: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
        }
        if (laser.resistance !== 1.0) {
            const resVar = (laser.resistance - 1.0) * 100;
            descriptionParts.push(`Res: ${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%`);
        }
        let fullDescription = descriptionParts.length > 0 ? ` (${descriptionParts.join(', ')})` : '';
        laserOptionsHTML += `<option value="${laserKey}">${laser.name}${fullDescription}</option>`;
    }

    const modulesByManufacturer = {};
    for (const key in moduleData) {
        if (key === 'none') continue;
        const module = moduleData[key];
        if (!modulesByManufacturer[module.manufacturer]) {
            modulesByManufacturer[module.manufacturer] = [];
        }
        modulesByManufacturer[module.manufacturer].push({ key, ...module });
    }
    let moduleOptionsHTML = '<option value="none">(None)</option>';
    for (const manufacturer in modulesByManufacturer) {
        moduleOptionsHTML += `<optgroup label="${manufacturer}">`;
        modulesByManufacturer[manufacturer].forEach(module => {
            moduleOptionsHTML += `<option value="${module.key}">${module.name}</option>`;
        });
        moduleOptionsHTML += `</optgroup>`;
    }

    // --- Save current config and rebuild UI ---
    const currentConfig = preservedConfig || [];
    if (!preservedConfig) {
        for (let i = 0; i < shipCount; i++) {
            const laserSelect = document.getElementById(`laser-${i}`);
            currentConfig.push(laserSelect ? laserSelect.value : 'arbor');
            if (!shipModules[i]) {
                const laserKey = currentConfig[i] || 'arbor';
                shipModules[i] = Array(laserData[laserKey].moduleSlots).fill('none');
            }
        }
    }

    container.innerHTML = '';

    for (let i = 0; i < shipCount; i++) {
        const shipDiv = document.createElement('div');
        shipDiv.className = 'ship-item';

        const laserKey = currentConfig[i] || 'arbor';
        const laser = laserData[laserKey];
        const moduleSlots = laser.moduleSlots;

        const statsParts = [];
        if (laserKey !== 'arbor') {
            const variation = ((laser.fracturingPower - arborFracturingPower) / arborFracturingPower) * 100;
            const pwrColor = variation > 0 ? 'green' : 'red';
            statsParts.push(`Pwr: <span style="color:${pwrColor};">${variation > 0 ? '+' : ''}${variation.toFixed(0)}%</span>`);
        }
        if (laser.instability !== 1.0) {
            const instVar = (laser.instability - 1.0) * 100;
            const instColor = instVar > 0 ? 'green' : 'red';
            statsParts.push(`Opt. Window: <span style="color:${instColor};">${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%</span>`);
        }
        if (laser.resistance !== 1.0) {
            const resVar = (laser.resistance - 1.0) * 100;
            const resColor = resVar < 0 ? 'green' : 'red';
            statsParts.push(`Res: <span style="color:${resColor};">${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%</span>`);
        }
        const statsHTML = statsParts.join(', ');

        let modulesHTML = '';
        for (let slot = 0; slot < moduleSlots; slot++) {
            const moduleKey = shipModules[i]?.[slot] || 'none';
            const module = moduleData[moduleKey];
            const moduleDescriptionHTML = generateModuleDescriptionHTML(module);

            modulesHTML += `
                <div class="module-slot">
                    <label>Module ${slot + 1}</label>
                    <select id="module-${i}-${slot}" class="module-select" onchange="FracturationParty.ui.onModuleChange(${i}, ${slot})">
                        ${moduleOptionsHTML}
                    </select>
                    <div class="module-description">${moduleDescriptionHTML}</div>
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
                    ${laserOptionsHTML}
                </select>
            </div>
            <div class="laser-description">
                <div class="laser-stats">${statsHTML}</div>
                <div class="laser-text">${laser.description}</div>
            </div>
            <div class="modules-container">
                ${modulesHTML}
            </div>
        `;
        container.appendChild(shipDiv);

        document.getElementById(`laser-${i}`).value = laserKey;
        if (shipModules[i]) {
            for (let slot = 0; slot < moduleSlots; slot++) {
                const moduleSelect = document.getElementById(`module-${i}-${slot}`);
                if (moduleSelect && shipModules[i][slot]) {
                    moduleSelect.value = shipModules[i][slot];
                }
            }
        }
    }

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
 * @param {string|null} focusedId - ID of the element to re-focus
 */
function onLaserChange(shipIndex, focusedId = null) {
    const laserData = window.FracturationParty.data.laserData;
    const laserSelect = document.getElementById(`laser-${shipIndex}`);
    focusedId = focusedId || laserSelect.id; // Use current element's ID if not provided

    const laser = laserSelect.value;
    const moduleSlots = laserData[laser].moduleSlots;
    shipModules[shipIndex] = Array(moduleSlots).fill('none');

    updateShipsUI(null, focusedId);
    updateTable();
}

/**
 * Handle module change event
 * @param {number} shipIndex - Index of the ship that changed
 * @param {number} slotIndex - Index of the module slot that changed
 * @param {string|null} focusedId - ID of the element to re-focus
 */
function onModuleChange(shipIndex, slotIndex, focusedId = null) {
    const moduleSelect = document.getElementById(`module-${shipIndex}-${slotIndex}`);
    focusedId = focusedId || moduleSelect.id; // Use current element's ID if not provided

    if (moduleSelect) {
        if (!shipModules[shipIndex]) {
            const laserKey = document.getElementById(`laser-${shipIndex}`)?.value || 'arbor';
            const moduleSlots = window.FracturationParty.data.laserData[laserKey].moduleSlots;
            shipModules[shipIndex] = Array(moduleSlots).fill('none');
        }
        shipModules[shipIndex][slotIndex] = moduleSelect.value;
    }
    updateShipsUI(null, focusedId);
    updateTable();
}

/**
 * Add a new gadget to the rock configuration
 */
function addGadget() {
    gadgets.push('sabir'); // Default gadget
    updateGadgetsUI();
    updateTable();
}

/**
 * Remove a gadget from the rock configuration
 * @param {number} index - Gadget index to remove
 */
function removeGadget(index) {
    gadgets.splice(index, 1);
    updateGadgetsUI();
    updateTable();
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
            descriptionParts.push(`Rock Res: ${resVar > 0 ? '+' : ''}${resVar.toFixed(0)}%`);
        }
        if (gadget.rockInstability !== 0) {
            const instVar = gadget.rockInstability * 100;
            descriptionParts.push(`Rock Inst: ${instVar > 0 ? '+' : ''}${instVar.toFixed(0)}%`);
        }

        // For gadgets without rock modifiers, show their main effect
        if (descriptionParts.length === 0) {
            if (key === 'stalwart') {
                descriptionParts.push('Opt. Window Rate +50%');
            } else if (key === 'waveshift') {
                descriptionParts.push('Opt. Window +100%');
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
 * @returns {Array} Array of ship configurations {laser, modules}
 */
function getShipConfig() {
    const config = [];
    for (let i = 0; i < shipCount; i++) {
        const laserSelect = document.getElementById(`laser-${i}`);
        const laser = laserSelect.value;
        const modules = shipModules[i] || [];
        config.push({ laser, modules });
    }
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
}

/**
 * Initialize the UI
 */
function initializeUI() {
    if (document.getElementById('ships-container')) {
        shipModules[0] = ['none', 'none', 'none'];
        updateShipsUI();
        updateGadgetsUI();
        updateTable();
    }
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.ui = {
    addShip,
    removeShip,
    onLaserChange,
    onModuleChange,
    addGadget,
    removeGadget,
    onGadgetChange,
    generateModuleDescriptionHTML,
    updateTable,
    initializeUI
};
