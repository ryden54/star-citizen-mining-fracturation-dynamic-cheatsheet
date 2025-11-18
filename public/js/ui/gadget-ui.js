// Gadget UI functions
// Functions for adding, removing, and rendering gadget controls

/**
 * Add a new gadget to the rock configuration
 */
function addGadget() {
    const { updateTable } = window.FracturationParty.rendering;
    const { gadgets, updateURL } = window.FracturationParty.uiState;

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
    const { updateTable } = window.FracturationParty.rendering;
    const { gadgets, updateURL } = window.FracturationParty.uiState;

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
    const { updateTable } = window.FracturationParty.rendering;
    const { gadgets, updateURL } = window.FracturationParty.uiState;

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
    const { gadgets } = window.FracturationParty.uiState;
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
                <button class="remove-gadget-btn" onclick="FracturationParty.gadgetUI.removeGadget(${index})" title="Remove gadget">🗑️</button>
            </div>
            <div class="gadget-select-container">
                <label>Type</label>
                <select id="gadget-${index}" onchange="FracturationParty.gadgetUI.onGadgetChange(${index})">
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

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.gadgetUI = {
    addGadget,
    removeGadget,
    onGadgetChange,
    updateGadgetsUI
};
