import { syntaxTree } from "@codemirror/language";
import { Decoration, ViewPlugin, WidgetType } from "@codemirror/view";

const hiddenMark = Decoration.mark({ class: "cm-hidden" });

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
      enter: (type, from, to) => {
        const state = view.state;
        const doc = state.doc;
        const selections = state.selection.ranges;
        for (const selection of selections) {
          if (
            doc.lineAt(selection.from).number <= doc.lineAt(from).number &&
            doc.lineAt(selection.to).number >= doc.lineAt(to).number
          ) {
            return;
          }
          if (type.name === "HeaderMark") {
            // Need to also hide the space after the #
            decorations.push(hiddenMark.range(from, to + 1));
          } else if (type.name === "URL") {
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
          } else if (type.name === "Link") {
            lastLink = { from, to };
          } else if (type.name === "LinkMark") {
            decorations.push(hiddenMark.range(from, to));
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
