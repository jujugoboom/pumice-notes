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
    let lastLink = {};
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
            doc.lineAt(selection.from).number <= doc.lineAt(from).number &&
            doc.lineAt(selection.to).number >= doc.lineAt(to).number
          ) {
            return;
          }
          if (node.name === "HeaderMark") {
            // Need to also hide the space after the #
            decorations.push(hiddenMark.range(from, to + 1));
          } else if (node.name === "URL") {
            if (lastLink?.from <= from && lastLink?.to >= to) {
              const href = doc.sliceString(from, to);
              const regex = /[[(\])]/gi;
              const text = doc
                .sliceString(lastLink.from, from)
                .replaceAll(regex, "");
              // TODO: Fix hyperclicking on styled links
              decorations.push(
                Decoration.replace({ widget: new UrlWidget(text, href) }).range(
                  lastLink.from,
                  lastLink.to
                )
              );
              decorations.push(hiddenMark.range(from, to));
            }
          } else if (node.name === "Link") {
            lastLink = { from, to };
          } else if (node.name === "LinkMark") {
            decorations.push(hiddenMark.range(from, to));
          } else if (node.name === "Strikethrough") {
            decorations.push(strikethruMark.range(from, to));
          } else if (node.name === "StrikethroughMark") {
            decorations.push(hiddenMark.range(from, to));
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
