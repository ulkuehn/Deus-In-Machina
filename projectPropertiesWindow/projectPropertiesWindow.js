/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of project properties window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/projectPropertiesWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let thePath;
let originalValues;
let originalPassword;
let originalCategories;
let theCategories;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} title project title
 * @param {String} subtitle
 * @param {String} author
 * @param {String} info
 * @param {Object} categories project categories for text status, type etc
 * @param {Object} statistics project statistics
 * @param {String[]} properties project properties e.g. meta info
 */
ipcRenderer.on(
  "projectPropertiesWindow_init",
  (
    event,
    [
      settings,
      title,
      subtitle,
      author,
      info,
      categories,
      statistics,
      properties,
    ],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "projectPropertiesWindow_init",
      { settings },
      { title },
      { subtitle },
      { author },
      { info },
      { categories },
      { statistics },
      { properties },
    ]);
    theLanguage = settings.language;
    thePath = properties[3];

    new Fonts().loadStandardFonts("..");

    originalValues = JSON.stringify([title, subtitle, author, info]);
    originalCategories = JSON.stringify(categories);
    originalPassword = properties[5];

    // create content
    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.propertiesBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.propertiesBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.propertiesBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.propertiesBackgroundColor || settings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content);

    // add title tab
    Util.addTab(
      $tabs,
      $content,
      true,
      "titleTab",
      _("projectPropertiesWindow_titleTab"),
      titleTab(settings.closingType != "settingsWindow_closeByX", [
        title,
        subtitle,
        author,
        info,
      ]),
    );

    // add project tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "projectTab",
      _("projectPropertiesWindow_projectTab"),
      projectTab(settings, properties),
    );

    // add categories tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "categoriesTab",
      _("projectPropertiesWindow_categoriesTab"),
      categoriesTab(
        categories,
        settings.palette,
        settings.closingType != "settingsWindow_closeByX",
      ),
    );
    // populate categories
    theCategories.populate();

    // add statistics tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "statisticsTab",
      _("statistics_statisticsTabName"),
      statisticsTab(statistics),
    );

    // add wordlist tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "wordlistTab",
      _("statistics_wordlistTabName"),
      `<table id="wordlist" class="display" width="100%"></table>`,
    );

    // add wordcloud tab
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

    Util.initTabs();

    // populate wordlist table
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

    // draw wordcloud
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

    // on password change check if both passwordd are equal
    $("#cryptoPassword1").on("input", () => {
      let col =
        $("#cryptoPassword1").val() != $("#cryptoPassword2").val()
          ? "#ffc0c0"
          : "";
      $("#cryptoPassword1").css("background-color", col);
      $("#cryptoPassword2").css("background-color", col);
    });
    $("#cryptoPassword2").on("input", () => {
      let col =
        $("#cryptoPassword1").val() != $("#cryptoPassword2").val()
          ? "#ffc0c0"
          : "";
      $("#cryptoPassword1").css("background-color", col);
      $("#cryptoPassword2").css("background-color", col);
    });
  },
);

/**
 * implement title tab
 *
 * @param {*} doButtons if to show save / abort buttons
 * @param {*} values
 * @returns {Object} jquery grid
 */
function titleTab(doButtons, values) {
  let $grid = $("<div>").attr({
    style:
      "display:grid; row-gap:25px; column-gap:10px; grid-template-columns:min-content",
  });

  [
    "projectPropertiesWindow_title",
    "projectPropertiesWindow_subtitle",
    "projectPropertiesWindow_author",
  ].forEach((item) => {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; place-self:center end;",
        })
        .html(_(item)),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; justify-self:stretch;",
        })
        .html(
          `<input type="text" class="form-control form-control-sm" spellcheck="false" class="form-control" id="${item}" value="${Util.escapeHTML(
            values.shift(),
          )}">`,
        ),
    );
  });

  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; place-self:start end;",
      })
      .html(_("projectPropertiesWindow_info")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:stretch;",
      })
      .html(
        `<textarea spellcheck="false" class="form-control form-control-sm" rows=5 id="projectPropertiesWindow_info">${values.shift()}</textarea>`,
      ),
  );

  // buttons
  if (doButtons) {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 2; justify-self:end;",
        })
        .html(
          `<button type="button" class="btn btn-primary" onclick="saveProperties(); closeWindow()">${_(
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
 * implement categories tab
 *
 * @param {*} doButtons if to show save / abort buttons
 * @returns {Object} jquery grid
 */
function categoriesTab(categories, palette, doButtons) {
  let $div = $("<div>");
  theCategories = new Categories($div, categories, palette);
  if (doButtons) {
    $div.append(
      $("<div>")
        .attr({
          style: "margin-top:20px; grid-column:1; justify-self:end;",
        })
        .html(
          `<p class="text-end"><button type="button" class="btn btn-primary" onclick="saveProperties(); closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></p>`,
        ),
    );
  }

  return $div;
}

/**
 * implement statistics tab
 *
 * @param {*} statistics
 * @returns {Object} jquery grid
 */
function statisticsTab(statistics) {
  let $grid = $("<div>").attr({
    style:
      "display:grid; row-gap:4px; column-gap:10px; grid-template-columns: 200px",
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
          style: "grid-column:1/span 1; justify-self:end;",
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

  // objects
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 2; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("statistics_objects")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(statistics.objects.toLocaleString(theLanguage)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_totalObjects", statistics.objects)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:end;",
      })
      .html(statistics.objectsWithTexts.toLocaleString(theLanguage)),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:start;",
      })
      .html(_("statistics_objectsWithTexts", statistics.objectsWithTexts)),
  );

  return $grid;
}

