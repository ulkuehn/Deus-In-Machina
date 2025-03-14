/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of object window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/objectWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

const rowGap = "15px";
const colGap = "10px";

let theStyledObject;
let theParentObjects;
let theInheritedStyle;
let theSettings;
let $popup;
let theScheme;
let theFonts;
let theFiles;
let originalDecoration;
let originalScheme;
let originalProperties;
let originalStyleProperties;
let theStandardFormat;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Object[]} object StyledObject in serialized form
 * @param {Object[][]} parents parents of object as StyledObjects in serialized form
 * @param {Object} nonSiblings parents and children of object as recursive structure {id:[...]}
 * @param {String} path the object's path as html
 * @param {Object[]} objects sorted list of {id:String, depth:Number, name:String}
 * @param {Object[]} texts list of text ids that are checked in the text tree
 * @param {Object} references mapping of text ids to references of this object
 * @param {Object} formats all existing paragraph formats
 * @param {String[]} fonts list of font names
 * @param {Object} files mapping of file ids to file properties
 */
ipcRenderer.on(
  "objectWindow_init",
  (
    event,
    [
      settings,
      object,
      parents,
      nonSiblings,
      path,
      objects,
      texts,
      references,
      formats,
      fonts,
      files,
    ],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "objectWindow_init",
      { settings },
      { object },
      { parents },
      { nonSiblings },
      { path },
      { objects },
      { texts },
      { references },
      { formats },
      { fonts },
      { files },
    ]);
    theSettings = settings;
    theLanguage = settings.language;
    theFiles = files;
    theStandardFormat = formats[UUID0];
    theFonts = new Fonts(fonts);
    theFonts.loadStandardFonts("..");

    theStyledObject = new StyledObject(...object);

    originalDecoration = JSON.parse(JSON.stringify(theStyledObject.decoration));
    originalProperties = JSON.parse(JSON.stringify(theStyledObject.properties));
    originalScheme = JSON.parse(JSON.stringify(theStyledObject.scheme));
    originalStyleProperties = JSON.parse(
      JSON.stringify(theStyledObject.styleProperties),
    );
    theParentObjects = parents.map((p) => new StyledObject(...p));

    // calculate inherited style from root downwards
    theInheritedStyle = StylingControls.nullStyle();
    theParentObjects.map((o) => theInheritedStyle.addStyleProperties(o));

    // tabs
    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });

    // info tab
    Util.addTab(
      $tabs,
      $content,
      true,
      "infoTab",
      _("objectWindow_infoTab"),
      infoTab(path),
    );

    // style tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "styleTab",
      _("objectWindow_styleTab"),
      styleTab(
        theInheritedStyle,
        new StyledObject()
          .addStyleProperties(theInheritedStyle)
          .addStyleProperties(theStyledObject),
        formats[UUID0],
        fonts,
      ),
    );

    // quotes tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "quotesTab",
      _("objectWindow_quotesTab"),
      `<table id="quotes" class="display" width="100%"></table>`,
    );

    // overwiew tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "overviewTab",
      _("objectWindow_overviewTab"),
      "",
    );

    // properties tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "propertiesTab",
      _("objectWindow_propertiesTab"),
      $("<div>").attr({
        id: "propertiesGrid",
        style: `display:grid; column-gap:${colGap}; row-gap:${rowGap}; grid-template-columns: 1fr 50px 3fr 80px`,
      }),
    );

    // scheme tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "schemeTab",
      _("objectWindow_schemeTab"),
      $("<div>").attr({
        id: "schemeGrid",
        style: `display:grid; column-gap:${colGap}; row-gap:${rowGap}; grid-template-columns: max-content auto max-content max-content`,
      }),
    );

    // icon popup div
    $popup = $("<div>").attr({
      style:
        "background-color:#ffffff; border:double black 4px; padding:10px; position:absolute; z-index:10; display:none;",
    });

    // // create an in essence invisible div that uses all fonts to preload them, thus making the font select open faster
    // let $invisible = $("<div>").attr({
    //   style: "position:absolute;top:0px;left:0px;user-select:none;z-index:-1;",
    // });
    // fonts.forEach((font) => {
    //   $invisible.append(
    //     `<span style="font-family:'${font}'; font-size:16px; color:var(--background-color)">x</span> `,
    //   );
    // });

    $(":root").css({
      "--first-line-indent": `${settings.firstLineIndent}px`,
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
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content)
      .append($popup);

    // initialize tabs
    Util.initTabs();

    // setTimeout(() => {
    //   $("body").append($invisible);
    //   $("document").ready(() => {
    //     _ready = performance.now();
    //   });
    // }, 100);

    // quotes table
    let quoteList = [];
    let index = 0;
    if (references.length) {
      texts.forEach((text) => {
        index++;
        let pre = "";
        let post = "";
        if (settings.objectsHighlightCheckedTexts && text.checked) {
          pre = "<b>";
          post = "</b>";
        }
        references[0].references.forEach((reference) => {
          if (reference.text == text.id) {
            reference.citations.forEach((c) => {
              quoteList.push([
                pre + Util.escapeHTML(text.name) + post,
                pre +
                  c.parts
                    .map((part) =>
                      part.html ? part.text : Util.escapeHTML(part.text),
                    )
                    .join("") +
                  post,
                index,
                c.pos,
              ]);
            });
          }
        });
      });
    }

    $("#quotes").DataTable({
      data: quoteList,
      language: {
        info: _("dataTables_info"),
        infoEmpty: _("dataTables_empty"),
        emptyTable: _("objectReferences_empty"),
        zeroRecords: _("objectReferences_empty"),
        infoFiltered: _("dataTables_filtered"),
        paginate: {
          first: _("dataTables_firstPage"),
          previous: _("dataTables_previousPage"),
          last: _("dataTables_lastPage"),
          next: _("dataTables_nextPage"),
        },
        lengthMenu: _("dataTables_lengthMenu"),
        search: _("objectReferences_search"),
      },
      pagingType: "full_numbers",
      pageLength: 10,
      lengthMenu: [
        [5, 10, 25, -1],
        [5, 10, 25, _("dataTables_lengthAll")],
      ],
      autoWidth: false,
      order: [[1, "asc"]],
      columns: [
        {
          title: _("objectReferences_text"),
          width: "25%",
          searchable: false,
          orderable: false,
        },
        {
          title: _("objectReferences_quote"),
          className: "preWrap",
          orderData: 2,
          orderData: [2, 3, 1], // the "1" is needed not for sorting proper but to use the sorting icons on column 1, see https://datatables.net/forums/discussion/64064
        },
        { type: "num", visible: false },
        { type: "num", visible: false },
      ],
    });
    // adapt data tables input style
    $(".dt-length .dt-input").css("margin-right", "5px");
    $(".dt-length .dt-input").addClass("form-select-sm");
    $(".dt-length .dt-input").removeClass("dt-input");
    $(".dt-search .dt-input").css({
      background: "#ffffff",
      height: "32px",
    });

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

    fillForm(theStyledObject, theInheritedStyle, formats[UUID0]);

    theScheme = new Scheme(
      settings,
      theStyledObject.id,
      theStyledObject.properties,
      theParentObjects.map((o) => ({
        id: o.id,
        name: o.name,
        scheme: o.scheme,
      })),
      theStyledObject.scheme,
      fonts,
      formats,
      files,
    );

    let buttonHTML = `<div style="display:flex; justify-content:flex-end"><div><button type="button" class="btn btn-primary" onclick="saveObject();closeWindow()">${_(
      "general_saveButton",
    )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
      "general_cancelButton",
    )}</button></div></div>`;
    theScheme.fillScheme($("#schemeGrid"), buttonHTML);
    theScheme.fillProperties(objects, $("#propertiesGrid"), buttonHTML);

    fillOverview(nonSiblings, objects, files);

    // tab switching events
    $(".nav-pills a[href='#propertiesTab']")[0].addEventListener(
      "hide.bs.tab",
      (event) => {
        theScheme.saveProperties($("#propertiesGrid"));
      },
    );
    // when switching to overview or properties, save scheme and wait until tab is shown before filling in props (maps need this)
    $(".nav-pills a[href='#overviewTab']")[0].addEventListener(
      "shown.bs.tab",
      (event) => {
        theScheme.saveItems($("#schemeGrid"));
        theScheme.fillProperties(objects, $("#propertiesGrid"), buttonHTML);
        fillOverview(nonSiblings, objects, files);
      },
    );
    $(".nav-pills a[href='#propertiesTab']")[0].addEventListener(
      "shown.bs.tab",
      (event) => {
        theScheme.saveItems($("#schemeGrid"));
        theScheme.fillProperties(objects, $("#propertiesGrid"), buttonHTML);
      },
    );
  },
);

