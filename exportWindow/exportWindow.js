/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of export window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/exportWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theProfiles;
let theProfileID;
let theFormats;
let theEditors = {};
let theSettings;
let theFonts;
let origProfiles;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Object} profiles all existing export profiles
 * @param {String} recentProfile last used profile id
 * @param {Object} formats paragraph formats needed for html preview
 * @param {String[]} fonts list of font names needed for html preview
 *
 */
ipcRenderer.on(
  "exportWindow_init",
  (event, [settings, profiles, recentProfile, formats, fonts]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "exportWindow_init",
      { settings },
      { profiles },
      { recentProfile },
      { formats },
      { fonts },
    ]);
    theSettings = settings;
    theLanguage = settings.language;
    theFormats = formats;
    theProfiles = profiles;
    theProfileID = recentProfile;
    origProfiles = JSON.stringify(profiles);

    theFonts = new Fonts(fonts);
    theFonts.loadStandardFonts("..");

    // create content
    const $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    const $content = $("<div>").attr({ class: "tab-content" });

    let tabIsActive = true;
    Exporter.settings.forEach((tab) => {
      Util.addTab(
        $tabs,
        $content,
        tabIsActive,
        tab.tab,
        _(tab.tab),
        $("<div>").attr({
          style:
            "overflow:auto; margin:10px; display:grid; row-gap:15px; column-gap:20px; grid-template-columns: min-content auto",
          id: `${tab.tab}_content`,
        }),
      );
      tabIsActive = false;
    });

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
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content);

    // top part of profileTab
    let $profileTabContent = $(`#exportWindow_profileTab_content`);
    $profileTabContent.append(
      $("<div>")
        .attr({
          style:
            "grid-column:1/span 1; justify-self:end; align-self:center; white-space:nowrap",
        })
        .html(
          `<button type="button" class="btn btn-success btn-sm" onclick="addProfile()" title="${_(
            "exportWindow_addProfile",
          )}"><i class="fa-solid fa-plus"></i></button> <button type="button" class="btn btn-secondary btn-sm" onclick="copyProfile()" title="${_(
            "exportWindow_copyProfile",
          )}"><i class="fa-solid fa-copy"></i></button> <button type="button" class="btn btn-outline-danger btn-sm" onclick="deleteProfile()" title="${_(
            "exportWindow_deleteProfile",
          )}"><i class="fa-solid fa-trash"></i></button> <button type="button" class="btn btn-primary btn-sm" onclick="saveProfile()" title="${_(
            "exportWindow_saveProfile",
          )}"><i class="fa-solid fa-floppy-disk"></i></button>`,
        ),
    );

    // profile selector
    let html =
      '<select class="form-select form-select-sm" id="profiles" onchange="applyProfile()">';
    Object.keys(theProfiles)
      .sort((a, b) => {
        // default profile always first
        if (a == UUID0) {
          return -1;
        }
        if (b == UUID0) {
          return 1;
        }
        // everything else is sorted alphabetically
        return theProfiles[a].profileName.localeCompare(
          theProfiles[b].profileName,
        );
      })
      .forEach((id) => {
        html += `<option value="${id}"${
          id == theProfileID ? " selected" : ""
        }>${Util.escapeHTML(theProfiles[id].profileName)}</option>`;
      });
    html += "</select>";

    $profileTabContent.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; justify-self:start; align-self:center;",
        })
        .html(html),
    );

    // fill tabs
    Exporter.settings.forEach((tab) => {
      fillTab(tab.settings, $(`#${tab.tab}_content`));
    });

    // bottom part of profileTab = buttons
    $profileTabContent.append(
      $("<div>")
        .attr({
          style: "margin-top:20px; grid-column:1/span 2; justify-self:end;",
        })
        .html(
          `<div style="display:flex; justify-content:flex-end;"><div><button type="button" class="btn btn-primary" onclick="saveProfile(); doExport(); closeWindow()">${_(
            "exportWindow_exportButton",
          )}</button> <button type="button" class="btn btn-light" id="previewButton" onclick="saveProfile(); doPreview()">${_(
            "exportWindow_previewButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_closeButton",
          )}</button></div></div>`,
        ),
    );

    Util.initTabs();
    applyProfile();

    // disable or enable preview button according to export type
    $("#exportType").on("change", () => {
      $("#previewButton").prop(
        "disabled",
        $("#exportType").val() == "rtf" || $("#exportType").val() == "docx",
      );
    });

    // save profile on tab switch
    $(".nav-pills a").each(function () {
      $(this)[0].addEventListener("hide.bs.tab", (event) => {
        saveProfile();
      });
    });
  },
);

