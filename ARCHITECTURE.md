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

### UI Layer (`public/js/ui/`)
✅ **COMPLETED** - Fully modularized

```
ui/
├── state-manager.js (93 lines) - Global state with getters/setters
├── ship-utils.js (81 lines) - Ship creation utilities
├── html-generators.js (83 lines) - HTML generation functions
├── rendering.js (100 lines) - Table & chart rendering
├── gadget-ui.js (159 lines) - Gadget UI & events
├── ship-ui.js (417 lines) - Ship/laser/module UI & events
└── index.js (93 lines) - Aggregator & initialization
```

**Benefits:**
- Each file < 420 lines (highly readable)
- Clear separation of concerns
- Easy to test individual modules
- Better code organization

## Modularization Status

**Phase 1: Data Layer Modularization** ✅ COMPLETED
- Split `data.js` into ships, lasers, modules, gadgets
- All 147 tests passing

**Phase 2: UI Layer Modularization** ✅ COMPLETED
- Split `ui.js` (891 lines) into 7 focused modules
- All 147 tests passing (103 unit + 147 E2E)
- Each module has single responsibility
- No breaking changes to API

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

<!-- UI modules (must load in dependency order) -->
<script src="js/ui/state-manager.js"></script>
<script src="js/ui/ship-utils.js"></script>
<script src="js/ui/html-generators.js"></script>
<script src="js/ui/rendering.js"></script>
<script src="js/ui/gadget-ui.js"></script>
<script src="js/ui/ship-ui.js"></script>
<script src="js/ui/index.js"></script>
```

## Testing Strategy

All modules export to `window.FracturationParty` for:
- ✅ Backward compatibility
- ✅ Easy testing (import via app.js)
- ✅ Browser console debugging
- ✅ Works with file:// URLs (no module bundler needed)

## Migration Path

**Phase 1: Data Layer ✅ COMPLETED**
- Split data.js into modular files
- All 147 tests passing
- No breaking changes

**Phase 2: UI Layer ✅ COMPLETED**
- Extracted state-manager.js (state management)
- Extracted ship-utils.js (ship creation utilities)
- Extracted html-generators.js (HTML generation)
- Extracted rendering.js (table/chart rendering)
- Extracted gadget-ui.js (gadget UI)
- Extracted ship-ui.js (ship/laser/module UI)
- Created ui/index.js (aggregator)
- Updated HTML and test imports
- All 147 tests passing (103 unit + 147 E2E)

**Approach:**
- Maintained backward compatibility via namespace exports
- Used getters/setters for state access
- Preserved load order in HTML
- No breaking changes to API

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
| **UI modules** |  |  |
| ui/state-manager.js | 93 | ✅ Modular |
| ui/ship-utils.js | 81 | ✅ Modular |
| ui/html-generators.js | 83 | ✅ Modular |
| ui/rendering.js | 100 | ✅ Modular |
| ui/gadget-ui.js | 159 | ✅ Modular |
| ui/ship-ui.js | 417 | ✅ Modular |
| ui/index.js | 93 | ✅ Modular |

**Before Phase 2:** 1,836 lines across 10 files (average 184 lines/file)
**After Phase 2:** 1,971 lines across 16 files (average 123 lines/file)

**Improvement:** -33% average file size, +60% number of focused modules