/**
 * content of info tab
 *
 * @param {String} path html representing the object's hierarchy path
 * @returns {Object} jquery grid
 */
function infoTab(path) {
  let $grid = $("<div>").attr({
    style: `display:grid; column-gap:${colGap}; row-gap:${rowGap}; grid-template-columns: 50px max-content 50px`,
  });

  // appearance
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("objectWindow_appearance")),
  );
  // name
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 1; justify-self:center; align-self:center; align-self:center;",
      })
      .html('<i class="fas fa-quote-right fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("objectWindow_name")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:3/span 2; justify-self:start; align-self:center; width:100%",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" id="objectName" style="width:100%" value="${Util.escapeHTML(
          theStyledObject.name,
        )}">`,
      ),
  );
  // style
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fas fa-paintbrush fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center",
      })
      .html(_("decoration_textStyle")),
  );
  let html = "";
  for (let [mod, tags] of Object.entries(TreeDecoration.modTags)) {
    html += `<span style="margin-right:20px;"><input id="${mod}" class="form-check-input" type="checkbox"${
      theStyledObject.decoration[mod] ? " checked" : ""
    }> ${tags[0]}${_(mod)}${tags[1]}</span>`;
  }
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:3/span 2; justify-self:start; align-self:center;`,
      })
      .html(html),
  );
  // icon
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:1/span 1; place-self:center center; margin-bottom:-${rowGap};`,
      })
      .html('<i class="fa-solid fa-icons fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:2/span 1; justify-self:start; align-self:center; margin-bottom:-${rowGap};`,
      })
      .html(_("decoration_icon")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:3/span 1; place-self:center start; margin-bottom:-${rowGap};`,
      })
      .html(
        `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="iconSwitch" onchange="showIcons();" ${
          theStyledObject.getDecorationValue("icon") ? "checked" : ""
        }></div>`,
      ),
  );
  html = `<span style="margin-left:30px">${_(
    "decoration_iconOverlay",
  )}</span> <select id="iconStack" class="form-select form-select-sm" style="display:unset; width:unset">`;
  TreeDecoration.stackIcons.forEach((stack) => {
    html += `<option value="${stack}"${
      theStyledObject.getDecorationValue("stack") == stack ? " selected" : ""
    }>${_(stack)}</option>`;
  });
  html += "</select>";
  $grid.append(
    $("<div>")
      .attr({
        id: "iconSpecs",
        style: `grid-column:4/span 1; place-self:center end; margin-bottom:-${rowGap}; visibility:${
          theStyledObject.getDecorationValue("icon") ? "visible" : "hidden"
        }`,
      })
      .html(
        `${_(
          "decoration_iconColor",
        )} <input class="colorPicker" id="iconColor" value="${theStyledObject.getDecorationValue(
          "iconColor",
        )}">` +
          html +
          `<span style="margin-left:30px">${_(
            "decoration_overlayColor",
          )}</span> <input class="colorPicker" id="stackColor" value="${theStyledObject.getDecorationValue(
            "stackColor",
          )}">`,
      ),
  );
  html = `<div id="icons" style="margin-top:10px; max-height:200px; overflow-y:auto; border:1px dotted; padding:10px; display:${
    theStyledObject.getDecorationValue("icon") ? "block" : "none"
  }">`;
  TreeDecoration.treeItemIcons.forEach((icon) => {
    if (!icon) {
      html += "<br>";
    } else {
      html +=
        '<div class="form-check form-check-inline" style="width:50px;"><input class="form-check-input" type="radio" name="iconsRadio" id="icons_' +
        icon +
        '" value="' +
        icon +
        '"' +
        (icon == theStyledObject.getDecorationValue("iconName")
          ? "checked"
          : "") +
        '><label class="form-check-label" for="icons_' +
        icon +
        '" onmouseover="iconPopup(this,\'' +
        icon +
        '\')" onmouseout="iconPopdown()"><i class="fa-solid fa-' +
        icon +
        '"></i></label></div>';
    }
  });
  html += "</div>";
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(html),
  );

  // infos
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch",
        class: "section-header",
      })
      .html(_("objectWindow_infos")),
  );
  // path
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 1; justify-self:center; align-self:center; align-self:center;",
      })
      .html('<i class="fa-solid fa-bars-staggered fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("objectWindow_path")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(path),
  );
  // created
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 1; justify-self:center; align-self:center; align-self:center;",
      })
      .html('<i class="fas fa-calendar-plus fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("objectWindow_created")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        theStyledObject.created.toLocalString(theSettings.dateTimeFormatLong) +
          " (" +
          _("time_timePassed", {
            time: theStyledObject.created.timeToNow(),
          }) +
          ")",
      ),
  );
  // changed
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 1; justify-self:center; align-self:center; align-self:center;",
      })
      .html('<i class="fas fa-calendar-check fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("objectWindow_changed")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        theStyledObject.changed.toLocalString(theSettings.dateTimeFormatLong) +
          " (" +
          _("time_timePassed", {
            time: theStyledObject.changed.timeToNow(),
          }) +
          ")",
      ),
  );

  // buttons
  if (theSettings.closingType != "settingsWindow_closeByX") {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 4; justify-self:end;",
        })
        .html(
          `<div style="display:flex; justify-content:flex-end"><div><button type="button" class="btn btn-primary" onclick="saveObject();closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></div></div>`,
        ),
    );
  }

  return $grid;
}

