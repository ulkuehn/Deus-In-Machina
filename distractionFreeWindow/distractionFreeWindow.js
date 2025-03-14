/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of distraction free window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/distractionFreeWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

/**
 * register class to highlight cursor position
 */
Parchment.register(
  new Parchment.Attributor.Class("whereami", "whereami", {
    scope: Parchment.Scope.INLINE,
  }),
);

let theSettings;
let theFormats;
let theObjects;
let theEditors = {}; // quill, created: Timestamp, changed: Timestamp, name, chars, words, editable
let theIDs = []; // array of editor ids
let updateTextTimers = {};
let selectionChangeTimers = {};
let selectedEditor;
let searchTextTimeout;
let doAdjustSearch;
let searchPositions = {}; // object of array
let showingWhere = false;
let sounds = {};
let playingSounds = {};
let wheelTimer = null; // id of timer used to manage wheeling/zoom events
let isWheeling = false;
let isZooming = false;
let objectStatusTimer = null;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {} zoom
 * @param {} texts
 * @param {} objects
 * @param {} formats
 * @param {} fonts
 */
ipcRenderer.on(
  "distractionFreeWindow_init",
  (event, [settings, zoom, texts, objects, formats, fonts]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      { settings },
      { zoom },
      { texts },
      { objects },
      { formats },
      { fonts },
    ]);
    theLanguage = settings.language;
    theFormats = formats;
    theSettings = settings;
    theObjects = objects;
    new Fonts(fonts).loadStandardFonts("..");

    // escape closes window
    window.addEventListener("keydown", closeOnEscape, true);
    // ctrl+w highlights the cursor position
    window.addEventListener("keypress", showWhere, true);

    // preload background images
    Promise.allSettled([
      new Promise((resolve) => {
        if (!settings.focusEditorWallpaperColor) {
          $("<img/>")
            .attr("src", settings.focusEditorWallpaper)
            .on("load", function () {
              $(this).remove();
              $("#dfw-inner").css(
                "background-image",
                `linear-gradient(to bottom, rgba(255,255,255,${
                  (100 - settings.focusEditorWallpaperOpacity) / 100
                }) 0%, rgba(255,255,255,${
                  (100 - settings.focusEditorWallpaperOpacity) / 100
                }) 100%), url(${settings.focusEditorWallpaper})`,
              );
              $("#dfw-inner").css("background-size", "cover");
              resolve();
            });
        } else {
          resolve();
        }
      }),
      new Promise((resolve) => {
        if (!settings.focusEditorBackgroundColor) {
          $("<img/>")
            .attr("src", settings.focusEditorBackground)
            .on("load", function () {
              $(this).remove();
              $("#editor").css(
                "background-image",
                `linear-gradient(to bottom, rgba(255,255,255,${
                  (100 - settings.focusEditorBackgroundOpacity) / 100
                }) 0%, rgba(255,255,255,${
                  (100 - settings.focusEditorBackgroundOpacity) / 100
                }) 100%), url(${settings.focusEditorBackground})`,
              );
              $("#editor").css("background-size", "cover");
              $("#editor").css("background-attachment", "local");
              resolve();
            });
        } else {
          resolve();
        }
      }),
    ]).then(() => {
      $("#dfw-outer").css("width", "100%");
      $("#dfw-outer").css("height", "100%");
      if (settings.focusEditorAnimation) {
        $("#dfw-outer").css("animation-name", "dfw-on");
      }
    });

    let $inner = $("<div>").attr({
      id: "dfw-inner",
      style: `background-color:${
        settings.focusEditorWallpaperColor || "#ffffff"
      }; display:flex; align-items:center; justify-content:center;`,
    });

    let $editor = $("<div>").attr({
      id: "editor",
      spellcheck: false,
      style: `background-color:${
        settings.focusEditorBackgroundColor || "#ffffff"
      }; height:${settings.focusEditorHeight}%; width:${
        settings.focusEditorWidth
      }%; padding:5px; overflow:auto; box-shadow:0px -1px 20px rgba(0,0,0,0.5), 0px 1px 20px rgba(0,0,0,0.7)`,
    });

    // bar separators
    let barSeparator = `<span style="display:block; height:100%; width:1px; margin:0 4px 0 4px; background-color:${Util.blackOrWhite(
      Util.lighterOrDarker(
        settings.TEBackgroundColor || settings.generalBackgroundColor,
        settings.contrastLevel,
      ),
    )}"></span>`;

    // menu bar
    let $menuBar = $("<div>").attr({
      id: "MB",
      style:
        "z-index:2; position:fixed; left:0; right:0; margin:auto; top:0; width:100%; height:36px; display:none; column-gap:5px; grid-template-columns:min-content min-content min-content min-content min-content 160px min-content auto min-content min-content min-content max-content min-content min-content min-content min-content min-content",
    });
    // menu bar overlay
    let $menuBarOverlay = $("<div>").attr({
      id: "MBOverlay",
      style:
        "z-index:3; position:fixed; left:0; top:5; width:100%; height:10px; background-color:#00000000",
    });

    // basic styling controls
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:1; align-self:center; padding-left:5px",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatBold"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatBold" title="${_(
            "editorBars_boldTitle",
          )}"><b style="font-size:18px; text-shadow:black 0px 0px 1px">${_(
            "editorBars_boldLabel",
          )}</b></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:2; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatItalic"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatItalic" title="${_(
            "editorBars_italicTitle",
          )}"><i style="font-size:18px;">${_(
            "editorBars_italicLabel",
          )}</i></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:3; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatUnderline"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatUnderline" title="${_(
            "editorBars_underlineTitle",
          )}"><u style="font-size:18px;">${_(
            "editorBars_underlineLabel",
          )}</u></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:4; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatStrike"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatStrike" title="${_(
            "editorBars_strikeTitle",
          )}"><s style="font-size:18px;">${_(
            "editorBars_strikeLabel",
          )}</s></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:5; align-self:center",
        })
        .html(
          `<input type="button" class="btn-check" id="formatSymbols"><label class="btn btn-outline-light btn-sm simple-btn" style="width:40px; padding:0; margin:0" for="formatSymbols" title="${_(
            "editorBars_symbolsTitle",
          )}"><span style="font-size:18px;">&alpha;&Omega;</span></label>`,
        ),
    );

    // format selector
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:6; align-self:center;",
        })
        .html(
          `<select id="formatSelector" class="form-select form-select-sm" style="height:30px; width:100%"></select>`,
        ),
    );
    // separator
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:7",
        })
        .html(barSeparator),
    );

    // search bar
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:8; align-self:center; background-color:white; border:1px solid black",
        })
        .html(
          `<div><input type="text" spellcheck="false" id="searchText" style="border:none;background-color:#00000000; width:calc(100% - 25px)"><i class="fa-solid fa-magnifying-glass fa-fw" id="searchIcon" title="${_(
            "editorBars_searchModeTitle",
          )}" style="padding-right:2px"></i></div><div style="display:none;"><input type="text" spellcheck="false" id="replaceText" style="border:none;background-color:#00000000; width:calc(100% - 25px)"><i class="fa-solid fa-retweet fa-fw" id="replaceIcon" title="${_(
            "editorBars_replaceModeTitle",
          )}" style="padding-right:2px;"></i></div>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:9; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchCase"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px" for="searchCase" title="${_(
            "search_withCase",
          )}"><span style="font-size:18px; letter-spacing:-1px">aA</span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:10; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchWord"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px" for="searchWord" title="${_(
            "search_wholeWord",
          )}"><span style="font-size:18px;"><u>ab</u></span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:11; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchRegex"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px; ${
            theSettings.searchWithRegex ? "" : "display:none"
          }" for="searchRegex" title="${_(
            "search_withRegex",
          )}"><span style="font-size:18px;"><b>.*</b></span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:12; place-self:center center; text-align:center; min-width:50px;",
          id: "searchCount",
        })
        .html(_("editorBars_noSearchResults")),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:13; align-self:center",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:29px; padding:0; width:30px" id="searchPrev" title="${_(
            "editorBars_searchPrevTitle",
          )}" disabled><i class="fa-solid fa-angle-up fa-fw"></i></button>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:14; align-self:center; justify-self:center",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:29px; padding:0; width:30px" id="searchNext" title="${_(
            "editorBars_searchNextTitle",
          )}" disabled><i class="fa-solid fa-angle-down fa-fw"></i></button>`,
        ),
    );
    // separator
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:15",
        })
        .html(barSeparator),
    );

    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:16; align-self:center; justify-self:center",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:29px; padding:0; width:30px" id="replaceNext" title="${_(
            "editorBars_replaceNextTitle",
          )}" disabled><i class="fa-solid fa-retweet fa-fw"></i></button>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:17; align-self:center; justify-self:center; padding-right:5px",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:29px; padding:0; width:30px" id="replaceAll" title="${_(
            "replaceAll",
          )}" disabled><i class="fa-solid fa-ellipsis-vertical fa-fw"></i></button>`,
        ),
    );

    // status bar
    let $statusBar = $("<div>").attr({
      id: "SB",
      style:
        "z-index:2; position:fixed; left:0; right:0; margin:auto; top:calc(100% - 36px); width:100%; height:36px; padding-right:10px; display:none; grid-template-columns:65px max-content 65px max-content 65px max-content 45px max-content max-content max-content min-content max-content min-content max-content min-content auto",
    });
    // status bar objects overlay
    $statusBar.append(
      $("<div>").attr({
        id: "SBObjects",
        style:
          "grid-column:1/span 16; height:36px; padding-top:5px; place-self:center; display:none",
      }),
    );
    // status bar overlay
    let $statusBarOverlay = $("<div>").attr({
      id: "SBOverlay",
      style:
        "z-index:3; position:fixed; left:0; top:calc(100% - 15px); width:100%; height:10px; background-color:#00000000",
    });

    // width selector
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:1; align-self:center; justify-self:end;",
        })
        .html(
          `<i class="fa-solid fa-arrows-left-right"></i> <span id="widthValue" title="${_(
            "distractionFreeWindow_resetWidth",
          )}" onclick="$('#widthSelector').val(${
            theSettings.focusEditorWidth
          });$('#widthSelector').trigger('change')">${
            theSettings.focusEditorWidth
          }%</span>`,
        ),
    );
    $statusBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:2; justify-self:end; align-self:center; width:100px; margin-left:10px; margin-right:10px",
        })
        .html(
          `<input type="range" class="${Util.blackOrWhite(
            theSettings.focusEditorBarColor,
            "range-light",
            "range-dark",
          )} form-range" style="padding-top:3px" min="20" max="100" id="widthSelector"  title="${_(
            "distractionFreeWindow_width",
          )}" value="${theSettings.focusEditorWidth}">`,
        ),
    );
    // height selector
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:3; align-self:center; justify-self:end;",
        })
        .html(
          `<i class="fa-solid fa-arrows-up-down"></i> <span id="heightValue" title="${_(
            "distractionFreeWindow_resetHeight",
          )}" onclick="$('#heightSelector').val(${
            theSettings.focusEditorHeight
          });$('#heightSelector').trigger('change')">${
            theSettings.focusEditorHeight
          }%</span>`,
        ),
    );
    $statusBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:4; justify-self:end; align-self:center; width:100px; margin-left:10px; margin-right:20px",
        })
        .html(
          `<input type="range" class="${Util.blackOrWhite(
            theSettings.focusEditorBarColor,
            "range-light",
            "range-dark",
          )} form-range" style="padding-top:3px" min="20" max="100" id="heightSelector" title="${_(
            "distractionFreeWindow_height",
          )}" value="${theSettings.focusEditorHeight}">`,
        ),
    );
    // zoom selector
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:5; align-self:center; justify-self:end;",
        })
        .html(
          `<i class="fa-solid fa-text-height"></i> <span id="zoomValue" style="cursor:pointer" title="${_(
            "editorBars_resetZoomTitle",
          )}" onclick="$('#zoomSelector').val(${Util.neutralZoomValue});$('#zoomSelector').trigger('input')">${Util.scaledZoom(
            zoom,
          )}%</span>`,
        ),
    );
    $statusBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:6; justify-self:end; align-self:center; width:150px; margin-left:10px; margin-right:10px",
        })
        .html(
          `<input type="range" class="${Util.blackOrWhite(
            theSettings.focusEditorBarColor,
            "range-light",
            "range-dark",
          )} form-range" style="padding-top:3px" min="0" max="160" id="zoomSelector" title="${_(
            "editorBars_textZoomTitle",
          )}" value="${zoom}">`,
        ),
    );
    // spell correction markup
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:7; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="showSpelling"><label class="btn btn-outline-${Util.blackOrWhite(
            settings.focusEditorBarColor,
            "light",
            "dark",
          )} btn-sm simple-btn" for="showSpelling" title="${_(
            "editorBars_showSpellingTitle",
          )}"><i class="fa-solid fa-spell-check"></i></label>`,
        ),
    );
    // object markup
    if (settings.focusEditorObjects) {
      $statusBar.append(
        $("<div>")
          .attr({
            style: `grid-column:8; align-self:center; width:45px`,
          })
          .html(
            `<input type="checkbox" class="btn-check" id="showObjectStyles" checked><label class="btn btn-outline-${Util.blackOrWhite(
              settings.focusEditorBarColor,
              "light",
              "dark",
            )} btn-sm simple-btn" for="showObjectStyles" title="${_(
              "editorBars_showObjectStylesTitle",
            )}"><i class="fa-solid fa-font"></i></label>`,
          ),
      );
      // text opacity selector
      $statusBar.append(
        $("<div>")
          .attr({
            style: `grid-column:9; align-self:center; justify-self:end;`,
          })
          .html(
            `<span id="textOpacityValue" title="${_(
              "editorBars_resetOpacityTitle",
            )}" onclick="$('#textOpacitySelector').val(50);$('#textOpacitySelector').trigger('change')">50%</span>`,
          ),
      );
      $statusBar.append(
        $("<div>")
          .attr({
            style: `grid-column:10; justify-self:end; align-self:center; width:100px; margin-left:10px; margin-right:10px;`,
          })
          .html(
            `<input type="range" class="${Util.blackOrWhite(
              theSettings.focusEditorBarColor,
              "range-light",
              "range-dark",
            )} form-range" style="padding-top:3px" min="0" max="100" id="textOpacitySelector" title="${_(
              "editorBars_textOpacityTitle",
            )}" value="50">`,
          ),
      );
    }
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:11",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // counts
    $statusBar.append(
      $("<div>").attr({
        style: "grid-column:12; place-self:center center",
        id: "SBcounts",
      }),
    );
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:13",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // total counts
    $statusBar.append(
      $("<div>").attr({
        style: "grid-column:14; place-self:center center",
        id: "SBtotalcounts",
      }),
    );
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:15",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // text name
    $statusBar.append(
      $("<div>").attr({
        style:
          "grid-column:16; align-self:center; text-align:end; white-space:nowrap; overflow:hidden; text-overflow:ellipsis",
        id: "SBtext",
        title: _("editorBars_textNameTitle"),
      }),
    );

    // sound bar
    let $soundBar = $("<div>").attr({
      id: "SNDB",
      style:
        "z-index:2; position:fixed; left:0px; top:50%; transform: translateY(-50%);padding:10px; display:none; grid-column-gap:10px; grid-row-gap:20px",
    });
    // sound bar overlay
    let $soundBarOverlay = $("<div>").attr({
      id: "SNDBOverlay",
      style:
        "z-index:3; position:fixed; left:5px; top:50px; width:10px; height:calc(100% - 100px); background-color:#00000000",
    });
    $soundBar.append(
      $("<div>")
        .attr({ style: "grid-column:1/span 2; justify-self:center" })
        .html(
          `<input type="checkbox" ${
            settings.focusEditorSoundOn ? "checked" : ""
          } class="btn-check" id="pauseSounds" onclick="pauseSounds()"><label class="btn btn-lg" for="pauseSounds" title="${_(
            "Sounds_pause",
          )}"><i class="fa-solid fa-volume-high"></i></label>`,
        ),
    );
    // sound controls
    Sounds.backgroundSounds.forEach((sound) => {
      $soundBar.append(
        $("<div>")
          .attr({
            style: "grid-column:1; justify-self:center",
          })
          .html(
            `<input type="checkbox" class="btn-check" id="${
              sound.name
            }OnOff" onclick="soundOnOff('${
              sound.name
            }')"><label class="btn" for="${sound.name}OnOff" title="${_(
              sound.i18n,
            )}"><i class="fa-solid ${sound.icon}"></i></label>`,
          ),
      );
      $soundBar.append(
        $("<div>")
          .attr({ style: "grid-column:2; justify-self:center; margin-top:7px" })
          .html(
            `<input title="${_(
              "distractionFreeWindow_soundVolume",
            )}" type="range" class="${Util.blackOrWhite(
              theSettings.focusEditorBarColor,
              "range-light",
              "range-dark",
            )} form-range" min="5" max="100" step="5" style="width:95px" id="${
              sound.name
            }Volume" disabled onchange="setVolume('${sound.name}')">`,
          ),
      );
    });

    let $outer = $("<div>")
      .attr({
        id: "dfw-outer",
      })
      .append($inner.append($editor));

    $("head")
      .append($(`<style id="editorSheet"></style>`))
      .append($(`<style id="fontSheet"></style>`))
      .append($(`<style id="formatSheet"></style>`))
      .append($(`<style id="objectSheet"></style>`))
      .append($(`<style id="bgSheet"></style>`));

    $("body")
      .append($statusBar)
      .append($statusBarOverlay)
      .append($menuBar)
      .append($menuBarOverlay)
      .append($soundBar)
      .append($soundBarOverlay)
      .append($outer);
    $(".SBseparator").css("visibility", "hidden");

    // load and activate sounds (with some attack profile and delayed if window opens animated)
    let promises = [];
    Sounds.backgroundSounds.forEach((sound) => {
      let path = nodePath.resolve(
        __dirname,
        `${Sounds.backgroundPath}/${sound.name}`,
      );
      let files = fs.readdirSync(path);
      if (files[0]) {
        promises.push(
          new Promise((resolve) => {
            let audio = new Audio(nodePath.join(path, files[0]));
            audio.loop = true;
            audio.volume = 1.0;
            audio.play().then(() => {
              audio.pause();
              sounds[sound.name] = audio;
              resolve();
            });
          }),
        );
      }
    });

    Promise.allSettled(promises).then(() => {
      Sounds.backgroundSounds.forEach((sound) => {
        $(`#${sound.name}Volume`).val(
          Math.abs(settings[`focusEditorSound_${sound.name}`]),
        );
        if (settings[`focusEditorSound_${sound.name}`] > 0) {
          $(`#${sound.name}Volume`).prop("disabled", false);
          $(`#${sound.name}OnOff`).prop("checked", true);
          if (settings.focusEditorSoundOn) {
            setTimeout(
              () => {
                soundOnOff(sound.name);
                setVolume(sound.name, 0.1);
                setTimeout(() => {
                  setVolume(sound.name, 0.2);
                  setTimeout(() => {
                    setVolume(sound.name, 0.3);
                    setTimeout(() => {
                      setVolume(sound.name, 0.5);
                      setTimeout(() => {
                        setVolume(sound.name);
                      }, 500);
                    }, 500);
                  }, 500);
                }, 500);
              },
              theSettings.focusEditorAnimation ? 1000 : 0,
            );
          } else {
            soundOnOff(sound.name);
          }
        }
      });
      if (!settings.focusEditorSoundOn) {
        pauseSounds();
      }
    });

    // dockable bars
    $("#MBOverlay").on("mouseleave", (e) => {
      if (e.pageY < 15) {
        $("#MB").show();
        $("#MB").css("display", "grid");
        $("#MBOverlay").hide();
      }
    });
    $("#MB").on("mouseleave", (e) => {
      if (e.pageY > $("#MB").height()) {
        $("#MB").hide();
        $("#MBOverlay").show();
      }
    });

    $("#SBOverlay").on("mouseleave", (e) => {
      if (e.pageY > $("#SBOverlay").position().top) {
        $("#SB").show();
        $("#SB").css("display", "grid");
        $("#SBOverlay").hide();
      }
    });
    $("#SB").on("mouseleave", (e) => {
      if (e.pageY < $("#SB").position().top) {
        $("#SB").hide();
        $("#SBOverlay").show();
      }
    });

    $("#SNDBOverlay").on("mouseleave", (e) => {
      if (e.pageX < $("#SNDBOverlay").position().left) {
        $("#SNDB").show();
        $("#SNDB").css("display", "grid");
        $("#SNDBOverlay").hide();
      }
    });
    $("#SNDB").on("mouseleave", (e) => {
      if (e.pageX > $("#SNDB").width()) {
        $("#SNDB").hide();
        $("#SNDBOverlay").show();
      }
    });

    $("#formatBold").on("change", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        theEditors[selectedEditor].quill.format(
          "bold",
          $("#formatBold").prop("checked"),
        );
      }
    });
    $("#formatItalic").on("change", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        theEditors[selectedEditor].quill.format(
          "italic",
          $("#formatItalic").prop("checked"),
        );
      }
    });
    $("#formatUnderline").on("change", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        theEditors[selectedEditor].quill.format(
          "underline",
          $("#formatUnderline").prop("checked"),
        );
      }
    });
    $("#formatStrike").on("change", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        theEditors[selectedEditor].quill.format(
          "strike",
          $("#formatStrike").prop("checked"),
        );
      }
    });

    $("#formatSymbols").on("click", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        ipcRenderer.invoke("mainProcess_openWindow", [
          "symbols",
          true, // close w/o asking
          false,
          50,
          50,
          _("windowTitles_symbolsWindow"),
          "./symbolsWindow/symbolsWindow.html",
          "symbolsWindow_init",
          null,
          [theSettings],
        ]);
      }
    });

    // styling
    let bgColor = settings.TEBackgroundColor || settings.generalBackgroundColor;
    let sepColor =
      settings.textSeparatorColor == ""
        ? Util.blackOrWhite(bgColor)
        : settings.textSeparatorColor;
    let barColor = settings.focusEditorBarColor;
    $("#MB").css({
      "background-color": barColor,
    });
    $("#SB").css({
      "background-color": barColor,
    });
    $("#SNDB").css({
      "background-color": barColor,
    });
    // additional border line?
    let border = `1px solid ${Util.blackOrWhite(barColor)}`;
    $("#MB").css("border-bottom", settings.borderLine ? border : "");
    $("#SB").css("border-top", settings.borderLine ? border : "");

    // status bar and zoom value text color
    $("#SB").css("color", Util.blackOrWhite(barColor));
    $("#zoomValue").css("color", Util.blackOrWhite(barColor));
    $("#SBtotalcounts").css("color", Util.blackOrWhite(barColor));
    $("#SBtotalcounts").css("color", Util.blackOrWhite(barColor));
    $("#SBtext").css("color", Util.blackOrWhite(barColor));
    $("#searchCount").css("color", Util.blackOrWhite(barColor));

    // set button classes
    let buttonClass = Util.blackOrWhite(
      barColor,
      "btn-outline-light",
      "btn-outline-dark",
    );
    [
      "#formatBold",
      "#formatItalic",
      "#formatUnderline",
      "#formatStrike",
      "#formatSymbols",
      "#searchCase",
      "#searchWord",
      "#searchRegex",
    ].forEach((control) => {
      $(`${control} + label`).removeClass([
        "btn-outline-light",
        "btn-outline-dark",
      ]);
      $(`${control} + label`).addClass(buttonClass);
    });
    ["#searchNext", "#searchPrev", "#replaceNext", "#replaceAll"].forEach(
      (control) => {
        $(control).removeClass(["btn-outline-light", "btn-outline-dark"]);
        $(control).addClass(buttonClass);
      },
    );
    $(`#pauseSounds + label`).removeClass([
      "btn-outline-light",
      "btn-outline-dark",
    ]);
    $(`#pauseSounds + label`).addClass(buttonClass);
    $(`#pauseSounds + label`).css({
      "box-shadow": `inset 0px 0px 3px 1px ${Util.blackOrWhite(
        barColor,
        "#ffffff",
        "#000000",
      )}`,
    });
    Sounds.backgroundSounds.forEach((sound) => {
      $(`#${sound.name}OnOff + label`).removeClass([
        "btn-outline-light",
        "btn-outline-dark",
      ]);
      $(`#${sound.name}OnOff + label`).addClass(buttonClass);
      $(`#${sound.name}OnOff + label`).css({
        "box-shadow": `inset 0px 0px 3px 1px ${Util.blackOrWhite(
          barColor,
          "#ffffff",
          "#000000",
        )}`,
      });
    });

    // fill in formats
    for (let [formatID, format] of Object.entries(formats)) {
      $("#formatSelector").append(
        `<option ${
          theSettings.previewFormats ? `class="format${formatID}"` : ""
        } value="${formatID}">${Util.escapeHTML(format.formats_name)}</option>`,
      );
    }

    // style sheets
    let sheetHTML = `.edi + .edi { border-top-color:${sepColor}; border-top-width:${settings.textSeparatorWidth}px; border-top-style:${settings.textSeparatorStyle}; margin-top:${settings.textSeparatorAbove}px; padding-top:${settings.textSeparatorBelow}px }\n`;
    sheetHTML += `.ql-editor[contenteditable="false"] { ${
      settings.lockedBackgroundColor
        ? `background-color:${settings.lockedBackgroundColor};`
        : ""
    } opacity:${settings.lockedOpacity / 100} }`;
    $("#editorSheet").html(sheetHTML);
    $(":root").css({
      "--selection-foregroundColor": Util.blackOrWhite(settings.selectionColor),
      "--selection-backgroundColor": settings.selectionColor,
    });

    // objects
    Object.keys(objects).forEach((object) => {
      let parchment = new Parchment.Attributor.Class(
        `object${object}`,
        `object${object}`,
        {
          scope: Parchment.Scope.INLINE,
        },
      );
      parchment.add = (node, value) => {
        let $node = $(node);
        $node.addClass(`object${object}-${value}`);
        $node.attr("onclick", `statusBarObjects(true,this.className)`);
        $node.attr("onmouseover", `statusBarObjects(false,this.className)`);
        return true;
      };
      Parchment.register(parchment);
    });
    buildObjectSheet();

    // formats
    Object.keys(formats).forEach((formatID) => {
      let parchment = new Parchment.Attributor.Class(
        `format${formatID}`,
        `format${formatID}`,
        {
          scope: Parchment.Scope.BLOCK,
        },
      );
      Parchment.register(parchment);
    });
    buildFormatSheet();

    // search bar
    $("#searchText").on("input", () => {
      if (searchTextTimeout) {
        clearTimeout(searchTextTimeout);
      }
      // debounce input
      if ($("#searchText").val() && checkSearchRegex()) {
        searchTextTimeout = setTimeout(() => {
          searchTextTimeout = null;
          doAdjustSearch = true;
          adjustSearch();
        }, 500);
      }
    });

    $("#searchIcon").on("click", () => {
      $("#searchText").parent().css("display", "none");
      $("#replaceText").parent().css("display", "block");
    });
    $("#replaceIcon").on("click", () => {
      $("#searchText").parent().css("display", "block");
      $("#replaceText").parent().css("display", "none");
    });
    $("#searchCase").on("change", () => {
      adjustSearch();
    });
    $("#searchWord").on("change", () => {
      adjustSearch();
    });
    $("#searchRegex").on("change", () => {
      if (checkSearchRegex()) {
        adjustSearch();
      }
    });
    $("#searchNext").on("click", () => {
      search();
    });
    $("#searchPrev").on("click", () => {
      search(false);
    });
    $("#replaceNext").on("click", () => {
      replaceNext();
    });
    $("#replaceAll").on("click", () => {
      if (theSettings.replaceAllConfirm) {
        let count = countSearchPositions();
        ipcRenderer
          .invoke("mainProcess_yesNoDialog", [
            _("editorBars_replaceAllTitle"),
            _("editorBars_confirmReplace", count, {
              count: count,
              replaceBy: $("#replaceText").val(),
            }),
            true,
          ])
          .then((result) => {
            if (result == 0) {
              replaceAll();
            }
          });
      } else {
        replaceAll();
      }
    });

    // change zoom
    $("#zoomSelector").on("input", () => {
      $("#zoomValue").html(Util.scaledZoom($("#zoomSelector").val()) + "%");
      $(":root").css({
        "--first-line-indent": `${
          (theSettings.firstLineIndent *
            Util.scaledZoom($("#zoomSelector").val())) /
          100
        }px`,
      });
      buildFormatSheet();
      buildObjectSheet();
    });

    // change width
    $("#widthSelector").on("change", () => {
      $("#widthValue").html($("#widthSelector").val() + "%");
      $("#editor").css("width", $("#widthSelector").val() + "%");
    });
    // change height
    $("#heightSelector").on("change", () => {
      $("#heightValue").html($("#heightSelector").val() + "%");
      $("#editor").css("height", $("#heightSelector").val() + "%");
    });

    // change spelling markup
    $("#showSpelling").on("change", () => {
      Object.keys(theEditors).forEach((id) => {
        $(theEditors[id].quill.container).attr(
          "spellcheck",
          $("#showSpelling").prop("checked"),
        );
      });
    });

    // change object markup
    $("#showObjectStyles").on("change", () => {
      buildObjectSheet(
        undefined,
        undefined,
        $("#showObjectStyles").prop("checked"),
        $("#textOpacitySelector").val(),
      );
    });
    // change text opacity
    $("#textOpacitySelector").on("change", () => {
      $("#textOpacityValue").html($("#textOpacitySelector").val() + "%");
      buildObjectSheet(
        undefined,
        undefined,
        $("#showObjectStyles").prop("checked"),
        $("#textOpacitySelector").val(),
      );
    });

    // change paragraph format
    $("#formatSelector").on("change", () => {
      if (selectedEditor && theEditors[selectedEditor].editable) {
        if (theEditors[selectedEditor].quill.getSelection()) {
          // unset all possible paragraph formats, as we do not know which one is set
          Object.keys(theFormats).forEach((formatID) => {
            theEditors[selectedEditor].quill.format(`format${formatID}`, false);
          });
          // set new format
          theEditors[selectedEditor].quill.format(
            `format${$("#formatSelector").val()}`,
            true,
          );
        }
      }
    });

    // load texts
    texts.forEach((text) => {
      let $newEditor = $("<div>").attr({
        id: `edi${text.id}`,
      });
      $newEditor.addClass("edi");
      $editor.append($newEditor);
      let [charCount, wordCount] = StyledText.countCharsWordsObjects(
        text.delta,
      );
      let quill = new Quill(`#edi${text.id}`, QuillConfig.config);
      quill.setContents(text.delta);
      theEditors[text.id] = {
        quill: quill,
        created: new Timestamp(text.created),
        changed: new Timestamp(text.changed),
        name: text.name,
        path: text.path,
        chars: charCount,
        words: wordCount,
        editable: text.editable,
      };
      theEditors[text.id].quill.enable(text.editable);
      theIDs.push(text.id);

      // DOM dragstart, copy and cut handlers
      // if we are taking chunks out of the text we must take care of all objects the text chunk is associated with
      $(`#edi${text.id}`).on("dragstart copy cut", (event) => {
        let fragment = document.getSelection().getRangeAt(0).cloneContents();
        let tempDiv = document.createElement("div");
        tempDiv.appendChild(fragment.cloneNode(true));
        let html = tempDiv.innerHTML;
        // if no children we took out text only
        // but this does not mean the text has no objects associated with, so we need check carefully and build html explicitly
        if (fragment.childElementCount == 0) {
          let classes = [];
          Object.keys(theEditors[text.id].quill.getFormat()).forEach(
            (format) => {
              if (format.startsWith("object")) {
                classes.push(format + "-true");
              }
            },
          );
          if (classes.length) {
            html = `<span class="${classes.join(" ")}">${html}</span>`;
          }
        }
        if (event.type == "dragstart") {
          // no drag from locked texts
          if (!theEditors[text.id].editable) {
            return false;
          }
          event.originalEvent.dataTransfer.setData("text/html", html);
          event.originalEvent.dataTransfer.setData("text/quill", html);
          // continue standard drag
          return true;
        } else {
          event.originalEvent.clipboardData.setData("text/html", html);
          event.originalEvent.clipboardData.setData("text/quill", html);
          event.originalEvent.clipboardData.setData(
            "text/plain",
            tempDiv.textContent,
          );
          if (event.type == "cut") {
            document.getSelection().deleteFromDocument();
          }
          // no standard copy/cut
          event.preventDefault();
        }
      });

      // DOM drop handler
      $(`#edi${text.id}`).on("drop", (event) => {
        let range = document.caretRangeFromPoint(event.clientX, event.clientY);
        if (
          range.startContainer &&
          range.startContainer.nodeType == Node.TEXT_NODE
        ) {
          let splitNode = range.startContainer.splitText(range.startOffset);
          // if we are not dropping from another quill editor or are requesting plain insert by alt key, then insert plain text
          if (
            !event.originalEvent.dataTransfer.types.includes("text/quill") ||
            event.altKey
          ) {
            range.startContainer.splitText(range.startOffset);
            range.startContainer.nodeValue =
              range.startContainer.nodeValue +
              event.originalEvent.dataTransfer.getData("text/plain");
          } else {
            let spanNode = document.createElement("span");
            spanNode.insertAdjacentHTML(
              "afterbegin",
              event.originalEvent.dataTransfer.getData("text/quill"),
            );
            range.startContainer.parentNode.insertBefore(spanNode, splitNode);
          }
          if (!event.ctrlKey) {
            document.getSelection().deleteFromDocument();
          }
          event.preventDefault();
        } else {
          return true;
        }
      });

      // DOM paste handler
      $(`#edi${text.id}`).on("paste", (event) => {
        // if we are not pasting from within, then insert plain text to avoid pasting unwanted html tags and styles
        if (!event.originalEvent.clipboardData.types.includes("text/quill")) {
          event.preventDefault();
          let range = theEditors[text.id].quill.getSelection(true);
          if (range) {
            paste(text.id, range);
          }
        }
      });

      // Quill selection handler
      quill.on("selection-change", (range, oldRange, source) => {
        if (selectionChangeTimers[text.id]) {
          clearTimeout(selectionChangeTimers[text.id]);
        }
        selectionChangeTimers[text.id] = setTimeout(
          updateSelection,
          100,
          range,
          text.id,
        );
      });

      // Quill text change handler
      quill.on("text-change", (changeDelta, oldDelta, source) => {
        theEditors[text.id].changed = new Timestamp();
        // clear a timer that might be running for this text
        if (updateTextTimers[text.id]) {
          clearTimeout(updateTextTimers[text.id]);
        }
        // and set a new one
        updateTextTimers[text.id] = setTimeout(updateText, 500, text.id);
      });

      // context menu type for object selection
      $.contextMenu.types.check = function (item, opt, root) {
        $(
          `<label><input type="checkbox" ${
            item.checked ? "checked" : ""
          } class="form-check-input" style="margin-top:2px; border:1px solid #2f2f2f; box-shadow:none"><span>${
            item.name
          }</span></label>`,
        ).appendTo(this);
        // (de)activate object
        this.on("click", function (e) {
          if (e.target.type == "checkbox") {
            opt.$menu.trigger("contextmenu:hide");
            item.checked = !item.checked;
            theObjects[item.id].checked = item.checked;
            buildObjectSheet();
          }
        });
      };
      // editor context menu definition
      $(`#edi${text.id}`).contextMenu({
        selector: ".ql-editor",
        autoHide: true,
        build: ($trigger, e) => {
          return !text.editable ? false : doContextMenu(text.id, e);
        },
      });
    });

    $("#editor")[0].onwheel = doZoom;
    $(":root").css({
      "--first-line-indent": `${
        (theSettings.firstLineIndent *
          Util.scaledZoom($("#zoomSelector").val())) /
        100
      }px`,
    });
  },
);

