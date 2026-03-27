import { runExportSafelySlow } from "./main.js";
import { setVisible, dateToRelative } from "./utils.js";

export class NavVPK {
    #files = undefined;
    get files() {
        return this.#files;
    }
    set files(value) {
        this.#files = value;

        setVisible(document.getElementById("nav-tree"), !!value);
        document.getElementById("nav-delete").disabled = !value;

        localStorage.setItem("dlmodding:nav:vpk:files", JSON.stringify(value));
    }

    #date = undefined;
    get date() {
        return this.#date;
    }
    set date(value) {
        this.#date = value;

        setVisible(document.getElementById("nav-explanation-no-file"), value === undefined);
        setVisible(document.getElementById("nav-explanation-file"), value !== undefined);
        document.querySelector('#nav-explanation-file .date').textContent = dateToRelative(value);
    }

    constructor() {
        try {
            const storedFiles = localStorage.getItem("dlmodding:nav:vpk:files");
            if (storedFiles) {
                this.files = JSON.parse(storedFiles);
            }

            const storedDate = localStorage.getItem("dlmodding:nav:vpk:date");
            if (storedDate) {
                this.date = new Date(parseInt(storedDate, 10));
            }
        } catch {}
    }

    /** @param file {File} */
    async addVPK(file) {
        const bytes = await file.bytes();
        if (file.name === 'pak01_dir.vpk') {
            // Load directory
            this.date = new Date();
            localStorage.setItem("dlmodding:nav:vpk:date", this.date.getTime());

            this.files = await runExportSafelySlow("ListFilePaths", bytes);
        } else if (file.name.startsWith("pak")) {
            alert("Unexpected pak file. You need to select the pak01_dir.vpk file from the Deadlock installation folder.");
        } else {
            alert("Unexpected file selected. You need to select the pak01_dir.vpk file from the Deadlock installation folder.");
        }
    }

    clear() {
        this.files = undefined;
    }
}