/**
 * fill tab content according to setting elements
 *
 * @param {*} settings
 * @param {Object} $grid jquery element to fill
 */
function fillTab(settings, $grid) {
  settings.forEach((setting) => {
    $grid.append(
      $("<div>")
        .attr({
          style:
            "grid-column:1/span 1; justify-self:end; align-self:center; text-align:right",
        })
        .html(
          setting.type == "editor"
            ? `${_(
                setting.i18n || setting.name,
              )} <i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer" id="editor_${
                setting.name
              }"></i>`
            : `<span style="white-space:nowrap">${_(
                setting.i18n || setting.name,
              )}</span>`,
        ),
    );
    // open editor in extra window
    if (setting.type == "editor") {
      $(`#editor_${setting.name}`).on("click", () => {
        saveProfile();
        ipcRenderer.invoke("mainProcess_openWindow", [
          "exportEditor",
          theSettings.closingType,
          true,
          90,
          90,
          _(setting.i18n || setting.name),
          "./exportEditorWindow/exportEditorWindow.html",
          "exportEditorWindow_init",
          null,
          [
            theSettings,
            setting.name,
            theProfiles[theProfileID][setting.name].ops,
            setting.placeholders,
            setting.format,
            theFormats,
            theFonts.availableFamilies,
          ],
        ]);
      });
    }

    switch (setting.type) {
      // checkboxes
      case "check":
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:2/span 1; justify-self:start; align-self:center;",
            })
            .html(
              `<input class="form-check-input" type="checkbox" id="${setting.name}">`,
            ),
        );
        break;
      // texts
      case "text":
        $grid.append(
          $("<div>")
            .attr({
              style: `grid-column:2/span 1; justify-self:start; align-self:center; width:100%`,
            })
            .html(
              `<input type="text" class="form-control form-control-sm" spellcheck="false" id="${setting.name}" style="width:100%">`,
            ),
        );
        break;
      // textareas
      case "textarea":
        $grid.append(
          $("<div>")
            .attr({
              style: `grid-column:2/span 1; justify-self:start; align-self:center; width:100%`,
            })
            .html(
              `<textarea spellcheck="false" class="form-control form-control-sm" rows="${setting.rows}" id="${setting.name}" style="width:100%"></textarea>`,
            ),
        );
        break;
      // editors
      case "editor":
        $("head").append($(`<style id="formatSheet${setting.name}"></style>`));
        let $div = $("<div>").attr({
          style: `grid-column:2/span 1;`,
        });
        $grid.append($div);
        theEditors[setting.name] = new ExportEditor(
          "export",
          $div,
          setting.name,
          [], //contents,
          setting.height,
          theSettings,
          theFormats,
          setting.placeholders,
          Util.blackOrWhite(
            theSettings.exportBackgroundColor ||
              theSettings.generalBackgroundColor,
            "btn-outline-light",
            "btn-outline-dark",
          ),
          setting.format,
          false,
        );
        break;
      // selects
      case "select":
        let html = `<select class="form-select form-select-sm" id="${setting.name}">`;
        for (let i = 0; i < setting.values.length; i++) {
          html += `<option value="${setting.values[i]}">${_(
            setting.i18nValues ? setting.i18nValues[i] : setting.values[i],
          )}</option>`;
        }
        html += "</select>";
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:2/span 1; justify-self:start; align-self:center;",
            })
            .html(html),
        );
        break;
      // timestamps (read only)
      case "timestamp":
        $grid.append(
          $("<div>").attr({
            style:
              "grid-column:2/span 1; justify-self:start; align-self:center;",
            id: setting.name,
          }),
        );
        break;
    }
  });
}

/**
 * apply a selected profile to all elements
 */
function applyProfile() {
  theProfileID = $("#profiles").val();
  Exporter.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      switch (setting.type) {
        case "check":
          $(`#${setting.name}`).prop(
            "checked",
            theProfiles[theProfileID][setting.name],
          );
          break;
        case "timestamp":
          $(`#${setting.name}`).text(
            timestamp(theProfiles[theProfileID][setting.name]),
          );
          break;
        case "editor":
          theEditors[setting.name].contents =
            theProfiles[theProfileID][setting.name];
          break;
        default:
          $(`#${setting.name}`).val(theProfiles[theProfileID][setting.name]);
      }
    });
  });

  // disable preview button for rtf or docx export
  $("#previewButton").prop(
    "disabled",
    theProfiles[theProfileID].exportType == "rtf" ||
      theProfiles[theProfileID].exportType == "docx",
  );

  // update Exporter
  ipcRenderer.invoke("mainProcess_updateExporter", [
    origProfiles != JSON.stringify(theProfiles),
    theProfiles,
    theProfileID,
  ]);
}