/**
 * style tab contents
 *
 * @param {StyledObject} inheritedStyle
 * @param {StyledObject} effectiveStyle
 * @param {Object} standardFormat properties of standard format
 * @param {String[]} fonts list of font names
 *
 * @returns {Object} jquery grid
 */
function styleTab(inheritedStyle, effectiveStyle, standardFormat, fonts) {
  console.log("styleTab", inheritedStyle, effectiveStyle, standardFormat);
  let textSample = theSettings.objectsTextSample || _("sampleTexts_medium");
  textSample = `<img style="display:block; margin:0px auto" src="${DIMImage.sampleImage}">${textSample.replace(/\n/g, "<br>")}&nbsp;<img style="display:inline; vertical-align:baseline" src="${DIMImage.sampleImage}">`;

  let $grid = $("<div>").attr({
    style: `display:grid; row-gap:${rowGap}; column-gap:${colGap}; grid-template-columns:max-content 200px auto 100px`,
  });

  // styles
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch",
        class: "section-header",
      })
      .html(_("objectWindow_styles")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(_("objectWindow_inheritedStyle")),
  );
  $grid.append(
    $("<div>")
      .attr({
        class: "form-control",
        style:
          "grid-column:2/span 3; justify-self:start; word-break:break-all; border:1px dotted; overflow-y:scroll; overflow-x:hidden; width:100%; height:150px; padding:5px; resize:vertical",
        contenteditable: true,
        spellcheck: false,
      })
      .append($(`<p class="inheritedStyle">`).html(textSample)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(_("objectWindow_effectiveStyle")),
  );
  $grid.append(
    $("<div>")
      .attr({
        class: "form-control",
        style:
          "grid-column:2/span 3; justify-self:start; word-break:break-all; border:1px dotted; overflow-y:scroll; overflow-x:hidden; width:100%; height:150px; padding:5px; resize:vertical",
        contenteditable: true,
        spellcheck: false,
      })
      .append($(`<p class="sampleStyle">`).html(textSample)),
  );

  $("#sampleSheet")
    .empty()
    .append(
      `.inheritedStyle {${Formats.formatToCSS(standardFormat)}; ${inheritedStyle.toCSS("text")}}\n`,
    )
    .append(
      `.inheritedStyle img {${Formats.formatToCSS(standardFormat)}; ${inheritedStyle.toCSS("image")}}\n`,
    )
    .append(
      `.sampleStyle {${Formats.formatToCSS(standardFormat)}; ${effectiveStyle.toCSS("text")}}\n`,
    )
    .append(
      `.sampleStyle img {${Formats.formatToCSS(standardFormat)}; ${effectiveStyle.toCSS("image")}}`,
    );

  // controls
  Object.keys(StylingControls.controls).forEach((area) => {
    StylingControls.controls[area].forEach((control) => {
      let html = "";
      if ("group" in control) {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 4; justify-self:stretch",
              class: "section-header",
            })
            .html(_(control.group)),
        );
      }
      // multi
      if (control.type == "multi") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${control.name}Switch" onclick="restyleSample();"></div>`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        control.controls.forEach((ctrl) => {
          // selects
          if (ctrl.type == "select") {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:2/span 1; place-self:center start;",
                  name: control.name,
                })
                .html(_(ctrl.name)),
            );
            let html = `<select class="form-select form-select-sm" id="${ctrl.name}Field" onchange="restyleSample();">`;
            ctrl.values.forEach((value) => {
              html += `<option value="${value}">${_(value)}</option>`;
            });
            html += "</select></div></div>";
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:3/span 1; place-self:center start;",
                  name: control.name,
                })
                .html(html),
            );
          }
          // colors
          if (ctrl.type == "color" || ctrl.type == "emptycolor") {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:2/span 1; place-self:center start;",
                  name: control.name,
                })
                .html(_(ctrl.name)),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:3/span 1; place-self:center start;",
                  name: control.name,
                })
                .html(
                  `<input class="${ctrl.type == "color" ? "colorPicker" : "emptyColorPicker"}" id="${ctrl.name}Field" onchange="restyleSample();">`,
                ),
            );
          }
          // ranges
          if (ctrl.type == "range") {
            $grid.append(
              $("<div>")
                .attr({
                  style: "grid-column:2/span 1; place-self:center start;",
                  name: control.name,
                })
                .html(_(ctrl.name)),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style:
                    "grid-column:3/span 1; place-self:center start; width:100%; margin-bottom:-6px",
                  name: control.name,
                })
                .html(
                  `<input type="range" class="${Util.blackOrWhite(
                    theSettings.objectBackgroundColor ||
                      theSettings.generalBackgroundColor,
                    "range-light",
                    "range-dark",
                  )} form-range" min="${ctrl.min}" max="${ctrl.max}" step="${
                    ctrl.step
                  }" id="${ctrl.name}Field" oninput="restyleSample(); $('#${
                    ctrl.name
                  }Field_R').html(this.value+'${_(ctrl.unitI18n)}')">`,
                ),
            );
            $grid.append(
              $("<div>")
                .attr({
                  style:
                    "grid-column:4/span 1; place-self:center start; margin-left:10px;",
                  name: control.name,
                })
                .html(`<span id="${ctrl.name}Field_R"></span>`),
            );
          }
        });
      }
      // checkboxes
      if (control.type == "check") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${control.name}Switch" onclick="restyleSample();"></div>`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:3/span 1; place-self:center start;",
            })
            .html(
              `<input class="form-check-input" type="checkbox" id="${control.name}Field" onchange="restyleSample();"></input>`,
            ),
        );
      }
      // selects
      if (control.type == "select") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${control.name}Switch" onclick="restyleSample();"></div>`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        html = `<select class="form-select form-select-sm" id="${control.name}Field" onchange="restyleSample();">`;
        control.values.forEach((value) => {
          html += `<option value="${value}">${_(value)}</option>`;
        });
        html += "</select></div></div>";
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:3/span 1; place-self:center start;",
            })
            .html(html),
        );
      }
      // fonts
      if (control.type == "font") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${control.name}Switch" onclick="restyleSample();"></div>`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        html = `<select class="form-select form-select-sm" id="${
          control.name
        }Field" onchange="restyleSample();"><optgroup label="${_(
          "Fonts_web",
        )}">`;
        for (let family of Fonts.standardFamilies) {
          html += `<option style="font-size:16px;font-family:'${
            family.class
          }'" value="'${family.class}'">${_(`Fonts_${family.class}`)}</option>`;
        }
        html += `</optgroup><optgroup label="${_("Fonts_system")}">`;
        fonts.forEach((font) => {
          html += `<option style="font-size:16px;font-family:'${font}'" title="${font}"  value="'${font}'">${font}</option>`;
        });
        html += "</optgroup>";
        html += "</select></div></div>";
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:3/span 1; place-self:center start;",
            })
            .html(html),
        );
      }
      // colors
      if (control.type == "color" || control.type == "emptycolor") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="${control.name}Switch" onclick="restyleSample();"></div>`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:3/span 1; place-self:center start;",
            })
            .html(
              `<div id="${control.name}Field_C"><input class="${control.type == "color" ? "colorPicker" : "emptyColorPicker"}" id="${control.name}Field" onchange="restyleSample();"></div>`,
            ),
        );
      }
      // ranges
      if (control.type == "range") {
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:1/span 1; place-self:center end;",
            })
            .html(
              '<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="' +
                control.name +
                'Switch" onclick="restyleSample();"></div>',
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style: "grid-column:2/span 1; place-self:center start;",
            })
            .html(_(control.name)),
        );
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:3/span 1; place-self:center start; width:100%; margin-bottom:-6px",
            })
            .html(
              `<input type="range" class="${Util.blackOrWhite(
                theSettings.objectBackgroundColor ||
                  theSettings.generalBackgroundColor,
                "range-light",
                "range-dark",
              )} form-range" min="${control.min}" max="${control.max}" step="${
                control.step
              }" id="${
                control.name
              }Field" onchange="" oninput="restyleSample(); $('#${
                control.name
              }Field_R').html(this.value+'${_(control.unitI18n)}')">`,
            ),
        );
        $grid.append(
          $("<div>")
            .attr({
              style:
                "grid-column:4/span 1; place-self:center start; margin-left:10px;",
            })
            .html(`<span id="${control.name}Field_R"></span>`),
        );
      }
    });
  });

  // buttons
  if (theSettings.closingType != "settingsWindow_closeByX") {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 4; justify-self:end;",
        })
        .html(
          `<div style="display:flex; justify-content:flex-end"><div><button type="button" class="btn btn-primary" onclick="saveObject();closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></div></div>`,
        ),
    );
  }

  return $grid;
}

