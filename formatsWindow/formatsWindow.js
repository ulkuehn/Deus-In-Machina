/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of "about" menu item
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/formatsWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theFormats;
let currentID;
let origFormats;
let theSettings;
let theFonts;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Object} formats all existing paragraph formats
 * @param {String[]} fonts list of font names
 */
ipcRenderer.on("formatsWindow_init", (event, [settings, formats, fonts]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "formatsWindow_init",
    { settings },
    { formats },
    { fonts },
  ]);

  theLanguage = settings.language;
  theSettings = settings;
  theFormats = formats;
  origFormats = JSON.stringify(formats);

  theFonts = new Fonts(fonts);
  theFonts.loadStandardFonts("..");

  // create content
  $grid = $("<div>").attr({
    style:
      "overflow:auto; margin:10px; display:grid; row-gap:25px; column-gap:10px; grid-template-columns: 200px 50px auto 100px",
  });

  // formats
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("formatsWindow_formats")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1; justify-self:center; align-self:center;",
      })
      .html(
        `<button type="button" class="btn btn-success btn-sm" onclick="addFormat()" title="${_(
          "formatsWindow_addFormat",
        )}"><i class="fa-solid fa-plus"></i></button> <button type="button" class="btn btn-secondary btn-sm" onclick="copyFormat()" title="${_(
          "formatsWindow_copyFormat",
        )}"><i class="fa-solid fa-copy"></i></button> <button type="button" class="btn btn-outline-danger btn-sm" id="deleteFormat" disabled onclick="deleteFormat()" title="${_(
          "formatsWindow_deleteFormat",
        )}"><i class="fa-solid fa-trash"></i></button>`,
      ),
  );
  let html = `<select class="form-select form-select-sm" id="formats" onchange="saveFormat(); applyFormat()">`;
  Object.keys(theFormats)
    .sort((a, b) => {
      // default format always first
      if (a == UUID0) {
        return -1;
      }
      if (b == UUID0) {
        return 1;
      }
      // everything else is sorted alphabetically
      return theFormats[a].formats_name.localeCompare(
        theFormats[b].formats_name,
      );
    })
    .forEach((formatID) => {
      html += `<option value="${formatID}" ${
        settings.previewFormats ? `class="format${formatID}"` : ""
      } ${formatID == currentID ? "selected" : ""}>${Util.escapeHTML(
        theFormats[formatID].formats_name,
      )}</option>`;
    });
  html += "</select>";
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 3; justify-self:start; align-self:center;",
      })
      .html(html),
  );

  // format preview
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("formatsWindow_sample")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 4; justify-self:stretch; padding:10px; background-color:#ffffff",
      })
      .append($("<div>").attr({ id: "formatsPreview" })),
  );

  // settings
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("formatsWindow_settings")),
  );
  Formats.settings.forEach((setting) => {
    if (setting.type == "separator") {
      $grid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 4; justify-self:stretch;",
            class: "section-header",
          })
          .html(_(setting.name)),
      );
    } else {
      // name
      $grid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 1; justify-self:end; align-self:center;",
          })
          .html(_(setting.name)),
      );
      // optional?
      if (!setting.mandatory) {
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:2/span 1; justify-self:center; align-self:center;",
            })
            .html(
              setting.type == "color" || setting.type == "emptycolor"
                ? `<div class="form-check form-switch"><input class="form-check-input" onclick="$('#${setting.name}').spectrum(this.checked?'enable':'disable');restyleSample()" id="${setting.name}_active" type="checkbox"></div>`
                : `<div class="form-check form-switch"><input class="form-check-input" onclick="$('#${setting.name}').prop('disabled',!$('#${setting.name}').prop('disabled'));restyleSample()" id="${setting.name}_active" type="checkbox"></div>`,
            ),
        );
      }
      // colors
      if (setting.type == "color" || setting.type == "emptycolor") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:3/span 2; justify-self:start;",
            })
            .html(
              `<input class="${
                setting.type == "color" ? "colorPicker" : "emptyColorPicker"
              }" id="${setting.name}" onchange="restyleSample();"></input>`,
            ),
        );
      }
      // checkboxes
      if (setting.type == "check") {
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 2; justify-self:start; align-self:center;",
            })
            .html(
              `<input class="form-check-input" type="checkbox" id="${setting.name}" onclick="restyleSample();">`,
            ),
        );
      }
      // texts
      if (setting.type == "text") {
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 2; justify-self:start; align-self:center; width:100%",
            })
            .html(
              `<input type="text" class="form-control form-control-sm" spellcheck="false" id="${setting.name}" style="width:100%" onchange="restyleSample();">`,
            ),
        );
      }
      // selects
      if (setting.type == "select") {
        let html = `<select class="form-select form-select-sm" id="${setting.name}" onchange="restyleSample();">`;
        let i = 0;
        setting.values.forEach((value) => {
          html += `<option value="${value}">${
            setting.i18nValues ? _(setting.i18nValues[i]) : value
          }</option>`;
          i++;
        });
        html += "</select>";
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 2; justify-self:start; align-self:center;",
            })
            .html(html),
        );
      }
      // fonts
      if (setting.type == "font") {
        let html = `<select class="form-select form-select-sm" id="${
          setting.name
        }" onchange="restyleSample();" ><optgroup label="${_("Fonts_web")}">`;
        for (let family of Fonts.standardFamilies) {
          html += `<option style="font-size:16px;font-family:'${family.class}'" value="'${family.class}'">${_(
            `Fonts_${family.class}`,
          )}</option>`;
        }
        html += `</optgroup><optgroup label="${_("Fonts_system")}">`;
        fonts.forEach((font) => {
          html += `<option title="${font}" style="font-size:16px;font-family:'${font}'" value="'${font}'">${font}</option>`;
        });
        html += "</optgroup></select>";
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 2; justify-self:start; align-self:center;",
            })
            .html(html),
        );
      }
      // ranges
      if (setting.type == "range") {
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 1; justify-self:stretch; margin-bottom:-6px",
            })
            .html(
              `<input type="range" class="${Util.blackOrWhite(
                settings.formatsBackgroundColor ||
                  settings.generalBackgroundColor,
                "range-light",
                "range-dark",
              )} form-range" min="${setting.min}" max="${setting.max}" step="${setting.step}" id="${setting.name}" onchange="$('#${setting.name}_value').html(this.value);restyleSample();">`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:4/span 1; justify-self:start; margin-left:10px;",
            })
            .html(
              `<span id="${setting.name}_value"></span> ${_(setting.unitI18n)}`,
            ),
        );
      }
    }
  });

  // buttons
  if (settings.closingType != "settingsWindow_closeByX") {
    $grid.append(
      $("<div>")
        .attr({
          style: "margin-top:20px; grid-column:1/span 4",
        })
        .html(
          `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveFormats(); closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></div></div>`,
        ),
    );
  }

  $("head").append($(`<style id="formatSheet"></style>`));
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.formatsBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.formatsBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        settings.formatsBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.formatsBackgroundColor || settings.generalBackgroundColor,
    })
    .append($grid);

  // set all color pickers
  document.querySelectorAll(".colorPicker").forEach(function (ele) {
    $(ele).spectrum({
      type: "color",
      showPalette: settings.palette != noPalette,
      palette: systemPalettes[settings.palette],
      showInput: true,
      preferredFormat: "hex",
      showInitial: true,
      allowEmpty: false,
      showAlpha: false,
      clickoutFiresChange: false,
      cancelText: _("colorpicker_cancel"),
      chooseText: _("colorpicker_choose"),
      clearText: _("colorpicker_empty"),
      noColorSelectedText: _("colorpicker_nocolor"),
      containerClassName: "dim",
    });
  });
  document.querySelectorAll(".emptyColorPicker").forEach(function (ele) {
    $(ele).spectrum({
      type: "color",
      showPalette: settings.palette != noPalette,
      palette: systemPalettes[settings.palette],
      showInput: true,
      preferredFormat: "hex",
      showInitial: true,
      allowEmpty: true,
      showAlpha: false,
      clickoutFiresChange: false,
      cancelText: _("colorpicker_cancel"),
      chooseText: _("colorpicker_choose"),
      clearText: _("colorpicker_empty"),
      noColorSelectedText: _("colorpicker_nocolor"),
      containerClassName: "dim",
    });
  });

  applyFormat();
});

