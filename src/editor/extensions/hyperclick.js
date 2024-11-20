import { EditorView, hoverTooltip } from "@codemirror/view";
import { Prec } from "@codemirror/state";

let openFile;

const platform = window.navigator.platform;
const macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"];

const isMac = macosPlatforms.indexOf(platform) !== -1;

const handleClick = (view, event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    let target = event.target;
    let url = "";
    if (
      target.classList?.contains("cm-url") ||
      target.classList?.contains("cm-link")
    ) {
      if (
        target.classList?.contains("cm-link") &&
        !target.classList?.contains("cm-url")
      ) {
        // Check for adjacent urls before just using link
        if (target.nextSibling.classList?.contains("cm-url")) {
          target = target.nextSibling;
        }
      }
      if (target.href) {
        url = target.href;
      } else {
        url = target.innerText;
      }
      url = url.replace("<", "").replace(">", "");
      const httpRegex = /^(http|https):\/\//g;
      const mailtoRegex = /^mailto:/g;
      if (url.match(httpRegex) || url.match(mailtoRegex)) {
        window.electronAPI.openBrowser(url);
      } else {
        url = url.endsWith(".md") ? url : `${url}.md`;
        openFile && openFile(url, true, true);
      }
    }
  }
};

const hyperclickTooltip = hoverTooltip((view, pos, side) => {
  const dom = view.domAtPos(pos);
  if (
    dom.node?.parentElement?.classList?.contains("cm-url") ||
    dom.node?.parentElement?.classList?.contains("cm-link")
  ) {
    let { from, to, text } = view.state.doc.lineAt(pos);
    let start = pos,
      end = pos;
    while (start > from && /\w/.test(text[start - from - 1])) start--;
    while (end < to && /\w/.test(text[end - from])) end++;
    if ((start === pos && side < 0) || (end === pos && side > 0)) return null;
    return {
      pos: start,
      end,
      above: true,
      create(view) {
        let dom = document.createElement("div");
        dom.textContent = `${isMac ? "Cmd" : "Ctrl"}+click to open`;
        return { dom };
      },
    };
  }
});

export function hyperclick(config = {}) {
  openFile = config.openFile;
  const hyperclick = EditorView.mouseSelectionStyle.of(handleClick);

  return [Prec.highest(hyperclick), hyperclickTooltip];
}
