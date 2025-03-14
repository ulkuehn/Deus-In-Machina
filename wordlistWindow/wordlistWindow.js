/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of word list window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/wordlistWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theWordList;
let originalWordList;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String[]} words
 */
ipcRenderer.on("wordlistWindow_init", (event, [settings, words]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "wordlistWindow_init",
    { settings },
    { words },
  ]);
  theLanguage = settings.language;

  theWordList = words;
  theWordList.sort(
    Intl.Collator(theLanguage, {
      numeric: true,
    }).compare,
  );
  originalWordList = JSON.stringify(theWordList);

  // contents
  let $grid = $("<div>").attr({
    style:
      "display:grid; grid-template-columns:35px auto 35px; column-gap:10px; row-gap:10px; padding:10px",
  });
  $grid.append(
    $("<div>")
      .attr({ style: "grid-column:1" })
      .append(
        $("<button>")
          .attr({
            type: "button",
            class: "btn btn-success btn-sm",
            onclick: `addWord($("#word").val())`,
          })
          .html(`<i class="fas fa-plus"></i>`),
      ),
    $("<div>")
      .attr({ style: "grid-column:2; align-self:center" })
      .append(
        $("<input>").attr({
          type: "text",
          class: "form-control form-control-sm",
          style: "width:100%",
          spellcheck: false,
          id: "word",
        }),
      ),
    $("<div>")
      .attr({ style: "grid-column:3" })
      .append(
        $("<button>")
          .attr({
            type: "button",
            class: "btn btn-danger btn-sm",
            onclick: `theWordList.splice($("#wordList").val(),1); fillList($("#wordList").val())`,
          })
          .html(`<i class="fas fa-minus"></i>`),
      ),
    $("<div>")
      .attr({ style: "grid-column:1/span 3" })
      .append(
        $("<select>").attr({
          class: "form-select",
          style: "height: calc(100vh - 120px)",
          size: "20",
          id: "wordList",
          onchange: `$("#word").val($("#wordList :selected").html())`,
        }),
      ),
  );

  // buttons
  if (settings.closingType != "settingsWindow_closeByX") {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 3",
        })
        .html(
          `<div style="display:flex; justify-content:flex-end"><div><button type="button" class="btn btn-primary" onclick="saveList(); closeWindow()">${_(
            "general_saveButton",
          )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
            "general_cancelButton",
          )}</button></div></div>`,
        ),
    );
  }
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.wordlistBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.wordlistBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        settings.wordlistBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.wordlistBackgroundColor || settings.generalBackgroundColor,
    })
    .append($grid);

  fillList(0);
});

/**
 * populate the select box
 *
 * @param {Number} selectIndex
 */
function fillList(selectIndex) {
  $("#wordList").empty();
  for (let i = 0; i < theWordList.length; i++) {
    $("#wordList").append(
      $("<option>").attr({ value: i }).html(theWordList[i]),
    );
  }
  if (selectIndex >= theWordList.length) {
    selectIndex = theWordList.length - 1;
  }
  if (selectIndex < 0) {
    selectIndex = 0;
  }
  $($("#wordList").children()[selectIndex]).prop("selected", true);
  $("#word").val(theWordList[selectIndex]);
}

/**
 * add a word to the list if it is not already in it
 *
 * @param {String} word
 */
function addWord(word) {
  if (word != "" && !word.match(/\s/) && !theWordList.includes(word)) {
    theWordList.push(word);
    theWordList.sort(
      Intl.Collator(theLanguage, {
        numeric: true,
      }).compare,
    );
    fillList(theWordList.indexOf(word));
  }
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
  return (
    originalWordList !=
    JSON.stringify(theWordList.sort(Intl.Collator().compare))
  );
}

/**
 * save content if changed
 */
function saveList() {
  if (isChanged()) {
    ipcRenderer.invoke("mainProcess_saveWordlist", [theWordList, false]);
  }
}

/**
 * save and close
 */
ipcRenderer.on("mainProcess_saveContent", () => {
  saveList();
  closeWindow();
});

/**
 * reply to main if contents is changed (and thus needs saving)
 */
ipcRenderer.on("mainProcess_checkIfChanged", (event) => {
  event.sender.send("mainProcess_isChanged", isChanged());
});
