import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coverageDir = path.resolve(__dirname, '..', 'coverage-v8');

export const test = base.extend({
  page: async ({ page }, use) => {
    const browserName = page.context().browser().browserType().name();
    const isChromium = browserName === 'chromium';

    if (isChromium) {
        await page.coverage.startJSCoverage({
            reportAnonymousScripts: false,
            resetOnNavigation: false
        });
    }

    await use(page);

    if (isChromium) {
        const jsCoverage = await page.coverage.stopJSCoverage();

        const coverageData = jsCoverage.filter(entry => {
            // Capture all JS files in the public/js/ folder
            return entry.url.includes('/js/');
        });

        if (coverageData.length > 0) {
            if (!fs.existsSync(coverageDir)) {
                fs.mkdirSync(coverageDir, { recursive: true });
            }
            const filename = `coverage-${Date.now()}-${Math.random()}.json`;
            fs.writeFileSync(path.join(coverageDir, filename), JSON.stringify(coverageData));
        }
    }
  }
});

export { expect };