/**
 * (un)set bold
 */
function bold() {
  let bold = "bold" in theEditors[selectedEditor].quill.getFormat();
  $("#formatBold").prop("checked", !bold);
  theEditors[selectedEditor].quill.format("bold", !bold);
}
/**
 * (un)set italic
 */
function italic() {
  let italic = "italic" in theEditors[selectedEditor].quill.getFormat();
  $("#formatItalic").prop("checked", !italic);
  theEditors[selectedEditor].quill.format("italic", !italic);
}
/**
 * (un)set underline
 */
function underline() {
  let underline = "underline" in theEditors[selectedEditor].quill.getFormat();
  $("#formatUnderline").prop("checked", !underline);
  theEditors[selectedEditor].quill.format("underline", !underline);
}
/**
 * (un)set strike
 */
function strike() {
  let strike = "strike" in theEditors[selectedEditor].quill.getFormat();
  $("#formatStrike").prop("checked", !strike);
  theEditors[selectedEditor].quill.format("strike", !strike);
}

/**
 * context menu
 *
 * @param {String} textID
 * @param {*} event
 * @returns {Object} context menu items
 */
function doContextMenu(textID, event) {
  let menuItems = {};
  let items = menuItems;
  let infoPre = `<span class="preWrap" style="font-style:italic">`;
  let infoPost = `</span>`;
  let compact = theSettings.editorCompactContextMenu;

  // on image
  if (event.target.nodeName.toLowerCase() == "img") {
    let specs = DIMImage.formats(event.target);
    items.name = {
      isHtmlName: true,
      name: `${infoPre}${_("editorContextMenu_imageInfo", {
        width: specs.width,
        height: specs.height,
      })}${infoPost}`,
    };
    items.name.icon = "fas fa-circle-info";
    if (specs.title) {
      items.title = {
        isHtmlName: true,
        name: `${infoPre}${Util.escapeHTML(specs.title)}${infoPost}`,
      };
    }
    items.sepInfo = "x";
    items.props = {
      name: _("editorContextMenu_imageProperties"),
      callback: () => {
        ipcRenderer.invoke("mainProcess_openWindow", [
          "image",
          theSettings.closingType,
          true,
          600,
          800,
          _("windowTitles_imageWindow"),
          "./imageWindow/imageWindow.html",
          "imageWindow_init",
          null,
          [
            theSettings,
            "distractionFree",
            textID,
            theEditors[textID].quill.getIndex(Quill.find(event.target)),
            event.target.src,
            specs,
          ],
        ]);
      },
    };
    items.select = {
      name: _("editorContextMenu_selectImage"),
      callback: () => {
        theEditors[textID].quill.setSelection(
          theEditors[textID].quill.getIndex(Quill.find(event.target)),
          1,
        );
        this.scrollToSelection();
      },
    };
    return {
      items: items,
    };
  }

  // on regular text
  let len = theEditors[textID].quill.getLength();
  let sel = theEditors[textID].quill.getSelection();
  let selDelta = theEditors[textID].quill.getContents(sel.index, sel.length);
  let selText = theEditors[textID].quill.getText(sel.index, sel.length);
  let [charCount, wordCount, objects] = StyledText.countCharsWordsObjects(
    selDelta.ops,
  );

  // info part
  if (compact) {
    menuItems.infoMenu = {
      name: _("editorContextMenu_infoMenu"),
      icon: "fas fa-circle-info",
      items: {},
    };
    items = menuItems.infoMenu.items;
  }
  items.name = {
    isHtmlName: true,
    name: infoPre + Util.escapeHTML(theEditors[textID].name) + infoPost,
  };
  if (!compact) {
    items.name.icon = "fas fa-circle-info";
  }

  if (theSettings.editorContextMenuStats) {
    let [chars, words, objects] = StyledText.countCharsWordsObjects(
      theEditors[textID].quill.getContents().ops,
    );
    items.stats = {
      isHtmlName: true,
      name: `${infoPre}${_("editorContextMenu_words", words, {
        words: words.toLocaleString(theLanguage),
      })} &ndash; ${_("editorContextMenu_characters", chars, {
        characters: chars.toLocaleString(theLanguage),
      })} &ndash; ${_("editorContextMenu_objects", objects.length, {
        objects: objects.length.toLocaleString(theLanguage),
      })}${infoPost}`,
    };
  }

  if (theSettings.editorContextMenuTime == "compactTime") {
    items.time = {
      isHtmlName: true,
      name:
        infoPre +
        _("editorContextMenu_timestamps", {
          created: theEditors[textID].created.toLocalString(
            theSettings.dateTimeFormatShort,
          ),
          changed: theEditors[textID].changed.toLocalString(
            theSettings.dateTimeFormatShort,
          ),
        }) +
        infoPost,
    };
  }
  if (theSettings.editorContextMenuTime == "fullTime") {
    items.created = {
      isHtmlName: true,
      name:
        infoPre +
        _("editorContextMenu_created", {
          created: theEditors[textID].created.toLocalString(
            theSettings.dateTimeFormatShort,
          ),
          relative: theEditors[textID].created.timeToNow(),
        }) +
        infoPost,
    };
    items.changed = {
      isHtmlName: true,
      name:
        infoPre +
        _("editorContextMenu_changed", {
          changed: theEditors[textID].changed.toLocalString(
            theSettings.dateTimeFormatShort,
          ),
          relative: theEditors[textID].changed.timeToNow(),
        }) +
        infoPost,
    };
  }

  if (sel.length) {
    items.select = {
      isHtmlName: true,
      name: `${infoPre}${_("editorContextMenu_selection")}${_(
        "editorContextMenu_words",
        wordCount,
        {
          words: wordCount.toLocaleString(theLanguage),
        },
      )} &ndash; ${_("editorContextMenu_characters", charCount, {
        characters: charCount.toLocaleString(theLanguage),
      })} &ndash; ${_("editorContextMenu_objects", objects.length, {
        objects: objects.length.toLocaleString(theLanguage),
      })}${infoPost}`,
    };
  }

  // formats
  if (theSettings.editorContextMenuFormat) {
    if (compact) {
      menuItems.formatMenu = {
        name: _("editorContextMenu_formatMenu"),
        icon: "fas fa-font",
        items: {},
      };
      items = menuItems.formatMenu.items;
    } else {
      items.sepFormat = "x";
    }
    let format = theEditors[textID].quill.getFormat();
    items.formatBold = {
      name: _("editorContextMenu_bold"),
      isHtmlName: true,
      icon: "bold" in format ? "fas fa-check" : null,
      callback: () => {
        $("#formatBold").prop("checked", !("bold" in format));
        theEditors[textID].quill.format("bold", !("bold" in format));
      },
    };
    items.formatItalic = {
      name: _("editorContextMenu_italic"),
      isHtmlName: true,
      icon: "italic" in format ? "fas fa-check" : null,
      callback: () => {
        $("#formatItalic").prop("checked", !("italic" in format));
        theEditors[textID].quill.format("italic", !("italic" in format));
      },
    };
    items.formatUnderline = {
      name: _("editorContextMenu_underline"),
      isHtmlName: true,
      icon: "underline" in format ? "fas fa-check" : null,
      callback: () => {
        $("#formatUnderline").prop("checked", !("underline" in format));
        theEditors[textID].quill.format("underline", !("underline" in format));
      },
    };
    items.formatStrike = {
      name: _("editorContextMenu_strike"),
      isHtmlName: true,
      icon: "strike" in format ? "fas fa-check" : null,
      callback: () => {
        $("#formatStrike").prop("checked", !("strike" in format));
        theEditors[textID].quill.format("strike", !("strike" in format));
      },
    };
  }

  // copy, cut, paste part
  if (compact) {
    menuItems.ccpMenu = {
      name: _("editorContextMenu_editMenu"),
      icon: "fas fa-clipboard",
      items: {},
    };
    items = menuItems.ccpMenu.items;
  } else {
    items.sepCCP = "x";
  }
  if (sel.length) {
    items.copy = {
      name: _("editorContextMenu_copy"),
      callback: function () {
        // execCommand should be avoided
        document.execCommand("copy");
      },
    };
    if (!compact) {
      items.copy.icon = "fas fa-clipboard";
    }
    items.cut = {
      name: _("editorContextMenu_cut"),
      callback: function () {
        // execCommand should be avoided - but clipboard.write fails on delta data (?)
        // this.#editors[textID].quill.deleteText(sel.index,sel.length);
        // navigator.clipboard.write([selDelta]);
        document.execCommand("cut");
      },
    };
  }
  items.paste = {
    name: _("editorContextMenu_paste"),
    callback: () => {
      paste(textID, sel);
    },
  };
  if (!compact && !sel.length) {
    items.paste.icon = "fas fa-paste";
  }
  items.pasteText = {
    name: _("editorContextMenu_pasteText"),
    callback: () => {
      navigator.clipboard.readText().then((clipText) => {
        theEditors[textID].quill.deleteText(sel.index, sel.length);
        theEditors[textID].quill.insertText(sel.index, clipText);
      });
    },
  };
  items.pastePlain = {
    name: _("editorContextMenu_pastePlain"),
    callback: () => {
      navigator.clipboard.readText().then((clipText) => {
        theEditors[textID].quill.deleteText(sel.index, sel.length);
        theEditors[textID].quill.insertText(sel.index, clipText);
        theEditors[textID].quill.removeFormat(sel.index, clipText.length);
      });
    },
  };
  items.loadImage = {
    name: _("editorContextMenu_insertImage"),
    icon: "fa-regular fa-image",
    callback: () => {
      ipcRenderer
        .invoke("mainProcess_fileOpenDialog", [
          {
            name: _("project_fileTypes"),
            extensions: ["jpg", "jpeg", "png"],
          },
        ])
        .then((path) => {
          if (path) {
            let reader = new FileReader();
            reader.readAsDataURL(new Blob([fs.readFileSync(path)]));
            reader.onload = () => {
              theEditors[textID].quill.deleteText(sel.index, sel.length);
              theEditors[textID].quill.insertEmbed(
                sel.index,
                "image",
                reader.result +
                  " " +
                  theSettings.imageWidth +
                  " " +
                  theSettings.imageHeight,
              );
              theEditors[textID].quill.formatText(sel.index, 1, {
                title: path,
                alignment: theSettings.imageAlignment,
                shadow: theSettings.imageShadow,
              });
            };
          }
        });
    },
  };

  // object de/activate part
  if (sel.length && objects.length && theSettings.focusEditorObjects) {
    if (compact) {
      menuItems.object2Menu = {
        name: _("editorContextMenu_changeObjectsMenu"),
        icon: "fas fa-check",
        items: {},
      };
      items = menuItems.object2Menu.items;
    } else {
      items.sepObject2 = "x";
    }
    // activate only the objects found in selection
    items.activateObjectsOnly = {
      name: _("editorContextMenu_activateExactly", objects.length),
      callback: function () {
        Object.keys(theObjects).forEach((object) => {
          theObjects[object].checked = objects.includes(object);
        });
        buildObjectSheet();
      },
    };
    if (!compact) {
      items.activateObjectsOnly.icon = "fas fa-check";
    }
    if (objects.length > 1) {
      // activate all objects found in selection
      items.activateObjects = {
        name: _("editorContextMenu_activate"),
        callback: function () {
          objects.forEach((object) => {
            theObjects[object].checked = true;
          });
          buildObjectSheet();
        },
      };
      // deactivate all objects found in selection
      items.deactivateObjects = {
        name: _("editorContextMenu_deactivate"),
        callback: function () {
          objects.forEach((object) => {
            theObjects[object].checked = false;
          });
          buildObjectSheet();
        },
      };
    }
    objects.forEach((object) => {
      items["check_" + object] = {
        type: "check",
        id: object,
        checked: theObjects[object].checked,
        name: theObjects[object].name,
        className: "context-menu-input context-menu-overflow",
      };
    });
  }

  // web tools part
  if (theSettings.focusEditorContextMenuWeb && selText.trim() != "") {
    let webtools = {};
    theSettings.editorContextMenuWeb.split(/\n+/).forEach((entry) => {
      if (entry.includes("::")) {
        let [name, url] = entry.split("::");
        name = name.trim();
        url = url.trim();
        if (name != "" && url.includes("$")) {
          webtools[name] = {
            name: name,
            callback: () => {
              ipcRenderer.invoke(
                "mainProcess_openURL",
                url.replace("$", encodeURI(selText.trim())),
              );
            },
          };
        }
      }
    });
    if (Object.keys(webtools).length) {
      if (compact) {
        menuItems.toolsMenu = {
          name: _("editorContextMenu_toolsMenu"),
          icon: "fas fa-globe",
          items: webtools,
        };
      } else {
        items.sepTools = "x";
        webtools[Object.keys(webtools)[0]].icon = "fas fa-globe";
        menuItems = { ...menuItems, ...webtools };
      }
    }
  }

  return {
    items: menuItems,
  };
}