/**
 * show uniform time infos
 *
 * @param {Number} when unix timestamp
 * @returns {String} absolute and relative time info
 */
function timestamp(when) {
  let ts = new Timestamp(when);
  return `${ts.toLocalString(theSettings.dateTimeFormatLong)} (${_(
    "time_timePassed",
    {
      time: ts.timeToNow(),
    },
  )})`;
}

/**
 * add an export profile
 */
function addProfile() {
  let profileID = uuid();
  theProfiles[profileID] = Exporter.defaultProfile(
    _("exportWindow_newProfile", {
      time: new Timestamp().toLocalString(theSettings.dateTimeFormatShort),
    }),
  );
  $("#profiles").append(
    $("<option>", {
      value: profileID,
      text: theProfiles[profileID].profileName,
    }),
  );
  $("#profiles").val(profileID);
  applyProfile();
}

/**
 * copy an existing profile
 */
function copyProfile() {
  let oldID = $("#profiles").val();
  let newID = uuid();
  theProfiles[newID] = Object.assign({}, theProfiles[oldID]);
  theProfiles[newID].profileName = _("exportWindow_profileCopy", {
    name: theProfiles[oldID].profileName,
  });
  theProfiles[newID].profileCreated = new Timestamp().epochSeconds;
  theProfiles[newID].profileChanged = theProfiles[newID].profileCreated;
  $("#profiles").append(
    $("<option>", {
      value: newID,
      text: theProfiles[newID].profileName,
    }),
  );
  $("#profiles").val(newID);
  applyProfile();
}

/**
 * delete current profile
 */
function deleteProfile() {
  if (Object.keys(theProfiles).length > 1) {
    ipcRenderer
      .invoke("mainProcess_yesNoDialog", [
        _("exportWindow_deleteProfile"),
        _("exportWindow_confirmDeleteProfile", {
          name: theProfiles[theProfileID].profileName,
        }),
        false,
      ])
      .then((result) => {
        if (result == 1) {
          delete theProfiles[theProfileID];
          $(`#profiles option[value="${theProfileID}"]`).remove();
          $("#profiles").val(Object.keys(theProfiles)[0]);
          applyProfile();
        }
      });
  }
}

/**
 * save current profile
 */
function saveProfile() {
  let profile = {};

  profile.profileChanged = new Timestamp().epochSeconds;

  Exporter.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      switch (setting.type) {
        case "check":
          profile[setting.name] = $(`#${setting.name}`).prop("checked");
          break;
        case "timestamp":
          profile[setting.name] = theProfiles[theProfileID][setting.name];
          break;
        case "editor":
          profile[setting.name] = theEditors[setting.name].contents;
          break;
        default:
          profile[setting.name] = $(`#${setting.name}`).val();
          break;
      }
    });
  });

  // profile name cannot be empty
  profile.profileName = profile.profileName.trim();
  if (profile.profileName == "") {
    profile.profileName = theProfiles[theProfileID].profileName;
  }

  $(`#profiles option[value="${theProfileID}"]`).text(profile.profileName);
  $("#profileName").val(profile.profileName);
  $("#profileChanged").text(timestamp(profile.profileChanged));

  theProfiles[theProfileID] = profile;
  ipcRenderer.invoke("mainProcess_updateExporter", [
    origProfiles != JSON.stringify(theProfiles),
    theProfiles,
    theProfileID,
  ]);
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * reply to main if contents is changed - here always false as we save unconditionally
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  saveProfile();
  event.sender.send("mainProcess_isChanged", false);
});

/**
 * do an export
 */
function doExport() {
  ipcRenderer.invoke("mainProcess_doExport", theProfiles[theProfileID]);
}

/**
 * do a preview
 */
function doPreview() {
  ipcRenderer.invoke("mainProcess_previewExport", theProfiles[theProfileID]);
}

/**
 * message received when detached editor is saved
 *
 * @param {String} name editor name
 * @param {Object} editorContents editor contents as delta op
 */
ipcRenderer.on(
  "exportWindow_changeExportEditor",
  (event, [name, editorContents]) => {
    theEditors[name].contents = editorContents;
  },
);

/**
 * invoked by image window upon saving image properties
 */
ipcRenderer.on("exportWindow_saveImage", (event, args) => {
  let id = args.shift();
  theEditors[id].setImage(...args);
});
