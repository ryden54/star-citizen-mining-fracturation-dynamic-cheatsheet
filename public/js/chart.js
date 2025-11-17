// Vanilla JavaScript chart module for visualizing fracture capacity
// No external dependencies - uses Canvas API

/**
 * Draw a line chart showing max fracturable mass vs resistance
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {Array<{resistance: number, maxMass: number}>} dataPoints - Data to plot
 * @param {Object} options - Chart configuration options
 */
function drawCapacityChart(canvas, dataPoints, options = {}) {
    if (!canvas || !canvas.getContext) {
        throw new Error('Invalid canvas element');
    }

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
        throw new Error('dataPoints must be a non-empty array');
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size for high DPI displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Responsive padding based on canvas size
    const isMobile = width < 500;
    const defaultPadding = isMobile
        ? { top: 35, right: 15, bottom: 50, left: 60 }
        : { top: 40, right: 40, bottom: 60, left: 80 };

    // Default options with dark theme support
    const config = {
        padding: defaultPadding,
        backgroundColor: '#1a1a24',
        gridColor: '#3a3a44',
        axisColor: '#e0e0e0',
        lineColor: '#4CAF50',
        lineWidth: isMobile ? 2 : 3,
        pointColor: '#ff8c00',
        pointRadius: isMobile ? 4 : 5,
        fontSize: isMobile ? 11 : 13,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textColor: '#e0e0e0',
        title: isMobile ? 'Mass vs Resistance' : 'Max Fracturable Mass vs Resistance',
        xLabel: 'Rock Resistance (%)',
        yLabel: isMobile ? 'Mass (kg)' : 'Max Mass (kg)',
        ...options
    };

    const chartArea = {
        x: config.padding.left,
        y: config.padding.top,
        width: width - config.padding.left - config.padding.right,
        height: height - config.padding.top - config.padding.bottom
    };

    // Find data ranges
    const resistances = dataPoints.map(d => d.resistance);
    const masses = dataPoints.map(d => d.maxMass);
    const minResistance = Math.min(...resistances);
    const maxResistance = Math.max(...resistances);
    const minMass = 0; // Always start from 0
    const maxMass = Math.max(...masses);

    // Scaling functions
    const scaleX = (resistance) => {
        return chartArea.x + (resistance - minResistance) / (maxResistance - minResistance) * chartArea.width;
    };

    const scaleY = (mass) => {
        return chartArea.y + chartArea.height - (mass - minMass) / (maxMass - minMass) * chartArea.height;
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw chart area with slightly lighter background
    ctx.fillStyle = '#22222c';
    ctx.fillRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

    // Draw grid lines
    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1;

    // Vertical grid lines (resistance)
    const numVerticalLines = 10;
    for (let i = 0; i <= numVerticalLines; i++) {
        const resistance = minResistance + (maxResistance - minResistance) * i / numVerticalLines;
        const x = scaleX(resistance);

        ctx.beginPath();
        ctx.moveTo(x, chartArea.y);
        ctx.lineTo(x, chartArea.y + chartArea.height);
        ctx.stroke();
    }

    // Horizontal grid lines (mass)
    const numHorizontalLines = 8;
    for (let i = 0; i <= numHorizontalLines; i++) {
        const mass = minMass + (maxMass - minMass) * i / numHorizontalLines;
        const y = scaleY(mass);

        ctx.beginPath();
        ctx.moveTo(chartArea.x, y);
        ctx.lineTo(chartArea.x + chartArea.width, y);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = config.axisColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartArea.x, chartArea.y);
    ctx.lineTo(chartArea.x, chartArea.y + chartArea.height);
    ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = config.lineColor;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();

    dataPoints.forEach((point, index) => {
        const x = scaleX(point.resistance);
        const y = scaleY(point.maxMass);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = config.pointColor;
    dataPoints.forEach(point => {
        const x = scaleX(point.resistance);
        const y = scaleY(point.maxMass);

        ctx.beginPath();
        ctx.arc(x, y, config.pointRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw labels with high contrast
    ctx.fillStyle = config.textColor;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-axis labels (resistance percentages)
    for (let i = 0; i <= 10; i++) {
        const resistance = minResistance + (maxResistance - minResistance) * i / 10;
        const x = scaleX(resistance);
        const label = `${Math.round(resistance * 100)}%`;

        ctx.fillText(label, x, chartArea.y + chartArea.height + 10);
    }

    // Y-axis labels (mass values)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 8; i++) {
        const mass = minMass + (maxMass - minMass) * i / 8;
        const y = scaleY(mass);
        const label = mass >= 1000
            ? `${(mass / 1000).toFixed(1)}k`
            : Math.round(mass).toString();

        ctx.fillText(label, chartArea.x - 10, y);
    }

    // Draw title with accent color
    ctx.fillStyle = '#ff8c00';
    ctx.font = `bold ${config.fontSize + 3}px ${config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, width / 2, 10);

    // Draw axis labels
    ctx.fillStyle = config.textColor;
    ctx.font = `${config.fontSize}px ${config.fontFamily}`;

    // X-axis label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(config.xLabel, width / 2, height - 5);

    // Y-axis label (rotated)
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(config.yLabel, 0, 0);
    ctx.restore();
}

/**
 * Convert UI ship format to calculations format
 * @param {Array} uiShips - Ships in UI format {type, lasers: [{laserType, modules}]}
 * @returns {Array} Ships in calculations format {laser, modules}
 */
function convertShipsFormat(uiShips) {
    const calcShips = [];

    uiShips.forEach(ship => {
        if (ship.lasers) {
            // UI format: {type: 'prospector', lasers: [{laserType: 'arbor', modules: ['none']}]}
            ship.lasers.forEach(laserConfig => {
                calcShips.push({
                    laser: laserConfig.laserType,
                    modules: laserConfig.modules.filter(m => m !== 'none')
                });
            });
        } else if (ship.laser) {
            // Already in calculations format: {laser: 'arbor', modules: []}
            calcShips.push(ship);
        }
    });

    return calcShips;
}

/**
 * Generate data points from ship configuration
 * @param {Array} ships - Ship configurations (UI or calculations format)
 * @param {Array} gadgets - Active gadgets
 * @param {Array<number>} resistanceSteps - Resistance values to plot (0.0 to 1.0)
 * @returns {Array<{resistance: number, maxMass: number}>}
 */
function generateChartData(ships, gadgets = [], resistanceSteps = null) {
    if (!window.FracturationParty || !window.FracturationParty.calculations) {
        throw new Error('FracturationParty.calculations module not loaded');
    }

    const { calculateMaxMass } = window.FracturationParty.calculations;

    // Convert ships to calculations format
    const calcShips = convertShipsFormat(ships);

    // Default resistance steps from 0% to 100% in 5% increments
    if (!resistanceSteps) {
        resistanceSteps = [];
        for (let i = 0; i <= 100; i += 5) {
            resistanceSteps.push(i / 100);
        }
    }

    return resistanceSteps.map(resistance => ({
        resistance,
        maxMass: calculateMaxMass(resistance, calcShips, gadgets)
    }));
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.chart = {
    drawCapacityChart,
    generateChartData
};
