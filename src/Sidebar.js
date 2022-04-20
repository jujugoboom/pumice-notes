import React from "react";
import "./Sidebar.css";

const Sidebar = ({
  openFile,
  currDir,
  setCurrDir,
  currFiles,
  setCurrFiles,
}) => {
  const mapFiles = (files) => {
    return (
      files.length > 0 &&
      files.map((file) =>
        file.directory && file.expanded ? (
          <>
            <div className="nav-directory">
              <div onClick={() => collapseDir(file)}>{file.name}</div>
              <div className="nav-directory-inner">{mapFiles(file.files)}</div>
            </div>
          </>
        ) : (
          <>
            <div
              className={file.file ? "nav-file" : "nav-directory nav-collapsed"}
              onClick={
                file.file ? () => openFile(file.path) : () => expandDir(file)
              }
              key={file.name}
            >
              {file.name}
            </div>
          </>
        )
      )
    );
  };

  const loadFolder = async () => {
    const selectedDir = await window.electronAPI.openFile();
    setCurrDir(selectedDir);
    const currentDir = (
      await window.electronAPI.listDirectory(selectedDir)
    ).map((f) => {
      if (f.directory) {
        f.expanded = false;
      }
      return f;
    });
    setCurrFiles(currentDir);
  };

  const expandDir = async (dir) => {
    const innerFiles = await window.electronAPI.listDirectory(dir.path);
    dir.files = innerFiles;
    dir.expanded = true;
    // Slice to rerender
    const newFiles = currFiles.slice();
    newFiles[newFiles.findIndex((f) => f.name === dir.name && f.directory)] =
      dir;
    setCurrFiles(newFiles);
  };

  const collapseDir = (dir) => {
    dir.expanded = false;
    const newFiles = currFiles.slice();
    newFiles[newFiles.findIndex((f) => f.name === dir.name && f.directory)] =
      dir;
    setCurrFiles(newFiles);
  };

  return (
    <div className="sidebar">
      <button onClick={loadFolder} className="sidebar-folder-select">
        Open Folder...
      </button>
      <div className="nav-bar">{mapFiles(currFiles)}</div>
    </div>
  );
};

export default React.memo(Sidebar);