/**
 * clear and refill the overview tab
 *
 * @param {*} nonSiblings
 * @param {*} objects
 * @param {} files
 */
function fillOverview(nonSiblings, objects, files) {
  let $headerButton = $(
    `<div class="form-check form-switch"><input class="form-check-input" id="overviewHeader" type="checkbox"> ${_("objectWindow_showHeader")}</div>`,
  );
  $headerButton.on("change", () =>
    $(".section-header").css(
      "display",
      $("#overviewHeader").prop("checked") ? "block" : "none",
    ),
  );
  let $emptyButton = $(
    `<div class="form-check form-switch"><input class="form-check-input" id="overviewEmpty" type="checkbox"> ${_("objectWindow_showEmpty")}</div>`,
  );
  $emptyButton.on("change", () =>
    $(".overview-empty").css(
      "display",
      $("#overviewEmpty").prop("checked") ? "block" : "none",
    ),
  );
  let $parentsButton = $(
    `<div class="form-check form-switch"><input class="form-check-input" id="overviewParents" type="checkbox"> ${_("objectWindow_showParents")}</div>`,
  );
  $parentsButton.on("change", () => {
    $(`#overview_${theStyledObject.id}`)
      .prevUntil("#overviewControls", "div")
      .css("display", $("#overviewParents").prop("checked") ? "grid" : "none");
  });
  let $childrenButton = $(
    `<div class="form-check form-switch"><input class="form-check-input" id="overviewChildren" type="checkbox"> ${_("objectWindow_showChildren")}</div>`,
  );
  $childrenButton.on("change", () => {
    $(`#overview_${theStyledObject.id}`)
      .nextAll("div")
      .css("display", $("#overviewChildren").prop("checked") ? "grid" : "none");
  });

  $("#overviewTab").empty();
  $("#overviewTab").append(
    $("<div>")
      .attr({
        id: "overviewControls",
        style: "display:flex; justify-content:center; column-gap:20px",
      })
      .append(
        _("objectWindow_show"),
        $parentsButton,
        $childrenButton,
        $headerButton,
        $emptyButton,
      ),
  );
  let vals = collectValues();
  let currentObject = new StyledObject(
    theStyledObject.id,
    vals[0] || theStyledObject.name,
    undefined,
    vals[1],
    vals[2],
    vals[3],
  );
  makeOverview(
    nonSiblings,
    Object.fromEntries(objects.map((o) => [o.id, o.name])),
    currentObject,
    files,
    0,
  );
}

