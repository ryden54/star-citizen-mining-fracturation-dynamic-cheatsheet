// Rendering functions for table and chart
// Pure rendering functions that update the DOM based on current state

/**
 * Update the capacity table based on current configuration
 * Reads state from uiState and updates the table DOM element
 */
function updateTable() {
    const { calculateMaxMass, calculateRockResistance, calculateCombinedModifiers } = window.FracturationParty.calculations;
    const { gadgetData } = window.FracturationParty.data;
    const { getShipConfig } = window.FracturationParty.uiState;

    // Get current state
    const ships = window.FracturationParty.uiState.ships;
    const gadgets = window.FracturationParty.uiState.gadgets;
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

    // Update chart after table
    updateChart();
}

/**
 * Update the capacity chart
 * Reads state from uiState and updates the chart canvas
 */
function updateChart() {
    const canvas = document.getElementById('capacity-chart');
    if (!canvas || !window.FracturationParty.chart) {
        return;
    }

    try {
        // Get current state
        const ships = window.FracturationParty.uiState.ships;
        const gadgets = window.FracturationParty.uiState.gadgets;

        const chartData = window.FracturationParty.chart.generateChartData(ships, gadgets);
        window.FracturationParty.chart.drawCapacityChart(canvas, chartData);
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.rendering = {
    updateTable,
    updateChart
};
