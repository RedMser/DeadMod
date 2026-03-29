/** @returns {Promise<File>} */
export async function selectFile(accept = "") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;

    return new Promise((res, rej) => {
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) {
                rej(new Error('No files in selection.'));
            } else {
                res(file);
            }
        };

        input.click();
    });
}

export async function fileToImageData(file) {
    // This only supports png as input. Canvas drawImage loses RGB data on alpha=0 due to
    // premultiplied alpha.
    return new Promise((resolve, reject) => {
        // Load image
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
            URL.revokeObjectURL(url);
            
            const arrayBuffer = await file.arrayBuffer();
            const pngBytes = new Uint8Array(arrayBuffer);

            resolve({
                width: img.width,
                height: img.height,
                png: pngBytes,
            });
        };

        img.onerror = reject;
        img.src = url;
    });
}

export function downloadURL(data, fileName) {
    const a = document.createElement('a')
    a.href = data
    a.download = fileName
    document.body.appendChild(a)
    a.style.display = 'none'
    a.click()
    a.remove()
}

export function downloadBinary(data, fileName, mimeType) {

    const blob = new Blob([data], {
        type: mimeType
    })

    const url = window.URL.createObjectURL(blob)

    downloadURL(url, fileName)

    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}
