import { selectFile } from "./file-select.js";
import { NavVPK } from "./nav-vpk.js";

export class Nav {
    constructor() {
        this.vpk = new NavVPK();
        this.tree = new Treeview({
            containerId: 'nav-tree',
            data: [],
            searchEnabled: true,
            searchPlaceholder: 'Search VPK...',
            initiallyExpanded: false,
            multiSelectEnabled: false,
            onSelectionChange: (selectedNodesData) => {
                const selection = selectedNodesData.length > 0 ? selectedNodesData[0] : null;
                if (!selection) {
                    return;
                }

                window.dl.mod.addOrFillRow(selection.path);
            },
            onRenderNode: (node, nodeContentWrapper) => {
                const nodeTextSpan = document.createElement('span');
                nodeTextSpan.classList.add('treeview-node-text');
                nodeTextSpan.textContent = node.name;
                if (node.path) {
                    nodeTextSpan.title = node.path;
                }
                nodeContentWrapper.appendChild(nodeTextSpan);
            }
        });

        document.getElementById("nav-upload").addEventListener("click", () => this.#onUploadClick());
        document.getElementById("nav-delete").addEventListener("click", () => this.#onDeleteClick());

        if (this.vpk.files?.length) {
            this.load(this.vpk.files);
        }
    }

    #pathsToTree(paths) {
        const root = {
            name: "pak01_dir.vpk",
            selectable: false,
            children: []
        };

        for (const path of paths) {
            const parts = path.split('/');
            let currentLevel = root.children;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;

                let existing = currentLevel.find(node => node.name === part);

                if (!existing) {
                    existing = {
                        name: part,
                        path,
                        selectable: isFile,
                        children: isFile ? undefined : []
                    };

                    currentLevel.push(existing);
                }

                if (!isFile) {
                    currentLevel = existing.children;
                }
            });
        }

        return [root];
    }

    load(paths) {
        const data = this.#pathsToTree(paths);
        this.tree.setData(data);
    }

    async #onUploadClick() {
        const file = await selectFile(".vpk");
        if (!file || !file.name) {
            return;
        }

        await this.vpk.addVPK(file);
        this.load(this.vpk.files);
    }

    #onDeleteClick() {
        this.vpk.clear();
        this.tree.setData([]);
    }
}