// Data module aggregator
// This file imports all data modules and re-exports them under window.FracturationParty.data
//
// Note: Individual data files (ships.js, lasers.js, etc.) already export to
// window.FracturationParty.{shipData|laserData|moduleData|gadgetData}
// This file consolidates them under a single 'data' namespace for consistency

// Ensure namespace exists
window.FracturationParty = window.FracturationParty || {};

// Aggregate all data under window.FracturationParty.data
// The individual files have already attached their data to window.FracturationParty
window.FracturationParty.data = {
    shipData: window.FracturationParty.shipData,
    laserData: window.FracturationParty.laserData,
    moduleData: window.FracturationParty.moduleData,
    gadgetData: window.FracturationParty.gadgetData
};
