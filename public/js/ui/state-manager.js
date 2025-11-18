// State management for UI
// Manages global state (ships, gadgets) and provides centralized access

// UI State
let ships = []; // Array of ships: [{ type: 'prospector', lasers: [{ laserType: 'arbor', modules: ['none'] }] }]
let gadgets = []; // Store gadgets placed on rock: ['sabir', 'optimax', ...]

// Legacy compatibility
let shipCount = 0;
let shipModules = {};

/**
 * Sync legacy shipCount and shipModules with new ships array
 */
function syncLegacyState() {
    shipCount = ships.length;
    shipModules = {};
    ships.forEach((ship, shipIdx) => {
        // For legacy: flatten all laser modules into shipModules[shipIdx]
        if (ship.lasers.length > 0) {
            shipModules[shipIdx] = ship.lasers[0].modules;
        }
    });
}

/**
 * Convert UI ships format to calculations format
 * Filters out un-maned lasers and extracts active laser/module combinations
 * @returns {Array} Ships in calculations format: [{laser: 'arbor', modules: ['rieger']}]
 */
function getShipConfig() {
    const config = [];
    ships.forEach(ship => {
        ship.lasers.forEach(laserConfig => {
            // Skip un-maned lasers (not operated by crew)
            if (laserConfig.laserType !== 'un-maned') {
                config.push({
                    laser: laserConfig.laserType,
                    modules: laserConfig.modules
                });
            }
        });
    });
    return config;
}

/**
 * Update URL hash with current configuration
 */
function updateURL() {
    if (window.FracturationParty.urlState) {
        window.FracturationParty.urlState.updateURLHash(ships, gadgets);
    }
}

/**
 * Load configuration from URL hash if available
 * @returns {boolean} True if config was loaded from URL, false otherwise
 */
function loadFromURL() {
    if (!window.FracturationParty.urlState) {
        return false;
    }

    const config = window.FracturationParty.urlState.loadFromURLHash();
    if (config && config.ships && config.gadgets) {
        ships = config.ships;
        gadgets = config.gadgets;
        syncLegacyState();
        return true;
    }

    return false;
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.uiState = {
    // State accessors (expose state directly for backward compatibility)
    get ships() { return ships; },
    set ships(value) { ships = value; },
    get gadgets() { return gadgets; },
    set gadgets(value) { gadgets = value; },
    get shipCount() { return shipCount; },
    get shipModules() { return shipModules; },

    // Functions
    syncLegacyState,
    getShipConfig,
    updateURL,
    loadFromURL
};