/**
 * escape exits from distraction free mode
 *
 * @param {*} event
 */
function closeOnEscape(event) {
  if (event.key == "Escape") {
    if (theSettings.focusEditorAnimation) {
      $("#dfw-outer").css("animation-name", "dfw-off");
    }
    allEditorsSaved().then((r) => {
      setTimeout(
        () => {
          ipcRenderer.invoke("mainProcess_closeModalWindow");
        },
        theSettings.focusEditorAnimation ? 1000 : 0,
      );
    });
  }
}

/**
 *
 * @param {*} event
 */
function showWhere(event) {
  if (event.ctrlKey && event.code == "KeyW") {
    if (selectedEditor && !showingWhere) {
      try {
        showingWhere = true;
        let sel = theEditors[selectedEditor].quill.getSelection();
        this.scrollToSelection();
        if (sel.length) {
          showingWhere = false;
        } else {
          let start = sel.index ? sel.index - 1 : sel.index;
          let length = 2;
          // take care of unicodes beyond #7fff -- as quill.format may break these
          let u1 =
            theEditors[selectedEditor].quill
              .getContents(start, 1)
              .ops[0].insert.charCodeAt(0) >= 32768;
          let u2 =
            theEditors[selectedEditor].quill
              .getContents(start + 1, 1)
              .ops[0].insert.charCodeAt(0) >= 32768;
          if (u1 && u2) {
            start -= 1;
            length += 2;
          } else {
            if (u1) {
              start -= 1;
              length += 1;
            } else if (u2) {
              length += 1;
            }
          }
          theEditors[selectedEditor].quill.formatText(
            start,
            length,
            "whereami",
            true,
          );
          setTimeout(() => {
            theEditors[selectedEditor].quill.formatText(
              start,
              length,
              "whereami",
              false,
            );
            showingWhere = false;
          }, 1000);
        }
      } catch (err) {
        showingWhere = false;
      }
    }
  }
}

