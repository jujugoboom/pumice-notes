import React, { useState, useEffect } from "react";
import "./Sidebar.css";

const FileContextMenu = ({ open, top, left, children }) => {
  return (
    <div
      className="file-context-menu"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        display: open ? "block" : "none",
        position: "absolute",
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
};

const FileDisplay = ({
  file,
  collapseDir,
  mapFiles,
  openFile,
  expandDir,
  openContextMenu,
}) => {
  return file.directory && file.expanded ? (
    <>
      <div className="nav-directory">
        <div onClick={() => collapseDir(file)}>{file.name}</div>
        <div className="nav-directory-inner">{mapFiles(file.files)}</div>
      </div>
      <div className="divider" />
    </>
  ) : (
    <>
      <div
        className={file.file ? "nav-file" : "nav-directory nav-collapsed"}
        onClick={file.file ? () => openFile(file.path) : () => expandDir(file)}
        onContextMenu={(e) => openContextMenu(e, file)}
        key={file.name}
      >
        🗒️ {file.name.replace(".md", "")}
      </div>
      <div className="divider" />
    </>
  );
};

const Sidebar = ({
  openFile,
  currDir,
  setCurrDir,
  currFiles,
  setCurrFiles,
}) => {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPoints, setContextMenuPoints] = useState({ x: 0, y: 0 });
  const [contextMenuFile, setContextMenuFile] = useState();

  useEffect(() => {
    const handleClick = () => setContextMenuOpen(false);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const mapFiles = (files) => {
    return (
      files.length > 0 &&
      files
        .filter((f) => !f.name.startsWith("."))
        .map((file) => (
          <FileDisplay
            file={file}
            collapseDir={collapseDir}
            mapFiles={mapFiles}
            openFile={openFile}
            expandDir={expandDir}
            openContextMenu={openContextMenu}
          />
        ))
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

  const reloadFiles = async () => {
    const currentDir = (await window.electronAPI.listDirectory(currDir)).map(
      (f) => {
        if (f.directory) {
          f.expanded = false;
        }
        return f;
      }
    );
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

  const openContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFile(file);
    setContextMenuOpen(true);
    setContextMenuPoints({ x: e.pageX, y: e.pageY });
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-restricted-globals
    const confirmDelete = confirm(
      `Are you sure you want to delete ${contextMenuFile.path}`
    );
    if (confirmDelete) {
      await window.electronAPI.deleteFile(contextMenuFile.path);
    }
    reloadFiles();
  };

  const handleNewFile = async () => {
    let fileName = prompt("File name");
    if (fileName === null || fileName === "") {
      return;
    }
    if (!fileName.endsWith(".md")) {
      fileName = `${fileName}.md`;
    }
    await openFile(fileName, true, true);
    await reloadFiles();
  };

  const handleNewFolder = async () => {
    let folderName = prompt("Folder name");
    if (folderName === null || folderName === "") {
      return;
    }
    await window.electronAPI.createFolder(`${currDir}/${folderName}`);
  };

  const handleNavBarContext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuFile(undefined);
    setContextMenuOpen(true);
    setContextMenuPoints({ x: e.pageX, y: e.pageY });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button
          onClick={loadFolder}
          className="sidebar-folder-select"
          aria-label="Open folder"
          title="Open folder"
        >
          📂
        </button>
      </div>
      <div className="divider" />
      <div className="nav-bar" onContextMenu={handleNavBarContext}>
        {mapFiles(currFiles)}
      </div>

      <FileContextMenu
        left={contextMenuPoints.x}
        top={contextMenuPoints.y}
        open={contextMenuOpen}
      >
        <ul>
          <li onClick={handleNewFile}>New File...</li>
          <li onClick={handleNewFolder}>New Folder...</li>
          {contextMenuFile && (
            <li onClick={handleDelete}>Delete {contextMenuFile.name}</li>
          )}
        </ul>
      </FileContextMenu>
    </div>
  );
};

export default React.memo(Sidebar);
