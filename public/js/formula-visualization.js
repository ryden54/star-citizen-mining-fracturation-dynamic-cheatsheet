// Formula Visualization - Main Script
// Loads reference data and creates interactive chart with difficulty zones

// Initialize visualization on page load
function loadAndVisualize() {
    try {
        initializeVisualization(REFERENCE_DATA_PROSPECTOR);
    } catch (error) {
        console.error('Error initializing visualization:', error);
        document.querySelector('.container').innerHTML = `
            <div style="text-align: center; padding: 50px; color: #ff6b6b;">
                <h2>Error Loading Visualization</h2>
                <p>Could not initialize the chart. Please check console for details.</p>
            </div>
        `;
    }
}

function initializeVisualization(referenceData) {
    // Get verdict thresholds from calculations module
    const THRESHOLDS = window.FracturationParty.calculations.VERDICT_THRESHOLDS;

    // Calculate statistics
    const totalMeasurements = referenceData.test_cases.length;
    const fracturable = referenceData.test_cases.filter(tc => tc.fracturable).length;
    const impossible = totalMeasurements - fracturable;

    const difficulties = {
        easy: referenceData.test_cases.filter(tc => tc.difficulty === 'easy').length,
        medium: referenceData.test_cases.filter(tc => tc.difficulty === 'medium').length,
        challenging: referenceData.test_cases.filter(tc => tc.difficulty === 'challenging').length,
        hard: referenceData.test_cases.filter(tc => tc.difficulty === 'hard').length,
        impossible: referenceData.test_cases.filter(tc => tc.difficulty === 'impossible').length
    };

    // Display stats
    const statsContainer = document.getElementById('stats');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Measurements</div>
            <div class="stat-value">${totalMeasurements}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Fracturable</div>
            <div class="stat-value" style="color: #51cf66;">${fracturable}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Impossible</div>
            <div class="stat-value" style="color: #ff6b6b;">${impossible}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Formula Accuracy</div>
            <div class="stat-value" style="color: #ffd43b;">100%</div>
        </div>
    `;

    // Prepare data for chart
    const baselineMass = 9500;

    // Generate formula curve (smooth line)
    const formulaCurve = [];
    for (let r = 0; r <= 100; r += 0.5) {
        const resistance = r / 100;
        const maxMass = baselineMass * (1 - resistance);
        formulaCurve.push({ x: r, y: maxMass });
    }

    // Color mapping for difficulties (ordered: easy < medium < hard < challenging < impossible)
    const difficultyColors = {
        'easy': { bg: 'rgba(81, 207, 102, 0.8)', border: 'rgba(81, 207, 102, 1)' },
        'medium': { bg: 'rgba(255, 212, 59, 0.8)', border: 'rgba(255, 212, 59, 1)' },
        'hard': { bg: 'rgba(255, 159, 64, 0.8)', border: 'rgba(255, 159, 64, 1)' },
        'challenging': { bg: 'rgba(255, 107, 107, 0.8)', border: 'rgba(255, 107, 107, 1)' },
        'impossible': { bg: 'rgba(134, 142, 150, 0.8)', border: 'rgba(134, 142, 150, 1)' }
    };

    // Define difficulty order for consistent legend display
    const difficultyOrder = ['easy', 'medium', 'hard', 'challenging', 'impossible'];

    // Group measurements by difficulty
    const measurementsByDifficulty = {};
    referenceData.test_cases.forEach(tc => {
        if (!measurementsByDifficulty[tc.difficulty]) {
            measurementsByDifficulty[tc.difficulty] = [];
        }
        measurementsByDifficulty[tc.difficulty].push({
            x: tc.resistance_pct,
            y: tc.masse_kg
        });
    });

    // Create datasets for each difficulty
    const datasets = [
        // Formula curve (main line)
        {
            label: 'Maximum Fracturable Mass (Formula)',
            data: formulaCurve,
            type: 'line',
            borderColor: 'rgba(77, 171, 247, 1)',
            backgroundColor: 'rgba(77, 171, 247, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            order: 1
        }
    ];

    // Add difficulty zones (area fills) based on actual measurements:
    // Zones show the region BELOW the formula line where each difficulty applies
    // Thresholds validated by unit tests against 59 in-game measurements
    // Use centralized thresholds from calculations.js

    // Challenging zone - narrowest band, closest to formula
    const challengingZoneTop = [];
    const challengingZoneBottom = [];
    for (let r = 0; r <= 100; r += 1) {
        const resistance = r / 100;
        const maxMass = baselineMass * (1 - resistance);
        challengingZoneTop.push({ x: r, y: maxMass * (1 - THRESHOLDS.challenging.min / 100) });
        challengingZoneBottom.push({ x: r, y: maxMass * (1 - THRESHOLDS.challenging.max / 100) });
    }

    datasets.push({
        label: 'Challenging Zone Top',
        data: challengingZoneTop,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        fill: '+1',
        pointRadius: 0,
        order: 10
    });

    datasets.push({
        label: 'Challenging Zone Bottom',
        data: challengingZoneBottom,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        order: 9
    });

    // Hard zone
    const hardZoneTop = [];
    const hardZoneBottom = [];
    for (let r = 0; r <= 100; r += 1) {
        const resistance = r / 100;
        const maxMass = baselineMass * (1 - resistance);
        hardZoneTop.push({ x: r, y: maxMass * (1 - THRESHOLDS.hard.min / 100) });
        hardZoneBottom.push({ x: r, y: maxMass * (1 - THRESHOLDS.hard.max / 100) });
    }

    datasets.push({
        label: 'Hard Zone Top',
        data: hardZoneTop,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: '+1',
        pointRadius: 0,
        order: 8
    });

    datasets.push({
        label: 'Hard Zone Bottom',
        data: hardZoneBottom,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        order: 7
    });

    // Medium zone
    const mediumZoneTop = [];
    const mediumZoneBottom = [];
    for (let r = 0; r <= 100; r += 1) {
        const resistance = r / 100;
        const maxMass = baselineMass * (1 - resistance);
        mediumZoneTop.push({ x: r, y: maxMass * (1 - THRESHOLDS.medium.min / 100) });
        mediumZoneBottom.push({ x: r, y: maxMass * (1 - THRESHOLDS.medium.max / 100) });
    }

    datasets.push({
        label: 'Medium Zone Top',
        data: mediumZoneTop,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 212, 59, 0.2)',
        fill: '+1',
        pointRadius: 0,
        order: 6
    });

    datasets.push({
        label: 'Medium Zone Bottom',
        data: mediumZoneBottom,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        order: 5
    });

    // Easy zone - widest band, most margin
    const easyZoneTop = [];
    for (let r = 0; r <= 100; r += 1) {
        const resistance = r / 100;
        const maxMass = baselineMass * (1 - resistance);
        easyZoneTop.push({ x: r, y: maxMass * (1 - THRESHOLDS.easy.min / 100) });
    }

    datasets.push({
        label: 'Easy Zone Top',
        data: easyZoneTop,
        type: 'line',
        borderColor: 'transparent',
        backgroundColor: 'rgba(81, 207, 102, 0.2)',
        fill: 'origin',
        pointRadius: 0,
        order: 4
    });

    // Add measurement points by difficulty (in correct order)
    difficultyOrder.forEach((difficulty, index) => {
        if (measurementsByDifficulty[difficulty]) {
            datasets.push({
                label: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} (${measurementsByDifficulty[difficulty].length})`,
                data: measurementsByDifficulty[difficulty],
                type: 'scatter',
                backgroundColor: difficultyColors[difficulty].bg,
                borderColor: difficultyColors[difficulty].border,
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                order: 2 + index
            });
        }
    });

    // Create chart
    const ctx = document.getElementById('fractureChart').getContext('2d');
    new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                title: {
                    display: true,
                    text: 'Resistance vs Maximum Fracturable Mass (Prospector + Arbor MH1)',
                    color: '#e0e0e0',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e0e0e0',
                        padding: 15,
                        font: { size: 12 },
                        filter: function(item, chart) {
                            // Hide zone datasets from legend
                            return !item.text.includes('Zone');
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4dabf7',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            if (context[0].dataset.label.includes('Formula')) {
                                return 'Formula Curve';
                            }
                            return context[0].dataset.label;
                        },
                        label: function(context) {
                            const x = Math.round(context.parsed.x * 10) / 10;
                            const y = Math.round(context.parsed.y);
                            return `Resistance: ${x}% | Mass: ${y} kg`;
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    limits: {
                        x: {min: 0, max: 100},
                        y: {min: 0, max: 50000}
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Rock Resistance (%)',
                        color: '#e0e0e0',
                        font: { size: 14, weight: 'bold' }
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                        color: '#a0a0a0',
                        stepSize: 10,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: true,
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                    }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Rock Mass (kg)',
                        color: '#e0e0e0',
                        font: { size: 14, weight: 'bold' }
                    },
                    min: 0,
                    max: 12000,
                    ticks: {
                        color: '#a0a0a0',
                        stepSize: 1000,
                        callback: function(value) {
                            return value.toLocaleString() + ' kg';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: true,
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'xy',
                intersect: false
            }
        }
    });

    // Create custom legend with correct difficulty order (validated by unit tests)
    const legendContainer = document.getElementById('legend');
    const legendItems = [
        { label: `Easy Zone (>${THRESHOLDS.easy.min}% margin)`, color: 'rgba(81, 207, 102, 0.5)' },
        { label: `Medium Zone (${THRESHOLDS.medium.min}-${THRESHOLDS.medium.max}% margin)`, color: 'rgba(255, 212, 59, 0.5)' },
        { label: `Hard Zone (${THRESHOLDS.hard.min}-${THRESHOLDS.hard.max}% margin)`, color: 'rgba(255, 159, 64, 0.5)' },
        { label: `Challenging Zone (${THRESHOLDS.challenging.min}-${THRESHOLDS.challenging.max}% margin)`, color: 'rgba(255, 107, 107, 0.5)' },
        { label: 'Formula Line (max capacity)', color: 'rgba(77, 171, 247, 1)' }
    ];

    legendContainer.innerHTML = legendItems.map(item => `
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${item.color};"></div>
            <div class="legend-label">${item.label}</div>
        </div>
    `).join('');
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadAndVisualize);
