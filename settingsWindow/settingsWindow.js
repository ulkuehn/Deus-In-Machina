/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of settings window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/settingsWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let globalOrig;
let projectOrig;
let globalS;
let projectS;
let leafletMaps = {};
let theSounds = {};
let theCategories;

/**
 * initialize window
 *
 * @param {Object} effectiveSettings effective settings
 * @param {String} globalSettings global settings as JSON
 * @param {String} projectSettings project specific settings as JSON
 * @param {} fonts
 */
ipcRenderer.on(
  "settingsWindow_init",
  (event, [effectiveSettings, globalSettings, projectSettings, fonts]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "settingsWindow_init",
      { effectiveSettings },
      { globalSettings },
      { projectSettings },
      { fonts },
    ]);
    theLanguage = effectiveSettings.language;

    globalSettings = JSON.parse(globalSettings);
    globalOrig = Object.assign({}, globalSettings);
    globalS = globalSettings;
    projectSettings = JSON.parse(projectSettings);
    projectOrig = Object.assign({}, projectSettings);
    projectS = projectSettings;

    theFonts = new Fonts(fonts);
    theFonts.loadStandardFonts("..");

    Sounds.backgroundSounds.forEach((sound) => {
      let path = nodePath.resolve(
        __dirname,
        `${Sounds.backgroundPath}/${sound.name}`,
      );
      try {
        let files = fs.readdirSync(path);
        if (files[0]) {
          theSounds[sound.name] = new Audio(nodePath.join(path, files[0]));
          theSounds[sound.name].loop = true;
        }
      } catch (err) {
        theSounds[sound.name] = null;
      }
    });

    // create content
    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });
    let checked = true;

    Settings.settings.forEach((tab) => {
      let $grid = $("<div>").attr({
        style: `display:grid; row-gap:15px; column-gap:10px; grid-template-columns:max-content 25% auto 40px 25% max-content`,
      });
      if (tab.info) {
        $grid.append(
          $("<div>")
            .attr({
              style: `grid-column:1/span 6; justify-self:stretch;`,
              class: "tab-info",
            })
            .html(_(tab.info)),
        );
      }
      tab.settings.forEach((setting) => {
        // separators
        if (setting.type == "separator") {
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 6; justify-self:stretch;",
                class: "section-header",
              })
              .html(_(setting.name)),
          );
        }
        // checkboxes
        if (setting.type == "check") {
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 2; place-self:center end",
              })
              .html(
                `<input title="${_(
                  "settingsWindow_globalSetting",
                )}" class="form-check-input" type="checkbox" id="${
                  setting.name
                }_global">`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$(\'#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $(\'#${
                    setting.name
                  }_project').prop('checked',$(\'#${
                    setting.name
                  }_global').prop('checked'))" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 2; place-self:center start",
                })
                .html(
                  `<input title="${_(
                    "settingsWindow_projectSetting",
                  )}" class="form-check-input" type="checkbox" id="${
                    setting.name
                  }_project">`,
                ),
            );
          }
        }
        // selects
        if (setting.type == "select") {
          let html = `<select title="${_(
            "settingsWindow_globalSetting",
          )}" class="form-select form-select-sm" id="${setting.name}_global">`;
          setting.values.forEach((value) => {
            html += `<option value="${value}">${_(value)}</option>`;
          });
          html += "</select>";
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 2; place-self:center end;",
              })
              .html(html),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $('#${
                    setting.name
                  }_project').val($('#${setting.name}_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            html = `<select title="${_(
              "settingsWindow_projectSetting",
            )}" class="form-select form-select-sm" id="${
              setting.name
            }_project">`;
            setting.values.forEach((value) => {
              html += `<option value="${value}">${_(value)}</option>`;
            });
            html += "</select>";
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 2; place-self:center start;",
                })
                .html(html),
            );
          }
        }
        // fonts
        if (setting.type == "font") {
          let html = `<select title="${_(
            "settingsWindow_globalSetting",
          )}" class="form-select form-select-sm" id="${
            setting.name
          }_global"><optgroup label="${_("Fonts_web")}">`;
          for (let family of Fonts.standardFamilies) {
            html += `<option style="font-size:16px;font-family:'${
              family.class
            }'" value="'${family.class}'">${_(
              `Fonts_${family.class}`,
            )}</option>`;
          }
          html += `</optgroup><optgroup label="${_("Fonts_system")}">`;
          fonts.forEach((value) => {
            html += `<option style="font-size:16px;font-family:'${value}'" title="${value}"  value="${value}">${value}</option>`;
          });
          html += "</optgroup></select>";
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 2; place-self:center end;",
              })
              .html(html),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $('#${
                    setting.name
                  }_project').val($('#${setting.name}_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            html = `<select title="${_(
              "settingsWindow_projectSetting",
            )}" class="form-select form-select-sm" id="${
              setting.name
            }_project">`;
            fonts.forEach((value) => {
              html += `<option value="${value}">${value}</option>`;
            });
            html += "</select>";
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 2; place-self:center start;",
                })
                .html(html),
            );
          }
        }
        // colors
        if (setting.type == "color" || setting.type == "emptycolor") {
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 2; place-self:center end;",
                title: _("settingsWindow_globalSetting"),
              })
              .html(
                `<input class="${
                  setting.type == "color" ? "colorPicker" : "emptyColorPicker"
                }" id="${setting.name}_global"></input>`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').spectrum(this.checked? 'enable':'disable'); $('#${
                    setting.name
                  }_project').spectrum('set',$('#${
                    setting.name
                  }_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 2; place-self:center start;",
                  title: _("settingsWindow_projectSetting"),
                })
                .html(
                  '<input class="' +
                    (setting.type == "color"
                      ? "colorPicker"
                      : "emptyColorPicker") +
                    '" id="' +
                    setting.name +
                    '_project"></input>',
                ),
            );
          }
        }
        // ranges
        if (setting.type == "range") {
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 1; place-self:center end;",
              })
              .html(
                `<span id="${setting.name}_globalvalue"></span> ${_(
                  setting.unitI18n,
                )}`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:2/span 1; place-self:center stretch;",
              })
              .html(
                `<input title="${_(
                  "settingsWindow_globalSetting",
                )}" type="range" class="${Util.blackOrWhite(
                  effectiveSettings.settingsBackgroundColor ||
                    effectiveSettings.generalBackgroundColor,
                  "range-light",
                  "range-dark",
                )} form-range" style="padding-top:7px" min="${
                  setting.min
                }" max="${setting.max}" step="${setting.step}" id="${
                  setting.name
                }_global" onchange="$('#${
                  setting.name
                }_globalvalue').html(this.value)">`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $('#${
                    setting.name
                  }_project').val($('#${setting.name}_global').val()); $('#${
                    setting.name
                  }_projectvalue').html($('#${setting.name}_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 1; place-self:center stretch;",
                })
                .html(
                  `<input title="${_(
                    "settingsWindow_projectSetting",
                  )}" type="range" class="${Util.blackOrWhite(
                    effectiveSettings.settingsBackgroundColor ||
                      effectiveSettings.generalBackgroundColor,
                    "range-light",
                    "range-dark",
                  )} form-range" style="padding-top:7px" min="${
                    setting.min
                  }" max="${setting.max}" step="${setting.step}" id="${
                    setting.name
                  }_project" onchange="$('#${
                    setting.name
                  }_projectvalue').html(this.value)">`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:6/span 1; place-self:center start;",
                })
                .html(
                  `<span id="${setting.name}_projectvalue"></span> ${_(
                    setting.unitI18n,
                  )}`,
                ),
            );
          }
        }
        // simple texts
        if (setting.type == "text") {
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:1/span 2; place-self:center end;${
                  setting.size ? "" : "width:100%"
                }`,
              })
              .html(
                `<input title="${_(
                  "settingsWindow_globalSetting",
                )}" type="text" class="form-control form-control-sm" spellcheck="false" id="${
                  setting.name
                }_global" ${
                  setting.size ? `size="${setting.size}"` : `style="width:100%"`
                }>`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center;",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $('#${
                    setting.name
                  }_project').val($('#${setting.name}_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:5/span 2; place-self:center start;${
                    setting.size ? "" : "width:100%"
                  }`,
                })
                .html(
                  `<input title="${_(
                    "settingsWindow_projectSetting",
                  )}" type="text" class="form-control form-control-sm" spellcheck="false" id="${
                    setting.name
                  }_project" ${
                    setting.size
                      ? `size="${setting.size}"`
                      : `style="width:100%"`
                  }>`,
                ),
            );
          }
        }
        // text areas
        if (setting.type == "textarea") {
          $grid.append(
            $("<div>")
              .attr({
                style:
                  "grid-column:1/span 2; place-self:center end; width:100%",
              })
              .html(
                `<textarea title="${_(
                  "settingsWindow_globalSetting",
                )}" spellcheck="false" class="form-control form-control-sm" rows="${
                  setting.rows
                }" id="${setting.name}_global" style="width:100%"></textarea>`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_project').prop('disabled',!$('#${
                    setting.name
                  }_project').prop('disabled')); $('#${
                    setting.name
                  }_project').val($('#${setting.name}_global').val())" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style:
                    "grid-column:5/span 2; place-self:center start; width:100%",
                })
                .html(
                  `<textarea title="${_(
                    "settingsWindow_projectSetting",
                  )}" spellcheck="false" class="form-control form-control-sm" rows="${
                    setting.rows
                  }" id="${
                    setting.name
                  }_project" style="width:100%"></textarea>`,
                ),
            );
          }
        }
        // images
        if (setting.type == "image") {
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:1/span 2; place-self:center end;`,
              })
              .html(
                `<img title="${_("settingsWindow_globalSetting")}" id="${
                  setting.name
                }_global" style="height:${
                  setting.height
                }; cursor:pointer; box-shadow:
                0px -1px 10px rgba(0,0,0,0.5), 0px 1px 10px rgba(0,0,0,0.7)"><div style="position:relative; margin-bottom:-35px; bottom:35px; left:calc(50% - 32px)"><button type="button" class="btn btn-outline-light btn-sm" title="${_(
                  "settingsWindow_loadImage",
                )}" onclick="loadImage('${
                  setting.name
                }_global')"><i class="fas fa-image"></i></button><button type="button" class="btn btn-outline-light btn-sm" onclick="resetImage('${
                  setting.name
                }','${setting.name}_global')" title="${_(
                  "settingsWindow_resetImage",
                )}"><i class="fas fa-trash"></i></button></div>`,
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center;",
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="$('#${
                    setting.name
                  }_overlay').css('display',$('#${
                    setting.name
                  }_overlay').css('display')=='none'?'':'none'); $('#${
                    setting.name
                  }_project').attr('src',$('#${setting.name}_global').attr('src'))" id="${
                    setting.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:5/span 2; place-self:center start;`,
                })
                .html(
                  `<div style="position:relative;"><img title="${_(
                    "settingsWindow_projectSetting",
                  )}" id="${setting.name}_project" style="height:${
                    setting.height
                  }; cursor:pointer; box-shadow:
                  0px -1px 10px rgba(0,0,0,0.5), 0px 1px 10px rgba(0,0,0,0.7)"><div id="${
                    setting.name
                  }_overlay" style="position:absolute; top:0; left:0; width:100%; height:calc(100% - 35px); z-index:10; background-color:#ffffffc0"></div><div style="position:relative; margin-bottom:-35px; bottom:35px; left:calc(50% - 32px)"><button type="button" class="btn btn-outline-light btn-sm" title="${_(
                    "settingsWindow_loadImage",
                  )}" onclick="loadImage('${
                    setting.name
                  }_project')"><i class="fas fa-image"></i></button><button type="button" class="btn btn-outline-light btn-sm" onclick="resetImage('${
                    setting.name
                  }','${setting.name}_project')" title="${_(
                    "settingsWindow_resetImage",
                  )}"><i class="fas fa-trash"></i></button></div></div>`,
                ),
            );
          }
        }
        // maps
        if (setting.type == "map") {
          $grid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 2;",
                title: _("settingsWindow_globalSetting"),
              })
              .append(
                $("<div>").attr({
                  style: "height:300px",
                  id: `${setting.name}_global`,
                }),
              ),
          );
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:3/span ${
                  tab.globalOnly ? "3" : "1"
                }; place-self:center ${
                  tab.globalOnly ? "start" : "center"
                }; line-height:normal; text-align:${
                  tab.globalOnly ? "left" : "center"
                }`,
              })
              .html(_(`settingsWindow_${setting.name}`)),
          );
          if (!tab.globalOnly) {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:4/span 1; place-self:center center",
                  title: _("settingsWindow_switchProjectSetting"),
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input class="form-check-input" onclick="projectMap('${tab.tab}','${setting.name}',this)" id="${setting.name}_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:5/span 2;",
                  title: _("settingsWindow_projectSetting"),
                })
                .append(
                  $("<div>").attr({
                    style: "height:300px",
                    id: `${setting.name}_project`,
                  }),
                ),
            );
          }
        }
        // sounds
        if (setting.type == "sounds") {
          Sounds.backgroundSounds.forEach((sound) => {
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:2; place-self:center stretch; display:inline-flex`,
                })
                .html(
                  `<input title="${_(
                    "settingsWindow_globalSetting",
                  )}" class="form-check-input" style="margin:8px 10px 0px 10px" type="checkbox" id="${
                    setting.name
                  }_${sound.name}on_global" onclick="playSounds('${
                    setting.name
                  }')"><input title="${_(
                    "distractionFreeWindow_soundVolume",
                  )}" type="range" class="${Util.blackOrWhite(
                    effectiveSettings.settingsBackgroundColor ||
                      effectiveSettings.generalBackgroundColor,
                    "range-light",
                    "range-dark",
                  )} form-range" min="${setting.min}" max="${
                    setting.max
                  }" step="${setting.step}" style="padding-top:7px" id="${
                    setting.name
                  }_${sound.name}vol_global" onchange="playSounds('${
                    setting.name
                  }')">`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:3; place-self:center center; line-height:normal; text-align:center`,
                })
                .html(
                  `${_(sound.i18n)}<i class="fa-solid ${
                    sound.icon
                  }" style="margin-left:15px"></i>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:4; place-self:center center`,
                })
                .html(
                  `<div class="form-check form-switch" style="padding-top:2px"><input title="${_(
                    "settingsWindow_switchProjectSetting",
                  )}" class="form-check-input" onclick="playSounds('${
                    setting.name
                  }'); $(\'#${setting.name}_${
                    sound.name
                  }on_project').prop('disabled',!$('#${setting.name}_${
                    sound.name
                  }on_project').prop('disabled')); $(\'#${setting.name}_${
                    sound.name
                  }vol_project').prop('disabled',!$('#${setting.name}_${
                    sound.name
                  }vol_project').prop('disabled')); $(\'#${setting.name}_${
                    sound.name
                  }on_project').prop('checked',$('#${setting.name}_${
                    sound.name
                  }on_global').prop('checked')); $(\'#${setting.name}_${
                    sound.name
                  }vol_project').val($('#${setting.name}_${
                    sound.name
                  }vol_global').val())" id="${setting.name}_${
                    sound.name
                  }_active" type="checkbox"></div>`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: `grid-column:5; place-self:center stretch; display:inline-flex`,
                })
                .html(
                  `<input title="${_(
                    "settingsWindow_projectSetting",
                  )}" class="form-check-input" style="margin:8px 10px 0px 0px" type="checkbox" id="${
                    setting.name
                  }_${sound.name}on_project" onclick="playSounds('${
                    setting.name
                  }')"><input title="${_(
                    "distractionFreeWindow_soundVolume",
                  )}" type="range" class="${Util.blackOrWhite(
                    effectiveSettings.settingsBackgroundColor ||
                      effectiveSettings.generalBackgroundColor,
                    "range-light",
                    "range-dark",
                  )} form-range" min="${setting.min}" max="${
                    setting.max
                  }" step="${setting.step}" style="padding-top:10px" id="${
                    setting.name
                  }_${sound.name}vol_project" onchange="playSounds('${
                    setting.name
                  }')">`,
                ),
            );
          });
          $grid.append(
            $("<div>")
              .attr({
                style: `grid-column:2/span 4; justify-self:stretch; margin-top:10px`,
              })
              .html(
                `<input type="checkbox" class="btn-check" id="${setting.name}_play" onclick="playSounds('${setting.name}')"><label class="btn btn-outline-dark" style="width:100%" for="${setting.name}_play"><i class="fa-solid fa-volume-high"></i></label>`,
              ),
          );
        }
      });

      // management controls on first tab only, i.e. if checked==true
      if (checked) {
        // reset global control
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 2; place-self:center end;",
            })
            .html(
              `<button type="button" class="btn btn-outline-danger" onclick="resetGlobalSettings()">${_(
                "settingsWindow_resetGlobalSettings",
              )}</button>`,
            ),
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 3; place-self:center start; line-height:normal;",
            })
            .html(_("settingsWindow_resetGlobalSettingsInfo")),
        );
        // reset project control
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 2; place-self:center end;",
            })
            .html(
              `<button type="button" class="btn btn-outline-danger" onclick="clearProjectSettings()">${_(
                "settingsWindow_clearProjectSettings",
              )}</button>`,
            ),
          $("<div>")
            .attr({
              style: "grid-column:3/span 3; place-self:center start;",
            })
            .html(_("settingsWindow_clearProjectSettingsInfo")),
        );
      }

      // buttons
      $grid.append(
        $("<div>")
          .attr({
            style: `margin-top:20px; grid-column:1/span 6`,
          })
          .html(
            `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveSettings(); closeWindow()">${_(
              "general_saveButton",
            )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
              "general_cancelButton",
            )}</button></div></div>`,
          ),
      );

      Util.addTab($tabs, $content, checked, tab.tab, _(tab.tab), $grid);
      checked = false;
    });

    // global categories tab
    let $cats = $("<div>");
    $cats.append(
      $("<div>")
        .attr({
          class: "tab-info",
        })
        .html(_("settingsWindow_categoriesInfo")),
    );
    theCategories = new Categories(
      $cats,
      Object.fromEntries(
        Categories.categories.map((list) => [
          list.name,
          JSON.parse(JSON.stringify(globalSettings[list.name])),
        ]),
      ),
      globalSettings.palette,
    );

    // buttons
    $cats.append(
      $("<div>")
        .attr({
          style: `margin-top:20px; grid-column:1/span 1`,
        })
        .html(
          `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="saveSettings(); closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></div></div>`,
        ),
    );

    Util.addTab(
      $tabs,
      $content,
      false,
      "settingTabs_categories",
      _("settingTabs_categories"),
      $cats,
    );

    $("body *").css({
      "--scrollbar-width": effectiveSettings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        effectiveSettings.scrollbarStyle,
        effectiveSettings.settingsBackgroundColor ||
          effectiveSettings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        effectiveSettings.scrollbarStyle,
        effectiveSettings.settingsBackgroundColor ||
          effectiveSettings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          effectiveSettings.settingsBackgroundColor ||
            effectiveSettings.generalBackgroundColor,
        ),
        "--background-color":
          effectiveSettings.settingsBackgroundColor ||
          effectiveSettings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content);

    // initialize tabs
    Util.initTabs();

    // set all color pickers
    document.querySelectorAll(".colorPicker").forEach(function (ele) {
      $(ele).spectrum({
        type: "color",
        showPalette: effectiveSettings.palette != noPalette,
        palette: systemPalettes[effectiveSettings.palette],
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
        showPalette: effectiveSettings.palette != noPalette,
        palette: systemPalettes[effectiveSettings.palette],
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

    fillForm(globalSettings, projectSettings);
    theCategories.populate();
  },
);

/**
 * set global settings to default values
 */
function resetGlobalSettings() {
  globalS = Object.assign(
    {},
    Settings.defaultSettings(theLanguage),
    Categories.defaultCategories(),
  );
  fillForm(globalS, projectS);
  theCategories.populate(Categories.defaultCategories());
}

/**
 * clear all project specific settings
 */
function clearProjectSettings() {
  projectS = {};
  fillForm(globalS, projectS);
  theCategories.populate();
}

/**
 * fill all form items with the values given in the parameters
 *
 * @param {Object} globalSettings
 * @param {Object} projectSettings
 */
function fillForm(globalSettings, projectSettings) {
  Settings.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      // checkboxes
      if (setting.type == "check") {
        $(`#${setting.name}_global`).prop(
          "checked",
          globalSettings[setting.name],
        );
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).prop(
            "checked",
            projectSettings[setting.name],
          );
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).prop(
            "checked",
            globalSettings[setting.name],
          );
          $(`#${setting.name}_project`).prop("disabled", true);
        }
      }
      // texts
      if (setting.type == "text" || setting.type == "textarea") {
        $(`#${setting.name}_global`).val(globalSettings[setting.name]);
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).val(projectSettings[setting.name]);
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).val(globalSettings[setting.name]);
          $(`#${setting.name}_project`).prop("disabled", true);
        }
      }
      // colors
      if (setting.type == "color" || setting.type == "emptycolor") {
        $(`#${setting.name}_global`).spectrum(
          "set",
          globalSettings[setting.name],
        );
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).spectrum(
            "set",
            projectSettings[setting.name],
          );
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).spectrum(
            "set",
            globalSettings[setting.name],
          );
          $(`#${setting.name}_project`).spectrum("disable");
        }
      }
      // ranges
      if (setting.type == "range") {
        $(`#${setting.name}_global`).val(globalSettings[setting.name]);
        $(`#${setting.name}_globalvalue`).html(globalSettings[setting.name]);
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).val(projectSettings[setting.name]);
          $(`#${setting.name}_projectvalue`).html(
            projectSettings[setting.name],
          );
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).val(globalSettings[setting.name]);
          $(`#${setting.name}_projectvalue`).html(globalSettings[setting.name]);
          $(`#${setting.name}_project`).prop("disabled", true);
        }
      }
      // sounds
      if (setting.type == "sounds") {
        Sounds.backgroundSounds.forEach((sound) => {
          $(`#${setting.name}_${sound.name}on_global`).prop(
            "checked",
            globalSettings[`${setting.name}_${sound.name}`] > 0,
          );
          $(`#${setting.name}_${sound.name}vol_global`).val(
            Math.abs(globalSettings[`${setting.name}_${sound.name}`]),
          );
          if (`${setting.name}_${sound.name}` in projectSettings) {
            $(`#${setting.name}_${sound.name}_active`).prop("checked", true);
            $(`#${setting.name}_${sound.name}on_project`).prop(
              "checked",
              projectSettings[`${setting.name}_${sound.name}`] > 0,
            );
            $(`#${setting.name}_${sound.name}vol_project`).val(
              Math.abs(projectSettings[`${setting.name}_${sound.name}`]),
            );
          } else {
            $(`#${setting.name}_${sound.name}_active`).prop("checked", false);
            $(`#${setting.name}_${sound.name}on_project`).prop(
              "checked",
              globalSettings[`${setting.name}_${sound.name}`] > 0,
            );
            $(`#${setting.name}_${sound.name}vol_project`).val(
              Math.abs(globalSettings[`${setting.name}_${sound.name}`]),
            );
            $(`#${setting.name}_${sound.name}on_project`).prop(
              "disabled",
              true,
            );
            $(`#${setting.name}_${sound.name}vol_project`).prop(
              "disabled",
              true,
            );
          }
        });
      }
      // selects and fonts
      if (setting.type == "select" || setting.type == "font") {
        $(`#${setting.name}_global`).val(globalSettings[setting.name]);
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).val(projectSettings[setting.name]);
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).val(globalSettings[setting.name]);
          $(`#${setting.name}_project`).prop("disabled", true);
        }
      }
      // images
      if (setting.type == "image") {
        $(`#${setting.name}_global`).attr("src", globalSettings[setting.name]);
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          $(`#${setting.name}_project`).attr(
            "src",
            projectSettings[setting.name],
          );
          $(`#${setting.name}_overlay`).css("display", "none");
        } else {
          $(`#${setting.name}_active`).prop("checked", false);
          $(`#${setting.name}_project`).attr(
            "src",
            globalSettings[setting.name],
          );
        }
      }
      // maps
      if (setting.type == "map") {
        if (leafletMaps[tab.tab] && leafletMaps[tab.tab][setting.name]) {
          if (leafletMaps[tab.tab][setting.name].global) {
            leafletMaps[tab.tab][setting.name].global.remove();
          }
          if (leafletMaps[tab.tab][setting.name].project) {
            leafletMaps[tab.tab][setting.name].projec.remove();
          }
        }
        let projectMap = null;
        let globalMap = Leaflet.map(`${setting.name}_global`, {
          attributionControl: false,
        });
        Leaflet.control.attribution({ prefix: false }).addTo(globalMap);
        Leaflet.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
          },
        ).addTo(globalMap);
        if (setting.name in projectSettings) {
          $(`#${setting.name}_active`).prop("checked", true);
          projectMap = Leaflet.map(`${setting.name}_project`, {
            attributionControl: false,
          });
          Leaflet.control.attribution({ prefix: false }).addTo(projectMap);
          Leaflet.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: "© OpenStreetMap",
            },
          ).addTo(projectMap);
        }
        if (!(tab.tab in leafletMaps)) {
          leafletMaps[tab.tab] = {};
        }
        leafletMaps[tab.tab][setting.name] = {
          project: projectMap,
          global: globalMap,
          initialized: false,
        };
      }
    });

    // initialize maps when the containing tab is shown (but not before!) -- do not do this only once as window size changes might happen anytime leading to size changes of the div containing the map which mandates a refitting of the map
    Object.keys(leafletMaps).forEach((tab) => {
      var tabEl = document.querySelector(`a[href='#${tab}']`);
      tabEl.addEventListener("shown.bs.tab", () => {
        Object.keys(leafletMaps[tab]).forEach((setting) => {
          leafletMaps[tab][setting].global.invalidateSize();
          leafletMaps[tab][setting].global.setView(
            globalS[setting].center,
            globalS[setting].zoom,
          );
          if (leafletMaps[tab][setting].project) {
            leafletMaps[tab][setting].project.invalidateSize();
            leafletMaps[tab][setting].global.setView(
              projectS[setting].center,
              projectS[setting].zoom,
            );
          }
          leafletMaps[tab][setting].initialized = true;
        });
      });
    });
  });
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * check if form content is changed
 */