/**
 * fill the overview tab
 *
 * @param {*} nonSiblings
 * @param {*} objects
 * @param {StyledObject} current
 * @param {} files
 * @param {Number} depth
 */
function makeOverview(nonSiblings, objects, current, files, depth) {
  let id = Object.keys(nonSiblings)[0];
  // insert div which is later filled by message back from main process
  $("#overviewTab").append(
    $("<div>")
      .attr({
        style: `display:${id == theStyledObject.id ? "grid" : "none"}; column-gap:5px; row-gap:5px; grid-template-columns:max-content max-content; padding:10px; margin:30px 0 0 ${depth * 25}px; border:${id == theStyledObject.id ? "5" : "3"}px double ${Util.blackOrWhite(
          theSettings.objectBackgroundColor ||
            theSettings.generalBackgroundColor,
        )}`,
        id: `overview_${id}`,
      })
      .append(
        $("<div>")
          .attr({
            style: `grid-column:1/span 3; justify-self:center; font-weight:bold`,
          })
          .text(id == current.id ? current.name : objects[id]),
      ),
  );
  ipcRenderer.invoke(
    "mainProcess_objectOverview",
    id,
    JSON.stringify(current.serialize()),
    files,
  );
  // recursive walk
  Object.values(nonSiblings)[0].forEach((child) => {
    makeOverview(child, objects, current, files, depth + 1);
  });
}

/**
 * populate overview div with results
 */
ipcRenderer.on("objectWindow_objectOverviewResult", (event, id, result) => {
  result.forEach((prop) => {
    // headers have no type
    if (!prop.type) {
      $(`#overview_${id}`).append(
        $("<div>")
          .attr({
            style: `grid-column:1/span 3; justify-self:stretch; display:${$("#overviewHeader").prop("checked") ? "block" : "none"}`,
            class: "section-header",
          })
          .html(prop.name),
      );
    } else {
      $(`#overview_${id}`).append(
        $("<div>")
          .attr({
            style: `grid-column:1; justify-self:end; display:${prop.content || $("#overviewEmpty").prop("checked") ? "block" : "none"}`,
            class: prop.content ? "" : "overview-empty",
          })
          .html(prop.name),
      );
      $(`#overview_${id}`).append(
        $("<div>")
          .attr({
            style: `grid-column:2; display:${prop.content || $("#overviewEmpty").prop("checked") ? "block" : "none"}`,
            class: prop.content ? "" : "overview-empty",
          })
          .html("="),
      );
      $(`#overview_${id}`).append(
        $("<div>")
          .attr({
            style: `grid-column:3; display:${prop.content || $("#overviewEmpty").prop("checked") ? "block" : "none"}`,
            class: prop.content ? "" : "overview-empty",
          })
          .html(prop.content),
      );
    }
  });
});

/**
 * fill the form with the object's values
 *
 * @param {Object} styledObject StyledObject
 * @param {*} inheritedStyle
 * @param {*} standardFormat
 */
