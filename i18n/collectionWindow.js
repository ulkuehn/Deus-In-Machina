/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for collection window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationStatistics } = require("./include/statistics.js");
const { translationDataTables } = require("./include/dataTables.js");
const { translationSearch } = require("./include/search.js");
const { translationFilter } = require("./include/filter.js");
const { translationDecoration } = require("./include/decoration.js");
const { translationWordcloud } = require("./include/wordcloud.js");

const translationCollectionWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationColorPicker.de,
      ...translationTime.de,
      ...translationStatistics.de,
      ...translationDataTables.de,
      ...translationSearch.de,
      ...translationFilter.de,
      ...translationDecoration.de,
      ...translationWordcloud.de,

      // info tab
      collectionWindow_infoTab: "Allgemein",
      collectionWindow_appearance: "Darstellung",
      collectionWindow_name: "Name",
      collectionWindow_infos: "Informationen",
      collectionWindow_texts: "Texte",
      collectionWindow_noTexts: "(keine Texte)",
      collectionWindow_created: "Angelegt",
      collectionWindow_changed: "Zuletzt geändert",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationColorPicker.en,
      ...translationTime.en,
      ...translationStatistics.en,
      ...translationDataTables.en,
      ...translationSearch.en,
      ...translationFilter.en,
      ...translationDecoration.en,
      ...translationWordcloud.en,

      // info tab
      collectionWindow_infoTab: "General",
      collectionWindow_appearance: "Appearance",
      collectionWindow_name: "Name",
      collectionWindow_infos: "Information",
      collectionWindow_texts: "Texts",
      collectionWindow_noTexts: "(no Texts)",
      collectionWindow_created: "Created",
      collectionWindow_changed: "Last changed",
    },
  }),
};

function __(lang, ...x) {
  return translationCollectionWindow[lang](...x);
}

module.exports = { __ };
