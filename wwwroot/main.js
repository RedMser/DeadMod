import { dotnet } from './_framework/dotnet.js'
import { Nav } from './nav.js';
import * as loading from './loading.js';
import { redrawUI } from "./utils.js";
import { Mod } from './mod.js';

let exports;

export async function getExports() {
    await loading.waitUntilDone();
    return exports;
}

export function runExportSafely(methodName, ...args) {
    return _runExportSafely(methodName, false, ...args);
}

export function runExportSafelySlow(methodName, ...args) {
    return _runExportSafely(methodName, true, ...args);
}

async function _runExportSafely(methodName, isSlow, ...args) {
    const exports = await getExports();

    try {
        loading.show(isSlow);
        await redrawUI();
        return exports.SourceTwoUtils[methodName](...args);
    } finally {
        loading.hide();
    }
}

// Hide the initial loading screen, to make the UI responsive.
loading.hide();

// Init stuff
window.dl = {
    nav: new Nav(),
    mod: new Mod(),
};

const { setModuleImports, getAssemblyExports, getConfig, runMain } = await dotnet.create();

/*
setModuleImports('main.js', {
    dom: {
        setInnerText: (selector, time) => document.querySelector(selector).innerText = time
    }
});
*/

const config = getConfig();
exports = await getAssemblyExports(config.mainAssemblyName);

// run the C# Main() method and keep the runtime process running and executing further API calls
await runMain();

loading.onDone();
