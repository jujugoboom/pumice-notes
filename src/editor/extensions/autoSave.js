import { ViewPlugin } from "@codemirror/view";

export function autoSave(config = {}) {
    const autoSaver = ViewPlugin.fromClass(class {
        constructor(view) {
            this.saveTimeout = null;
        }
    
        update(update) {
            if (update.docChanged) {
                this.lastUpdate = update;
                if (!this.saveTimeout) {
                    this.saveTimeout = setTimeout(() => {
                        config.onSave && config.onSave(this.lastUpdate);
                        this.saveTimeout = null;
                    }, 1000);
                }
            }
        }
    });
    return [
        autoSaver,
    ];
} 