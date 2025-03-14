/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for export editor window
 */

const { translationGeneral } = require("./include/general.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationEditorBars } = require("./include/editorBars.js");
const { translationPlaceholders } = require("./include/placeholders.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");

const translationExportEditorWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationWindowTitles.de,
      ...translationEditorBars.de,
      ...translationPlaceholders.de,
      ...translationEditorContextMenu.de,
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationWindowTitles.en,
      ...translationEditorBars.en,
      ...translationPlaceholders.en,
      ...translationEditorContextMenu.en,
    },
  }),
};

function __(lang, ...x) {
  return translationExportEditorWindow[lang](...x);
}

module.exports = { __ };
