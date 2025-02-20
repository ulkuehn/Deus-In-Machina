/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of spelling correction window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/spellingCorrectionWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theEditorIndex;
let theTextIndex;
let theWordIndex;
let theWordPos;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {Number} editorIndex index of the current editor in the list of displayed editors
 * @param {Number} textIndex index of the current textlet within the current editor
 * @param {Number} wordIndex index of the current word within the current textlet
 * @param {Number} wordPos character position of the current word within the current textlet
 *
 */
ipcRenderer.on(
  "spellingCorrectionWindow_init",
  (event, [settings, editorIndex, textIndex, wordIndex, wordPos]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "spellingCorrectionWindow_init",
      { settings },
      { editorIndex },
      { textIndex },
      { wordIndex },
      { wordPos },
    ]);
    theLanguage = settings.language;
    theEditorIndex = editorIndex;
    theTextIndex = textIndex;
    theWordIndex = wordIndex;
    theWordPos = wordPos;

    let $grid = $("<div>").attr({
      style:
        "display:grid; grid-template-columns:240px; column-gap:10px; row-gap:10px; padding:10px",
    });
    $grid.append(
      $("<div>")
        .attr({ style: "grid-column:1; justify-self:right" })
        .html(_("spellingCorrectionWindow_misspelledWord")),
      $("<div>").attr({
        style: "grid-column:2; font-weight:bold",
        id: "misspelledWord",
      }),
      $("<div>")
        .attr({
          style: "grid-column:1; justify-self:right; align-self:center",
        })
        .html(_("spellingCorrectionWindow_correctedWord")),
      $("<div>")
        .attr({ style: "grid-column:2" })
        .append(
          $("<input>").attr({
            type: "text",
            id: "correctedWord",
            style: "width:100%",
            spellcheck: false,
            // correction must be single word made out of letters
            oninput: `$("#correctionButton").prop("disabled", $(this).val()=="" || $(this).val().match(/\\P{L}/u))`,
          }),
        ),
      $("<div>")
        .attr({ style: "grid-column:1; justify-self:right" })
        .html(_("spellingCorrectionWindow_spellingSuggestions")),
      $("<div>")
        .attr({ style: "grid-column:2" })
        .append(
          $("<select>").attr({
            class: "form-select",
            size: "5",
            id: "spellingSuggestions",
          }),
        ),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 2; justify-self:right; margin-top:20px",
        })
        .append(
          $("<button>")
            .attr({
              type: "button",
              class: "btn btn-primary",
              style: "margin-right:10px",
              onclick: "sendCorrection()",
              id: "correctionButton",
            })
            .html(_("spellingCorrectionWindow_correctMisspelled")),
          $("<button>")
            .attr({
              type: "button",
              class: "btn btn-outline-primary",
              style: "margin-right:10px",
              onclick: `ipcRenderer.invoke("mainProcess_nextMisspelledWord",[theEditorIndex,theTextIndex,theWordIndex,theWordPos,false,''])`,
            })
            .html(_("spellingCorrectionWindow_ignoreMisspelled")),
          $("<button>")
            .attr({
              type: "button",
              class: "btn btn-secondary",
              onclick: `ipcRenderer.invoke("mainProcess_nextMisspelledWord",[theEditorIndex,theTextIndex,theWordIndex,theWordPos,false,$("#misspelledWord").html()])`,
            })
            .html(_("spellingCorrectionWindow_notMisspelled")),
        ),
    );
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.spellcheckBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.spellcheckBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.spellcheckBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.spellcheckBackgroundColor || settings.generalBackgroundColor,
      })
      .append($grid);

    ipcRenderer.invoke("mainProcess_nextMisspelledWord", [
      theEditorIndex,
      theTextIndex,
      theWordIndex,
      theWordPos,
      false,
      "",
    ]);
  },
);

/**
 * send a correction to the editor
 */
function sendCorrection() {
  ipcRenderer.invoke("mainProcess_nextMisspelledWord", [
    theEditorIndex,
    theTextIndex,
    theWordIndex,
    // adapt wordPos for longer or shorter substitute (e.g. "colour"->"color": wordPos is one less)
    theWordPos +
      ($("#correctedWord").val().length - $("#misspelledWord").html().length),
    true,
    $("#correctedWord").val(),
  ]);
}

/**
 * receive info about a misspelled word
 *
 * @param {Number} editorIndex
 * @param {Number} textIndex
 * @param {Number} wordIndex
 * @param {Number} wordPos
 * @param {String} word misspelled word
 * @param {String[]} suggestions list of possible corrections
 */
ipcRenderer.on(
  "spellingCorrectionWindow_misspelledWord",
  (event, [editorIndex, textIndex, wordIndex, wordPos, word, suggestions]) => {
    theEditorIndex = editorIndex;
    theTextIndex = textIndex;
    theWordIndex = wordIndex;
    theWordPos = wordPos;
    $("#misspelledWord").html(word);
    $("#spellingSuggestions").empty();
    if (suggestions.length) {
      suggestions.forEach((suggestion) => {
        $("#spellingSuggestions").append(
          $("<option>")
            .attr({
              value: suggestion,
              onclick: `$("#correctedWord").val(this.value)`,
            })
            .html(suggestion),
        );
      });
      $("#spellingSuggestions").val(suggestions[0]);
      $("#correctedWord").val(suggestions[0]);
    }
  },
);

/**
 * tell when spell checking has finished (all text has been checked)
 */
ipcRenderer.on("spellingCorrectionWindow_spellCheckFinished", () => {
  ipcRenderer.invoke("mainProcess_infoMessage", [
    _("spellingCorrectionWindow_finishedTitle"),
    _("spellingCorrectionWindow_finishedMessage"),
  ]);
  ipcRenderer.invoke("mainProcess_closeModalWindow");
});
