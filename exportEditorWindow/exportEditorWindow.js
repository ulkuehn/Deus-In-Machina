/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of export editor window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/exportEditorWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

/**
 * global copy of settings needed for placeholder processing
 */
let theSettings;
/**
 * name of the editor for communication back to opening window
 */
let theEditorName;
/**
 * editor object of type ExportEditor
 */
let theEditor;
/**
 * contents of editor upon call; needed to see if changes occured and thus saving is needed
 * @todo could be done by md5 hashing or the like
 */
let theContents;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} name editor name
 * @param {Object[]} editorContents editor contents as quill delta
 * @param {String[]} placeholders list of available placeholder names
 * @param {Boolean} withStyling should the editor display styling controls
 * @param {Object} formats available paragraph formats
 * @param {String[]} fonts list of available font names
 */
ipcRenderer.on(
  "exportEditorWindow_init",
  (
    event,
    [settings, name, editorContents, placeholders, withStyling, formats, fonts],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "exportEditorWindow_init",
      { settings },
      { name },
      { editorContents },
      { placeholders },
      { withStyling },
      { formats },
      { fonts },
    ]);
    theEditorName = name;
    theSettings = settings;
    theLanguage = settings.language;
    theContents = JSON.stringify(editorContents);

    new Fonts(fonts).loadStandardFonts("..");

    const $editorDiv = $("<div>").attr({ style: "padding:10px" });

    $("head").append($(`<style id="formatSheetexport-editor"></style>`));
    $("head").append(
      $("<style>").html(
        `.ql-editor *::selection { color:${Util.blackOrWhite(
          settings.selectionColor,
        )}; background:${settings.selectionColor} }\n` +
          `.ql-editor img::selection { color:${Util.blackOrWhite(
            settings.selectionColor,
          )}; background:${settings.selectionColor}80 }`,
      ),
    );
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.exportBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.exportBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.exportBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.exportBackgroundColor || settings.generalBackgroundColor,
      })
      .append($editorDiv);

    if (settings.closingType != "settingsWindow_closeByX") {
      $("body").append(
        `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveEditor(); closeWindow()">${_(
          "general_saveButton",
        )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
          "general_cancelButton",
        )}</button></div></div>`,
      );
    }

    theEditor = new ExportEditor(
      "exportEditor",
      $editorDiv,
      "export-editor",
      editorContents,
      "calc(100vh - 120px)",
      settings,
      formats,
      placeholders,
      Util.blackOrWhite(
        settings.exportBackgroundColor || settings.generalBackgroundColor,
        "btn-outline-light",
        "btn-outline-dark",
      ),
      withStyling,
      true,
    );
  },
);

/**
 * check if editor content is changed
 */
function contentChanged() {
  return theContents != JSON.stringify(theEditor.contents);
}

/**
 * save content if changed
 */
function saveEditor() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_changeExportEditor", [
      theEditorName,
      theEditor.contents,
    ]);
  }
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveEditor();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", contentChanged());
});

/**
 * invoked by image window upon saving image properties
 */
ipcRenderer.on("exportEditorWindow_saveImage", (event, args) => {
  args.shift();
  theEditor.setImage(...args);
});
