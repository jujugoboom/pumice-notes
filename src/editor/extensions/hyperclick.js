import { EditorView } from "@codemirror/view";
import { countColumn } from "@codemirror/text";

const MaxOff = 2000;

let openFile;

function absoluteColumn(view, x) {
    let ref = view.coordsAtPos(view.viewport.from)
    return ref ? Math.round(Math.abs((ref.left - x) / view.defaultCharacterWidth)) : -1
}

function getPos(view, event) {
    let offset = view.posAtCoords({x: event.clientX, y: event.clientY}, false);
    let line = view.state.doc.lineAt(offset);
    let off = offset - line.from;
    let col = off > MaxOff ? -1
      : off === line.length ? absoluteColumn(view, event.clientX)
      : countColumn(line.text, view.state.tabSize, offset - line.from);
    return {line: line.number, col, off}
  }

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