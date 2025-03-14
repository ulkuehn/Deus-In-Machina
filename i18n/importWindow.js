/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for import window
 */

const { translationGeneral } = require("./include/general.js");
const { translationTime } = require("./include/time.js");
const { translationSettingTabs } = require("./include/settingTabs.js");

const translationImportWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationTime.de,
      ...translationSettingTabs.de,

      importWindow_import: "Alle Daten übernehmen",
      importWindow_selectAll: "alles auswählen",
      importWindow_unselectAll: "alles abwählen",
      importWindow_upConnect:
        "zusätzliche Elemente auswählen, so dass alle Gliederungsebenen verbunden sind",
      importWindow_texts: "Texte",
      importWindow_autoTexts:
        "Texte, die mit importierten Textsammlungen verbunden sind, werden automatisch importiert und können nicht abgewählt werden.",
      importWindow_noTexts: "Das Projekt %{project} hat keine Texte",
      importWindow_created: "erzeugt am %{time}",
      importWindow_changed: "geändert am %{time}",
      //
      importWindow_collections: "Textsammlungen",
      importWindow_clearCollections: "vorhandene Textsammlungen löschen",
      importWindow_noCollections:
        "Das Projekt %{project} hat keine Textsammlungen",
      //
      importWindow_objects: "Objekte",
      importWindow_autoObjects:
        "Objekte, die mit importierten Texten verbunden sind, werden automatisch importiert und können nicht abgewählt werden.",
      importWindow_noObjects: "Das Projekt %{project} hat keine Objekte",
      //
      importWindow_formats: "Absatzformate",
      importWindow_autoFormats:
        "Formate, die mit importierten Texten oder Objekten verbunden sind, werden automatisch importiert und können nicht abgewählt werden..",
      importWindow_clearFormats: "vorhandene Absatzformate löschen",
      importWindow_noFormats: "Das Projekt %{project} hat keine Absatzformate",
      //
      importWindow_words: "Liste korrekter Wörter",
      importWindow_noWords:
        "Die Liste korrekter Wörter des Projekts %{project} ist leer",
      importWindow_clearWords: "vorhandene Wörter löschen",
      //
      importWindow_exportProfiles: "Exportprofile",
      importWindow_clearExports: "vorhandene Profile löschen",
      //
      importWindow_settings: "Einstellungen",
      importWindow_clearSettings: "vorhandene Einstellungen löschen",
      importWindow_noSettings:
        "Das Projekt %{project} hat keine projektspezifischen Einstellungen",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationTime.en,
      ...translationSettingTabs.en,

      importWindow_import: "Import all Data",
      importWindow_selectAll: "select all",
      importWindow_unselectAll: "deselect all",
      importWindow_upConnect:
        "select additional elements to connect all levels",
      importWindow_texts: "Texts",
      importWindow_autoTexts:
        "The texts connected to the imported text collections are imported automatically and cannot be unchecked.",
      importWindow_noTexts: "Project %{project} has no Texts",
      importWindow_created: "created on %{time}",
      importWindow_changed: "last changed on %{time}",
      //
      importWindow_collections: "Text Collections",
      importWindow_clearCollections: "delete existing collections",
      importWindow_noCollections: "Project %{project} has no Collections",
      //
      importWindow_objects: "Objects",
      importWindow_autoObjects:
        "The objects connected to the imported texts are imported automatically and cannot be unchecked.",
      importWindow_noObjects: "Project %{project} has no Objects",
      //
      importWindow_formats: "Paragraph formats",
      importWindow_autoFormats:
        "The formats used in the imported texts or objects are imported automatically and cannot be unchecked.",
      importWindow_clearFormats: "delete existing formats",
      importWindow_noFormats: "Project %{project} has no Formats",
      //
      importWindow_words: "List of correct Words",
      importWindow_noWords:
        "Project %{project} has empty list of correct words",
      importWindow_clearWords: "delete existing list of correct words",
      //
      importWindow_exportProfiles: "Export Profiles",
      importWindow_clearExports: "delete existing profiles",
      //
      importWindow_settings: "Settings",
      importWindow_clearSettings: "delete existing settings",
      importWindow_noSettings:
        "Project %{project} has no project specific settings",
    },
  }),
};

function __(lang, ...x) {
  return translationImportWindow[lang](...x);
}

module.exports = { __ };