/**
 * update after selection change
 *
 * @param {*} range
 * @param {String} id
 */
function updateSelection(range, id) {
  delete selectionChangeTimers[id];
  if (range) {
    selectedEditor = id;
    setStatusBar(id);

    // set basic format checkboxes
    let format = theEditors[id].quill.getFormat(range);
    $("#formatBold").prop("checked", "bold" in format);
    $("#formatItalic").prop("checked", "italic" in format);
    $("#formatUnderline").prop("checked", "underline" in format);
    $("#formatStrike").prop("checked", "strike" in format);

    // set format selector to paragraph format or none if no format or multiple formats
    let pos = 0;
    format = null;
    theEditors[id].quill
      .getText(range.index, range.length)
      .split("\n")
      .forEach((textlet) => {
        let paraFormat = UUID0; // standard
        Object.keys(
          theEditors[id].quill.getFormat(range.index + pos, textlet.length + 1),
        ).forEach((format) => {
          if (format.startsWith("format")) {
            paraFormat = format.slice(6);
          }
        });
        if (format == null) {
          format = paraFormat;
        } else {
          if (format != paraFormat) {
            format = "";
          }
        }
        pos += textlet.length + 1;
      });
    $("#formatSelector").val(format);
  } else {
  }
}

/**
 * update a changed text
 *
 * @param {String} id
 */
