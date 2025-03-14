/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of text collection window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/collectionWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

const gridGap = "15px";

/**
 * representation of the collection as Collection Object
 */
let theCollection;
/**
 * filter Object
 */
let theFilter;

/**
 * icon popup div
 */
const $popup = $("<div>").attr({
  style:
    "background-color:#ffffff; border:double black 4px; padding:10px; position:absolute; z-index:10; display:none;",
});

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Array} collection text collection object
 * @param {String[]} textPaths names and paths of text in collection
 * @param {Object} statistics character, word etc counts of all texts in the collection
 */
ipcRenderer.on(
  "collectionWindow_init",
  (
    event,
    [
      settings,
      collection,
      textPaths,
      statistics,
      objectList,
      statusList,
      typeList,
      userList,
    ],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "collectionWindow_init",
      { settings },
      { collection },
      { textPaths },
      { statistics },
      { objectList },
      { statusList },
      { typeList },
      { userList },
    ]);
    theLanguage = settings.language;

    new Fonts().loadStandardFonts("..");

    theCollection = new Collection(...collection);

    /**
     * create content
     */
    const $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    const $content = $("<div>").attr({ class: "tab-content" });
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.collectionBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.collectionBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.collectionBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.collectionBackgroundColor || settings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content)
      .append($popup);

    /**
     * add info tab and initialize color pickers
     */
    Util.addTab(
      $tabs,
      $content,
      true,
      "infoTab",
      _("collectionWindow_infoTab"),
      infoTab(textPaths, settings),
    );

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

    /**
     * add search and filter tab
     */
    if (theCollection.search) {
      const $filterDiv = $(`<div>`);
      Util.addTab(
        $tabs,
        $content,
        false,
        "searchTab",
        _("search_tab"),
        searchTab(settings, $filterDiv),
      );
      theFilter = new Filter(
        $filterDiv,
        validate,
        theCollection.search.filters
          ? JSON.parse(JSON.stringify(theCollection.search.filters))
          : [],
        objectList,
        statusList,
        typeList,
        userList,
      );
      validate();
      $("#searchText").on("input", checkSearchRegex);
      $("#searchRegex").on("change", checkSearchRegex);

      $("#searchText").on("input", validate);
      $("#searchRegex").on("change", validate);
    }

    /**
     * add statistics tab
     */
    Util.addTab(
      $tabs,
      $content,
      false,
      "statisticsTab",
      _("statistics_statisticsTabName"),
      statisticsTab(statistics),
    );

    /**
     * add wordlist tab and fill wordlist table
     */
    Util.addTab(
      $tabs,
      $content,
      false,
      "wordlistTab",
      _("statistics_wordlistTabName"),
      `<table id="wordlist" class="display" width="100%"></table>`,
    );

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
    // adapt data tables input style
    $(".dt-length .dt-input").css("margin-right", "5px");
    $(".dt-length .dt-input").addClass("form-select-sm");
    $(".dt-length .dt-input").removeClass("dt-input");
    $(".dt-search .dt-input").css({
      background: "#ffffff",
      height: "32px",
    });

    /**
     * add wordcloud tab and fill canvas
     */
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

    let wcList = Object.entries(statistics.wordCounts)
      .sort(([, a], [, b]) => a - b)
      .reverse();
    if (wcList.length) {
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
      wordCloud($("#wordcloud")[0], {
        list: wcList,
        gridSize: 10,
        weightFactor: 250 / wcList[0][1],
        fontFamily: settings.wordcloudFont,
        color: wcCol,
        backgroundColor: settings.wordcloudBackgroundColor,
        rotateRatio: 0.5,
        drawOutOfBound: false,
        ellipticity: $("#wordcloud").height() / $("#wordcloud").width(),
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

    Util.initTabs();
  },
);

/**
 * implement info tab
 *
 * @param {String[]} textPaths names and paths of text in collection
 * @param {Object} settings effective settings
 * @returns {Object} jquery
 */
function infoTab(textPaths, settings) {
  const $grid = $("<div>").attr({
    style: `display:grid; row-gap:20px; column-gap:10px; grid-template-columns:50px max-content 50px`,
  });

  // appearance
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("collectionWindow_appearance")),
  );
  // name
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center; align-self:center;",
      })
      .html('<i class="fas fa-quote-right fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start; align-self:center",
      })
      .html(_("collectionWindow_name")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:3/span 2; justify-self:start; align-self:center; width:100%",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" id="collectionName" style="width:100%" value="${Util.escapeHTML(theCollection.name)}">`,
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
      theCollection.decoration[mod] ? " checked" : ""
    }> ${tags[0]}${_(mod)}${tags[1]}</span>`;
  }
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(html),
  );
  // color
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:1/span 1; place-self:center center;`,
      })
      .html('<i class="fa-solid fa-palette fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:2/span 1; justify-self:start;`,
      })
      .html(_("decoration_color")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: `grid-column:3/span 1; place-self:center start;`,
      })
      .html(
        `<input class="emptyColorPicker" id="color" value="${theCollection.getDecorationValue(
          "color",
        )}">`,
      ),
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
        style: `grid-column:2/span 1; justify-self:start; margin-bottom:-${gridGap};`,
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
          theCollection.getDecorationValue("icon") ? "checked" : ""
        }></div>`,
      ),
  );
  html = `<span style="margin-left:30px">${_(
    "decoration_iconOverlay",
  )}</span> <select id="iconStack" class="form-select form-select-sm" style="display:unset; width:unset">`;
  TreeDecoration.stackIcons.forEach((stack) => {
    html += `<option value="${stack}"${
      theCollection.getDecorationValue("stack") == stack ? " selected" : ""
    }>${_(stack)}</option>`;
  });
  html += "</select>";
  $grid.append(
    $("<div>")
      .attr({
        id: "iconSpecs",
        style: `grid-column:4/span 1; place-self:center end; margin-bottom:-${gridGap}; visibility:${
          theCollection.getDecorationValue("icon") ? "visible" : "hidden"
        }`,
      })
      .html(
        `${_(
          "decoration_iconColor",
        )} <input class="colorPicker" id="iconColor" value="${theCollection.getDecorationValue(
          "iconColor",
        )}">` +
          html +
          `<span style="margin-left:30px">${_(
            "decoration_overlayColor",
          )}</span> <input class="colorPicker" id="stackColor" value="${theCollection.getDecorationValue(
            "stackColor",
          )}">`,
      ),
  );
  html = `<div id="icons" style="margin-top:10px; max-height:200px; overflow-y:auto; border:1px dotted; padding:10px; display:${
    theCollection.getDecorationValue("icon") ? "block" : "none"
  }">`;
  TreeDecoration.treeItemIcons.forEach((icon) => {
    if (!icon) {
      html += "<br>";
    } else {
      html += `<div class="form-check form-check-inline" style="width:50px;"><input class="form-check-input" type="radio" name="iconsRadio" id="icons_${icon}" value="${icon}"${
        icon == theCollection.getDecorationValue("iconName") ? " checked" : ""
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

  // infos
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 4; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("collectionWindow_infos")),
  );
  // texts
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-align-left fa-fw"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("collectionWindow_texts")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        textPaths.length
          ? textPaths.join("<br>")
          : _("collectionWindow_noTexts"),
      ),
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
      .html(_("collectionWindow_created")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        `${theCollection.created.toLocalString(
          settings.dateTimeFormatLong,
        )} (${_("time_timePassed", {
          time: theCollection.created.timeToNow(),
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
      .html(_("collectionWindow_changed")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 2; justify-self:start; align-self:center;",
      })
      .html(
        `${theCollection.changed.toLocalString(
          settings.dateTimeFormatLong,
        )} (${_("time_timePassed", {
          time: theCollection.changed.timeToNow(),
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
          `<button type="button" class="btn btn-primary" id="saveButton1" onclick="saveContent(); closeWindow();">${_(
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
 * implement search tab
 *
 * @param {Object} settings effective settings
 * @param {Object} $filterDiv jquery
 * @returns
 */
function searchTab(settings, $filterDiv) {
  $searchGrid = $("<div>").attr({
    style:
      "display:grid; row-gap:20px; column-gap:10px; grid-template-columns: 50px 20px max-content 50px max-content 50px",
  });

  // search
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 7; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("search_search")),
  );
  // search input
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:1; align-self:center; justify-self:center",
      })
      .html(`<i class="fa-solid fa-magnifying-glass">`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 6;",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" style="width:90%" id="searchText" value="${Util.escapeHTML(
          theCollection.search.text,
        )}">`,
      ),
  );
  // options
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2; justify-self:end",
      })
      .html(
        `<input type="checkbox" class="form-check-input" id="searchCase"${
          theCollection.search.case ? " checked" : ""
        }>`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3",
      })
      .html(_("search_withCase")),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:4; justify-self:end",
      })
      .html(
        `<input type="checkbox" class="form-check-input" id="searchWord"${
          theCollection.search.word ? " checked" : ""
        }>`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:5",
      })
      .html(_("search_wholeWord")),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:6; justify-self:end",
      })
      .html(
        `<input type="checkbox" class="form-check-input" id="searchRegex"${
          theCollection.search.regex ? " checked" : ""
        }>`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:7",
      })
      .html(_("search_withRegex")),
  );

  // buttons
  if (settings.closingType != "settingsWindow_closeByX") {
    $buttonDiv = $("<p>")
      .attr({
        style: "text-align:right",
      })
      .html(
        `<button type="button" class="btn btn-primary" id="saveButton2" onclick="saveContent(); closeWindow()">${_(
          "general_saveButton",
        )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
          "general_cancelButton",
        )}</button>`,
      );
  }

  return [$searchGrid, $filterDiv, $buttonDiv];
}

