# Star Citizen - Cooperative Mining Calculator

**Live app:** https://ryden54.github.io/star-citizen-mining-fracturation-dynamic-cheatsheet/

[![codecov](https://codecov.io/gh/ryden54/star-citizen-mining-fracturation-dynamic-cheatsheet/graph/badge.svg)](https://codecov.io/gh/ryden54/star-citizen-mining-fracturation-dynamic-cheatsheet)

Quick reference tool for **cooperative mining in Star Citizen 4.0+**. Helps players determine during prospecting whether a rock is fracturable with their current configuration.

## Problem Solved

In solo mining, the game displays "easy/medium/challenging/impossible", but in cooperative mode or with gadgets, it's impossible to know in advance if a rock is doable without consulting a pre-calculated capacity table.

## The Fracture Formula

This calculator uses a scientifically calibrated formula to predict whether a rock can be fractured based on its mass and resistance.

### Mathematical Model

The maximum fracturable mass is calculated using a **linear resistance model**:

```
max_mass = baseline × (power / baseline_power) × (1 - R)
```

Where:
- `baseline` = 9500 kg (calibrated baseline for Arbor MH1 laser at 0% resistance)
- `baseline_power` = 1890 (fracturing power of Arbor MH1)
- `power` = combined fracturing power of all lasers (with module modifiers applied)
- `R` = effective rock resistance (0.0 to 1.0, after gadget and laser modifiers)

### Why This Formula?

**Data-Driven Calibration**: The formula was validated against **59 in-game measurements** collected from Star Citizen (Prospector rental + Arbor MH1 laser), achieving **100% prediction accuracy**.

**Linear vs Exponential**: Testing revealed that a linear relationship `(1 - R)` outperforms exponential models for Star Citizen's mining mechanics:
- At 0% resistance: max mass = 9500 kg
- At 50% resistance: max mass = 4750 kg (exactly half)
- At 100% resistance: max mass = 0 kg (unfracturable)

**Comparison with Alternative Models**: Another developer (Mericet) proposed a Power Breakpoint formula using `(1 + R)` resistance scaling. When tested against our dataset, our `(1 - R)` model achieved 100% accuracy vs 95.7% for the alternative approach.

### Validation

The formula correctly predicts all edge cases from in-game testing:
- **Critical case**: 11,958 kg at 0% resistance is impossible (proves absolute mass limit)
- **Gadget effectiveness**: Sabir gadget reduces resistance by 50% (8279 kg rock goes from impossible at 14% to fracturable at 7%)
- **Difficulty zones**: Prediction margins match in-game difficulty labels (easy/medium/challenging/hard)

For technical details, see:
- `tests/reference-data-prospector.json` - All 59 in-game measurements
- `tests/formula-optimizer.js` - Calibration algorithm that tested thousands of parameter combinations
- `tests/formula-visualization.html` - Interactive chart showing formula accuracy
- `tests/formula-comparison.js` - Comparison with alternative models

## Features

- ✅ Multi-Prospector configuration (add/remove ships dynamically)
- ✅ 4 mining laser types (Arbor, Hofstede, Helix, Lancet)
- ✅ Real-time capacity table by resistance level (0%-80%)

## Usage

Simply open `public/index.html` in any modern browser. No build process or server required.

### Typical Workflow

1. Configure the number of Prospectors
2. Select lasers for each ship
3. Consult the automatically generated capacity table

## Testing

This project uses a modern testing stack with **Vitest** (unit tests) and **Playwright** (E2E tests).

### Prerequisites

```bash
# Install dependencies (for testing only - not needed to run the app)
npm install

# Install Playwright browsers (first time only, for E2E tests)
npm run playwright:install
```

### Running Tests Locally

```bash
# Run all tests (unit + E2E)
npm test

# Run only unit tests
npm run test:unit

# Run unit tests in watch mode (during development)
npm run test:unit:watch

# Run only E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests with visible browser
npm run test:e2e:headed
```

### Test Structure

```
tests/
├── calculations.test.js    # Unit tests for calculation functions
└── app.e2e.js              # End-to-end tests for user interactions
```

### Unit Tests Coverage

- Laser data validation
- Combined power calculations
- Modifier calculations (instability, resistance)
- Maximum mass calculations
- Mining feasibility checks
- Real-world scenarios (multiple ships, different configurations)

### E2E Tests Coverage

- Page loading and initial state
- Adding/removing Prospectors
- Laser selection and preservation
- Capacity table updates
- Multi-ship capacity increase

### CI/CD

Tests run automatically on GitHub Actions for every push and pull request to the `main` branch. The workflow:

1. Installs dependencies
2. Runs unit tests with coverage
3. Installs Playwright browsers
4. Runs E2E tests across Chromium, Firefox, and WebKit (using file:// URLs - no HTTP server needed)
5. Uploads coverage to Codecov and test reports as artifacts

## Project Structure

```
.
├── public/                 # Web assets
│   ├── index.html         # Main HTML structure
│   ├── style.css          # All styling
│   └── js/                # Modular JavaScript (dual-compatible for file:// URLs)
│       ├── data.js        # Laser and module data
│       ├── calculations.js # Mining calculations
│       ├── ui.js          # UI state and DOM manipulation
│       └── app.js         # Initialization and test exports
├── tests/
│   ├── calculations.test.js   # Unit tests
│   └── app.e2e.js             # E2E tests
├── package.json            # Dependencies and scripts
├── vitest.config.js        # Vitest configuration
├── playwright.config.js    # Playwright configuration
├── .github/
│   └── workflows/
│       └── test.yml        # GitHub Actions workflow
├── AGENTS.md               # Developer guidance
└── README.md               # This file
```

## Development

The application is a single-page app with no build process:
- Pure HTML/CSS/JavaScript
- No framework dependencies for the app itself
- Test dependencies are dev-only

### Making Changes

1. Edit files in `public/` directory (`index.html`, `style.css`, or `script.js`)
2. Run tests to ensure nothing breaks: `npm test`
3. Open `public/index.html` in browser to manually verify
4. Commit changes (tests will run on GitHub)

## Roadmap

Future features to implement:
- Mining gadgets (e.g., Saber) - temporary power modifiers
- Support for other ships (MOLE with 3 lasers, etc.)
- Laser sizes (S0, S1, S2...)
- Laser modifications
- Ability to combine different configurations
- Save/load favorite configurations

## License

This is a community tool for Star Citizen players. Not affiliated with Cloud Imperium Games.
