/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file implementation of (hidden) printing window
 */

ipcRenderer.on("printingWindow_print", (event, [toPDF, head, body]) => {
  // ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
  $("head").html(head);
  $("body").html(body);
  if (toPDF) ipcRenderer.invoke("mainWindow_print2PDF");
  else ipcRenderer.invoke("mainWindow_print");
  // ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
});
