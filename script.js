// Laser data based on Star Citizen 4.x specifications
// Power values are extraction power from game data
const laserData = {
    'arbor': {
        power: 1850,
        instability: 1.0,
        resistance: 1.0,
        name: 'Arbor (default)',
        description: 'Standard rental laser - balanced but limited power'
    },
    'hofstede': {
        power: 1295,
        instability: 0.5,
        resistance: 0.7,  // -30% resistance bonus
        name: 'Hofstede S1',
        description: 'Lower power but excellent resistance reduction'
    },
    'helix': {
        power: 1850,
        instability: 0.6,  // -40% inert materials
        resistance: 0.7,   // -30% resistance bonus
        name: 'Helix I',
        description: 'Same extraction power as Arbor but better modifiers'
    },
    'lancet': {
        power: 1850,
        instability: 0.7,
        resistance: 1.0,
        name: 'Lancet MH1',
        description: 'Support laser - reduces instability for team mining'
    }
};

let shipCount = 1;

function addShip() {
    shipCount++;
    updateShipsUI();
    updateTable();
}

function removeShip() {
    if (shipCount > 1) {
        shipCount--;
        updateShipsUI();
        updateTable();
    }
}

function updateShipsUI() {
    const container = document.getElementById('ships-container');

    // Save current configuration before rebuilding UI
    const currentConfig = [];
    for (let i = 0; i < shipCount; i++) {
        const laserSelect = document.getElementById(`laser-${i}`);
        if (laserSelect) {
            currentConfig.push(laserSelect.value);
        } else {
            currentConfig.push('arbor'); // Default for new ships
        }
    }

    container.innerHTML = '';

    for (let i = 0; i < shipCount; i++) {
        const shipDiv = document.createElement('div');
        shipDiv.className = 'ship-item';
        shipDiv.innerHTML = `
            <label>Prospector #${i + 1}</label>
            <select id="laser-${i}" onchange="updateTable()">
                <option value="arbor">Arbor (default rental)</option>
                <option value="hofstede">Hofstede S1 (6,375 aUEC)</option>
                <option value="helix">Helix I (54,000 aUEC)</option>
                <option value="lancet">Lancet MH1 (support)</option>
            </select>
        `;
        container.appendChild(shipDiv);

        // Restore previous selection
        const laserSelect = document.getElementById(`laser-${i}`);
        if (currentConfig[i]) {
            laserSelect.value = currentConfig[i];
        }
    }
}

function getShipConfig() {
    const config = [];
    for (let i = 0; i < shipCount; i++) {
        const laserSelect = document.getElementById(`laser-${i}`);
        config.push(laserSelect.value);
    }
    return config;
}

function calculateCombinedPower(lasers) {
    // Power is additive - sum of all laser extraction powers
    let totalPower = 0;
    lasers.forEach(laser => {
        totalPower += laserData[laser].power;
    });
    return totalPower;
}

function calculateCombinedModifiers(lasers) {
    // Modifiers multiply (diminishing returns)
    let instabilityMod = 1.0;
    let resistanceMod = 1.0;

    lasers.forEach(laser => {
        instabilityMod *= laserData[laser].instability;
        resistanceMod *= laserData[laser].resistance;
    });

    return { instability: instabilityMod, resistance: resistanceMod };
}

function calculateMaxMass(resistance, lasers) {
    const combinedPower = calculateCombinedPower(lasers);
    const modifiers = calculateCombinedModifiers(lasers);

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

function canMine(mass, resistance, lasers) {
    const maxMass = calculateMaxMass(resistance, lasers);

    if (mass > maxMass * 1.2) {
        return { possible: false, difficulty: 'impossible', color: 'cannot-mine' };
    } else if (mass > maxMass) {
        return { possible: true, difficulty: 'very difficult', color: 'difficult' };
    } else if (mass > maxMass * 0.8) {
        return { possible: true, difficulty: 'difficult', color: 'difficult' };
    } else {
        return { possible: true, difficulty: 'easy', color: 'can-mine' };
    }
}

function checkRock() {
    const mass = parseFloat(document.getElementById('rock-mass').value);
    const resistance = parseFloat(document.getElementById('rock-resistance').value) / 100; // Convert % to float
    const instability = parseFloat(document.getElementById('rock-instability').value) / 100; // Convert % to float

    const config = getShipConfig();
    const result = canMine(mass, resistance, config);
    const modifiers = calculateCombinedModifiers(config);
    const effectiveInstability = instability * modifiers.instability;

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';

    let html = `<h3>Analysis Result</h3>`;

    if (!result.possible) {
        html += `<p class="cannot-mine" style="font-size: 24px;">❌ CANNOT BE FRACTURED (impossible)</p>`;
        html += `<p>Your configuration doesn't have enough power for this rock.</p>`;
        html += `<p><strong>Solution:</strong> Upgrade your lasers or add an additional miner.</p>`;
    } else {
        html += `<p class="${result.color}" style="font-size: 24px;">✅ CAN BE FRACTURED (${result.difficulty})</p>`;

        if (result.difficulty === 'easy') {
            html += `<p>✨ This rock should be easy to fracture with your configuration.</p>`;
        } else {
            html += `<p>⚠️ This rock will be challenging. Narrow green zone, be careful!</p>`;
        }

        html += `<p><strong>Effective instability:</strong> ${(effectiveInstability * 100).toFixed(0)}% (original: ${(instability * 100).toFixed(0)}%)</p>`;

        if (effectiveInstability > 2.0) {
            html += `<p class="difficult">⚠️ High instability! Precise control required.</p>`;
        } else if (effectiveInstability < 1.0) {
            html += `<p class="can-mine">✅ Instability well managed by your lasers.</p>`;
        }
    }

    resultDiv.innerHTML = html;
}

function updateTable() {
    const config = getShipConfig();
    const resistanceLevels = [0.00, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80];

    let html = '<table>';
    html += '<tr><th>Resistance</th>';

    // Header with configuration
    const configName = config.map((laser, i) => `P${i+1}: ${laserData[laser].name}`).join('<br>');
    html += `<th>Maximum mass (kg)<br><small>${configName}</small></th>`;
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

// Initialization (only in browser with proper DOM elements)
if (typeof document !== 'undefined' && document.getElementById('ships-container')) {
    updateShipsUI();
    updateTable();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        laserData,
        calculateCombinedPower,
        calculateCombinedModifiers,
        calculateMaxMass,
        canMine
    };
}
