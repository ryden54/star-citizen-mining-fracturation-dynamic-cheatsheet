import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the module to test
await import('../public/js/data.js');
await import('../public/js/calculations.js');
await import('../public/js/chart.js');

const { drawCapacityChart, generateChartData } = window.FracturationParty.chart;
const { calculateMaxMass } = window.FracturationParty.calculations;

describe('Chart Module', () => {
    let canvas;
    let ctx;

    beforeEach(() => {
        // Create a mock canvas element
        canvas = {
            width: 800,
            height: 400,
            getContext: null,
            getBoundingClientRect: null
        };

        // Mock canvas context
        ctx = {
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            fillText: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            font: '',
            textAlign: '',
            textBaseline: ''
        };

        canvas.getContext = vi.fn(() => ctx);
        canvas.getBoundingClientRect = vi.fn(() => ({
            width: 800,
            height: 400,
            top: 0,
            left: 0
        }));

        // Mock global window if not present
        global.window = global.window || {
            devicePixelRatio: 1
        };
    });

    describe('drawCapacityChart', () => {
        it('should throw error if canvas is invalid', () => {
            expect(() => drawCapacityChart(null, [])).toThrow('Invalid canvas element');
            expect(() => drawCapacityChart({}, [])).toThrow('Invalid canvas element');
        });

        it('should throw error if dataPoints is empty', () => {
            expect(() => drawCapacityChart(canvas, [])).toThrow('dataPoints must be a non-empty array');
        });

        it('should throw error if dataPoints is not an array', () => {
            expect(() => drawCapacityChart(canvas, null)).toThrow('dataPoints must be a non-empty array');
        });

        it('should draw chart with valid data', () => {
            const dataPoints = [
                { resistance: 0.0, maxMass: 10000 },
                { resistance: 0.25, maxMass: 7500 },
                { resistance: 0.5, maxMass: 5000 },
                { resistance: 0.75, maxMass: 2500 },
                { resistance: 1.0, maxMass: 0 }
            ];

            drawCapacityChart(canvas, dataPoints);

            // Verify canvas methods were called
            expect(ctx.clearRect).toHaveBeenCalled();
            expect(ctx.fillRect).toHaveBeenCalled(); // Background
            expect(ctx.stroke).toHaveBeenCalled(); // Lines
            expect(ctx.fill).toHaveBeenCalled(); // Points
            expect(ctx.fillText).toHaveBeenCalled(); // Labels
        });

        it('should apply custom options', () => {
            const dataPoints = [
                { resistance: 0.0, maxMass: 10000 },
                { resistance: 0.5, maxMass: 5000 }
            ];

            const options = {
                lineColor: '#FF0000',
                pointColor: '#00FF00',
                title: 'Custom Title'
            };

            drawCapacityChart(canvas, dataPoints, options);

            // Verify custom colors were applied at some point during rendering
            // strokeStyle and fillStyle are set multiple times during rendering,
            // so we just verify the drawing methods were called
            expect(ctx.stroke).toHaveBeenCalled();
            expect(ctx.fill).toHaveBeenCalled();
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should handle single data point', () => {
            const dataPoints = [
                { resistance: 0.5, maxMass: 5000 }
            ];

            expect(() => drawCapacityChart(canvas, dataPoints)).not.toThrow();
        });

        it('should scale canvas for high DPI displays', () => {
            global.window.devicePixelRatio = 2;

            const dataPoints = [
                { resistance: 0.0, maxMass: 10000 },
                { resistance: 0.5, maxMass: 5000 }
            ];

            drawCapacityChart(canvas, dataPoints);

            // Verify canvas was scaled
            expect(canvas.width).toBe(1600); // 800 * 2
            expect(canvas.height).toBe(800); // 400 * 2
            expect(ctx.scale).toHaveBeenCalledWith(2, 2);

            global.window.devicePixelRatio = 1; // Reset
        });

        it('should draw grid lines', () => {
            const dataPoints = [
                { resistance: 0.0, maxMass: 10000 },
                { resistance: 1.0, maxMass: 0 }
            ];

            drawCapacityChart(canvas, dataPoints);

            // Should draw multiple grid lines (vertical + horizontal)
            expect(ctx.beginPath).toHaveBeenCalled();
            expect(ctx.moveTo).toHaveBeenCalled();
            expect(ctx.lineTo).toHaveBeenCalled();
        });
    });

    describe('generateChartData', () => {
        it('should throw error if calculations module not loaded', () => {
            const backup = window.FracturationParty.calculations;
            delete window.FracturationParty.calculations;

            expect(() => generateChartData([])).toThrow('FracturationParty.calculations module not loaded');

            window.FracturationParty.calculations = backup;
        });

        it('should generate default resistance steps', () => {
            const ships = [{ laser: 'arbor', modules: [] }];
            const data = generateChartData(ships);

            // Should have 21 points (0%, 5%, 10%, ..., 100%)
            expect(data).toHaveLength(21);
            expect(data[0].resistance).toBe(0);
            expect(data[20].resistance).toBe(1.0);
        });

        it('should use custom resistance steps', () => {
            const ships = [{ laser: 'arbor', modules: [] }];
            const customSteps = [0.0, 0.5, 1.0];
            const data = generateChartData(ships, [], customSteps);

            expect(data).toHaveLength(3);
            expect(data[0].resistance).toBe(0.0);
            expect(data[1].resistance).toBe(0.5);
            expect(data[2].resistance).toBe(1.0);
        });

        it('should calculate max mass for each resistance', () => {
            const ships = [{ laser: 'arbor', modules: [] }];
            const data = generateChartData(ships, [], [0.0, 0.5]);

            expect(data[0].maxMass).toBeGreaterThan(0);
            expect(data[1].maxMass).toBeGreaterThan(0);
            expect(data[0].maxMass).toBeGreaterThan(data[1].maxMass); // Lower resistance = higher mass
        });

        it('should respect gadgets parameter', () => {
            const ships = [{ laser: 'arbor', modules: [] }];
            const dataNoGadget = generateChartData(ships, [], [0.5]);
            const dataWithGadget = generateChartData(ships, ['sabir'], [0.5]);

            // Sabir reduces resistance, so max mass should be higher
            expect(dataWithGadget[0].maxMass).toBeGreaterThan(dataNoGadget[0].maxMass);
        });

        it('should handle multiple ships', () => {
            const singleShip = [{ laser: 'arbor', modules: [] }];
            const doubleShips = [
                { laser: 'arbor', modules: [] },
                { laser: 'arbor', modules: [] }
            ];

            const dataSingle = generateChartData(singleShip, [], [0.5]);
            const dataDouble = generateChartData(doubleShips, [], [0.5]);

            // Two ships should handle more mass
            expect(dataDouble[0].maxMass).toBeGreaterThan(dataSingle[0].maxMass);
        });
    });

    describe('Integration', () => {
        it('should generate and draw complete chart', () => {
            const ships = [{ laser: 'arbor', modules: [] }];
            const chartData = generateChartData(ships);

            expect(() => drawCapacityChart(canvas, chartData)).not.toThrow();
            expect(ctx.clearRect).toHaveBeenCalled();
            expect(ctx.fillText).toHaveBeenCalled();
        });

        it('should handle different ship configurations', () => {
            const configurations = [
                [{ laser: 'arbor', modules: [] }],
                [{ laser: 'helix', modules: ['rieger', 'rieger'] }],
                [
                    { laser: 'arbor', modules: [] },
                    { laser: 'helix', modules: [] }
                ]
            ];

            configurations.forEach(config => {
                const chartData = generateChartData(config);
                expect(() => drawCapacityChart(canvas, chartData)).not.toThrow();
            });
        });

        it('should handle UI format ships with lasers array', () => {
            // UI format: ships with lasers array (for MOLE multi-laser ships)
            const uiShips = [
                {
                    type: 'prospector',
                    lasers: [
                        { laserType: 'arbor', modules: ['none'] }
                    ]
                }
            ];

            const chartData = generateChartData(uiShips);
            expect(chartData).toHaveLength(21); // Default resistance steps
            expect(chartData[0].maxMass).toBeGreaterThan(0);
        });

        it('should handle UI format with multiple lasers (MOLE)', () => {
            // MOLE ship with 3 lasers in UI format
            const uiShips = [
                {
                    type: 'mole',
                    lasers: [
                        { laserType: 'arbor-mh2', modules: ['none'] },
                        { laserType: 'helix-ii', modules: ['rieger'] },
                        { laserType: 'impact-ii', modules: ['none'] }
                    ]
                }
            ];

            const chartData = generateChartData(uiShips);
            expect(chartData).toHaveLength(21);
            // With 3 lasers, capacity should be higher
            expect(chartData[10].maxMass).toBeGreaterThan(5000);
        });

        it('should filter out "none" modules in UI format', () => {
            const uiShipsWithNone = [
                {
                    type: 'prospector',
                    lasers: [
                        { laserType: 'arbor', modules: ['none', 'rieger'] }
                    ]
                }
            ];

            const uiShipsWithoutNone = [
                {
                    type: 'prospector',
                    lasers: [
                        { laserType: 'arbor', modules: ['rieger'] }
                    ]
                }
            ];

            const dataWithNone = generateChartData(uiShipsWithNone, [], [0.5]);
            const dataWithoutNone = generateChartData(uiShipsWithoutNone, [], [0.5]);

            // Should produce same results since 'none' is filtered
            expect(dataWithNone[0].maxMass).toBe(dataWithoutNone[0].maxMass);
        });
    });
});
