/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of text editor window for object properties
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/schemeEditorWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theEditor;
let theSchemeID;
let theItemID;
let origContents;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} schemeID
 * @param {String} itemID
 * @param {} editorContents delta of editor content
 * @param {} formats
 * @param {} fonts
 *
 */
ipcRenderer.on(
  "schemeEditorWindow_init",
  (event, [settings, schemeID, itemID, editorContents, formats, fonts]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "schemeEditorWindow_init",
      { settings },
      { schemeID },
      { itemID },
      { editorContents },
      { formats },
      { fonts },
    ]);
    theLanguage = settings.language;
    theSchemeID = schemeID;
    theItemID = itemID;
    origContents = JSON.stringify(editorContents);
    new Fonts(fonts).loadStandardFonts("..");

    // div to hold the editor content
    let $editorDiv = $("<div>").attr({ style: "padding:10px" });

    $(":root").css({
      "--first-line-indent": `${settings.firstLineIndent}px`,
    });
    $("head").append($(`<style id="formatSheet"></style>`));
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
        settings.objectBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.objectBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.objectBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.objectBackgroundColor || settings.generalBackgroundColor,
      })
      .append($editorDiv);

    // buttons
    if (settings.closingType != "settingsWindow_closeByX") {
      $("body").append(
        `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveContent(); closeWindow()">${_(
          "general_saveButton",
        )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
          "general_cancelButton",
        )}</button></div></div>`,
      );
    }

    // implement the editor
    theEditor = new SchemeEditor(
      "schemeEditor",
      $editorDiv,
      "scheme-editor",
      editorContents,
      "calc(100vh - 120px)",
      settings,
      formats,
      Util.blackOrWhite(
        settings.objectBackgroundColor || settings.generalBackgroundColor,
        "btn-outline-light",
        "btn-outline-dark",
      ),
      true,
      true,
    );
  },
);

/**
 * check if editor content is changed
 */
function contentChanged() {
  return origContents != JSON.stringify(theEditor.contents);
}

/**
 * save content if changed
 */
function saveContent() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_changeSchemeEditor", [
      theSchemeID,
      theItemID,
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
  saveContent();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", contentChanged());
});

/**
 * image changes from an overlay window
 *
 * @param {Object[]} args image properties
 */
ipcRenderer.on("schemeEditorWindow_saveImage", (event, args) => {
  args.shift();
  theEditor.setImage(...args);
});