/**
 * implement project infos tab
 *
 * @param {*} settings
 * @param {*} project
 * @returns {Object} jquery grid
 */
function projectTab(settings, project) {
  let $grid = $("<div>").attr({
    style:
      "display:grid; row-gap:25px; column-gap:20px; grid-template-columns: 50px max-content",
  });

  // created
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-calendar-plus"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_created")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(
        project[0]
          ? new Timestamp(project[0]).toLocalString(
              settings.dateTimeFormatLong,
            ) +
              ` (${_("time_timePassed", {
                time: new Timestamp(project[0]).timeToNow(),
              })})`
          : "---",
      ),
  );

  // changed
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-calendar-check"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_changed")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(
        project[1]
          ? new Timestamp(project[1]).toLocalString(
              settings.dateTimeFormatLong,
            ) +
              ` (${_("time_timePassed", {
                time: new Timestamp(project[1]).timeToNow(),
              })})`
          : "---",
      ),
  );

  // version
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-hashtag"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_projectVersion")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(project[2] ? project[2] : "---"),
  );

  // location / path
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-folder-tree"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_location")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(
        project[3]
          ? `<i class="fa-solid fa-up-right-from-square" onclick="ipcRenderer.invoke('mainProcess_openFileInExplorer', thePath)" title="${_(
              "projectPropertiesWindow_exploreFileTitle",
            )}" style="cursor:pointer; margin-right:10px"></i>${project[3]}`
          : "---",
      ),
  );

  // size
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fa-solid fa-database"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_size")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(project[4] ? Util.formatBytes(project[4]) : "---"),
  );

  // software
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; justify-self:center;",
      })
      .html('<i class="fas fa-certificate"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_programVersion")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:start; align-self:center;",
      })
      .html(project[6] ? project[6] : "---"),
  );

  // password
  $grid.append(
    $("<div>")
      .attr({
        style:
          "grid-column:1/span 1; grid-row:7/span 2; justify-self:center; align-self:center",
      })
      .html('<i class="fa-solid fa-key"></i>'),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_password")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:stretch;",
      })
      .html(
        `<div class="input-group">
        <input type="password" class="form-control form-control-sm" style="line-height:24px" spellcheck="false" id="cryptoPassword1" value="${project[5]}">
        <span class="input-group-text" onmouseover="showPasswords()" onmouseout="hidePasswords()"><i class="fa-solid fa-eye-slash fa-fw"></i></span>
        </div>`,
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; justify-self:end; align-self:center;",
      })
      .html(_("projectPropertiesWindow_confirmPassword")),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1; justify-self:stretch;",
      })
      .html(
        `<div class="input-group">
        <input type="password" class="form-control form-control-sm" style="line-height:24px" spellcheck="false" id="cryptoPassword2" value="${project[5]}">
        <span class="input-group-text" onmouseover="showPasswords()" onmouseout="hidePasswords()"><i class="fa-solid fa-eye-slash fa-fw"></i></span>
        </div>`,
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
          `<button type="button" class="btn btn-primary" onclick="saveProperties(); closeWindow()">${_(
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
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * check if form content is changed
 */
function isChanged() {
  if (
    originalValues !=
    JSON.stringify([
      $("#projectPropertiesWindow_title").val(),
      $("#projectPropertiesWindow_subtitle").val(),
      $("#projectPropertiesWindow_author").val(),
      $("#projectPropertiesWindow_info").val(),
    ])
  ) {
    return true;
  }
  if (originalPassword != $("#cryptoPassword1").val()) {
    return true;
  }
  if (originalCategories != JSON.stringify(theCategories.lists)) {
    return true;
  }
  return false;
}

/**
 * save content if changed
 */
function saveProperties() {
  if (
    $("#cryptoPassword1").val() == $("#cryptoPassword2").val() &&
    isChanged()
  ) {
    ipcRenderer.invoke("mainProcess_saveProjectProperties", [
      $("#projectPropertiesWindow_title").val(),
      $("#projectPropertiesWindow_subtitle").val(),
      $("#projectPropertiesWindow_author").val(),
      $("#projectPropertiesWindow_info").val(),
      $("#cryptoPassword1").val(),
      theCategories.lists,
    ]);
  }
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveProperties();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  if ($("#cryptoPassword1").val() != $("#cryptoPassword2").val()) {
    // do not try to save as long as passwords do not match (sending undefined rather than true or false)
    event.sender.send("mainProcess_isChanged");
  } else {
    event.sender.send("mainProcess_isChanged", isChanged());
  }
});

/**
 * display passwords in the clear
 */
function showPasswords() {
  $("#cryptoPassword1").attr("type", "text");
  $("#cryptoPassword1 + span i").removeClass("fa-eye-slash");
  $("#cryptoPassword1 + span i").addClass("fa-eye");
  $("#cryptoPassword2").attr("type", "text");
  $("#cryptoPassword2 + span i").removeClass("fa-eye-slash");
  $("#cryptoPassword2 + span i").addClass("fa-eye");
}

/**
 * hide passwords
 */
function hidePasswords() {
  $("#cryptoPassword1").attr("type", "password");
  $("#cryptoPassword1 + span i").removeClass("fa-eye");
  $("#cryptoPassword1 + span i").addClass("fa-eye-slash");
  $("#cryptoPassword2").attr("type", "password");
  $("#cryptoPassword2 + span i").removeClass("fa-eye");
  $("#cryptoPassword2 + span i").addClass("fa-eye-slash");
}
