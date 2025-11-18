# Architecture & Code Organization

This document describes the current code structure and provides recommendations for future modularization.

## Current Structure

### Data Layer (`public/js/data/`)
✅ **COMPLETED** - Fully modularized

```
data/
├── ships.js (35 lines) - 3 mining ships (Golem, Prospector, MOLE)
├── lasers.js (160 lines) - 14 lasers (7 Size-1 + 7 Size-2)
├── modules.js (130 lines) - 15 modules (3 manufacturers)
├── gadgets.js (85 lines) - 7 gadgets (3 manufacturers)
└── index.js (20 lines) - Aggregator for namespace consistency
```

**Benefits:**
- Each file < 160 lines (highly readable)
- Clear separation by data type
- Easy to add new ships/lasers/modules/gadgets
- Could support lazy-loading in future

### Core Modules (`public/js/`)
✅ Well-organized, single-responsibility modules

- **`calculations.js`** (122 lines) - Pure calculation functions
- **`chart.js`** (277 lines) - Canvas-based chart rendering
- **`url-state.js`** (116 lines) - URL serialization/deserialization
- **`app.js`** (35 lines) - Test exports aggregator

### UI Layer (`public/js/ui.js`)
⚠️ **NEEDS REFACTORING** - Monolithic file (891 lines)

Current responsibilities in single file:
1. State management (ships, gadgets arrays)
2. Ship UI rendering & events
3. Laser UI rendering & events
4. Module UI rendering & events
5. Gadget UI rendering & events
6. Table rendering
7. Chart updates
8. HTML generation utilities
9. Initialization

## Future Modularization Recommendations

### Phase 2: Split `ui.js` (Recommended)

```
ui/
├── state-manager.js (~110 lines)
│   - Global state (ships, gadgets)
│   - State accessors (getShips, setShips, etc.)
│   - URL synchronization (updateURL, loadFromURL)
│   - Legacy state sync
│
├── ship-utils.js (~80 lines)
│   - createShip(shipType)
│   - getCompatibleLasers(shipType)
│   - Ship creation utilities
│
├── ship-ui.js (~175 lines)
│   - addShip(), removeShip()
│   - onShipTypeChange()
│   - updateShipsUI()
│   - Ship DOM manipulation
│
├── laser-ui.js (~200 lines)
│   - onLaserChange()
│   - generateLaserStatsHTML()
│   - Laser selection & modules
│
├── gadget-ui.js (~140 lines)
│   - addGadget(), removeGadget()
│   - onGadgetChange()
│   - updateGadgetsUI()
│
├── rendering.js (~60 lines)
│   - updateTable()
│   - updateChart()
│   - Pure rendering functions
│
├── html-generators.js (~80 lines)
│   - generateModuleDescriptionHTML()
│   - generateLaserStatsHTML()
│   - Reusable HTML utilities
│
└── index.js (~50 lines)
    - Aggregator
    - initializeUI()
    - Event listeners
```

### Benefits of Further Modularization
- ✅ Each module < 200 lines (easier to understand)
- ✅ Clear separation of concerns
- ✅ Easier to test individual modules
- ✅ Better code reuse
- ✅ Simpler debugging (isolated responsibilities)

### Challenges to Consider
- Need to manage shared state carefully
- Must maintain load order in HTML
- Risk of circular dependencies if not careful
- Migration effort vs. benefit trade-off

## Dependency Graph

```
┌─────────────────────────────────────┐
│   Data Layer (data/index.js)        │
│   Ships, Lasers, Modules, Gadgets   │
└─────────────┬───────────────────────┘
              │
       ┌──────┴──────┬─────────────┐
       │             │             │
┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│ calculations│ │  chart  │ │  url-state  │
└──────┬──────┘ └────┬────┘ └──────┬──────┘
       │             │             │
       └──────┬──────┴─────┬───────┘
              │            │
         ┌────▼────────────▼───┐
         │      ui.js           │
         │  (DOM & Events)      │
         └──────────────────────┘
```

## Load Order (HTML)

Current order in `index.html`:
```html
<!-- Data modules (must load first) -->
<script src="js/data/ships.js"></script>
<script src="js/data/lasers.js"></script>
<script src="js/data/modules.js"></script>
<script src="js/data/gadgets.js"></script>
<script src="js/data/index.js"></script>

<!-- Core modules -->
<script src="js/calculations.js"></script>
<script src="js/chart.js"></script>
<script src="js/url-state.js"></script>

<!-- UI (depends on all above) -->
<script src="js/ui.js"></script>
```

## Testing Strategy

All modules export to `window.FracturationParty` for:
- ✅ Backward compatibility
- ✅ Easy testing (import via app.js)
- ✅ Browser console debugging
- ✅ Works with file:// URLs (no module bundler needed)

## Migration Path

**Current Status: Phase 1 Complete ✅**
- Data layer fully modularized
- All 147 tests passing
- No breaking changes

**Next Steps (Optional):**
1. Extract state-manager.js from ui.js
2. Extract ship-utils.js utilities
3. Split remaining UI rendering functions
4. Create ui/index.js aggregator
5. Update HTML/test imports

**Considerations:**
- Keep PRs focused (one module at a time)
- Maintain test coverage at each step
- Document any API changes
- Consider waiting for real need before splitting ui.js further

## File Size Summary

| File | Lines | Status |
|------|-------|--------|
| **Data modules** |  |  |
| data/ships.js | 35 | ✅ Modular |
| data/lasers.js | 160 | ✅ Modular |
| data/modules.js | 130 | ✅ Modular |
| data/gadgets.js | 85 | ✅ Modular |
| data/index.js | 20 | ✅ Modular |
| **Core modules** |  |  |
| calculations.js | 122 | ✅ Good size |
| chart.js | 277 | ✅ Good size |
| url-state.js | 116 | ✅ Good size |
| **UI** |  |  |
| ui.js | 891 | ⚠️ Could be split |

**Total:** 1,836 lines across 10 files (average 184 lines/file)
