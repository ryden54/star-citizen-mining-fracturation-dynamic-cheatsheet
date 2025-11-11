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
- Capacity table by resistance level (0%-80%)

**To implement:**
- **Mining gadgets** (e.g., Saber) - temporary power modifiers
- Support for other ships (MOLE with 3 lasers, etc.)
- Laser sizes (S0, S1, S2...)
- Laser modifications
- Ability to combine different configurations (e.g., Prospector + Saber gadget)
- Save/load favorite configurations

## Key Functions

**Configuration:**
- `addShip()`/`removeShip()`: Manage ship count
- `updateShipsUI()`: Regenerate configuration UI
- `getShipConfig()`: Extract selected lasers

**Calculations:**
- `calculateCombinedPower(lasers)`: Sum of power values
- `calculateCombinedModifiers(lasers)`: Product of modifiers
- `calculateMaxMass(resistance, lasers)`: Main max mass formula

**User interface:**
- `updateTable()`: Regenerate capacity table

## Reference Data

**Available lasers** (`laserData` object in `public/script.js`):
```javascript
{
  arbor: { power: 1.0, instability: 1.0, resistance: 1.0 },      // Default rental
  hofstede: { power: 1.0, instability: 0.5, resistance: 1.0 },   // 6,375 aUEC
  helix: { power: 1.3, instability: 0.5, resistance: 1.0 },      // 54,000 aUEC
  lancet: { power: 0.85, instability: 0.7, resistance: 0.65 }    // Support
}
```

**Resistance levels tested:** 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%

## Usage

**Open application:** Double-click `public/index.html` (no dependencies, no build process)

**Typical workflow:**
1. Configure number of Prospectors
2. Select lasers for each ship
3. Consult automatically generated capacity table

## Development Notes

- Table values are approximate, based on community data
- Calculation formula is empirical and may need adjustment with game patches
- Instability doesn't affect fracturing capacity, only control difficulty
- Table updates automatically via `onchange` on laser selectors
- **All UI text, variable names, and comments must be in English**