function updateText(id) {
  delete updateTextTimers[id];
  setStatusBar(id);
  ipcRenderer.invoke("mainProcess_updateText", [
    id,
    theEditors[id].quill.getContents().ops,
  ]);
}

/**
 * wait until all editors have been saved
 *
 * @returns {Promise}
 */
function allEditorsSaved() {
  return new Promise((resolve, reject) => {
    if (Object.keys(updateTextTimers).length == 0) {
      resolve("saved");
    } else {
      setTimeout(allEditorsSavedTimer, 250, resolve);
    }
  });
}

/**
 *
 * @param {*} resolve
 */
function allEditorsSavedTimer(resolve) {
  if (Object.keys(updateTextTimers).length == 0) {
    resolve("saved");
  } else {
    setTimeout(allEditorsSavedTimer, 250, resolve);
  }
}

/**
 *
 * @param {*} textID
 * @param {*} sel
 */
function paste(textID, sel) {
  navigator.clipboard.read().then((clipItems) => {
    for (let clipboardItem of clipItems) {
      if (
        clipboardItem.types.includes("image/png") ||
        clipboardItem.types.includes("image/jpeg")
      ) {
        for (let type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            clipboardItem.getType(type).then((image) => {
              let reader = new FileReader();
              reader.readAsDataURL(image);
              reader.onload = () => {
                theEditors[textID].quill.deleteText(sel.index, sel.length);
                theEditors[textID].quill.insertEmbed(
                  sel.index,
                  "image",
                  reader.result +
                    " " +
                    theSettings.imageWidth +
                    " " +
                    theSettings.imageHeight,
                );
                theEditors[textID].quill.formatText(sel.index, 1, {
                  title: "",
                  alignment: theSettings.imageAlignment,
                  shadow: theSettings.imageShadow,
                });
              };
            });
          }
        }
      } else {
        if (
          clipboardItem.types.includes("text/plain") ||
          clipboardItem.types.includes("text/html")
        ) {
          // document.execCommand("paste");
          navigator.clipboard.readText().then((clipText) => {
            theEditors[textID].quill.deleteText(sel.index, sel.length);
            theEditors[textID].quill.insertText(sel.index, clipText);
          });
        }
      }
    }
  });
}

