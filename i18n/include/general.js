/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for general terms
 */

const translationGeneral = {
  // German
  de: {
    general_answerNo: "Nein",
    general_answerYes: "Ja",
    general_saveButton: "Speichern",
    general_cancelButton: "Abbrechen",
    general_closeButton: "Schließen",
  },
  // English
  en: {
    general_answerNo: "No ", // for some reason we need to add a trailing space so that the value is not just "No" (which irritatingly leads to a non i18n-messageDialog)
    general_answerYes: "Yes ",
    general_saveButton: "Save",
    general_cancelButton: "Cancel",
    general_closeButton: "Close",
  },
};

if (typeof module != "undefined") {
  module.exports = { translationGeneral };
}
