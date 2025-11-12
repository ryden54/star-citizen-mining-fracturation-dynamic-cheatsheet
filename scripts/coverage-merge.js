import pkg from 'lcov-result-merger';
const { mergeCoverageReportFiles } = pkg;
import fs from 'fs';

async function run() {
    const tempFilePath = await mergeCoverageReportFiles([
        'coverage/lcov.info',
        'coverage-e2e/lcov.info'
    ]);

    const mergedReport = fs.readFileSync(tempFilePath, 'utf-8');
    fs.writeFileSync('coverage/lcov.info', mergedReport);
}

run();
