/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of map editor window for object properties
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/schemeMapWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theMap;
let theSchemeID;
let theItemID;
let origMap;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} schemeID
 * @param {String} itemID
 * @param {Object} mapProperties
 */
ipcRenderer.on(
  "schemeMapWindow_init",
  (event, [settings, schemeID, itemID, mapProperties]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "exportEditorWindow_init",
      { settings },
      { schemeID },
      { itemID },
      { mapProperties },
    ]);
    theLanguage = settings.language;
    theSchemeID = schemeID;
    theItemID = itemID;
    origMap = JSON.stringify(mapProperties);

    let $mapDiv = $("<div>").attr({
      id: "map",
    });
    let $locationsDiv = $("<div>").attr({
      id: "locations",
      style: "padding:10px; overflow-y: auto",
    });
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
      .append(
        $("<div>")
          .attr({
            class: "dim-split",
            style: "padding:0; overflow-y: hidden",
          })
          .append($mapDiv, $locationsDiv),
      );

    Split(["#map", "#locations"], {
      direction: "vertical",
      gutterSize: settings ? parseInt(settings.gutterSize) : 5,
      sizes: [75, 25],
    });
    $("div.gutter").each(function () {
      $(this).css("background-color", settings.gutterColor);
    });

    theMap = new SchemeMap(
      settings,
      $mapDiv,
      $locationsDiv,
      mapProperties,
      `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveMap(); closeWindow()">${_(
        "general_saveButton",
      )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
        "general_cancelButton",
      )}</button></div></div>`,
    );
  },
);

/**
 * check if map content is changed
 */
function contentChanged() {
  return origMap != JSON.stringify(theMap.mapState());
}

/**
 * save content if changed
 */
function saveMap() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_saveSchemeMap", [
      theSchemeID,
      theItemID,
      theMap.mapState(),
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
  saveMap();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", contentChanged());
});