function isChanged() {
  let [globalSettings, globalChanged, projectSettings, projectChanged] =
    collectSettings();
  return globalChanged || projectChanged;
}

/**
 * save content if changed
 * this includes a possible language change which means to possibly correct i18n related values before submitting
 *
 * possible cases:
 *    - only global : w or w/o lang change
 *    - only project: no lang change
 *    - both: w or w/o lang change
 */
function saveSettings() {
  let [globalSettings, globalChanged, projectSettings, projectChanged] =
    collectSettings();

  if (globalOrig.language != globalSettings.language) {
    projectSettings = changeLanguage(
      globalOrig.language,
      globalSettings.language,
      projectSettings,
    );
    globalSettings = changeLanguage(
      globalOrig.language,
      globalSettings.language,
      globalSettings,
    );
  }
  if (globalChanged) {
    ipcRenderer.invoke("mainProcess_setGlobalSettings", [
      globalSettings,
      projectChanged,
    ]);
  }
  if (projectChanged) {
    ipcRenderer.invoke("mainProcess_setProjectSettings", [projectSettings]);
  }
}

/**
 * change i18n related settings having default values
 *
 * @param {String} fromLanguage current language id
 * @param {String} toLanguage target language id
 * @param {Object} settings
 * @returns {Object} changed settings
 */
