/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of text window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/textWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

const gridGap = "15px";

let theStyledText;
let theSettings;
let $popup;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Object} categories text categories as defined in Properties
 * @param {} text
 * @param {String} path text path as html
 * @param {} collections
 * @param {} objects
 * @param {} references
 */
ipcRenderer.on(
  "textWindow_init",
  (
    event,
    [settings, categories, text, path, collections, objects, references],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "textWindow_init",
      { settings },
      { categories },
      { text },
      { path },
      { collections },
      { objects },
      { references },
    ]);
    theSettings = settings;
    theLanguage = settings.language;
    theStyledText = new StyledText(...text);
    let statistics = theStyledText.calcStatistics();
    new Fonts().loadStandardFonts("..");

    // tabs
    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });

    // info tab
    Util.addTab(
      $tabs,
      $content,
      true,
      "infoTab",
      _("textWindow_infoTab"),
      infoTab(categories, path, collections, settings),
    );

    // statistics tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "statisticsTab",
      _("statistics_statisticsTabName"),
      statisticsTab(statistics),
    );

    // wordlist tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "wordlistTab",
      _("statistics_wordlistTabName"),
      `<table id="wordlist" class="display" width="100%"></table>`,
    );

    // wordcloud tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "wordcloudTab",
      _("statistics_wordcloudTabName"),
      $("<canvas>")
        .attr({
          id: "wordcloud",
          title: _("wordcloud_title"),
          width: window.innerWidth - 55,
          height: window.innerHeight - 126,
        })
        .css({
          border: `10px ${settings.wordcloudBackgroundColor} solid`,
          background: settings.wordcloudBackgroundColor,
          overflow: "hidden",
        }),
    );

    // quotes tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "quotesTab",
      _("objectReferences_tab"),
      `<table id="quotes" class="display" width="100%"></table>`,
    );

    // icon popup div
    $popup = $("<div>").attr({
      style:
        "background-color:#ffffff; border:double black 4px; padding:10px; position:absolute; z-index:10; display:none;",
    });
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.textBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.textBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.textBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.textBackgroundColor || settings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content)
      .append($popup);

    // initialize tabs
    Util.initTabs();

    // initialize color pickers
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

    // quotes table
    let quoteList = [];
    references.forEach((reference) => {
      let object;
      for (object of objects) {
        if (object.id == reference.object) break;
      }
      let pre =
        settings.textsHighlightCheckedObjects && object.checked ? "<b>" : "";
      let post =
        settings.textsHighlightCheckedObjects && object.checked ? "</b>" : "";
      reference.references.forEach((r) => {
        r.citations.forEach((c) => {
          quoteList.push([
            pre + Util.escapeHTML(object.name) + post,
            pre +
              c.parts
                .map((part) =>
                  part.html ? part.content : Util.escapeHTML(part.content),
                )
                .join("") +
              post,
            c.pos,
          ]);
        });
      });
    });

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
          title: _("objectReferences_object"),
          width: "25%",
          searchable: false,
          orderable: false,
        },
        { title: _("objectReferences_quote"), orderData: [2, 1] },
        { type: "num", visible: false },
      ],
    });

    // wordlist table
    let wordList = [];
    Object.keys(statistics.wordCounts).map((key) =>
      wordList.push([key, key.length, statistics.wordCounts[key]]),
    );
    $("#wordlist").DataTable({
      data: wordList,
      language: {
        info: _("dataTables_info"),
        infoEmpty: _("dataTables_empty"),
        emptyTable: _("statistics_wordlistEmpty"),
        paginate: {
          first: _("dataTables_firstPage"),
          previous: _("dataTables_previousPage"),
          last: _("dataTables_lastPage"),
          next: _("dataTables_nextPage"),
        },
        lengthMenu: _("dataTables_lengthMenu"),
        search: _("statistics_wordlistSearch"),
      },
      pagingType: "full_numbers",
      pageLength: 10,
      lengthMenu: [
        [5, 10, 25, -1],
        [5, 10, 25, _("dataTables_lengthAll")],
      ],
      autoWidth: false,
      columns: [
        { title: _("statistics_wordlistWord"), type: "stringbylocale" },
        {
          title: _("statistics_wordlistLength"),
          className: "dt-body-right",
          type: "num",
          searchable: false,
          width: "100px",
        },
        {
          title: _("statistics_wordlistFrequency"),
          className: "dt-body-right",
          type: "num",
          searchable: false,
          width: "300px",
          render: function (data, type, row) {
            return type == "display"
              ? _(
                  "statistics_wordFrequency",
                  Math.round(statistics.words / data),
                  {
                    absolute: data,
                    relative:
                      data / statistics.words > 1 / 100
                        ? Number.parseFloat(
                            (data / statistics.words) * 100,
                          ).toLocaleString(theLanguage, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }) + " %"
                        : Number.parseFloat(
                            (data / statistics.words) * 1000,
                          ).toLocaleString(theLanguage, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }) + " &permil;",
                    every: Math.round(statistics.words / data),
                  },
                )
              : data;
          },
        },
      ],
    });

    // wordcloud
    let wcList = Object.entries(statistics.wordCounts)
      .sort(([, a], [, b]) => a - b)
      .reverse();
    let wcCol;
    switch (settings.wordcloudColorScheme) {
      case "settingsWindow_wordcloudColorLight":
        wcCol = "random-light";
        break;
      case "settingsWindow_wordcloudColorDark":
        wcCol = "random-dark";
        break;
      case "settingsWindow_wordcloudColorUser":
        wcCol = settings.wordcloudColor;
        break;
    }
    if (wcList.length) {
      wordCloud(document.getElementById("wordcloud"), {
        list: wcList,
        gridSize: 10,
        weightFactor: 250 / wcList[0][1],
        fontFamily: settings.wordcloudFont,
        color: wcCol,
        backgroundColor: settings.wordcloudBackgroundColor,
        rotateRatio: 0.5,
        drawOutOfBound: false,
        ellipticity:
          document.getElementById("wordcloud").height /
          document.getElementById("wordcloud").width,
      });
    }

    $("#wordcloud").on("dblclick", () => {
      $("#wordcloud")[0].toBlob((blob) => {
        let data = [new ClipboardItem({ [blob.type]: blob })];
        navigator.clipboard.write(data);
        ipcRenderer.invoke("mainProcess_infoMessage", [
          _("wordcloud_copiedTitle"),
          _("wordcloud_copiedMessage"),
        ]);
      });
    });

    // adapt data tables input style
    $(".dt-length .dt-input").css("margin-right", "5px");
    $(".dt-length .dt-input").addClass("form-select-sm");
    $(".dt-length .dt-input").removeClass("dt-input");
    $(".dt-search .dt-input").css({
      background: "#ffffff",
      height: "32px",
    });
  },
);

