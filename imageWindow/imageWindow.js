/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of image window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/imageWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theSpecs;
let theID;
let theIndex;
let theRatio;
let theMode;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {*} mode
 * @param {*} id
 * @param {*} index
 * @param {*} imageData
 * @param {*} imageSpecs
 */
ipcRenderer.on(
  "imageWindow_init",
  (event, [settings, mode, id, index, imageData, imageSpecs]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "imageWindow_init",
      { settings },
      { mode },
      { id },
      { index },
      { imageData },
      { imageSpecs },
    ]);
    theLanguage = settings.language;
    theMode = mode;
    theID = id;
    theIndex = index;
    theSpecs = imageSpecs;
    theRatio = parseInt(imageSpecs.width) / parseInt(imageSpecs.height);

    let $grid = $("<div>").attr({
      style: `display:grid; row-gap:20px; column-gap:10px; grid-template-columns:min-content min-content; margin:20px;`,
    });

    // thumbnail
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3; justify-self:stretch;",
          class: "section-header",
        })
        .html(_("imageWindow_thumbnail")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3; justify-self:center;",
        })
        .append($("<img>").attr({ src: imageData, style: "max-width:200px" })),
    );

    // size
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3; justify-self:stretch;",
          class: "section-header",
        })
        .html(_("imageWindow_size")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:end; align-self:center",
        })
        .html(_("imageWindow_width")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2",
        })
        .html(
          `<div class="input-group" style="width:150px"><input type="number" class="form-control form-control-sm" id="width" min="10" value="${parseInt(
            theSpecs.width,
          )}"><span class="input-group-text">px</span></div>`,
        ),
    );
    $grid.append(
      $("<div>").attr({
        style: "grid-column:3; grid-row:auto/span 2; align-self:center",
      })
        .html(`<div class="form-check"><input class="form-check-input" type="checkbox" id="ratio" checked><label class="form-check-label" for="ratio">${_(
        "imageWindow_keepRatio",
      )}</label>
      </div>`),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:end; align-self:center",
        })
        .html(_("imageWindow_height")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2",
        })
        .html(
          `<div class="input-group" style="width:150px"><input type="number" class="form-control form-control-sm" id="height" min="10" value="${parseInt(
            theSpecs.height,
          )}"><span class="input-group-text">px</span></div>`,
        ),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3; justify-self:end",
        })
        .html(
          `<button type="button" class="btn btn-outline-primary btn-sm" ${
            theSpecs.height == theSpecs.origheight &&
            theSpecs.width == theSpecs.origwidth
              ? "disabled"
              : ""
          } onclick="$('#width').val(parseInt(theSpecs.origwidth));$('#height').val(parseInt(theSpecs.origheight));theRatio=parseInt(theSpecs.origwidth)/parseInt(theSpecs.origheight)"><i class="fa-solid fa-rotate-left"></i></button> ${_(
            "imageWindow_originalSize",
            {
              width: theSpecs.origwidth,
              height: theSpecs.origheight,
            },
          )}`,
        ),
    );

    // settings
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3; justify-self:stretch;",
          class: "section-header",
        })
        .html(_("imageWindow_settings")),
    );

    // title
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:end;",
        })
        .html(_("imageWindow_title")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 2; justify-self:stretch;",
        })
        .html(
          `<textarea spellcheck="false" class="form-control form-control-sm" rows="5" id="title" style="width:100%">${
            "title" in theSpecs ? Util.escapeHTML(theSpecs.title) : ""
          }</textarea>`,
        ),
    );

    // alignment
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:end;",
        })
        .html(_("image_alignment")),
    );
    let html = "";
    DIMImage.alignments.forEach((c) => {
      let sample = "";
      if (c in DIMImage.styles.alignment) {
        sample = `<img src="${DIMImage.sampleImage}" style="filter:invert(${Util.blackOrWhite(
          settings.imageBackgroundColor || settings.generalBackgroundColor,
          1,
          0,
        )});`;
        Object.keys(DIMImage.styles.alignment[c]).forEach((css) => {
          sample += `${css}:${DIMImage.styles.alignment[c][css]};`;
        });
        sample += `">`;
      }
      html += `<div class="form-check"><input class="form-check-input" type="radio" name="alignment" style="margin-top:${DIMImage.adjust[c]}px" value="${c}" ${
        theSpecs.alignment == c ? "checked" : ""
      }><br><label class="form-check-label">${_(c)} ${sample}</label></div>`;
    });
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 2",
        })
        .html(html),
    );

    // shadow
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:end;",
        })
        .html(_("image_shadow")),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 2",
        })
        .html(
          `<input class="form-check-input" type="checkbox" id="shadow"${
            theSpecs.shadow == "true" ? " checked" : ""
          }>`,
        ),
    );

    // buttons
    if (settings.closingType != "settingsWindow_closeByX") {
      $grid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 3; justify-self:end;",
          })
          .html(
            `<button type="button" class="btn btn-primary" onclick="saveImage(); closeWindow()">${_(
              "general_saveButton",
            )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
              "general_cancelButton",
            )}</button>`,
          ),
      );
    }
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.imageBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.imageBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body").css({
      "--foreground-color": Util.blackOrWhite(
        settings.imageBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.imageBackgroundColor || settings.generalBackgroundColor,
    });
    $("body").append($grid);

    // recalc ratio = w/h
    $("#ratio").on("change", () => {
      if ($("#ratio").prop("checked")) {
        theRatio = parseInt($("#width").val()) / parseInt($("#height").val());
      }
    });
    // ratio = w/h; h=w/ratio; w=h*ratio
    $("#width").on("change", () => {
      if ($("#ratio").prop("checked")) {
        $("#height").val(parseInt($("#width").val() / theRatio));
      }
    });
    $("#height").on("change", () => {
      if ($("#ratio").prop("checked")) {
        $("#width").val(parseInt($("#height").val() * theRatio));
      }
    });
  },
);

/**
 * check if image is changed
 */
function imageChanged() {
  return (
    `${$("#width").val()}px` != theSpecs.width ||
    `${$("#height").val()}px` != theSpecs.height ||
    $("#title").val() != theSpecs.title ||
    $("input:radio[name=alignment]:checked").val() != theSpecs.alignment ||
    $("#shadow").prop("checked").toString() != theSpecs.shadow
  );
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * save image if changed
 */
function saveImage() {
  if (imageChanged()) {
    ipcRenderer.invoke("mainProcess_saveImage", [
      theMode,
      theID,
      theIndex,
      `${$("#width").val()}px`,
      `${$("#height").val()}px`,
      $("#title").val(),
      $("input:radio[name=alignment]:checked").val(),
      $("#shadow").prop("checked"),
    ]);
  }
}

/**
 * save and close window
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveImage();
  closeWindow();
});

/**
 * determine if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", imageChanged());
});
