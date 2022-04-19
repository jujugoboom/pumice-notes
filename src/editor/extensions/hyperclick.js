import { hoverTooltip } from "@codemirror/tooltip";
import { EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";

let openFile;

const platform = window.navigator?.userAgentData?.platform ?? window.navigator.platform;
const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];

const isMac = macosPlatforms.indexOf(platform) !== -1;

const handleClick = (view, event) => {
    if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const pos = view.posAtCoords({x: event.clientX, y: event.clientY}, false);
        const dom = view.domAtPos(pos);
        console.log(dom);
        let url = '';
        if (dom.node?.parentElement?.classList?.contains('cm-url')) {
            if (dom.node.parentElement.href) {
                url = dom.node.parentElement.href;
            } else {
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
}

const hyperclickTooltip = hoverTooltip((view, pos, side) => {
    const dom = view.domAtPos(pos);
    if (dom.node?.parentElement?.classList?.contains('cm-url')) {
        let {from, to, text} = view.state.doc.lineAt(pos);
        let start = pos, end = pos
        while (start > from && /\w/.test(text[start - from - 1])) start--
        while (end < to && /\w/.test(text[end - from])) end++
        if ((start === pos && side < 0) || (end === pos && side > 0))
            return null
        return {
            pos: start,
            end,
            above: true,
            create(view) {
                let dom = document.createElement("div")
                dom.textContent = `${isMac ? "Cmd" : "Ctrl"}+click to open`
                return {dom}
            }
        }
    }
})

export function hyperclick(config = {}) {
    openFile = config.openFile;
    const hyperclick = EditorView.mouseSelectionStyle.of(handleClick);
    
    return [Prec.highest(hyperclick), hyperclickTooltip];
}