/**
 * rebuild style sheet for formats to reflect current scaling and given opacity
 *
 * @param {Number} opacity 0...1
 */
function buildFormatSheet(opacity = 1.0) {
  $("#formatSheet").empty();
  if (!theSettings.firstLineIndentFormats) {
    // indent first line of all paragraphs, no matter of their format
    $("#formatSheet").append(
      `.ql-editor p + p { text-indent: var(--first-line-indent) }`,
    );
    $("#formatSheet").append(`.ql-editor p:has(> br) + p { text-indent: 0cm }`);
  } else {
    // indent first line of paragraphs, standard format, consecutive
    $("#formatSheet").append(
      `.ql-editor p:not([class]) + p:not([class]) { text-indent: var(--first-line-indent) }`,
    );
    $("#formatSheet").append(
      `.ql-editor p:not([class]):has(> br) + p:not([class]) { text-indent: 0cm }`,
    );
  }
  for (let [formatID, format] of Object.entries(theFormats)) {
    $("#formatSheet").append(
      `.edi ${Formats.toCSS(formatID, format, opacity, Util.scaledZoom($("#zoomSelector").val()))}`,
    );
    if (theSettings.firstLineIndentFormats) {
      // indent first line of paragraphs, specific format, consecutive
      $("#formatSheet").append(
        `.ql-editor p.format${formatID}-true + p.format${formatID}-true { text-indent: var(--first-line-indent) }`,
      );
      $("#formatSheet").append(
        `.ql-editor p.format${formatID}-true:has(> br) + p.format${formatID}-true { text-indent: 0cm }`,
      );
    }
    if (theSettings.previewFormats) {
      $("#formatSheet").append(
        `${
          formatID == UUID0
            ? `#formatSelector option { `
            : `#formatSelector .format${formatID} {`
        } ${Formats.toPreviewCSS(format)}}\n`,
      );
    }
  }
  // zoom is non standard - https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
  // but yet best way to scale images (transform:scale is not suitable)
  $("#formatSheet").append(
    `.edi img { opacity:${opacity}; zoom:${Util.scaledZoom($("#zoomSelector").val())}% }`,
  );
}

/**
 * rebuild style sheet for objects
 */
function buildObjectSheet() {
  $("#objectSheet").empty();
  if (theSettings.focusEditorObjects) {
    buildFormatSheet(
      $("#showObjectStyles").prop("checked")
        ? 1.0
        : $("#textOpacitySelector").val() / 100,
    );
    Object.keys(theObjects).forEach((object) => {
      if (theObjects[object].checked) {
        if ($("#showObjectStyles").prop("checked")) {
          $("#objectSheet").append(
            `.object${object}-true { ${new StyledObject(
              object,
              undefined,
              undefined,
              theObjects[object].style,
            ).toCSS(
              "text",
              false,
              Util.scaledZoom($("#zoomSelector").val()),
            )} }\n`,
          );
          $("#objectSheet").append(
            `.object${object}-true img { ${new StyledObject(
              object,
              undefined,
              undefined,
              theObjects[object].style,
            ).toCSS("image")} }\n`,
          );
          if (
            theSettings.selectionObjectColor &&
            theSettings.selectionCheckedObjects
          ) {
            $("#objectSheet").append(
              `.object${object}-true::selection, .object${object}-true img::selection { background:${theSettings.selectionObjectColor}; color: ${Util.blackOrWhite(theSettings.selectionObjectColor)} }\n`,
            );
          }
        } else {
          $("#objectSheet").append(
            `.object${object}-true { --alpha:1;color:rgba(var(--rgb),var(--alpha)); }\n`,
          );
          $("#objectSheet").append(
            `span.object${object}-true img { opacity:1.0 }\n`,
          );
          if (
            theSettings.selectionObjectColor &&
            theSettings.selectionUnstyledObjects &&
            theSettings.selectionCheckedObjects
          ) {
            $("#objectSheet").append(
              `.object${object}-true::selection, .object${object}-true img::selection { background:${theSettings.selectionObjectColor}; color: ${Util.blackOrWhite(theSettings.selectionObjectColor)} }\n`,
            );
          }
        }
      }
    });
    if (
      theSettings.selectionObjectColor &&
      ($("#showObjectStyles").prop("checked") ||
        theSettings.selectionUnstyledObjects) &&
      !theSettings.selectionCheckedObjects
    ) {
      $("#objectSheet").append(
        `span[class^=object]::selection, span[class^=object] img::selection { background:${theSettings.selectionObjectColor}; color: ${Util.blackOrWhite(theSettings.selectionObjectColor)} }\n`,
      );
    }
  }
}

/**
 * change zoom
 *
 * @param {*} event
 */
function doZoom(event) {
  if (wheelTimer) {
    clearTimeout(wheelTimer);
  }
  wheelTimer = setTimeout(() => {
    isWheeling = false;
    isZooming = false;
  }, 100);
  if (!isWheeling) {
    isWheeling = true;
    isZooming = event.ctrlKey;
  }
  if (isZooming) {
    event.preventDefault();
    let scale = parseInt($("#zoomSelector").val());
    scale -= event.deltaY;
    if (scale < 0) {
      scale = 0;
    }
    if (scale > 160) {
      scale = 160;
    }
    $("#zoomSelector").val(scale);
    $("#zoomValue").html(Util.scaledZoom($("#zoomSelector").val()) + "%");
    $(":root").css({
      "--first-line-indent": `${
        (theSettings.firstLineIndent *
          Util.scaledZoom($("#zoomSelector").val())) /
        100
      }px`,
    });
    buildFormatSheet();
    buildObjectSheet();
  }
}

/**
 * fill status bar with infos of the text with given id
 *
 * @param {String} textID
 */
function setStatusBar(textID) {
  if (textID) {
    $(".SBseparator").css("visibility", "visible");
    $("#SBtext").html(
      `<span style="padding-left:5px;">${_("editorBars_textPath", {
        value: theSettings.textPath
          ? theEditors[textID].path
          : Util.escapeHTML(theEditors[textID].name),
      })}</span>`,
    );
    let totalWords = 0;
    let totalChars = 0;
    let totalObjects = {};
    let texts = 0;
    let diffChars = 0;
    let diffWords = 0;
    Object.keys(theEditors).forEach((id) => {
      let [charCount, wordCount, objects] = StyledText.countCharsWordsObjects(
        theEditors[id].quill.getContents().ops,
      );
      texts++;
      totalWords += wordCount;
      totalChars += charCount;
      objects.forEach((id) => {
        totalObjects[id]++;
      });
      diffChars += charCount - theEditors[id].chars;
      diffWords += wordCount - theEditors[id].words;
    });

    if (texts > 1) {
      $("#SBtotalcounts").html(
        `<span style="display:inline-block; padding-left:7px; padding-right:7px;">${_(
          "editorBars_textLength",
          {
            sep: "+",
            words: totalWords.toLocaleString(theLanguage),
            characters: totalChars.toLocaleString(theLanguage),
            objects:
              Object.keys(totalObjects).length.toLocaleString(theLanguage),
          },
        )}</span>`,
      );
      $("#SBtotalcounts").attr(
        "title",
        _("distractionFreeWindow_progress", {
          chars: diffChars.toLocaleString(theLanguage, {
            signDisplay: "always",
          }),
          words: diffWords.toLocaleString(theLanguage, {
            signDisplay: "always",
          }),
        }),
      );
    } else {
      $("#SBtotalcounts").html("&nbsp;&nbsp;&nbsp;");
      $("#SBtotalcounts").attr("title", "");
    }
    let [charCount, wordCount, objects] = StyledText.countCharsWordsObjects(
      theEditors[textID].quill.getContents().ops,
    );
    $("#SBcounts").html(
      `<span style="display:inline-block; padding-left:7px; padding-right:7px;">${_(
        "editorBars_textLength",
        {
          sep: "&ndash;",
          words: wordCount.toLocaleString(theLanguage),
          characters: charCount.toLocaleString(theLanguage),
          objects: objects.length.toLocaleString(theLanguage),
          dChars: (charCount - theEditors[textID].chars).toLocaleString(
            theLanguage,
            { signDisplay: "always" },
          ),
          dWords: (wordCount - theEditors[textID].words).toLocaleString(
            theLanguage,
            { signDisplay: "always" },
          ),
        },
      )}</span>`,
    );
    $("#SBcounts").attr(
      "title",
      _("distractionFreeWindow_progress", {
        chars: (charCount - theEditors[textID].chars).toLocaleString(
          theLanguage,
          { signDisplay: "always" },
        ),
        words: (wordCount - theEditors[textID].words).toLocaleString(
          theLanguage,
          { signDisplay: "always" },
        ),
      }),
    );
  }
}

/**
 * show (activated) object names in status bar
 *
 * @param {Boolean} isClick true if causing event was a click, false on mouseenter
 * @param {String} classes
 */
function statusBarObjects(isClick, classes) {
  if (
    (isClick && theSettings.objectsOnClick) ||
    (!isClick && theSettings.objectsOnOver)
  ) {
    let objects = [];
    classes.split(" ").forEach((cls) => {
      let m = cls.match(/^object(.*)-true$/);
      if (m && m[1] in theObjects && theObjects[m[1]].checked) {
        objects.push(theObjects[m[1]].name);
      }
    });
    if (objects.length) {
      if (objectStatusTimer) clearTimeout(objectStatusTimer);
      $("#SB").show();
      $("#SB").css("display", "grid");
      $("#SBObjects")
        .css("display", "block")
        .html(objects.join(" &nbsp;&bull;&nbsp; "));
      $("#SBOverlay").hide();
      objectStatusTimer = setTimeout(() => {
        $("#SBObjects").css("display", "none");
        $("#SBOverlay").hide();
        $("#SB").hide();
        $("#SBOverlay").show();
      }, theSettings.objectsShowTime * 1000);
    }
  }
}

/**
 * insert symbol at cursor position
 *
 * @param {String} code hex value of symbol
 */
ipcRenderer.on("rendererProcess_insertSymbol", (event, code) => {
  if (selectedEditor) {
    let range = theEditors[selectedEditor].quill.getSelection();
    if (range.length) {
      theEditors[selectedEditor].quill.deleteText(range.index, range.length);
    }
    theEditors[selectedEditor].quill.insertText(
      range.index,
      String.fromCodePoint(parseInt(code, 16)),
    );
  }
});

/**
 * set image parameters
 */
ipcRenderer.on(
  "distractionFreeWindow_saveImage",
  (event, [id, index, width, height, title, alignment, shadow]) => {
    theEditors[id].quill.formatText(index, 1, {
      width: width,
      height: height,
      title: title,
      alignment: alignment,
      shadow: shadow,
    });
  },
);

// search related functions

/**
 * check if search text is valid (either not regex mode or valid regex expression)
 *
 * @returns {Boolean} true if search text is a well formed rexep
 */
function checkSearchRegex() {
  $("#searchText").css("background-color", "#00000000");
  $("#searchText").parent().parent().removeAttr("title");
  if ($("#searchRegex").prop("checked")) {
    try {
      RegExp(Util.escapeRegExpSearch($("#searchText").val()));
      return true;
    } catch (err) {
      $("#searchText").css("background-color", "#ff000040");
      $("#searchText")
        .parent()
        .parent()
        .attr("title", _("editorBars_regexError"));
      $("#searchCount").text(_("editorBars_noSearchResults"));
      return false;
    }
  }
  return true;
}

/**
 * set search ui elements according to result of next search position
 */
function adjustSearch() {
  if (doAdjustSearch) {
    $("#searchCount").text(_("editorBars_noSearchResults"));
    $("#searchPrev").prop("disabled", true);
    $("#searchNext").prop("disabled", true);
    $("#replaceNext").prop("disabled", true);
    $("#replaceAll").prop("disabled", true);
    if ($("#searchText").val() != "") {
      findSearchPositions(
        $("#searchText").val(),
        $("#searchCase").prop("checked"),
        $("#searchWord").prop("checked"),
        $("#searchRegex").prop("checked"),
      );
      $("#searchCount").text(`?/${countSearchPositions()}`);
      $("#searchPrev").prop("disabled", false);
      $("#searchNext").prop("disabled", false);
      $("#replaceNext").prop("disabled", false);
      $("#replaceAll").prop("disabled", false);
    }
  }
}

/**
 * count search positions
 *
 * @param {Boolean} skipLocked if to omit locked texts from counting
 * @returns
 */
function countSearchPositions(skipLocked = false) {
  let count = 0;
  for (let [id, positions] of Object.entries(searchPositions)) {
    if (!skipLocked || theEditors[id].editable) {
      count += positions.length;
    }
  }
  return count;
}

/**
 * find search positions -- this refills searchPositions and is called whenever the search parameters or the Editor changes
 *
 * @param {String} searchFor
 * @param {Boolean} doCase
 * @param {Boolean} doWord
 * @param {Boolean} doRegex
 */
function findSearchPositions(searchFor, doCase, doWord, doRegex) {
  let rex = RegExp(
    `${doWord ? "(^|\\P{L})(" : ""}${
      doRegex
        ? Util.escapeRegExpSearch(searchFor)
        : Util.escapeRegExp(searchFor)
    }${doWord ? ")\\P{L}" : ""}`,
    `udg${doCase ? "" : "i"}`,
  );
  let res;
  searchPositions = {};
  theIDs.forEach((editorID) => {
    searchPositions[editorID] = [];
    let textlets = [];
    let textlet = "";
    theEditors[editorID].quill.getContents().ops.forEach((op) => {
      if (typeof op.insert == "string") {
        textlet += op.insert;
      } else {
        textlets.push(textlet);
        textlet = "";
      }
    });
    textlets.push(textlet);
    let start = 0;
    textlets.forEach((text) => {
      rex.lastIndex = 0;
      while ((res = rex.exec(text))) {
        searchPositions[editorID].push({
          index: doWord ? res.indices[2][0] + start : res.index + start,
          length: doWord
            ? res.indices[2][1] - res.indices[2][0]
            : res[0].length,
        });
        rex.lastIndex = res.index + 1;
      }
      start += text.length + 1; // +1 for the image
    });
  });
}

/**
 * get index of a search position
 *
 * @param {String} editorID
 * @param {*} found
 * @returns {Number}
 */
function getSearchPosition(editorID, found) {
  let index = 0;
  for (let i = 0; i < theIDs.length; i++) {
    if (theIDs[i] != editorID) {
      index += searchPositions[theIDs[i]].length;
    } else {
      return index + searchPositions[theIDs[i]].indexOf(found) + 1;
    }
  }
  return 0;
}

/**
 * do a search (i.e. advance to next or prev position based on searchPositions)
 *
 * @param {Boolean} goDown
 * @param {Boolean} overlapSelection
 */
function search(goDown = true, overlapSelection = true) {
  if (theIDs.length) {
    let editorIndex = 0;
    if (selectedEditor) {
      while (theIDs[editorIndex] != selectedEditor) {
        editorIndex++;
      }
    }
    let quill = theEditors[theIDs[editorIndex]].quill;
    let selection = quill.getSelection();
    if (!selection) {
      selection = { index: 0, length: 0 };
    }
    let found = null;
    while (!found) {
      if (goDown) {
        let i = 0;
        let selPos =
          selection.index +
          (selection.length ? (overlapSelection ? 1 : selection.length) : 0);
        let ediPos = searchPositions[theIDs[editorIndex]];
        for (; i < ediPos.length && ediPos[i].index < selPos; i++) {}
        if (i >= ediPos.length) {
          // next editor
          editorIndex++;
          if (editorIndex >= theIDs.length) {
            editorIndex = 0;
          }
          selection = { index: 0, length: 0 };
        } else {
          found = ediPos[i];
        }
      }
      // go up
      else {
        let ediPos = searchPositions[theIDs[editorIndex]];
        let i = ediPos.length - 1;
        for (; i >= 0 && ediPos[i].index >= selection.index; i--) {}
        if (i < 0) {
          // prev editor
          editorIndex--;
          if (editorIndex < 0) {
            editorIndex = theIDs.length - 1;
          }
          selection = {
            index: theEditors[theIDs[editorIndex]].quill.getText().length,
            length: 0,
          };
        } else {
          found = ediPos[i];
        }
      }
    }
    // found it
    theEditors[theIDs[editorIndex]].quill.setSelection(
      found.index,
      found.length,
    );
    this.scrollToSelection();
    // setTimeout(()=>{this.#selectedEditor = this.#ids[editorIndex];},250);
    $("#searchCount").html(
      `${getSearchPosition(
        theIDs[editorIndex],
        found,
      )}/${countSearchPositions()}`,
    );
  }
}

/**
 * replace next position
 */
function replaceNext() {
  if (theIDs.length) {
    let editorIndex = 0;
    if (selectedEditor) {
      while (theIDs[editorIndex] != selectedEditor) {
        editorIndex++;
      }
    }
    let quill = theEditors[theIDs[editorIndex]].quill;
    let selection = quill.getSelection();
    let mustSearch = true;
    if (selection) {
      let pos = searchPositions[theIDs[editorIndex]];
      for (let i = 0; i < pos.length && pos[i].index <= selection.index; i++) {
        if (
          pos[i].index == selection.index &&
          pos[i].length == selection.length
        ) {
          mustSearch = false;
        }
      }
    }
    if (mustSearch) {
      search();
    } else {
      let promiseBeforeReplace = new Promise((resolve) => resolve());
      if (theSettings.replaceBlinkBefore) {
        promiseBeforeReplace = blinkSelection(
          quill,
          selection.index,
          selection.length,
          theSettings.replaceBlinkBefore,
          theSettings.replaceBlinkTime,
        );
      }
      promiseBeforeReplace.then(() => {
        // source "user" prevents changes in locked texts
        quill.deleteText(selection.index, selection.length, "user");
        if ($("#replaceText").val()) {
          // source "user" prevents changes in locked texts
          let delta = quill.insertText(
            selection.index,
            $("#replaceText").val(),
            "user",
          );
          if (delta.ops.length) {
            quill.setSelection(selection.index, $("#replaceText").val().length);
            let promiseAfterReplace = new Promise((resolve) => resolve());
            if (theSettings.replaceBlinkAfter) {
              promiseAfterReplace = blinkSelection(
                quill,
                selection.index,
                $("#replaceText").val().length,
                theSettings.replaceBlinkAfter,
                theSettings.replaceBlinkTime,
              );
            }
            // finally do a non overlapping search, so that if e.g. "xx" is
            // replaced by "xxx", the search doesn't end in the replaced text
            promiseAfterReplace.then(() => {
              adjustSearch();
              search(true, false);
            });
          } else {
            adjustSearch();
            search(true, false);
          }
        }
      });
    }
  }
}

/**
 * replace all found positions (in non-locked texts)
 */
function replaceAll() {
  ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
  doAdjustSearch = false;
  theIDs.forEach((editorID) => {
    if (theEditors[editorID].editable) {
      let ops = [];
      let pos = 0;
      let quill = theEditors[editorID].quill;
      searchPositions[editorID].forEach((position) => {
        if (position.index - pos >= 0) {
          let format = quill.getFormat(position.index, position.length);
          if (position.index - pos > 0) {
            ops.push({ retain: position.index - pos });
          }
          ops.push({ delete: position.length });
          ops.push({ insert: $("#replaceText").val(), attributes: format });
          pos = position.index + position.length;
        }
      });
      quill.updateContents(new Delta(ops));
    }
  });
  ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
  allEditorsSaved().then(() => {
    doAdjustSearch = true;
    adjustSearch();
  });
}

/**
 * scroll the current editor selection into view
 *
 * @param {Number} verticalShift determines if scrolling is
 * - top of selection to top of viewport (0.0)
 * - bottom of selection to bottom of viewport (1.0)
 * - center of selection to center of viewport (0.5)
 * - or anything inbetween
 */
function scrollToSelection(verticalShift = 0.5) {
  if (selectedEditor) {
    if (verticalShift < 0.0) {
      verticalShift = 0.0;
    }
    if (verticalShift > 1.0) {
      verticalShift = 1.0;
    }
    let selection = theEditors[selectedEditor].quill.getSelection();
    if (selection) {
      let bounds = theEditors[selectedEditor].quill.getBounds(selection);
      let i = 0;
      let top = 0;
      // add heights of editors that come before the editor the selection is in
      while (theIDs[i] != selectedEditor) {
        top += $(`#edi${theIDs[i]}`).height();
        i += 1;
        top -=
          $(`#edi${theIDs[i]} .ql-editor`).height() -
          $(`#edi${theIDs[i]}`).height();
      }
      // if height of selection exceeds viewport height, scroll top of selection to top of viewport
      if (bounds.height >= $("#editor").height()) {
        verticalShift = 0.0;
      }
      let scrollTo = Math.round(
        bounds.top +
          top -
          verticalShift * ($("#editor").height() - bounds.height),
      );
      if (scrollTo < 0) {
        scrollTo = 0;
      }
      $("#editor").scrollTop(scrollTo);
    }
  }
}

