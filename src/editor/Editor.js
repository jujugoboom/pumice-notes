import React, { useEffect, useRef } from "react";
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  indentOnInput,
  foldGutter,
  foldKeymap,
  bracketMatching,
  defaultHighlightStyle,
  HighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  defaultKeymap,
  insertTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import { lintKeymap } from "@codemirror/lint";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import "./Editor.css";
import { autoSave } from "./extensions/autoSave";
import { hyperclick } from "./extensions/hyperclick";
import { markdownRenderer } from "./extensions/markdownRenderer";

const mdHighlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "bold", fontSize: "20px" },
  { tag: tags.heading2, fontWeight: "bold", fontSize: "18px" },
  { tag: tags.heading3, fontWeight: "bold", fontSize: "16px" },
  { tag: tags.heading4, fontWeight: "bold" },
  { tag: tags.heading5, fontWeight: "bold" },
  { tag: tags.heading6, fontWeight: "bold" },
  {
    tag: tags.quote,
    background: "#f9f9f9",
    borderLeft: "10px solid #ccc",
    margin: "1.5em 10px",
    padding: "0.5em 10px",
    quotes: '"201C""201D""2018""2019"',
  },
  { tag: tags.url, class: "cm-url" },
  { tag: tags.link, class: "cm-link" },
]);

function Editor({ content, onSave, openFile }) {
  const viewHost = useRef();
  const view = useRef(null);

  useEffect(() => {
    // initial render
    const basicSetup = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(false),
      indentOnInput(),
      syntaxHighlighting(mdHighlightStyle),
      syntaxHighlighting(defaultHighlightStyle),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        { key: "Tab", run: insertTab },
        {
          key: "Ctrl-s",
          mac: "Cmd-s",
          run: onSave,
        },
      ]),
      markdown({ base: markdownLanguage }),
      EditorState.tabSize.of(4),
      autoSave({ onSave: onSave }),
      hyperclick({ openFile: openFile }),
      markdownRenderer(),
    ];

    const state = EditorState.create({ doc: content, extensions: basicSetup });
    view.current = new EditorView({ state, parent: viewHost.current });
    return () => view.current.destroy();
  }, [content, onSave, openFile]);

  return <div ref={viewHost} className="editor" />;
}

export default Editor;
