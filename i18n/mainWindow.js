/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for main renderer window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationBusy } = require("./include/busy.js");
const { translationSettingDefaults } = require("./include/SettingDefaults.js");
const { translationSampleTexts } = require("./include/sampleTexts.js");
const { translationEditorBars } = require("./include/editorBars.js");
const { translationSearch } = require("./include/search.js");
const { translationSchemeValues } = require("./include/Scheme.js");
const { translationSchemeTypes } = require("./include/SchemeTypes.js");
const { translationDataTables } = require("./include/dataTables.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationCategories } = require("./include/categories.js");
const {
  translationObjectReferences,
} = require("./include/objectReferences.js");
const { translationFormats } = require("./include/formats.js");
const { translationObjects } = require("./include/objects.js");
const { translationTexts } = require("./include/texts.js");
const { translationTextCollections } = require("./include/textCollections.js");
const { translationProject } = require("./include/Project.js");
const { translationImage } = require("./include/image.js");
const { translationUnits } = require("./include/units.js");
const { translationPlaceholders } = require("./include/placeholders.js");
const { translationTour } = require("./include/Tour.js");
const { translationTests } = require("./include/Tests.js");

const translationMainWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationTime.de,
      ...translationBusy.de,
      ...translationSettingDefaults.de,
      ...translationEditorBars.de,
      ...translationSearch.de,
      ...translationDataTables.de,
      ...translationEditorContextMenu.de,
      ...translationWindowTitles.de,
      ...translationCategories.de,
      ...translationObjectReferences.de,
      ...translationFormats.de,
      ...translationObjects.de,
      ...translationTexts.de,
      ...translationTextCollections.de,
      ...translationProject.de,
      ...translationImage.de,
      ...translationSchemeTypes.de,
      ...translationSchemeValues.de,
      ...translationUnits.de,
      ...translationSampleTexts.de,
      ...translationPlaceholders.de,
      ...translationTour.de,
      ...translationTests.de,

      // for export
      mainWindow_defaultExportProfile: "Standardprofil",
      mainWindow_exportError: "Fehler beim Export",
      mainWindow_exportOpenError: `Datei "%{file}" konnte nicht geöffnet werden`,
      mainWindow_exportCloseError: `Datei "%{file}" konnte nicht geschlossen werden`,
      mainWindow_exportComplete: "Export abgeschlossen",
      mainWindow_exportSuccess: `Soll die Datei "%{file}" geöffnet werden?`,
      mainWindow_textName: "Text",
      mainWindow_citation: "Zitat",
      mainWindow_exportTitle: "%{title} - Export %{time}",
    },
  }),
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationTime.en,
      ...translationBusy.en,
      ...translationSettingDefaults.en,
      ...translationEditorBars.en,
      ...translationSearch.en,
      ...translationDataTables.en,
      ...translationEditorContextMenu.en,
      ...translationWindowTitles.en,
      ...translationCategories.en,
      ...translationObjectReferences.en,
      ...translationFormats.en,
      ...translationObjects.en,
      ...translationTexts.en,
      ...translationTextCollections.en,
      ...translationProject.en,
      ...translationImage.en,
      ...translationSchemeTypes.en,
      ...translationSchemeValues.en,
      ...translationUnits.en,
      ...translationSampleTexts.en,
      ...translationPlaceholders.en,
      ...translationTour.en,
      ...translationTests.en,

      // for export
      mainWindow_defaultExportProfile: "Default Profile",
      mainWindow_exportError: "Export Error",
      mainWindow_exportOpenError: "File %{file} couldn't be opened",
      mainWindow_exportCloseError: "File %{file} couldn't be closed",
      mainWindow_exportComplete: "Export finished",
      mainWindow_exportSuccess: `Open file "%{file}"?`,
      mainWindow_textName: "Text",
      mainWindow_citation: "Citation",
    },
  }),
};

function __(lang, ...x) {
  return translationMainWindow[lang](...x);
}

module.exports = { __ };
