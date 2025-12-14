const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const apiDir = path.join(projectRoot, 'src', 'app', 'api');
const apiDisabledDir = path.join(projectRoot, 'src', 'app', '_api_disabled');

// Helper to handle cleanup
function cleanup() {
    if (fs.existsSync(apiDisabledDir)) {
        try {
            if (fs.existsSync(apiDir)) {
                // If both exist (weird state), remove the disabled one or merge? 
                // Safer to just remove the temp one if the original is back.
                // But if original isn't back, move temp back.
                console.warn('Both api and _api_disabled exist. Please check manually.');
            } else {
                fs.renameSync(apiDisabledDir, apiDir);
                console.log('Restored src/app/api');
            }
        } catch (err) {
            console.error('Failed to restore API directory:', err);
        }
    }
}

// 1. Rename API directory
if (fs.existsSync(apiDir)) {
    console.log('Moving src/app/api to src/app/_api_disabled for static build...');
    try {
        fs.renameSync(apiDir, apiDisabledDir);
    } catch (err) {
        console.error('Failed to move API directory:', err);
        process.exit(1);
    }
} else {
    console.log('No src/app/api directory found, skipping move.');
}

// 2. Run Build
try {
    console.log('Running Next.js build for Desktop...');
    execSync('cross-env APP_ENV=desktop next build --webpack', {
        stdio: 'inherit',
        cwd: projectRoot
    });
    console.log('Build completed successfully.');
} catch (err) {
    console.error('Build failed.');
    cleanup();
    process.exit(1);
}

// 3. Restore API directory
cleanup();