function fillForm(styledObject, inheritedStyle, standardFormat) {
  Object.keys(StylingControls.controls).forEach((area) => {
    StylingControls.controls[area].forEach((control) => {
      if (control.type == "multi") {
        if (styledObject.getStyleProperty(area, control.name) != null) {
          let value = styledObject.getStyleProperty(area, control.name);
          $(`#${control.name}Switch`).prop("checked", true);
          $(`[name="${control.name}"]`).prop("hidden", false);
          for (let i = 0; i < control.controls.length; i++) {
            $(`#${control.controls[i].name}Field`).prop("disabled", false);
            switch (control.controls[i].type) {
              case "color":
              case "emptycolor":
                $(`#${control.controls[i].name}Field`).spectrum("enable");
                $(`#${control.controls[i].name}Field`).spectrum(
                  "set",
                  value[i],
                );
                break;
              case "range":
                $(`#${control.controls[i].name}Field`).val(value[i]);
                $(`#${control.controls[i].name}Field_R`).html(
                  `${value[i]} ${_(control.controls[i].unitI18n)}`,
                );
                break;
              case "select":
                $(`#${control.controls[i].name}Field`).val(value[i]);
                break;
            }
          }
        } else if (
          inheritedStyle.getStyleProperty(area, control.name) != null
        ) {
          let value = inheritedStyle.getStyleProperty(area, control.name);
          $(`#${control.name}Switch`).prop("checked", false);
          $(`[name="${control.name}"]`).prop("hidden", false);
          for (let i = 0; i < control.controls.length; i++) {
            $(`#${control.controls[i].name}Field`).prop("disabled", true);
            switch (control.controls[i].type) {
              case "color":
              case "emptycolor":
                $(`#${control.controls[i].name}Field`).spectrum("disable");
                $(`#${control.controls[i].name}Field`).spectrum(
                  "set",
                  value[i],
                );
                break;
              case "range":
                $(`#${control.controls[i].name}Field`).val(value[i]);
                $(`#${control.controls[i].name}Field_R`).html(
                  `${value[i]} ${_(control.controls[i].unitI18n)}`,
                );
                break;
              case "select":
                $(`#${control.controls[i].name}Field`).val(value[i]);
                break;
            }
          }
        } else {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`[name="${control.name}"]`).prop("hidden", true);
          for (let i = 0; i < control.controls.length; i++) {
            $(`#${control.controls[i].name}Field`).prop("disabled", true);
            switch (control.controls[i].type) {
              case "color":
              case "emptycolor":
                $(`#${control.controls[i].name}Field`).spectrum("disable");
                $(`#${control.controls[i].name}Field`).spectrum(
                  "set",
                  control.controls[i].default,
                );
                break;
              case "range":
                $(`#${control.controls[i].name}Field`).val(
                  control.controls[i].default,
                );
                $(`#${control.controls[i].name}Field_R`).html(
                  `${control.controls[i].default} ${_(control.controls[i].unitI18n)}`,
                );
                break;
              case "select":
                $(`#${control.controls[i].name}Field`).val(
                  control.controls[i].default,
                );
                break;
            }
          }
        }
      }
      // checkboxes
      if (control.type == "check") {
        if (styledObject.getStyleProperty(area, control.name) != null) {
          $(`#${control.name}Switch`).prop("checked", true);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          $(`#${control.name}Field`).prop(
            "checked",
            styledObject.getStyleProperty(area, control.name),
          );
        } else if (
          inheritedStyle.getStyleProperty(area, control.name) != null
        ) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).prop(
            "checked",
            inheritedStyle.getStyleProperty(area, control.name),
          );
        } else if (control.name in standardFormat) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).prop(
            "checked",
            standardFormat[control.name],
          );
        } else {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", true);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).prop("checked", control.default);
        }
      }
      // selects and fonts
      if (control.type == "select" || control.type == "font") {
        if (styledObject.getStyleProperty(area, control.name) != null) {
          $(`#${control.name}Switch`).prop("checked", true);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          $(`#${control.name}Field`).val(
            styledObject.getStyleProperty(area, control.name),
          );
        } else if (
          inheritedStyle.getStyleProperty(area, control.name) != null
        ) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(
            inheritedStyle.getStyleProperty(area, control.name),
          );
        } else if (control.name in standardFormat) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(standardFormat[control.name]);
        } else {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", true);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(control.default);
        }
      }
      // colors
      if (control.type == "color" || control.type == "emptycolor") {
        if (styledObject.getStyleProperty(area, control.name) != null) {
          $(`#${control.name}Switch`).prop("checked", true);
          $(`#${control.name}Field_C`).prop("hidden", false);
          $(`#${control.name}Field`).spectrum("enable");
          $(`#${control.name}Field`).spectrum(
            "set",
            styledObject.getStyleProperty(area, control.name),
          );
        } else if (
          inheritedStyle.getStyleProperty(area, control.name) != null
        ) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field_C`).prop("hidden", false);
          $(`#${control.name}Field`).spectrum("disable");
          $(`#${control.name}Field`).spectrum(
            "set",
            inheritedStyle.getStyleProperty(area, control.name),
          );
        } else if (control.name in standardFormat) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field_C`).prop("hidden", false);
          $(`#${control.name}Field`).spectrum("disable");
          $(`#${control.name}Field`).spectrum(
            "set",
            standardFormat[control.name],
          );
        } else {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field_C`).prop("hidden", true);
          $(`#${control.name}Field`).spectrum("disable");
          $(`#${control.name}Field`).spectrum("set", control.default);
        }
      }
      // ranges
      if (control.type == "range") {
        if (styledObject.getStyleProperty(area, control.name) != null) {
          $(`#${control.name}Switch`).prop("checked", true);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field_R`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          $(`#${control.name}Field`).val(
            styledObject.getStyleProperty(area, control.name),
          );
          $(`#${control.name}Field_R`).html(
            `${styledObject.getStyleProperty(area, control.name)} ${_(control.unitI18n)}`,
          );
        } else if (
          inheritedStyle.getStyleProperty(area, control.name) != null
        ) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field_R`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(
            inheritedStyle.getStyleProperty(area, control.name),
          );
          $(`#${control.name}Field_R`).html(
            `${inheritedStyle.getStyleProperty(area, control.name)} ${_(control.unitI18n)}`,
          );
        } else if (control.name in standardFormat) {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field_R`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(standardFormat[control.name]);
          $(`#${control.name}Field_R`).html(
            `${standardFormat[control.name]} ${_(control.unitI18n)}`,
          );
        } else {
          $(`#${control.name}Switch`).prop("checked", false);
          $(`#${control.name}Field`).prop("hidden", true);
          $(`#${control.name}Field_R`).prop("hidden", true);
          $(`#${control.name}Field`).prop("disabled", true);
          $(`#${control.name}Field`).val(control.default);
          $(`#${control.name}Field_R`).html(
            `${control.default} ${_(control.unitI18n)}`,
          );
        }
      }
    });
  });
}

/**
 * adapt style sample to reflect form value changes
 */
