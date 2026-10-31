const fs = require('fs');
const path = require('path');

// Scan the /extensions directory for plug-and-play modules,
// read their manifests, cache metadata, and load backend routers dynamically.
function loadExtensions(extensionsDir) {
    const extensionManifests = [];
    const extensionHandlers = [];

    if (!fs.existsSync(extensionsDir)) {
        return { extensionManifests, extensionHandlers };
    }

    const extFolders = fs.readdirSync(extensionsDir, { withFileTypes: true });
    
    extFolders.forEach(dirent => {
        if (dirent.isDirectory()) {
            const extName = dirent.name;
            const manifestPath = path.join(extensionsDir, extName, 'manifest.json');
            const backendPath = path.join(extensionsDir, extName, 'backend.js');

            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    extensionManifests.push(manifest);
                    console.log(`[Extension] Discovered: ${manifest.name} (v${manifest.version})`);

                    if (fs.existsSync(backendPath)) {
                        const registerBackend = require(backendPath);
                        if (typeof registerBackend === 'function') {
                            extensionHandlers.push(registerBackend);
                            console.log(`[Extension] Loaded backend for: ${extName}`);
                        }
                    }
                } catch (err) {
                    console.error(`[Extension] Failed to load extension ${extName}:`, err.message);
                }
            }
        }
    });

    return { extensionManifests, extensionHandlers };
}

module.exports = { loadExtensions };