function changeLanguage(fromLanguage, toLanguage, settings) {
  // regular settings
  Settings.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      if (
        "i18n" in setting &&
        settings[setting.name] == __(fromLanguage, setting.default)
      ) {
        settings[setting.name] = __(toLanguage, setting.default);
      }
    });
  });
  return settings;
}

/**
 * collect and return setting values from all tabs and forms
 *
 * @returns {Array} global values, project values
 */
function collectSettings() {
  let globalSettings = {};
  let globalChanged = false;
  let projectSettings = {};
  let projectChanged = false;

  // regular settings
  Settings.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      switch (setting.type) {
        case "separator":
          break;
        case "check":
          globalSettings[setting.name] = $(`#${setting.name}_global`).prop(
            "checked",
          );
          globalSettings[setting.name] != globalOrig[setting.name] &&
            (globalChanged = true);
          break;
        case "image":
          globalSettings[setting.name] = $(`#${setting.name}_global`).attr(
            "src",
          );
          globalSettings[setting.name] != globalOrig[setting.name] &&
            (globalChanged = true);
          break;
        case "map":
          if (leafletMaps[tab.tab][setting.name].initialized) {
            globalSettings[setting.name] = {
              center: leafletMaps[tab.tab][setting.name].global.getCenter(),
              zoom: leafletMaps[tab.tab][setting.name].global.getZoom(),
            };
            if (leafletMaps[tab.tab][setting.name].project) {
              projectSettings[setting.name] = {
                center: leafletMaps[tab.tab][setting.name].project.getCenter(),
                zoom: leafletMaps[tab.tab][setting.name].project.getZoom(),
              };
              (projectSettings[setting.name].center[0] !=
                projectOrig[setting.name].center[0] ||
                projectSettings[setting.name].center[1] !=
                  projectOrig[setting.name].center[1] ||
                projectSettings[setting.name].zoom !=
                  projectOrig[setting.name].zoom) &&
                (projectChanged = true);
            }
          } else {
            globalSettings[setting.name] = globalS[setting.name];
          }
          (globalSettings[setting.name].center[0] !=
            globalOrig[setting.name].center[0] ||
            globalSettings[setting.name].center[1] !=
              globalOrig[setting.name].center[1] ||
            globalSettings[setting.name].zoom !=
              globalOrig[setting.name].zoom) &&
            (globalChanged = true);
          break;
        case "sounds":
          Sounds.backgroundSounds.forEach((sound) => {
            globalSettings[`${setting.name}_${sound.name}`] =
              $(`#${setting.name}_${sound.name}vol_global`).val() *
              ($(`#${setting.name}_${sound.name}on_global`).prop("checked")
                ? 1
                : -1);
            globalSettings[`${setting.name}_${sound.name}`] !=
              globalOrig[`${setting.name}_${sound.name}`] &&
              (globalChanged = true);
            if ($(`#${setting.name}_${sound.name}_active`).prop("checked")) {
              projectSettings[`${setting.name}_${sound.name}`] =
                $(`#${setting.name}_${sound.name}vol_project`).val() *
                ($(`#${setting.name}_${sound.name}on_project`).prop("checked")
                  ? 1
                  : -1);
              projectSettings[`${setting.name}_${sound.name}`] !=
                projectOrig[`${setting.name}_${sound.name}`] &&
                (projectChanged = true);
            }
          });
          break;
        default:
          globalSettings[setting.name] = $(`#${setting.name}_global`).val();
          globalSettings[setting.name] != globalOrig[setting.name] &&
            (globalChanged = true);
          break;
      }

      if ($(`#${setting.name}_active`).prop("checked")) {
        switch (setting.type) {
          case "map":
          case "sounds":
            break;
          case "check":
            projectSettings[setting.name] = $(`#${setting.name}_project`).prop(
              "checked",
            );
            projectSettings[setting.name] != projectOrig[setting.name] &&
              (projectChanged = true);
            break;
          case "image":
            projectSettings[setting.name] = $(`#${setting.name}_project`).attr(
              "src",
            );
            projectSettings[setting.name] != projectOrig[setting.name] &&
              (projectChanged = true);
            break;
          default:
            projectSettings[setting.name] = $(`#${setting.name}_project`).val();
            projectSettings[setting.name] != projectOrig[setting.name] &&
              (projectChanged = true);
            break;
        }
      } else {
        setting.name in projectOrig && (projectChanged = true);
      }
    });
  });

  // category lists (only global values; project specific categories are set in projectPropertyWindow)
  Object.entries(theCategories.lists).forEach(([name, list]) => {
    JSON.stringify(globalOrig[name]) != JSON.stringify(list) &&
      (globalChanged = true);
    globalSettings[name] = list;
  });

  return [globalSettings, globalChanged, projectSettings, projectChanged];
}

