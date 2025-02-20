/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for distraction free window
 */

const { translationEditorBars } = require("./include/editorBars.js");
const { translationSearch } = require("./include/search.js");
const { translationTime } = require("./include/time.js");
const { translationSounds } = require("./include/Sounds.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");

const translationDFWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationEditorContextMenu.de,
      ...translationEditorBars.de,
      ...translationSearch.de,
      ...translationTime.de,
      ...translationSounds.de,
      distractionFreeWindow_width: "Breite des Editors",
      distractionFreeWindow_resetWidth: "auf Einstellungswert zurücksetzen",
      distractionFreeWindow_height: "Höhe des Editors",
      distractionFreeWindow_resetHeight: "auf Einstellungswert zurücksetzen",
      distractionFreeWindow_progress: "Veränderung %{words} W / %{chars} Z",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationEditorContextMenu.en,
      ...translationEditorBars.en,
      ...translationSearch.en,
      ...translationTime.en,
      ...translationSounds.en,
      distractionFreeWindow_width: "Editor width",
      distractionFreeWindow_resetWidth: "Reset to settings value",
      distractionFreeWindow_height: "Editor height",
      distractionFreeWindow_resetHeight: "Reset to settings value",
      distractionFreeWindow_progress: "Modification %{words} W / %{chars} C",
    },
  }),
};

function __(lang, ...x) {
  return translationDFWindow[lang](...x);
}

module.exports = { __ };