/**
 * save all control's settings to the selected format
 */
function saveFormat() {
  if (currentID != null) {
    let format = {};
    Formats.settings.forEach((setting) => {
      if (setting.mandatory || $(`#${setting.name}_active`).prop("checked")) {
        format[setting.name] = $(`#${setting.name}`).val();
      }
    });
    // format name must not be empty
    format.formats_name = format.formats_name.trim();
    if (format.formats_name == "") {
      format.formats_name = theFormats[currentID].formats_name;
    }

    $("#formatName").val(format.formats_name);
    theFormats[currentID] = format;
    $(`#formats option[value="${currentID}"]`).html(
      Util.escapeHTML(format.formats_name),
    );
  }
}

/**
 * populate controls with the current format's values
 */
function applyFormat() {
  currentID = $("#formats").val();
  $("#deleteFormat").prop("disabled", currentID == UUID0);
  let format = theFormats[currentID];
  if (format != null) {
    Formats.settings.forEach((setting) => {
      let hasName;
      if (currentID == UUID0) {
        $(`#${setting.name}_active`).prop("disabled", true);
        hasName = true;
      } else {
        $(`#${setting.name}_active`).prop("disabled", false);
        hasName = setting.name in format;
      }
      // active switch
      $(`#${setting.name}_active`).prop("checked", hasName);
      // enabling / disabling
      switch (setting.type) {
        case "color":
        case "emptycolor":
          $(`#${setting.name}`).spectrum(hasName ? "enable" : "disable");
          break;
        default:
          $(`#${setting.name}`).prop(
            "disabled",
            !hasName ||
              ("mandatory" in setting &&
                setting.mandatory &&
                currentID == UUID0),
          );
          break;
      }
      // values
      switch (setting.type) {
        case "check":
          $(`#${setting.name}`).prop(
            "checked",
            hasName ? format[setting.name] : theFormats[UUID0][setting.name],
          );
          break;
        case "color":
        case "emptycolor":
          $(`#${setting.name}`).spectrum(
            "set",
            hasName ? format[setting.name] : theFormats[UUID0][setting.name],
          );
          break;
        default:
          $(`#${setting.name}`).val(
            hasName ? format[setting.name] : theFormats[UUID0][setting.name],
          );
          break;
      }
      if (setting.type == "range") {
        $(`#${setting.name}_value`).html(
          hasName ? format[setting.name] : theFormats[UUID0][setting.name],
        );
      }
    });
  }

  restyleSample();
}

