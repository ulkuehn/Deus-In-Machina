/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for text window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationStatistics } = require("./include/statistics.js");
const { translationDataTables } = require("./include/dataTables.js");
const { translationCategories } = require("./include/categories.js");
const { translationDecoration } = require("./include/decoration.js");
const {
  translationObjectReferences,
} = require("./include/objectReferences.js");
const { translationWordcloud } = require("./include/wordcloud.js");

const translationTextWindow = {
  // German
  "de": i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationColorPicker.de,
      ...translationTime.de,
      ...translationStatistics.de,
      ...translationDataTables.de,
      ...translationCategories.de,
      ...translationDecoration.de,
      ...translationObjectReferences.de,
      ...translationWordcloud.de,

      // info tab
      textWindow_infoTab: "Allgemein",
      textWindow_appearance: "Darstellung",
      textWindow_name: "Name",
      textWindow_properties: "Eigenschaften",
      textWindow_locked: "gesperrt",
      textWindow_infos: "Informationen",
      textWindow_created: "Angelegt",
      textWindow_changed: "Zuletzt geändert",
      textWindow_path: "Pfad",
      textWindow_collections: "Textlisten",
      textWindow_noCollections: "(in keiner Textliste enthalten)",
    },
  }),
  // English
  "en": i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationColorPicker.en,
      ...translationTime.en,
      ...translationStatistics.en,
      ...translationDataTables.en,
      ...translationCategories.en,
      ...translationDecoration.en,
      ...translationObjectReferences.en,
      ...translationWordcloud.en,

      // info tab
      textWindow_infoTab: "General",
      textWindow_appearance: "Appearance",
      textWindow_name: "Name",
      textWindow_properties: "Properties",
      textWindow_locked: "locked",
      textWindow_infos: "Information",
      textWindow_created: "Created",
      textWindow_changed: "Last changed",
      textWindow_path: "Path",
      textWindow_collections: "Text Collections",
      textWindow_noCollections: "(not part of any Text Collection)",
    },
  }),
};

function __(lang, ...x) {
  return translationTextWindow[lang](...x);
}

module.exports = { __ };
