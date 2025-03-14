/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for scheme editor window
 */

const { translationGeneral } = require("./include/general.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationEditorBars } = require("./include/editorBars.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");

const translationSchemeEditorWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationWindowTitles.de,
      ...translationEditorBars.de,
      ...translationEditorContextMenu.de,
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationWindowTitles.en,
      ...translationEditorBars.en,
      ...translationEditorContextMenu.en,
    },
  }),
};

function __(lang, ...x) {
  return translationSchemeEditorWindow[lang](...x);
}

module.exports = { __ };
