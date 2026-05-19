/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file preload for web page print window
 */
const { contextBridge, ipcRenderer } = require("electron");

/**
 * provide the API for the renderer
 */
contextBridge.exposeInMainWorld("api", {
  // setting the renderer up
  onInit: (callback) => {
    ipcRenderer.on("printFromURLWindow_init", (event, args) => {
      callback(args);
    });
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
  new: (language, vals) =>
    ipcRenderer.invoke("mainProcess_newBrowser", language, vals),
  move: (vals) => ipcRenderer.invoke("mainProcess_moveBrowser", true, vals),
  zoom: (zoom) => ipcRenderer.invoke("mainProcess_browserZoom", true, zoom),
  open: (url) => {
    ipcRenderer.invoke("mainProcess_browserOpenURL", true, url);
  },
  stop: () => ipcRenderer.invoke("mainProcess_browserStop", true),
  print: (settings, schemeID, itemID, dateTimeShort, dateTimeLong) => {
    ipcRenderer.invoke(
      "mainProcess_browserPrint",
      settings,
      schemeID,
      itemID,
      dateTimeShort,
      dateTimeLong
    );
  },
});