/**
 * setup stylesheets according to format specs to render formats in sample text
 */
function restyleSample() {
  saveFormat();
  let formatSheet = $("#formatSheet");
  formatSheet.empty();
  for (let [formatID, format] of Object.entries(theFormats)) {
    formatSheet.append(`#formatsPreview ${Formats.toCSS(formatID, format)}`);
    if (theSettings.previewFormats) {
      formatSheet.append(
        `${
          formatID == UUID0
            ? `#formats option { `
            : `#formats .format${formatID} {`
        } ${Formats.toPreviewCSS(format)}}\n`,
      );
    }
  }
  $("#formatsPreview").html(
    `<p>${_("formatsWindow_sampleText", {
      name: Util.escapeHTML(theFormats[UUID0].formats_name),
    })} ${theSettings.editorFormatSample}</p>${
      currentID != UUID0
        ? `<p class="format${currentID}-true">${_("formatsWindow_sampleText", {
            name: Util.escapeHTML(theFormats[currentID].formats_name),
          })} ${
            theSettings.editorFormatSample
          }</p><p class="format${currentID}-true">${_(
            "formatsWindow_sampleText",
            {
              name: Util.escapeHTML(theFormats[currentID].formats_name),
            },
          )} ${theSettings.editorFormatSample}</p>`
        : ""
    }<p>${_("formatsWindow_sampleText", {
      name: Util.escapeHTML(theFormats[UUID0].formats_name),
    })} ${theSettings.editorFormatSample}</p>`,
  );
}

/**
 * add a new blank format (just ID and default name)
 */
function addFormat() {
  let id = uuid();
  theFormats[id] = {
    formats_name: _("formatsWindow_newFormat", {
      time: new Timestamp().toLocalString(theSettings.dateTimeFormatShort),
    }),
  };
  $("#formats").append(
    $("<option>", {
      value: id,
      text: theFormats[id].formats_name,
    }),
  );
  $("#formats").val(id);
  saveFormat();
  applyFormat();
}

/**
 * copy a format
 */
function copyFormat() {
  let id = uuid();
  theFormats[id] = Object.assign({}, theFormats[currentID]);
  theFormats[id].formats_name = _("formatsWindow_copiedFormat", {
    name: theFormats[currentID].formats_name,
  });
  $("#formats").append(
    $("<option>", {
      value: id,
      text: theFormats[id].formats_name,
    }),
  );
  $("#formats").val(id);
  saveFormat();
  applyFormat();
}

/**
 * delete a format
 */
function deleteFormat() {
  if (currentID != UUID0) {
    ipcRenderer
      .invoke("mainProcess_yesNoDialog", [
        _("formatsWindow_deleteFormat"),
        _("formatsWindow_confirmDelete", {
          format: theFormats[currentID].formats_name,
        }),
        false,
      ])
      .then((result) => {
        if (result == 1) {
          delete theFormats[currentID];
          $(`#formats option[value="${currentID}"]`).remove();
          $("#formats").val(UUID0);
          applyFormat();
        }
      });
  }
}

/**
 * check if formats are changed
 */
function formatsChanged() {
  return origFormats != JSON.stringify(theFormats);
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * save formats if changed
 */
function saveFormats() {
  saveFormat();
  if (formatsChanged()) {
    ipcRenderer.invoke("mainProcess_saveFormats", [theFormats, false]);
  }
}

/**
 * save and close window
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveFormats();
  closeWindow();
});

/**
 * determine if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", formatsChanged());
});
