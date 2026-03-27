// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './_framework/dotnet.js'

let isLoaded = false;
let callOnLoad;
let exports;

async function pickFileAndConvertToRGBA32() {
    // Create file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    return new Promise((resolve, reject) => {
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return reject("No file selected");

            try {
                // Load image
                const img = new Image();
                const url = URL.createObjectURL(file);

                img.onload = () => {
                    URL.revokeObjectURL(url);

                    // Draw to canvas
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);

                    // Get RGBA pixel data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height, { pixelFormat: 'rgba-unorm8' });

                    resolve({
                        width: canvas.width,
                        height: canvas.height,
                        data: imageData.data
                    });
                };

                img.onerror = reject;
                img.src = url;
            } catch (err) {
                reject(err);
            }
        };

        input.click();
    });
}

let imageData;

document.getElementById('pick').addEventListener('click', async () => {
    const result = await pickFileAndConvertToRGBA32();
    /** @type {Uint8ClampedArray} */
    const clampedArray = result.data;
    imageData = new Uint8Array(clampedArray.buffer);
});

document.getElementById('download').addEventListener('click', async () => {
    if (!isLoaded) {
        console.log("Waiting for ColorBlindDeadlock to load...");
        await new Promise(res => {
            callOnLoad = res;
        });
    }

    if (!imageData) {
        console.log("no image data picked");
        return;
    }

    console.log("Generating VPK...");
    var ba = exports.StopwatchSample.MakeVPK(imageData);
    console.log(ba);

    const downloadURL = (data, fileName) => {
        const a = document.createElement('a')
        a.href = data
        a.download = fileName
        document.body.appendChild(a)
        a.style.display = 'none'
        a.click()
        a.remove()
    }

    const downloadBlob = (data, fileName, mimeType) => {

        const blob = new Blob([data], {
            type: mimeType
        })

        const url = window.URL.createObjectURL(blob)

        downloadURL(url, fileName)

        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    }

    downloadBlob(ba, "teste.vpk");
});

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

isLoaded = true;
if (callOnLoad) {
    callOnLoad();
}
