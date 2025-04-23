/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of text search window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/textSearchWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theFilter;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 */
ipcRenderer.on(
  "textSearchWindow_init",
  (event, [settings, objectList, statusList, typeList, userList]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "textSearchWindow_init",
      { settings },
      { objectList },
      { statusList },
      { typeList },
      { userList },
    ]);
    theLanguage = settings.language;

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
        .html(
          `<input type="checkbox" class="form-check-input" id="searchCase">`,
        ),
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
        .html(
          `<input type="checkbox" class="form-check-input" id="searchWord">`,
        ),
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

    // buttons
    let $buttonDiv = "";
    if (settings.closingType != "settingsWindow_closeByX") {
      $buttonDiv = $("<p>")
        .attr({
          style: "text-align:right",
        })
        .html(
          `<button type="button" class="btn btn-primary" id="searchButton" disabled onclick="doSearch(); closeWindow();">${_(
            "textSearchWindow_button",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button>`,
        );
    }

    $filterDiv = $(`<div>`);

    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.textSearchBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.textSearchBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.textSearchBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.textSearchBackgroundColor || settings.generalBackgroundColor,
      })
      .append(
        $("<div>")
          .append($searchGrid)
          .append($filterDiv)
          .append($buttonDiv)
          .css("margin", "20px"),
      );

    // filter
    theFilter = new Filter(
      $filterDiv,
      validate,
      [],
      objectList,
      statusList,
      typeList,
      userList,
    );

    $("#searchText")[0].focus();
    $("#searchText").on("input", checkSearchRegex);
    $("#searchRegex").on("change", checkSearchRegex);

    $("#searchText").on("input", validate);
    $("#searchRegex").on("change", validate);
  },
);

/**
 * check for valid regexp
 *
 * @returns {Boolean} true if not in regexp mode or search text is a valid regexp
 */
function checkSearchRegex() {
  $("#searchText").css("background-color", "");
  if ($("#searchRegex").prop("checked")) {
    try {
      RegExp(Util.escapeRegExpSearch($("#searchText").val()));
      return true;
    } catch (err) {
      $("#searchText").css("background-color", "#ff606080");
      return false;
    }
  }
  return true;
}

/**
 * validate all inputs and disable search if anything is invalid
 * also disable search if neither filter nor search input
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
  $("#searchButton").attr("disabled", disabled);
  return !disabled;
}

/**
 * search and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  doSearch();
  closeWindow();
});

/**
 * reply to main if contents is valid (and thus search can be done)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send(
    "mainProcess_isChanged",
    validate(),
    _("textSearchWindow_message"),
    _("general_answerYes"),
    _("general_answerNo"),
  );
});

/**
 * execute search
 */
function doSearch() {
  if (validate()) {
    ipcRenderer.invoke("mainProcess_textSearch", [
      $("#searchText").val(),
      $("#searchCase").prop("checked"),
      $("#searchWord").prop("checked"),
      $("#searchRegex").prop("checked"),
      theFilter.filters,
    ]);
  }
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}
