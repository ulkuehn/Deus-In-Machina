/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for text search window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationSearch } = require("./include/search.js");
const { translationFilter } = require("./include/filter.js");

const translationTextSearchWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationTime.de,
      ...translationSearch.de,
      ...translationFilter.de,

      textSearchWindow_message: "Die Suche ausführen?",
      textSearchWindow_button: "Suche ausführen",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationTime.en,
      ...translationSearch.en,
      ...translationFilter.en,

      textSearchWindow_message: "Apply search?",
      textSearchWindow_button: "Apply search",
    },
  }),
};

function __(lang, ...x) {
  return translationTextSearchWindow[lang](...x);
}

module.exports = { __ };