function restyleSample() {
  Object.keys(StylingControls.controls).forEach((area) => {
    StylingControls.controls[area].forEach((control) => {
      // multi
      if (control.type == "multi") {
        if ($(`#${control.name}Switch`).prop("checked")) {
          $(`[name="${control.name}"]`).prop("hidden", false);
          let value = [];
          for (let i = 0; i < control.controls.length; i++) {
            if (
              control.controls[i].type == "color" ||
              control.controls[i].type == "emptycolor"
            ) {
              $(`#${control.controls[i].name}Field`).spectrum("enable");
            } else {
              $(`#${control.controls[i].name}Field`).prop("disabled", false);
            }
            value.push($(`#${control.controls[i].name}Field`).val());
          }
          console.log("multi", control.name, value);
          theStyledObject.setStyleProperty(area, control.name, value);
        } else {
          if (theInheritedStyle.getStyleProperty(area, control.name) != null) {
            let value = theInheritedStyle.getStyleProperty(area, control.name);
            $(`[name="${control.name}"]`).prop("hidden", false);
            for (let i = 0; i < control.controls.length; i++) {
              if (
                control.controls[i].type == "color" ||
                control.controls[i].type == "emptycolor"
              ) {
                $(`#${control.controls[i].name}Field`).spectrum("disable");
                $(`#${control.controls[i].name}Field`).spectrum(
                  "set",
                  value[i],
                );
              } else {
                $(`#${control.controls[i].name}Field`).prop("disabled", true);
                $(`#${control.controls[i].name}Field`).val(value[i]);
              }
            }
            theStyledObject.setStyleProperty(area, control.name, null);
          } else {
            $(`[name="${control.name}"]`).prop("hidden", true);
            for (let i = 0; i < control.controls.length; i++) {
              if (
                control.controls[i].type == "color" ||
                control.controls[i].type == "emptycolor"
              ) {
                $(`#${control.controls[i].name}Field`).spectrum("disable");
                $(`#${control.controls[i].name}Field`).spectrum(
                  "set",
                  control.controls[i].default,
                );
              } else {
                $(`#${control.controls[i].name}Field`).prop("disabled", true);
                $(`#${control.controls[i].name}Field`).val(
                  control.controls[i].default,
                );
              }
              theStyledObject.setStyleProperty(area, control.name, null);
            }
          }
        }
      }
      // checkboxes
      if (control.type == "check") {
        if ($(`#${control.name}Switch`).prop("checked")) {
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          theStyledObject.setStyleProperty(
            area,
            control.name,
            $(`#${control.name}Field`).prop("checked"),
          );
        } else {
          if (theInheritedStyle.getStyleProperty(area, control.name) != null) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).prop(
              "checked",
              theInheritedStyle.getStyleProperty(area, control.name),
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else if (control.name in theStandardFormat) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).prop(
              "checked",
              theStandardFormat[control.name],
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else {
            $(`#${control.name}Field`).prop("hidden", true);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).prop("checked", control.default);
            theStyledObject.setStyleProperty(area, control.name, null);
          }
        }
      }
      // selects and fonts
      if (control.type == "select" || control.type == "font") {
        if ($(`#${control.name}Switch`).prop("checked")) {
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          theStyledObject.setStyleProperty(
            area,
            control.name,
            $(`#${control.name}Field`).val(),
          );
        } else {
          if (theInheritedStyle.getStyleProperty(area, control.name) != null) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(
              theInheritedStyle.getStyleProperty(area, control.name),
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else if (control.name in theStandardFormat) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(theStandardFormat[control.name]);
            theStyledObject.setStyleProperty(area, control.name, null);
          } else {
            $(`#${control.name}Field`).prop("hidden", true);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(control.default);
            theStyledObject.setStyleProperty(area, control.name, null);
          }
        }
      }
      // ranges
      if (control.type == "range") {
        if ($(`#${control.name}Switch`).prop("checked")) {
          $(`#${control.name}Field`).prop("hidden", false);
          $(`#${control.name}Field_R`).prop("hidden", false);
          $(`#${control.name}Field`).prop("disabled", false);
          theStyledObject.setStyleProperty(
            area,
            control.name,
            $(`#${control.name}Field`).val(),
          );
        } else {
          if (theInheritedStyle.getStyleProperty(area, control.name) != null) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field_R`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(
              theInheritedStyle.getStyleProperty(area, control.name),
            );
            $(`#${control.name}Field_R`).html(
              `${theInheritedStyle.getStyleProperty(area, control.name)} ${_(control.unitI18n)}`,
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else if (control.name in theStandardFormat) {
            $(`#${control.name}Field`).prop("hidden", false);
            $(`#${control.name}Field_R`).prop("hidden", false);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(theStandardFormat[control.name]);
            $(`#${control.name}Field_R`).html(
              `${theStandardFormat[control.name]} ${_(control.unitI18n)}`,
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else {
            $(`#${control.name}Field`).prop("hidden", true);
            $(`#${control.name}Field_R`).prop("hidden", true);
            $(`#${control.name}Field`).prop("disabled", true);
            $(`#${control.name}Field`).val(control.default);
            $(`#${control.name}Field_R`).html(
              `${control.default} ${_(control.unitI18n)}`,
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          }
        }
      }
      // colors
      if (control.type == "color" || control.type == "emptycolor") {
        if ($(`#${control.name}Switch`).prop("checked")) {
          $(`#${control.name}Field_C`).prop("hidden", false);
          $(`#${control.name}Field`).spectrum("enable");
          theStyledObject.setStyleProperty(
            area,
            control.name,
            $(`#${control.name}Field`).val(),
          );
        } else {
          if (theInheritedStyle.getStyleProperty(area, control.name) != null) {
            $(`#${control.name}Field_C`).prop("hidden", false);
            $(`#${control.name}Field`).spectrum("disable");
            $(`#${control.name}Field`).spectrum(
              "set",
              theInheritedStyle.getStyleProperty(area, control.name),
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else if (control.name in theStandardFormat) {
            $(`#${control.name}Field_C`).prop("hidden", false);
            $(`#${control.name}Field`).spectrum("disable");
            $(`#${control.name}Field`).spectrum(
              "set",
              theStandardFormat[control.name],
            );
            theStyledObject.setStyleProperty(area, control.name, null);
          } else {
            $(`#${control.name}Field_C`).prop("hidden", true);
            $(`#${control.name}Field`).spectrum("disable");
            $(`#${control.name}Field`).spectrum("set", control.default);
            theStyledObject.setStyleProperty(area, control.name, null);
          }
        }
      }
    });
  });

  $("#sampleSheet")
    .empty()
    .append(
      `.inheritedStyle {${Formats.formatToCSS(theStandardFormat)}; ${new StyledObject()
        .addStyleProperties(theInheritedStyle)
        .toCSS("text")}}\n`,
    )
    .append(
      `.inheritedStyle img {${Formats.formatToCSS(theStandardFormat)}; ${new StyledObject()
        .addStyleProperties(theInheritedStyle)
        .toCSS("image")}}\n`,
    )
    .append(
      `.sampleStyle {${Formats.formatToCSS(theStandardFormat)}; ${new StyledObject()
        .addStyleProperties(theInheritedStyle)
        .addStyleProperties(theStyledObject)
        .toCSS("text")}}\n`,
    )
    .append(
      `.sampleStyle img {${Formats.formatToCSS(theStandardFormat)}; ${new StyledObject()
        .addStyleProperties(theInheritedStyle)
        .addStyleProperties(theStyledObject)
        .toCSS("image")}}`,
    );
}

/**
 * check if form content is changed
 * this is not yet implemented flawlessly, as objects are considered changed although they are not if the object is hierarchially below another one having scheme items
 */
function contentChanged() {
  let values = collectValues();
  return (
    values[0] != theStyledObject.name ||
    !Util.deepEqual(values[1], originalDecoration) ||
    !Util.deepEqual(values[2], originalScheme) ||
    !Util.deepEqual(values[3], originalProperties) ||
    !Util.deepEqual(theStyledObject.styleProperties, originalStyleProperties)
  );
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * collect all form values
 *
 * @returns {Array} object name, decoration values, scheme items, scheme
 */
function collectValues() {
  let decoration = {};
  for (let [mod, tags] of Object.entries(TreeDecoration.modTags)) {
    if ($(`#${mod}`).prop("checked")) {
      decoration[mod] = true;
    }
  }
  decoration.icon = $("#iconSwitch").prop("checked");
  if (decoration.icon) {
    decoration.iconName = $("input:radio[name=iconsRadio]:checked").val();
    decoration.iconColor = $("#iconColor").val() || "#000000";
    decoration.stack = $("#iconStack").val();
    decoration.stackColor = $("#stackColor").val() || "#000000";
  }
  return [
    $("#objectName").val(),
    decoration,
    theScheme.saveItems($("#schemeGrid")),
    theScheme.saveProperties($("#propertiesGrid")),
  ];
}

/**
 * save content if changed
 */
function saveObject() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_saveObject", [
      theStyledObject.id,
      ...collectValues(),
      theStyledObject.styleProperties,
      theFiles,
    ]);
  }
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveObject();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", contentChanged());
});