/**
 * create or remove a project leaflet map
 *
 * @param {String} tabID the tab's name
 * @param {String} mapID the map's name
 * @param {Object} switchEl jquery checkbox element turning map on or off
 */
function projectMap(tabID, mapID, switchEl) {
  if ($(switchEl).prop("checked")) {
    let projectMap = Leaflet.map(`${mapID}_project`, {
      attributionControl: false,
    });
    Leaflet.control.attribution({ prefix: false }).addTo(projectMap);
    Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(projectMap);
    leafletMaps[tabID][mapID].project = projectMap;
    if (mapID in projectS) {
      projectMap.fitBounds(Leaflet.latLngBounds(projectS[mapID]));
    } else {
      projectMap.fitBounds(leafletMaps[tabID][mapID].global.getBounds());
    }
  } else {
    leafletMaps[tabID][mapID].project.remove();
    leafletMaps[tabID][mapID].project = null;
    $(`#${mapID}_project`).empty();
    $(`#${mapID}_project`).removeClass();
  }
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveSettings();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", isChanged());
});

/**
 * load an image as data url
 *
 * @param {String} imageID the image element
 */
function loadImage(imageID) {
  ipcRenderer
    .invoke("mainProcess_loadImageAsDataURL")
    .then((result) => {
      $(`#${imageID}`).attr("src", result);
    })
    .catch(() => {});
}

/**
 * reset an image
 *
 * @param {String} imageID the image element
 */
function resetImage(name, imageID) {
  Settings.settings.forEach((tab) => {
    tab.settings.forEach((setting) => {
      if (setting.name == name) {
        $(`#${imageID}`).attr("src", setting.default);
      }
    });
  });
}

/**
 * play or pause sounds
 *
 * @param {String} settingID
 */
function playSounds(settingID) {
  if ($(`#${settingID}_play`).prop("checked")) {
    Object.keys(theSounds).forEach((sound) => {
      let scope = $(`#${settingID}_${sound}_active`).prop("checked")
        ? "project"
        : "global";
      if (
        theSounds[sound] &&
        $(`#${settingID}_${sound}on_${scope}`).prop("checked")
      ) {
        theSounds[sound].play();
        theSounds[sound].volume =
          $(`#${settingID}_${sound}vol_${scope}`).val() / 100;
      } else {
        theSounds[sound].pause();
      }
    });
  } else {
    Object.keys(theSounds).forEach((sound) => {
      theSounds[sound] && theSounds[sound].pause();
    });
  }
}
