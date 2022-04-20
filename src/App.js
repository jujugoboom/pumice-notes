import "./App.css";
import Editor from "./editor/Editor";
import Sidebar from "./Sidebar";
import { useState } from "react";

function App() {
  const [content, setContent] = useState("");
  const [path, setPath] = useState("");
  const [currDir, setCurrDir] = useState("");
  const [currFiles, setCurrFiles] = useState([]);

  const loadFile = async (file, relative = false, create = false) => {
    let path = file;
    if (relative) {
      path = `${currDir}/${file}`;
    }
    const fileContent = await window.electronAPI.readFile(path, create);
    if (fileContent !== false) {
      if (create) {
        const currentDir = (
          await window.electronAPI.listDirectory(currDir)
        ).map((f) => {
          if (f.directory) {
            f.expanded = false;
          }
          return f;
        });
        setCurrFiles(currentDir);
      }
      setContent(fileContent);
      setPath(path);
    }
  };

  const saveFile = async (update) => {
    if (path !== "") {
      window.electronAPI.saveFile(path, update.state.doc.toString());
    }
  };

  return (
    <div className="App">
      <Sidebar
        openFile={loadFile}
        currDir={currDir}
        setCurrDir={setCurrDir}
        currFiles={currFiles}
        setCurrFiles={setCurrFiles}
      />
      <Editor content={content} onSave={saveFile} openFile={loadFile} />
    </div>
  );
}

export default App;
