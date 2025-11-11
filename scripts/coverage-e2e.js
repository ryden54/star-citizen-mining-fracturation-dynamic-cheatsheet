import { glob } from 'glob';
import MCR from 'monocart-coverage-reports';
import fs from 'fs';
import path from 'path';

async function run() {
    const coverageFiles = await glob('coverage-v8/*.json');
    if (coverageFiles.length === 0) {
        console.log('No E2E coverage files found.');
        return;
    }

    const coverageResults = [];
    for (const file of coverageFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        coverageResults.push(...JSON.parse(content));
    }

    const mcr = MCR({
        name: 'E2E Coverage',
        outputDir: './coverage-e2e',
        reports: ['lcov']
    });
    await mcr.add(coverageResults);
    await mcr.generate();
}

run();