/**
 * statistics tab contents
 *
 * @param {Object} statistics
 * @returns {String} jquery grid
 */
function statisticsTab(statistics) {
  let $grid = $("<div>").attr({
    style: `display:grid; row-gap:4px; column-gap:10px; grid-template-columns:200px`,
  });
  // counts
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 2; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("statistics_absoluteNumbers")),
  );
  [
    "characters",
    "nonSpaceCharacters",
    "words",
    "sentences",
    "paragraphs",
  ].forEach((item) => {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; justify-self:end",
        })
        .html(statistics[item].toLocaleString(theLanguage)),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; justify-self:start;",
        })
        .html(_(`statistics_${item}`, statistics[item])),
    );
  });
  // averages
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 2; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("statistics_averageNumbers")),
  );
  // words
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.words
          ? 0
          : statistics.nonSpaceCharacters / statistics.words
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_charactersPerWord")),
  );
  // sentences
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.sentences
          ? 0
          : statistics.characters / statistics.sentences
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_charactersPerSentence")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.sentences
          ? 0
          : statistics.words / statistics.sentences
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_wordsPerSentence")),
  );
  // paragraphs
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.paragraphs
          ? 0
          : statistics.characters / statistics.paragraphs
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_charactersPerParagraph")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.paragraphs
          ? 0
          : statistics.words / statistics.paragraphs
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_wordsPerParagraph")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end",
      })
      .html(
        (!statistics.paragraphs
          ? 0
          : statistics.sentences / statistics.paragraphs
        ).toLocaleString(theLanguage, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_sentencesPerParagraph")),
  );

  return $grid;
}

