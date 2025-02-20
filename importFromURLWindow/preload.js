/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file preload for web page import window
 */
const { contextBridge, ipcRenderer } = require("electron");

/**
 * provide the API for the renderer
 */
contextBridge.exposeInMainWorld("api", {
  // setting the renderer up
  onInit: (callback) => {
    ipcRenderer.on("importFromURLWindow_init", (event, args) => callback(args));
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
  new: (vals) => ipcRenderer.invoke("mainProcess_newBrowser", vals),
  move: (vals) => ipcRenderer.invoke("mainProcess_moveBrowser", vals),
  zoom: (zoom) => ipcRenderer.invoke("mainProcess_browserZoom", zoom),
  open: (url) => {
    ipcRenderer.invoke("mainProcess_browserOpenURL", url);
  },
  stop: () => ipcRenderer.invoke("mainProcess_browserStop"),
  import: () =>
    ipcRenderer.invoke("mainProcess_browserContent"),
});
