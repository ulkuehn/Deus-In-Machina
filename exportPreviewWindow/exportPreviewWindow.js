/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of export preview window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/exportPreviewWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theFonts;
let theFormats;
let theObjects;
let theContent;
let theProfile;
let theTitle;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} title project title
 * @param {String} content content to preview
 * @param {Object} profile export profile used for this preview
 * @param {String[]} fonts list of font names needed for this preview
 * @param {Object} formats paragraph formats needed for this preview
 * @param {Object} objects objects needed for this preview
 */
ipcRenderer.on(
  "exportPreviewWindow_init",
  (event, [settings, title, content, profile, fonts, formats, objects]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "exportPreviewWindow_init",
      { settings },
      { title },
      { content },
      { profile },
      { fonts },
      { formats },
    ]);
    theLanguage = settings.language;
    theTitle = title;
    theContent = content;
    theProfile = profile;
    theFormats = formats;

    theFonts = new Fonts(fonts);
    theFonts.loadStandardFonts("..");

    // build StyledObjects from styleProps
    theObjects = {};
    Object.keys(objects).forEach((id) => {
      let object = new StyledObject();
      object.styleProperties = objects[id];
      theObjects[id] = object;
    });

    const $grid = $("<div>").attr({
      style: `height:60px; padding:9px; display:grid; row-gap:10px; column-gap:10px; grid-template-columns: max-content max-content; background:linear-gradient(180deg,#00000080,5%,transparent,95%,#00000080)`,
    });
    $grid.append(
      $("<div>")
        .attr({
          style:
            "grid-column:1; justify-self:end; align-self:center; width:200px; height:25px",
        })
        .html(
          `<input type="range" class="${Util.blackOrWhite(
            settings.previewBackgroundColor || settings.generalBackgroundColor,
            "range-light",
            "range-dark",
          )} form-range" min="0" max="160" id="zoomSelector" value="80" onchange="zoom()">`,
        ),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2; justify-self:end; align-self:center;",
        })
        .html(
          `<span id="zoomValue" style="cursor:pointer" onclick="$('#zoomSelector').val(80); $('#zoomSelector').trigger('change')">100%</span>`,
        ),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:3; justify-self:end;",
        })
        .html(
          `<button type="button" class="btn btn-primary" onclick="savePreview()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_closeButton",
          )}</button>`,
        ),
    );

    $("head")
      .append($(`<style id="formatSheet"></style>`))
      .append($(`<style id="objectSheet"></style>`));
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
      .append(
        $grid,
        $("<div>")
          .attr({
            style: `height:calc(100vh - 60px); overflow-y:auto; padding:20px; color:#000000; background-color:#ffffff; ${
              profile.exportType == "html" ? "" : "white-space:pre-wrap;"
            }`,
          })
          .html(
            profile.exportType == "html"
              ? theContent
              : `<p style="line-height:1.5">${Util.escapeHTML(theContent)}</p>`,
          ),
      );

    // fill stylesheets
    zoom();
  },
);

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * save preview to file
 */
function savePreview() {
  switch (theProfile.exportType) {
    case "txt":
      ipcRenderer.invoke("mainProcess_saveExportPreview", [
        theContent,
        theProfile,
      ]);
      closeWindow();
      break;
    case "html":
      ipcRenderer.invoke("mainProcess_saveExportPreview", [
        `<!DOCTYPE html><html><meta charset="utf-8">\n<head><title>${Util.escapeHTML(
          theTitle,
        )}</title>${Exporter.formats2CSS(
          "formatSheet",
          theFormats,
        )}${Exporter.objects2CSS(
          "objectSheet",
          theObjects,
        )}${Exporter.fonts2CSS(
          "fontSheet",
          theFonts.availableFamilies,
        )}</head>\n<body>\n${theContent}</body></html>`,
        theProfile,
      ]);
      closeWindow();
      break;
  }
}

/**
 * zoom by changing CSS styles
 */
function zoom() {
  let zoomValue = Util.scaledZoom($("#zoomSelector").val());
  $(`#zoomValue`).html(`${zoomValue}%`);

  $("#formatSheet").empty();
  for (let [id, format] of Object.entries(theFormats)) {
    $("#formatSheet").append(Formats.toCSS(id, format, 1.0, zoomValue));
  }
  $("#formatSheet").append(`img { zoom:${zoomValue}% }`);

  $("#objectSheet").empty();
  for (let [id, object] of Object.entries(theObjects)) {
    $("#objectSheet").append(
      `.object${id}-true { ${object.toCSS("text", false, zoomValue)} }\n`,
      `.object${id}-true img { ${object.toCSS("image", false, zoomValue)} }\n`,
    );
  }
}
