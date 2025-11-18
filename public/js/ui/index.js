// UI module aggregator
// Aggregates all UI modules and provides centralized initialization

/**
 * Initialize the UI
 */
function initializeUI() {
    const { ships, syncLegacyState, loadFromURL, updateURL } = window.FracturationParty.uiState;
    const { createShip } = window.FracturationParty.shipUtils;
    const { updateShipsUI } = window.FracturationParty.shipUI;
    const { updateGadgetsUI } = window.FracturationParty.gadgetUI;
    const { updateTable, updateChart } = window.FracturationParty.rendering;

    if (document.getElementById('ships-container')) {
        // Try to load configuration from URL first
        const loadedFromURL = loadFromURL();

        // Initialize with one prospector if ships is empty and nothing loaded from URL
        if (ships.length === 0 && !loadedFromURL) {
            ships.push(createShip('prospector'));
            syncLegacyState();
        }

        updateShipsUI();
        updateGadgetsUI();
        updateTable();

        // Update URL with initial state (if not loaded from URL)
        if (!loadedFromURL) {
            updateURL();
        }

        // Add resize listener to redraw chart when window size changes
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Debounce resize events to avoid excessive redraws
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateChart();
            }, 150);
        });
    }
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.ui = {
    // Ship UI
    addShip: window.FracturationParty.shipUI.addShip,
    removeShip: window.FracturationParty.shipUI.removeShip,
    onShipTypeChange: window.FracturationParty.shipUI.onShipTypeChange,
    onLaserChange: window.FracturationParty.shipUI.onLaserChange,
    onModuleChange: window.FracturationParty.shipUI.onModuleChange,
    updateShipsUI: window.FracturationParty.shipUI.updateShipsUI,

    // Gadget UI
    addGadget: window.FracturationParty.gadgetUI.addGadget,
    removeGadget: window.FracturationParty.gadgetUI.removeGadget,
    onGadgetChange: window.FracturationParty.gadgetUI.onGadgetChange,

    // Rendering
    updateTable: window.FracturationParty.rendering.updateTable,
    updateChart: window.FracturationParty.rendering.updateChart,

    // HTML Generators (for backward compatibility)
    generateModuleDescriptionHTML: window.FracturationParty.htmlGenerators.generateModuleDescriptionHTML,

    // Initialization
    initializeUI,

    // Test helpers - expose state accessors
    getShipModules: () => window.FracturationParty.uiState.shipModules,
    setShipModules: (newModules) => {
        // Legacy helper - not used in new architecture but kept for test compatibility
        console.warn('setShipModules is deprecated');
    },
    getShipCount: () => window.FracturationParty.uiState.shipCount,
    setShipCount: (newCount) => {
        // Legacy helper - not used in new architecture but kept for test compatibility
        console.warn('setShipCount is deprecated');
    },
    getShips: () => window.FracturationParty.uiState.ships,
    setShips: (newShips) => {
        window.FracturationParty.uiState.ships = newShips;
        window.FracturationParty.uiState.syncLegacyState();
    },

    // MOLE feature test helpers
    createShip: window.FracturationParty.shipUtils.createShip,
    getCompatibleLasers: window.FracturationParty.shipUtils.getCompatibleLasers,
    getShipConfig: window.FracturationParty.uiState.getShipConfig
};