/**
 * implement statistics tab
 *
 * @param {Object} statistics character, word etc counts of all texts in the collection
 * @returns {Object} jquery
 */
function statisticsTab(statistics) {
  const $grid = $("<div>").attr({
    style: `display:grid; row-gap:4px; column-gap:10px; grid-template-columns:200px`,
  });

  // absolute values
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

  // texts
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 2; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("statistics_texts")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(statistics.texts.toLocaleString(theLanguage)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_totalTexts", statistics.texts)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(statistics.textsWithObjects.toLocaleString(theLanguage)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_textsWithObjects")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(
        (
          statistics.objectCharacters /
          (statistics.characters == 0 ? 1 : statistics.characters)
        ).toLocaleString(theLanguage, {
          style: "percent",
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
      .html(_("statistics_charactersInObjects")),
  );

  return $grid;
}

/**
 * collect all form values
 *
 * @returns {Array} search text or collection name, decoration values, search and filter values
 */
function collectContent() {
  let decoration = {};
  for (let [mod, tags] of Object.entries(TreeDecoration.modTags)) {
    if ($(`#${mod}`).prop("checked")) {
      decoration[mod] = true;
    }
  }
  decoration.color = $("#color").val();
  decoration.icon = $("#iconSwitch").prop("checked");
  if (decoration.icon) {
    decoration.iconName = $("input:radio[name=iconsRadio]:checked").val();
    decoration.iconColor = $("#iconColor").val() || "#000000";
    decoration.stack = $("#iconStack").val();
    decoration.stackColor = $("#stackColor").val() || "#000000";
  }

  let search = null;
  if (theCollection.search) {
    search = {};
    search.text = $("#searchText").val(); // || theCollection.search.text;
    search.case = $("#searchCase").prop("checked");
    search.word = $("#searchWord").prop("checked");
    search.regex = $("#searchRegex").prop("checked");
    search.filters = theFilter.filters;
    if (search.text == "" && !search.filters.length) {
      search = theCollection.search;
    }
  }

  return [
    // theCollection.search ? search.text :
    $("#collectionName").val(),
    decoration,
    search,
  ];
}

/**
 * check if form content is changed
 */
function contentChanged() {
  return (
    JSON.stringify(collectContent()) !=
    JSON.stringify([
      theCollection.name,
      theCollection.decoration,
      theCollection.search,
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
function saveContent() {
  if (contentChanged()) {
    ipcRenderer.invoke("mainProcess_saveCollection", [
      theCollection.id,
      ...collectContent(),
    ]);
  }
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
 * undisplay the icon popup
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
 * check if search text is valid regular expression
 *
 * @returns {Boolean}
 */
function checkSearchRegex() {
  $("#searchText")[0].setCustomValidity("");
  if ($("#searchRegex").prop("checked")) {
    try {
      RegExp(Util.escapeRegExpSearch($("#searchText").val()));
      return true;
    } catch (err) {
      $("#searchText")[0].setCustomValidity("?");
      return false;
    }
  }
  return true;
}

/**
 * validate all inputs and disable save if anything is invalid
 */
function validate() {
  let disabled = true;
  if (theFilter && theFilter.filters.length) {
    disabled = false;
  }
  if ($("#searchText").val().length) {
    disabled = !checkSearchRegex();
  }
  $(":input").filter(function () {
    if ($(this).is(":invalid")) {
      disabled = true;
    }
  });
  $("#saveButton1").attr("disabled", disabled);
  $("#saveButton2").attr("disabled", disabled);
}
