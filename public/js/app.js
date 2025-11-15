// Test exports file - loads scripts and re-exports from window.FracturationParty
// This file is ONLY used by tests, NOT loaded in the browser HTML

// Dynamically load the scripts to populate window.FracturationParty
// In test environment (Node/Vitest), we need to load these files
// They will execute and populate window.FracturationParty
await import('./data.js');
await import('./calculations.js');
await import('./ui.js');

// Re-export from window.FracturationParty for tests
export const laserData = window.FracturationParty.data.laserData;
export const moduleData = window.FracturationParty.data.moduleData;
export const gadgetData = window.FracturationParty.data.gadgetData;
export const calculateCombinedPower = window.FracturationParty.calculations.calculateCombinedPower;
export const calculateCombinedModifiers = window.FracturationParty.calculations.calculateCombinedModifiers;
export const calculateRockResistance = window.FracturationParty.calculations.calculateRockResistance;
export const calculateMaxMass = window.FracturationParty.calculations.calculateMaxMass;

// UI functions
export const ui = window.FracturationParty.ui;
export const generateModuleDescriptionHTML = window.FracturationParty.ui.generateModuleDescriptionHTML;