/**
 * let an editor selection blink (unselect/reselect) for some time
 *
 * @param {*} quill
 * @param {*} from
 * @param {*} to
 * @param {*} times
 * @param {*} time
 * @returns {Promise}
 */
function blinkSelection(quill, from, to, times, time) {
  return new Promise((resolve) => {
    let promises = [];
    for (let i = 1; i <= times; i++) {
      promises.push(
        new Promise((resolve) =>
          setTimeout(() => {
            quill.setSelection(0, 0);
            resolve();
          }, time * i),
        ),
      );
      promises.push(
        new Promise((resolve) =>
          setTimeout(
            () => {
              quill.setSelection(from, to);
              resolve();
            },
            time * i + time / 2,
          ),
        ),
      );
    }
    Promise.allSettled(promises).then(() => resolve());
  });
}

/**
 * (de)activate a sound
 *
 * @param {String} name name of the sound
 */
function soundOnOff(name) {
  if (name in playingSounds) {
    name in sounds && sounds[name].pause();
    delete playingSounds[name];
    $(`#${name}Volume`).prop("disabled", true);
  } else {
    name in sounds && sounds[name].play();
    playingSounds[name] = true;
    $(`#${name}Volume`).prop("disabled", false);
  }
}

/**
 *
 */
function pauseSounds() {
  if ($("#pauseSounds").prop("checked")) {
    Sounds.backgroundSounds.forEach((sound) => {
      $(`#${sound.name}OnOff`).prop("disabled", false);
      if (sound.name in playingSounds) {
        $(`#${sound.name}Volume`).prop("disabled", false);
        sound.name in sounds && sounds[sound.name].play();
      }
    });
  } else {
    Sounds.backgroundSounds.forEach((sound) => {
      $(`#${sound.name}OnOff`).prop("disabled", true);
      $(`#${sound.name}Volume`).prop("disabled", true);
      if (sound.name in playingSounds) {
        sound.name in sounds && sounds[sound.name].pause();
      }
    });
  }
}

/**
 * set the volume of a sound
 *
 * @param {String} name sound name
 * @param {Number} volume 0...1
 */
function setVolume(name, volume = 1.0) {
  if (name in sounds) {
    sounds[name].volume = (volume * $(`#${name}Volume`).val()) / 100;
  }
}