/**
 * info tab contents
 *
 * @param {*} categories
 * @param {String} path
 * @param {*} collections
 * @param {Object} settings
 * @returns {String} jquery grid
 */
function infoTab(categories, path, collections, settings) {
  let $grid = $("<div>").attr({
    style: `display:grid; row-gap:20px; column-gap:10px; grid-template-columns:50px max-content 50px`,
  });
  // appearance
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("textWindow_appearance")),
  );
  // name
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; place-self:center center;",
      })
      .html('<i class="fas fa-quote-right fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; place-self:center start;",
      })
      .html(_("textWindow_name")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; place-self:center start; width:100%",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" id="textName" style="width:100%" value="${Util.escapeHTML(
          theStyledText.name,
        )}">`,
      ),
  );
  // style
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; place-self:center center;",
      })
      .html('<i class="fas fa-paintbrush fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; place-self:center start;",
      })
      .html(_("decoration_textStyle")),
  );
  let html = "";
  for (let [mod, tags] of Object.entries(TreeDecoration.modTags)) {
    html += `<span style="margin-right:20px;"><label><input id="${mod}" class="form-check-input" type="checkbox"${
      theStyledText.decoration[mod] ? " checked" : ""
    }> ${tags[0]}${_(mod)}${tags[1]}</label></span>`;
  }
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; place-self:center start;",
      })
      .html(html),
  );
  // icon
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:1/span 1; place-self:center center; margin-bottom:-${gridGap};`,
      })
      .html('<i class="fa-solid fa-icons fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:2/span 1; place-self:center start; margin-bottom:-${gridGap};`,
      })
      .html(_("decoration_icon")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:3/span 1; place-self:center start; margin-bottom:-${gridGap};`,
      })
      .html(
        `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="iconSwitch" onchange="showIcons();" ${
          theStyledText.getDecorationValue("icon") ? "checked" : ""
        }></div>`,
      ),
  );
  html = `<span style="margin-left:30px">${_(
    "decoration_iconOverlay",
  )}</span> <select id="iconStack" class="form-select form-select-sm" style="display:unset; width:unset">`;
  TreeDecoration.stackIcons.forEach((stack) => {
    html += `<option value="${stack}"${
      theStyledText.getDecorationValue("stack") == stack ? " selected" : ""
    }>${_(stack)}</option>`;
  });
  html += "</select>";
  $grid.append(
    $("<div>")
      .attr({
        id: "iconSpecs",
        style: `grid-column:4/span 1; place-self:center end; margin-bottom:-${gridGap}; visibility:${
          theStyledText.getDecorationValue("icon") ? "visible" : "hidden"
        }`,
      })
      .html(
        `${_(
          "decoration_iconColor",
        )} <input class="colorPicker" id="iconColor" value="${theStyledText.getDecorationValue(
          "iconColor",
        )}">` +
          html +
          `<span style="margin-left:30px">${_(
            "decoration_overlayColor",
          )}</span> <input class="colorPicker" id="stackColor" value="${theStyledText.getDecorationValue(
            "stackColor",
          )}">`,
      ),
  );
  html = `<div id="icons" style="margin-top:10px; max-height:200px; overflow-y:auto; border:1px dotted; padding:10px; display:${
    theStyledText.getDecorationValue("icon") ? "block" : "none"
  }">`;
  TreeDecoration.treeItemIcons.forEach((icon) => {
    if (!icon) {
      html += "<br>";
    } else {
      html += `<div class="form-check form-check-inline" style="width:50px;"><input class="form-check-input" type="radio" name="iconsRadio" id="icons_${icon}" value="${icon}"${
        icon == theStyledText.getDecorationValue("iconName") ? " checked" : ""
      }><label class="form-check-label" for="icons_${icon}" onmouseover="iconPopup(this,'${icon}')" onmouseout="iconPopdown()"><i class="fa-solid fa-${icon}"></i></label></div>`;
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
  // controls
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("textWindow_properties")),
  );
  // locked
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fa-solid fa-lock fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center",
      })
      .html(_("textWindow_locked")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        '<input id="textEdit" class="form-check-input" type="checkbox"' +
          (!theStyledText.editable ? " checked" : "") +
          ">",
      ),
  );
  // category lists
  Categories.categories.forEach((list) => {
    $grid.append(
      $("<div>")
        .attr({
          style:
            "grid-column:1/span 1; justify-self:center; align-self:center;",
        })
        .html(list.icon),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; justify-self:start; align-self:center;",
        })
        .html(_(list.name)),
    );
    html = `<select class="form-select form-select-sm" id="${
      list.name
    }"><option value="${UUID0}">(${_(list.noValue)})</option>`;
    categories[list.name].forEach((entry) => {
      let value;
      switch (list.name) {
        case "categories_status":
          value = theStyledText.status;
          break;
        case "categories_type":
          value = theStyledText.type;
          break;
        case "categories_user":
          value = theStyledText.userValue;
          break;
      }
      html += `<option value="${entry.id}" ${
        value == entry.id ? "selected" : ""
      }>${Util.escapeHTML(entry[list.properties[1].name])}</option>`;
    });
    html += "</select>";
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2; justify-self:start; align-self:center;",
        })
        .html(html),
    );
  });
  // infos
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("textWindow_infos")),
  );
  // path
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fa-solid fa-bars-staggered fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("textWindow_path")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(path),
  );
  // collections
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:begin;",
      })
      .html('<i class="fa-solid fa-list"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:begin;",
      })
      .html(_("textWindow_collections")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(collections.join("<br>") || _("textWindow_noCollections")),
  );
  // created
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fas fa-calendar-plus fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("textWindow_created")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        `${theStyledText.created.toLocalString(
          theSettings.dateTimeFormatLong,
        )} (${_("time_timePassed", {
          time: theStyledText.created.timeToNow(),
        })})`,
      ),
  );
  // changed
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fas fa-calendar-check fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center;",
      })
      .html(_("textWindow_changed")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        `${theStyledText.changed.toLocalString(
          theSettings.dateTimeFormatLong,
        )} (${_("time_timePassed", {
          time: theStyledText.changed.timeToNow(),
        })})`,
      ),
  );
  // buttons
  if (settings.closingType != "settingsWindow_closeByX") {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 4; justify-self:end;",
        })
        .html(
          `<button type="button" class="btn btn-primary" onclick="saveText();closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button>`,
        ),
    );
  }

  return $grid;
}

/**
 * collect all form values
 *
 * @returns {Array} locked, text name, decoration values, category values
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
    !$("#textEdit").prop("checked"),
    $("#textName").val(),
    decoration,
    ...Categories.categories.map((x) => $(`#${x.name}`).val()),
  ];
}

/**
 * check if form content is changed
 *
 * @returns {Boolean} true if changed
 */
function contentChanged() {
  return (
    JSON.stringify(collectValues()) !=
    JSON.stringify([
      theStyledText.editable,
      theStyledText.name,
      theStyledText.decoration,
      theStyledText.status,
      theStyledText.type,
      theStyledText.userValue,
    ])
  );
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * save content if changed
 */
function saveText() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_saveText", [
      theStyledText.id,
      ...collectValues(),
    ]);
  }
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveText();
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
