/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for object window
 */

const { translationGeneral } = require("./include/general.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationTime } = require("./include/time.js");
const { translationSchemeValues } = require("./include/Scheme.js");
const { translationSchemeTypes } = require("./include/SchemeTypes.js");
const { translationSchemeMap } = require("./include/SchemeMap.js");
const { translationEditorBars } = require("./include/editorBars.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationDataTables } = require("./include/dataTables.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");
const { translationUnits } = require("./include/units.js");
const { translationSampleTexts } = require("./include/sampleTexts.js");
const { translationFormats } = require("./include/formats.js");
const { translationFonts } = require("./include/Fonts.js");
const { translationDecoration } = require("./include/decoration.js");
const {
  translationObjectReferences,
} = require("./include/objectReferences.js");

const translationObjectWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationWindowTitles.de,
      ...translationColorPicker.de,
      ...translationTime.de,
      ...translationDataTables.de,
      ...translationEditorContextMenu.de,
      ...translationUnits.de,
      ...translationFormats.de,
      ...translationDecoration.de,
      ...translationObjectReferences.de,
      ...translationSchemeValues.de,
      ...translationSchemeTypes.de,
      ...translationSchemeMap.de,
      ...translationSampleTexts.de,
      ...translationEditorBars.de,
      ...translationFonts.de,

      // info tab
      objectWindow_infoTab: "Allgemein",
      objectWindow_appearance: "Darstellung",
      objectWindow_name: "Name",
      objectWindow_infos: "Informationen",
      objectWindow_created: "Angelegt",
      objectWindow_changed: "Zuletzt geändert",
      objectWindow_path: "Pfad",
      // style tab
      objectWindow_styleTab: "Textstil",
      objectWindow_styles: "Stile",
      objectWindow_inheritedStyle: "vererbter Stil",
      objectWindow_effectiveStyle: "Ergebnisstil",
      // quotes tab
      objectWindow_quotesTab: "Textstellen",
      // overviewTab
      objectWindow_overviewTab: "Überblick",
      objectWindow_show: "zeige",
      objectWindow_showHeader: "Überschriften",
      objectWindow_showEmpty: "deaktivierte Eigenschaften",
      objectWindow_showParents: "übergeordnete Objekte",
      objectWindow_showChildren: "untergeordnete Objekte",
      // properties tab
      objectWindow_propertiesTab: "Eigenschaften",
      // scheme tab
      objectWindow_schemeTab: "Schema",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationWindowTitles.en,
      ...translationColorPicker.en,
      ...translationTime.en,
      ...translationDataTables.en,
      ...translationEditorContextMenu.en,
      ...translationUnits.en,
      ...translationFormats.en,
      ...translationDecoration.en,
      ...translationObjectReferences.en,
      ...translationSchemeValues.en,
      ...translationSchemeTypes.en,
      ...translationSchemeMap.en,
      ...translationSampleTexts.en,
      ...translationEditorBars.en,
      ...translationFonts.en,
      // info tab
      objectWindow_infoTab: "General",
      objectWindow_appearance: "Appearance",
      objectWindow_name: "Name",
      objectWindow_infos: "Information",
      objectWindow_created: "Created",
      objectWindow_changed: "Last changed",
      objectWindow_path: "Path",
      // style tab
      objectWindow_styleTab: "Style",
      objectWindow_styles: "Styles",
      objectWindow_inheritedStyle: "inherited Style",
      objectWindow_effectiveStyle: "effective Style",
      // quotes tab
      objectWindow_quotesTab: "Quotes",
      // overviewTab
      objectWindow_overviewTab: "Overview",
      objectWindow_show: "show",
      objectWindow_showHeader: "headers",
      objectWindow_showEmpty: "deactivated properties",
      objectWindow_showParents: "parent objects",
      objectWindow_showChildren: "child objects",
      // properties tab
      objectWindow_propertiesTab: "Properties",
      // scheme tab
      objectWindow_schemeTab: "Scheme",
    },
  }),
};

function __(lang, ...x) {
  return translationObjectWindow[lang](...x);
}

module.exports = { __ };
