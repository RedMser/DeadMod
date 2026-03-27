// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

import { dotnet } from './_framework/dotnet.js'

const { setModuleImports, getAssemblyExports, getConfig, runMain } = await dotnet
    .withApplicationArguments("start")
    .create();

setModuleImports('main.js', {
    dom: {
        setInnerText: (selector, time) => document.querySelector(selector).innerText = time
    }
});

const config = getConfig();
const exports = await getAssemblyExports(config.mainAssemblyName);

document.getElementById('reset').addEventListener('click', e => {
    var ba = exports.StopwatchSample.MakeVPK();
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

    e.preventDefault();
});

// run the C# Main() method and keep the runtime process running and executing further API calls
await runMain();