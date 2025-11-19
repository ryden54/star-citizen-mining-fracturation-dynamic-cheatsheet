// URL state management - save/load configuration via URL hash

/**
 * Serialize the current configuration to a URL-safe string
 * @param {Array} ships - Ships configuration array
 * @param {Array} gadgets - Gadgets configuration array
 * @returns {string} Base64 encoded configuration
 */
function serializeConfig(ships, gadgets) {
    const config = {
        ships: ships,
        gadgets: gadgets
    };

    const json = JSON.stringify(config);
    // Use btoa for Base64 encoding (browser-native)
    // encodeURIComponent to handle special characters
    return encodeURIComponent(btoa(json));
}

/**
 * Deserialize configuration from a URL-safe string
 * @param {string} encodedConfig - Base64 encoded configuration
 * @returns {Object|null} Configuration object {ships, gadgets} or null if invalid
 */
function deserializeConfig(encodedConfig) {
    try {
        // Decode URL component then Base64
        const json = atob(decodeURIComponent(encodedConfig));
        const config = JSON.parse(json);

        // Validate structure
        if (!config || typeof config !== 'object') {
            return null;
        }

        if (!Array.isArray(config.ships)) {
            return null;
        }

        if (!Array.isArray(config.gadgets)) {
            return null;
        }

        // Validate ships structure
        for (const ship of config.ships) {
            if (!ship.type || !Array.isArray(ship.lasers)) {
                return null;
            }
            for (const laser of ship.lasers) {
                if (!laser.laserType || !Array.isArray(laser.modules)) {
                    return null;
                }
            }
        }

        // Validate gadgets are strings
        for (const gadget of config.gadgets) {
            if (typeof gadget !== 'string') {
                return null;
            }
        }

        return config;
    } catch (e) {
        return null;
    }
}

/**
 * Update the URL hash with the current configuration
 * @param {Array} ships - Ships configuration array
 * @param {Array} gadgets - Gadgets configuration array
 */
function updateURLHash(ships, gadgets) {
    const encoded = serializeConfig(ships, gadgets);
    const newHash = `#config=${encoded}`;

    // Update hash without triggering page reload or scroll
    if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
    }
}

/**
 * Load configuration from URL hash
 * @returns {Object|null} Configuration object {ships, gadgets} or null if no valid config in URL
 */
function loadFromURLHash() {
    const hash = window.location.hash;

    if (!hash || !hash.startsWith('#config=')) {
        return null;
    }

    const encoded = hash.substring(8); // Remove '#config='
    return deserializeConfig(encoded);
}

/**
 * Clear the URL hash
 */
function clearURLHash() {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

// Export to global namespace
window.FracturationParty = window.FracturationParty || {};
window.FracturationParty.urlState = {
    serializeConfig,
    deserializeConfig,
    updateURLHash,
    loadFromURLHash,
    clearURLHash
};
