import { EditorView } from "@codemirror/view";

let openFile;

const handleClick = (view, event) => {
    if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const pos = view.posAtCoords({x: event.clientX, y: event.clientY}, false);
        const dom = view.domAtPos(pos);
        let url = '';
        if (dom.node?.parentElement?.classList?.contains('cm-url')) {
            url = dom.node.data;
        }
        const httpRegex = /^(http|https):\/\//g;
        if (url.match(httpRegex)) {
            window.electronAPI.openBrowser(url);
        } else {
            openFile && openFile(url, true, true);
        }
    }
}

export function hyperclick(config = {}) {
    openFile = config.openFile;
    const hyperclick = EditorView.mouseSelectionStyle.of(handleClick);
    return [hyperclick];
}