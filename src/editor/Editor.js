import React, { useEffect, useRef } from "react";
import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, EditorView} from "@codemirror/view"
import { EditorState, StateField } from "@codemirror/state"
import {history, historyKeymap} from "@codemirror/history"
import {foldGutter, foldKeymap} from "@codemirror/fold"
import {indentOnInput } from "@codemirror/language"
import {lineNumbers, highlightActiveLineGutter} from "@codemirror/gutter"
import {defaultKeymap, insertTab} from "@codemirror/commands"
import {bracketMatching} from "@codemirror/matchbrackets"
import {closeBrackets, closeBracketsKeymap} from "@codemirror/closebrackets"
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search"
import {autocompletion, completionKeymap} from "@codemirror/autocomplete"
import {commentKeymap} from "@codemirror/comment"
import {rectangularSelection, crosshairCursor} from "@codemirror/rectangular-selection"
import {defaultHighlightStyle, HighlightStyle, tags} from "@codemirror/highlight"
import {lintKeymap} from "@codemirror/lint"
import { markdown } from "@codemirror/lang-markdown";
import './Editor.css';
import { autoSave } from "./extensions/autoSave";
import { hyperclick } from "./extensions/hyperclick";

const myHighlightStyle = HighlightStyle.define([
  {tag: tags.heading1, fontWeight: "bold", fontSize: "20px"},
  {tag: tags.heading2, fontWeight: "bold", fontSize: "18px"},
  {tag: tags.heading3, fontWeight: "bold", fontSize: "16px"},
  {tag: tags.heading4, fontWeight: "bold"},
  {tag: tags.heading5, fontWeight: "bold"},
  {tag: tags.heading6, fontWeight: "bold"},
  {tag: tags.quote, 
    background: "#f9f9f9", 
    borderLeft: "10px solid #ccc",
    margin: "1.5em 10px",
    padding: "0.5em 10px",
    quotes: '"201C""201D""2018""2019"'},
  {tag: tags.url, class: 'cm-url'},
  {tag: tags.link, class: 'cm-link'},
])

function Editor({content, onSave, openFile}) {
  const viewHost = useRef();
  const view = useRef(null);

  
  const basicSetup = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    myHighlightStyle,
    defaultHighlightStyle.fallback,
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...lintKeymap,
      {key: "Tab", run: insertTab}
    ]),
    markdown(),
    EditorState.tabSize.of(4),
    autoSave({onSave: onSave}),
    hyperclick({openFile: openFile}),
  ];

  useEffect(() => { // initial render
    const state = EditorState.create({doc: content, extensions: basicSetup})
    view.current = new EditorView({state, parent: viewHost.current});
    return () => view.current.destroy();
  }, [content]);

  useEffect(() => { // every render
  });

  return <div ref={viewHost} className='editor' />;
}

export default Editor;