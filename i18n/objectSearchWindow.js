/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for object search window
 */

const { translationDataTables } = require("./include/dataTables.js");
const { translationSearch } = require("./include/search.js");
const { translationFilter } = require("./include/filter.js");
const { translationSchemeTypes } = require("./include/SchemeTypes.js");

const translationObjectSearchWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationDataTables.de,
      ...translationSearch.de,
      ...translationFilter.de,
      ...translationSchemeTypes.de,

      objectSearchWindow_searchTab: "Suche",
      objectSearchWindow_resultTab: "Ergebnis",
      objectSearchWindow_criteria: "Suchkriterien",
      objectSearchWindow_objectNames: "Objektnamen",
      objectSearchWindow_searchObjectNames: `Name des Objekts`,
      objectSearchWindow_propertyNames: "Namen von Objekteigenschaften",
      objectSearchWindow_searchPropertyNames: `Name einer Eigenschaft (%{type})`,
      objectSearchWindow_values: "Inhalte von Objekteigenschaften",
      objectSearchWindow_searchValues: `Inhalt einer Eigenschaft (%{type})`,
      objectSearchWindow_texts:
        "Textstellen, mit denen das Objekt verbunden ist",
      objectSearchWindow_searchTexts: "Textstelle",
      objectSearchWindow_resultName: "Objekt",
      objectSearchWindow_resultInfo: "Fundinfo",
      objectSearchWindow_resultValue: "Fundstelle",
      objectSearchWindow_resultEmpty: "keine Objekte gefunden",
      objectSearchWindow_showObject:
        "Objekt anzeigen (Rechtsklick schließt Suchfenster)",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationDataTables.en,
      ...translationSearch.en,
      ...translationFilter.en,
      ...translationSchemeTypes.en,

      objectSearchWindow_searchTab: "Search",
      objectSearchWindow_resultTab: "Result",
      objectSearchWindow_criteria: "Search Criteria",
      objectSearchWindow_objectNames: "Object Names",
      objectSearchWindow_searchObjectNames: `Object Name`,
      objectSearchWindow_propertyNames: "Object Properties Names",
      objectSearchWindow_searchPropertyNames: `Name of %{type}-Property`,
      objectSearchWindow_values: "Object Properties Content",
      objectSearchWindow_searchValues: `Content of %{type}-Property`,
      objectSearchWindow_texts: "Text snippets connected to an Object",
      objectSearchWindow_searchTexts: "Text snippet",
      objectSearchWindow_resultName: "Object",
      objectSearchWindow_resultInfo: "Result info",
      objectSearchWindow_resultValue: "Result value",
      objectSearchWindow_resultEmpty: "no Objects found",
      objectSearchWindow_showObject:
        "Show Object (right click to close search window)",
    },
  }),
};

function __(lang, ...x) {
  return translationObjectSearchWindow[lang](...x);
}

module.exports = { __ };