/**
 * display the icon popup
 *
 * @param {*} element DOM element to display the icon next to
 * @param {String} icon name of the font awesome icon
 */
function iconPopup(element, icon) {
  $popup.css("display", "inline-block");
  if ($("#iconStack").val() == TreeDecoration.noStack) {
    $popup.html(
      '<i class="fa-solid fa-' +
        icon +
        ' fa-3x" style="color:' +
        $("#iconColor").val() +
        '"></i>',
    );
  } else {
    let i1 =
      '<i class="' +
      TreeDecoration.stackProps[$("#iconStack").val()].class +
      ' fa-stack-1x" style="color:' +
      $("#stackColor").val() +
      '"></i>';
    let i2 =
      '<i class="fa-solid fa-' +
      icon +
      ' fa-stack-1x" style="color:' +
      $("#iconColor").val() +
      '"></i>';
    $popup.html(
      '<span class="fa-stack" style="font-size:2.4em;">' +
        (TreeDecoration.stackProps[$("#iconStack").val()].background
          ? i1 + i2
          : i2 + i1) +
        "</span> ",
    );
  }
  $popup.offset({
    top: $(element).offset().top + $(element).height() - $popup.height() - 20,
    left:
      $(element).offset().left < window.innerWidth / 2
        ? $(element).offset().left + $(element).width() + 8
        : $(element).offset().left - $popup.width() - 30,
  });
}

/**
 * hide icon popup
 */
function iconPopdown() {
  $popup.css("display", "none");
}

/**
 * show or unshow icon div
 */
function showIcons() {
  if (!$("#iconSwitch").prop("checked")) {
    $("#iconSpecs").css("visibility", "hidden");
    $("#icons").css("display", "none");
  } else {
    $("#iconSpecs").css("visibility", "visible");
    $("#icons").css("display", "block");
    if ($("input:radio[name=iconsRadio]:checked").val() == undefined) {
      $("input:radio[name=iconsRadio]")[0].checked = true;
    }
  }
}

/**
 * display another object (and save current object if necessary)
 *
 * @param {String} id object id
 */
function showObject(id, item) {
  if ($(`#property_${id}_${item}`).val()) {
    saveObject();
    ipcRenderer.invoke("mainProcess_closeModalWindow");
    ipcRenderer.invoke("mainProcess_openObject", [
      $(`#property_${id}_${item}`).val(),
    ]);
  }
}

/**
 * map changes from an overlay window
 *
 * @param {String} schemeID
 * @param {String} itemID
 * @param {SchemeMap} mapValue
 */
ipcRenderer.on(
  "objectWindow_saveSchemeMap",
  (event, [schemeID, itemID, mapValue]) => {
    theScheme.properties[schemeID][itemID] = mapValue;
    theScheme.updateMap(schemeID, itemID, mapValue);
  },
);

/**
 * editor changes from an overlay window
 *
 * @param {String} schemeID
 * @param {String} itemID
 * @param {Object} editorContents
 */
ipcRenderer.on(
  "objectWindow_changeSchemeEditor",
  (event, [schemeID, itemID, editorContents]) => {
    theScheme.properties[schemeID][itemID] = editorContents;
    theScheme.updateEditor(schemeID, itemID, editorContents);
  },
);

/**
 * image changes from an overlay window
 *
 * @param {Object[]} args image properties
 */
ipcRenderer.on("objectWindow_saveImage", (event, args) => {
  theScheme.setImage(args);
});
