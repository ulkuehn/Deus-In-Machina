/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of object search window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/objectSearchWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let searchState = null;
// global for realizing rowspan in result table
let tableObject = null;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 */
ipcRenderer.on("objectSearchWindow_init", (event, [settings]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "objectSearchWindow_init",
    { settings },
  ]);
  theLanguage = settings.language;

  // tabs
  let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
  let $content = $("<div>").attr({ class: "tab-content" });

  // search tab
  Util.addTab(
    $tabs,
    $content,
    true,
    "searchTab",
    _("objectSearchWindow_searchTab"),
    searchTab(),
  );

  // result tab
  Util.addTab(
    $tabs,
    $content,
    false,
    "resultTab",
    _("objectSearchWindow_resultTab"),
    `<table id="results" class="display" width="100%"></table>`,
  );
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.objectSearchBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.objectSearchBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        settings.objectSearchBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.objectSearchBackgroundColor || settings.generalBackgroundColor,
    })
    .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
    .append($content);

  // initialize tabs
  Util.initTabs();

  $("#searchText")[0].focus();
  $("#searchText").on("input", checkSearchRegex);
  $("#searchRegex").on("change", checkSearchRegex);

  // search result is displayed as data table (supress multiple object names, creating a kind of "rowspan" effect)
  $("#results").DataTable({
    drawCallback: () => {
      tableObject = null;
    },
    fnRowCallback: function (nRow, aData) {
      $("td:eq(0)", nRow).css(
        "visibility",
        tableObject == aData[0] ? "hidden" : "visible",
      );
      tableObject = aData[0];
    },
    searching: false,
    language: {
      info: _("dataTables_info"),
      infoEmpty: _("dataTables_empty"),
      emptyTable: _("objectSearchWindow_resultEmpty"),
      paginate: {
        first: _("dataTables_firstPage"),
        previous: _("dataTables_previousPage"),
        last: _("dataTables_lastPage"),
        next: _("dataTables_nextPage"),
      },
      lengthMenu: _("dataTables_lengthMenu"),
    },
    pagingType: "full_numbers",
    pageLength: 10,
    lengthMenu: [
      [5, 10, 25, -1],
      [5, 10, 25, _("dataTables_lengthAll")],
    ],
    autoWidth: false,
    columns: [
      {
        title: _("objectSearchWindow_resultName"),
        width: "20%",
      },
      {
        title: _("objectSearchWindow_resultInfo"),
        width: "20%",
        orderable: false,
      },
      { title: _("objectSearchWindow_resultValue"), orderable: false },
    ],
  });

  // when switching to result tab do a new search
  $(".nav-pills a[href='#resultTab']")[0].addEventListener(
    "show.bs.tab",
    (event) => {
      let state = getSearchState();
      // only do a new search if search parameters changed
      if (state != searchState) {
        searchState = state;
        ipcRenderer.invoke("mainProcess_objectSearch", [
          checkSearchRegex() ? $("#searchText").val() : "",
          $("#searchCase").prop("checked"),
          $("#searchWord").prop("checked"),
          $("#searchRegex").prop("checked"),
          $("#searchObjectNames").prop("checked"),
          $("#searchPropertyNames").prop("checked"),
          $("#searchValues").prop("checked"),
          $("#searchTexts").prop("checked"),
        ]);
      }
    },
  );
});

/**
 * current search with all controls and settings
 *
 * @returns {String} stringified json
 */
function getSearchState() {
  return JSON.stringify([
    $("#searchText").val(),
    $("#searchCase").prop("checked"),
    $("#searchWord").prop("checked"),
    $("#searchRegex").prop("checked"),
    $("#searchObjectNames").prop("checked"),
    $("#searchPropertyNames").prop("checked"),
    $("#searchValues").prop("checked"),
    $("#searchTexts").prop("checked"),
  ]);
}

/**
 * if search term is regexp check if it is valid
 *
 * @returns  {Boolean}
 */
function checkSearchRegex() {
  $("#searchText").css("background-color", "#ffffff");
  if ($("#searchRegex").prop("checked")) {
    try {
      RegExp(Util.escapeRegExpSearch($("#searchText").val()));
      return true;
    } catch (err) {
      $("#searchText").css("background-color", "#ff4040");
      return false;
    }
  }
  return true;
}

/**
 * search tab
 *
 * @returns {Object} jquery div
 */
function searchTab() {
  let $searchGrid = $("<div>").attr({
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
  // no input required (empty search possible to enable mere filtering)
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 6;",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" style="width:90%" id="searchText">`,
      ),
  );
  // options
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2; justify-self:end",
      })
      .html(`<input type="checkbox" class="form-check-input" id="searchCase">`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3",
      })
      .html(`<label for="searchCase">${_("search_withCase")}</label>`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:4; justify-self:end",
      })
      .html(`<input type="checkbox" class="form-check-input" id="searchWord">`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:5",
      })
      .html(`<label for="searchWord">${_("search_wholeWord")}</label>`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:6; justify-self:end",
      })
      .html(
        `<input type="checkbox" class="form-check-input" id="searchRegex">`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:7",
      })
      .html(`<label for="searchRegex">${_("search_withRegex")}</label>`),
  );

  // search covering
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 7; justify-self:stretch;",
        class: "section-header",
      })
      .html(_("objectSearchWindow_criteria")),
  );

  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2",
      })
      .html(
        `<input type="checkbox" class="form-check-input" checked id="searchObjectNames">`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 5",
      })
      .html(
        `<label for="searchObjectNames">${_("objectSearchWindow_objectNames")}</label>`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2",
      })
      .html(
        `<input type="checkbox" class="form-check-input" checked id="searchPropertyNames">`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 5",
      })
      .html(`<label for="searchPropertyNames">${_("objectSearchWindow_propertyNames")}</label>`),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2",
      })
      .html(
        `<input type="checkbox" class="form-check-input" checked id="searchValues">`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 5",
      })
      .html(
        `<label for="searchValues">${_("objectSearchWindow_values")} (${_("schemeTypes_text")}, ${_(
          "schemeTypes_editor",
        )}, ${_("schemeTypes_map")})</label>`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:2",
      })
      .html(
        `<input type="checkbox" class="form-check-input" checked id="searchTexts">`,
      ),
  );
  $searchGrid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 5",
      })
      .html(`<label for="searchTexts">${_("objectSearchWindow_texts")}</label>`),
  );

  return $searchGrid;
}

/**
 * display search result as data table
 */
ipcRenderer.on("objectSearchWindow_result", (event, results) => {
  let table = [];
  results.forEach((result) => {
    result.result.forEach((r) => {
      table.push([
        `<i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer; margin-right:10px" onclick="showObject('${
          result.id
        }',false)" oncontextmenu="showObject('${result.id}',true)" title="${_(
          "objectSearchWindow_showObject",
        )}")></i>${result.name}`,
        _(`objectSearchWindow_${r.type}`, { type: _(r.info) }),
        r.value[0] +
          `<span style="color:#000000; background-color:#ffff00">` +
          r.value[1] +
          "</span>" +
          r.value[2],
      ]);
    });
  });
  $("#results").DataTable().clear();
  $("#results").DataTable().rows.add(table).draw();
});

/**
 * display an object in a seperate window
 *
 * @param {String} id object id
 * @param {Boolean} close close this window?
 */
function showObject(id, close = false) {
  if (close) {
    ipcRenderer.invoke("mainProcess_closeModalWindow");
  }
  ipcRenderer.invoke("mainProcess_openObject", [id]);
}
