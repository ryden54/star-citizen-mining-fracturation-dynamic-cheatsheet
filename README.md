# Star Citizen - Cooperative Mining Calculator

[![codecov](https://codecov.io/gh/ryden54/star-citizen-rock-fracturation/graph/badge.svg)](https://codecov.io/gh/ryden54/star-citizen-rock-fracturation)

Quick reference tool for **cooperative mining in Star Citizen 4.0+**. Helps players determine during prospecting whether a rock is fracturable with their current configuration.

## Problem Solved

In solo mining, the game displays "easy/medium/challenging/impossible", but in cooperative mode or with gadgets, it's impossible to know in advance if a rock is doable without consulting a pre-calculated capacity table.

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
# Install dependencies
npm install

# Install Playwright browsers (first time only)
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
2. Runs unit tests
3. Installs Playwright browsers
4. Runs E2E tests across Chromium, Firefox, and WebKit
5. Uploads test reports as artifacts

## Project Structure

```
.
├── public/                 # Web assets
│   ├── index.html         # Main HTML structure
│   ├── style.css          # All styling
│   └── script.js          # Application logic
├── tests/
│   ├── calculations.test.js   # Unit tests
│   └── app.e2e.js             # E2E tests
├── package.json            # Dependencies and scripts
├── vitest.config.js        # Vitest configuration
├── playwright.config.js    # Playwright configuration
├── .github/
│   └── workflows/
│       └── test.yml        # GitHub Actions workflow
├── CLAUDE.md               # Developer guidance
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
