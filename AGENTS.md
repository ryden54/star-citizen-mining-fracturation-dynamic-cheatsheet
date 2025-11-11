# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

Quick reference tool for **cooperative mining in Star Citizen 4.0+**. Allows players to quickly determine during prospecting whether a rock is fracturable with their current configuration.

**Problem solved:** In solo mining, the game displays "easy/medium/challenging/impossible", but in cooperative mode or with gadgets, it's impossible to know in advance if a rock is doable without consulting a pre-calculated capacity table.

**Language:** English (all UI text, comments, and variables must be in English)

## Technical Architecture

**Structure:** Separate files for maintainability (in `public/` directory)
- `public/index.html` - HTML structure only
- `public/style.css` - All styling
- `public/script.js` - All JavaScript logic

**Calculation system:**
- Laser database with power/instability/resistance multipliers
- Combined power = additive (sum of lasers)
- Modifiers = multiplicative (diminishing returns)
- Max mass formula: `(baseMass * combinedPower * baseResistance) / (effectiveResistance + 0.01)`
- Reference values: 3000kg @ resistance 0.25, capped at 15000kg

## Current Status vs Future Goals

**Implemented:**
- Multi-Prospector configuration (dynamic add/remove)
- 4 mining laser types (Arbor, Hofstede, Helix, Lancet)
- **Mining modules** (16 modules from 3 manufacturers, 3 slots per laser)
- Capacity table by resistance level (0%-80%)
- Module power multipliers (additive/multiplicative stacking)

**To implement:**
- **Mining gadgets** (e.g., Saber) - temporary power modifiers
- Support for other ships (MOLE with 3 lasers, etc.)
- Laser sizes (S0, S1, S2...)
- Ability to combine different ships (e.g., Prospector + MOLE)
- Save/load favorite configurations

## Key Functions

**Configuration:**
- `addShip()`/`removeShip(index)`: Manage ship count
- `updateShipsUI()`: Regenerate configuration UI
- `getShipConfig()`: Extract selected lasers and modules (returns `{laser, modules}` objects)
- `onLaserChange(shipIndex)`: Handle laser changes and reset modules

**Calculations:**
- `calculateCombinedPower(ships)`: Sum of power values with module multipliers
- `calculateCombinedModifiers(ships)`: Product of laser modifiers (instability/resistance)
- `calculateMaxMass(resistance, ships)`: Main max mass formula

**User interface:**
- `updateTable()`: Regenerate capacity table with module indicators

## Reference Data

**Available lasers** (`laserData` object in `public/script.js`):
```javascript
{
  arbor: { power: 1850, instability: 1.0, resistance: 1.0, moduleSlots: 3 },      // Default rental
  hofstede: { power: 1295, instability: 0.5, resistance: 0.7, moduleSlots: 3 },   // -30% resistance
  helix: { power: 1850, instability: 0.6, resistance: 0.7, moduleSlots: 3 },      // -40% instability, -30% resistance
  lancet: { power: 1850, instability: 0.7, resistance: 1.0, moduleSlots: 3 }      // -30% instability (support)
}
```

**Mining modules** (`moduleData` object - 3 slots per laser):
- **Greycat** (easier control): FLTR, FLTR-L, FLTR-XL, XTR, XTR-L, XTR-XL
  - Power: 0.85x - 0.95x
  - Benefit: Wider optimal charge window (easier green zone)

- **Thermyte** (faster charge): Focus, Focus II, Focus III
  - Power: 0.85x - 0.95x
  - Benefit: Faster charge rate (quicker fracturing)

- **Shubin** (more power): Rieger, Rieger-C2, Rieger-C3, Vaux, Vaux-C2, Vaux-C3
  - Power: 1.15x - 1.25x (+15% to +25%)
  - Trade-off: More capacity but harder to control

**Module stacking:** Multipliers stack multiplicatively (e.g., 3× Rieger = 1.15³ = 1.52x total)

**Resistance levels tested:** 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%

## Usage

**Open application:** Double-click `public/index.html` (no dependencies, no build process)

**Typical workflow:**
1. Configure number of Prospectors
2. Select lasers for each ship
3. Consult automatically generated capacity table

## Development Workflow (for AI assistants)

**IMPORTANT: Before starting any implementation:**
1. **Ask clarifying questions first** - Ask all necessary questions ONE AT A TIME before writing any code
2. **Ensure full understanding** - Don't start coding until requirements are completely clear
3. **Confirm approach** - Discuss the implementation approach with the user before proceeding

**During development:**
1. **Always run tests after modifications** - Use `npm test` to run both unit and E2E tests
2. **Verify all tests pass** - ALL tests (unit + E2E) must pass before committing
3. **Test incrementally** - Run tests after each significant change, not just at the end

**Before committing:**
1. **ALWAYS ask permission before committing** - The user must review and approve changes
2. **Explain what was done** - Summarize the changes clearly
3. **Wait for confirmation** - Never commit without explicit user approval

**Merging to main:**
- **All feature branches must go through a Pull Request** - Never merge directly to main
- Create PR after feature is complete and all tests pass
- User will review and merge the PR

**Why these rules exist:**
- Misunderstandings are common - asking questions upfront prevents wasted work
- Tests catch regressions and ensure quality
- User review ensures the implementation matches their actual intent
- PRs provide a clear review process and history

## Development Notes

- Table values are approximate, based on community data
- Calculation formula is empirical and may need adjustment with game patches
- Instability doesn't affect fracturing capacity, only control difficulty
- Table updates automatically via `onchange` on laser selectors
- **All UI text, variable names, and comments must be in English**
- toutes les feature branches doivent passer par une PR pour être mergées dans main