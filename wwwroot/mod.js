import { downloadBinary, fileToImageData } from "./file-select.js";
import * as loading from "./loading.js";
import { redrawUI } from "./utils.js";
import { runExportSafely } from "./main.js";

export class Mod {
    #table = document.getElementById("mod-table");

    constructor() {
        document.getElementById("mod-add-row").addEventListener("click", () => this.addRow());
        document.getElementById("mod-save").addEventListener("click", () => this.#saveMod());

        // dont start empty
        this.addRow();
    }

    async getModData() {
        const tbody = this.#table.querySelector('tbody');
        const children = [...tbody.children];
        const modData = [];
        for (const child of children) {
            const row = await this.#parseRow(child);
            if (!row) {
                continue;
            }
            modData.push(row);
        }

        // TODO: check mod for duplicate file paths
        // -> should probably be done in real time as path field is changed

        return modData;
    }

    async #parseRow(row) {
        const filePath = row.querySelector('.filepath').value;
        if (!filePath) {
            return null;
        }

        // TODO: check in nav.vpk if file path is known (if we have one loaded)
        // -> should probably be done in real time as path field is changed

        const uploadFile = row.querySelector('.uploadfile').files?.[0];
        if (!uploadFile) {
            return null;
        }

        // Parse file
        let data;
        if (filePath.endsWith(".vtex_c")) {
            data = await fileToImageData(uploadFile);
        }
        return { path: filePath, data };
    }

    addRow() {
        const row = document.createElement('tr');

        let td = document.createElement('td');
        const filePath = document.createElement('input');
        filePath.className = 'filepath';
        td.appendChild(filePath);
        row.appendChild(td);

        td = document.createElement('td');
        const uploadFile = document.createElement('input');
        uploadFile.className = 'uploadfile';
        uploadFile.type = 'file';
        uploadFile.accept = 'image/png';
        td.appendChild(uploadFile);
        row.appendChild(td);

        td = document.createElement('td');
        const deleteRow = document.createElement('button');
        deleteRow.ariaLabel = 'Delete';
        deleteRow.textContent = 'x';
        deleteRow.className = 'text-btn text-btn--big';
        deleteRow.title = "Delete asset from mod.";
        deleteRow.addEventListener('click', () => {
            row.remove();
            this.#onRowCountChanged();
        });
        td.appendChild(deleteRow);
        row.appendChild(td);

        const tbody = this.#table.querySelector('tbody');
        tbody.appendChild(row);

        this.#onRowCountChanged();
    }

    addOrFillRow(path) {
        const tbody = this.#table.querySelector('tbody');
        
        const fillLastRow = () => {
            const lastTr = tbody.lastElementChild;
            if (lastTr) {
                const filePath = lastTr.querySelector('.filepath');
                if (!filePath.value) {
                    filePath.value = path;
                    return true;
                }
            }
            return false;
        };

        // Is the last row empty?
        if (fillLastRow()) {
            return;
        }

        // Add new row instead.
        this.addRow();
        fillLastRow();
    }

    async #saveMod() {
        loading.show();
        await redrawUI();

        let data;
        try {
            data = await this.getModData();
        } finally {
            loading.hide();
        }

        if (data.length === 0) {
            alert('You first have to add assets to your mod.');
            return;
        }

        const vpk = await runExportSafely("MakeVPK", ...this.#makeVPKArgs(data));
        downloadBinary(vpk, this.getModFileName());
    }

    getModFileName() {
        let text = document.getElementById("mod-name").value;
        if (!text) {
            text = "pak50_dir.vpk";
        }
        if (!text.toLowerCase().endsWith(".vpk")) {
            text = text + ".vpk";
        }
        return text;
    }

    #makeVPKArgs(data) {
        // data is an Array<{ path: string, data: ImageData }>
        // ImageData is { width, height, png }

        const filePaths = data.map(d => d.path);
        const fileSizes = data.map(d => d.data.png.byteLength);
        const textureSizes = data.flatMap(d => [d.data.width, d.data.height]);
        const fileContents = new Uint8Array(fileSizes.reduce((p, c) => p+c, 0));
        let offset = 0;
        for (const png of data.map(d => d.data.png)) {
            fileContents.set(png, offset);
            offset += png.byteLength;
        }

        return [filePaths, fileSizes, fileContents, textureSizes];
    }

    #onRowCountChanged() {
        const tbody = this.#table.querySelector('tbody');
        const rowCount = tbody.childElementCount;
        document.getElementById("mod-row-count").textContent = rowCount === 1 ? '1 asset' : `${rowCount} assets`;
    }
}