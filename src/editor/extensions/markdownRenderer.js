import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin, WidgetType } from "@codemirror/view";

const hiddenMark = Decoration.mark({ class: "cm-hidden" });
const strikethruMark = Decoration.mark({ tagName: "del" });
const checkMark = Decoration.mark({
  tagName: "input",
  attributes: { type: "checkbox", checked: true, disabled: true },
});
const uncheckMark = Decoration.mark({
  tagName: "input",
  attributes: { type: "checkbox", disabled: true },
});

class UrlWidget extends WidgetType {
  constructor(text, url) {
    super();
    this.text = text;
    this.url = url;
  }

  eq(other) {
    return this.text === other.text && this.url === other.url;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.className = "cm-url";
    wrap.href = this.url;
    wrap.textContent = this.text;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

function generateDecorations(view) {
  let decorations = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        const state = view.state;
        const doc = state.doc;
        const selections = state.selection.ranges;
        const from = node.from;
        const to = node.to;
        for (const selection of selections) {
          if (
            (selection.from <= from && selection.to >= to) ||
            (from <= selection.from && to >= selection.to)
          ) {
            return;
          }
          if (node.name.startsWith("ATXHeading")) {
            // Need to also hide the space after the #
            const headingCount = parseInt(/ATXHeading(\d)/.exec(node.name)[1]);
            if (!Number.isInteger(headingCount)) continue;
            decorations.push(hiddenMark.range(from, from + headingCount + 1));
          } else if (node.name === "URL") {
          } else if (node.name === "Link") {
            const linkText = doc.sliceString(from, to);
            let url;
            const text = /\[(.*)\]/g.exec(linkText)[1];
            if (/\(.*\)/.test(linkText)) {
              url = /\((.*)\)/g.exec(linkText)[1];
            } else {
              url = text;
            }
            decorations.push(
              Decoration.replace({ widget: new UrlWidget(text, url) }).range(
                from,
                to
              )
            );
          } else if (node.name === "Strikethrough") {
            decorations.push(hiddenMark.range(from, from + 2));
            decorations.push(hiddenMark.range(to - 2, to));
          } else if (node.name === "TaskMarker") {
            decorations.push(
              doc.sliceString(from, to).toLowerCase().includes("x")
                ? checkMark.range(from, to)
                : uncheckMark.range(from, to)
            );
          }
        }
      },
    });
  }
  return Decoration.set(decorations, true);
}

export function markdownRenderer(config = {}) {
  const autoSaver = ViewPlugin.fromClass(
    class {
      decorations = [];
      constructor(view) {
        this.decorations = generateDecorations(view);
      }

      update(update) {
        if (
          update.selectionSet ||
          update.viewportChanged ||
          update.docChanged
        ) {
          this.decorations = generateDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
  return [autoSaver];
}
