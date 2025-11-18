// Test exports file - loads scripts and re-exports from window.FracturationParty
// This file is ONLY used by tests, NOT loaded in the browser HTML

// Dynamically load the scripts to populate window.FracturationParty
// In test environment (Node/Vitest), we need to load these files
// They will execute and populate window.FracturationParty

// Data modules (must load first)
await import('./data/ships.js');
await import('./data/lasers.js');
await import('./data/modules.js');
await import('./data/gadgets.js');
await import('./data/index.js');

// Core modules
await import('./calculations.js');
await import('./chart.js');
await import('./url-state.js');
await import('./ui.js');

// Re-export from window.FracturationParty for tests
export const shipData = window.FracturationParty.data.shipData;
export const laserData = window.FracturationParty.data.laserData;
export const moduleData = window.FracturationParty.data.moduleData;
export const gadgetData = window.FracturationParty.data.gadgetData;
export const calculateCombinedPower = window.FracturationParty.calculations.calculateCombinedPower;
export const calculateCombinedModifiers = window.FracturationParty.calculations.calculateCombinedModifiers;
export const calculateRockResistance = window.FracturationParty.calculations.calculateRockResistance;
export const calculateMaxMass = window.FracturationParty.calculations.calculateMaxMass;

// Chart functions
export const chart = window.FracturationParty.chart;
export const drawCapacityChart = window.FracturationParty.chart.drawCapacityChart;
export const generateChartData = window.FracturationParty.chart.generateChartData;

// UI functions
export const ui = window.FracturationParty.ui;
export const generateModuleDescriptionHTML = window.FracturationParty.ui.generateModuleDescriptionHTML;

// URL state functions
export const urlState = window.FracturationParty.urlState;
export const serializeConfig = window.FracturationParty.urlState.serializeConfig;
export const deserializeConfig = window.FracturationParty.urlState.deserializeConfig;
