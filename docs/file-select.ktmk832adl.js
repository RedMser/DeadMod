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
    return new Promise((resolve, reject) => {
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

            // Encode canvas as PNG blob
            canvas.toBlob(async (blob) => {
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const pngBytes = new Uint8Array(arrayBuffer);

                    resolve({
                        width: canvas.width,
                        height: canvas.height,
                        png: pngBytes // full PNG byte stream (with headers)
                    });
                } catch (err) {
                    reject(err);
                }
            }, "image/png");
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
