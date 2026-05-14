/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file preload for web page import window
 */
const { contextBridge, ipcRenderer } = require("electron");

/**
 * provide the API for the renderer
 */
contextBridge.exposeInMainWorld("api", {
  // set the renderer up
  onInit: (callback) => {
    ipcRenderer.on("importFromURLWindow_init", (event, args) => callback(args));
  },
  // change settings
  onChangeSettings: (callback) => {
    ipcRenderer.on("importFromURLWindow_changeSettings", (event, args) =>
      callback(args),
    );
  },
  // URL change
  onChangeURL: (callback) => {
    ipcRenderer.on("importFromURLWindow_changeURL", (event, url) =>
      callback(url),
    );
  },
  // web page fully loaded
  onReadyToImport: (callback) => {
    ipcRenderer.on("importFromURLWindow_readyToImport", () => callback());
  },
  new: (language,vals) => ipcRenderer.invoke("mainProcess_newBrowser", language, vals),
  move: (vals) => ipcRenderer.invoke("mainProcess_moveBrowser", false, vals),
  zoom: (zoom) => ipcRenderer.invoke("mainProcess_browserZoom", false,zoom),
  open: (url) => {
    ipcRenderer.invoke("mainProcess_browserOpenURL", false, url);
  },
  stop: () => ipcRenderer.invoke("mainProcess_browserStop", false),
  import: () => ipcRenderer.invoke("mainProcess_browserImport"),
});
