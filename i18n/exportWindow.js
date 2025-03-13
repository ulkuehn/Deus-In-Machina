/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for export window
 */

const { translationGeneral } = require("./include/general.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationTime } = require("./include/time.js");
const { translationEditorBars } = require("./include/editorBars.js");
const { translationPlaceholders } = require("./include/placeholders.js");
const {
  translationEditorContextMenu,
} = require("./include/editorContextMenu.js");

const translationExportWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationWindowTitles.de,
      ...translationEditorBars.de,
      ...translationTime.de,
      ...translationPlaceholders.de,
      ...translationEditorContextMenu.de,

      // profile tab
      exportWindow_profileTab: "Profile",
      exportWindow_addProfile: "neues Profil",
      exportWindow_copyProfile: "Profil kopieren",
      exportWindow_deleteProfile: "Profil löschen",
      exportWindow_saveProfile: "Profil speichern",
      exportWindow_confirmDeleteProfile: 'Profil "%{name}" wirklich löschen?',
      exportWindow_newProfile: "neues Profil (%{time})",
      exportWindow_profileCopy: 'Kopie von "%{name}"',
      exportWindow_profileName: "Profilname",
      exportWindow_profileCreated: "erzeugt am",
      exportWindow_profileChanged: "geändert am",
      exportWindow_previewButton: "Vorschau",
      exportWindow_exportButton: "Export",

      // document tab
      exportWindow_documentTab: "Dokument",
      exportWindow_exportType: "Ausgabeformat",
      exportWindow_typeTXT:
        "einfacher Text (ohne Absatz- und Zeichenformatierung)",
      exportWindow_typeHTML: "HTML (alle Formatierungen werden unterstützt)",
      exportWindow_typeRTF:
        "RTF (die meisten Formatierungen werden unterstützt)",
      exportWindow_typeDOCX:
        "DOCX (die meisten Formatierungen werden unterstützt)",
      exportWindow_documentEditor: "Dokumentenmuster",

      // texts tab
      exportWindow_textsTab: "Texte",
      exportWindow_exportTexts: "Textauswahl",
      exportWindow_allTexts: "alle Texte exportieren",
      exportWindow_checkedTexts: "die aktivierten Texte exportieren",
      exportWindow_ignoreEmptyTexts: "leere Texte ignorieren",
      exportWindow_useTextFormats: "Absatzformate verwenden",
      exportWindow_textEditor: "Textmuster",

      // object text tab
      exportWindow_objectTextTab: "Objektmarkierungen",
      exportWindow_exportObjectsText: "Objektauswahl",
      exportWindow_allObjects: "alle Objekte berücksichtigen",
      exportWindow_checkedObjects: "die aktivierten Objekte berücksichtigen",
      exportWindow_usedObjects: "die verwendeten Objekte berücksichtigen",
      exportWindow_noObjects: "kein Objekt berücksichtigen",
      exportWindow_useObjectFormats: "Objektformate verwenden",
      exportWindow_objectStartEditor: "Muster am Anfang einer Objektmarkierung",
      exportWindow_objectEndEditor: "Muster am Ende einer Objektmarkierung",

      // object tab
      exportWindow_objectTab: "Objekte",
      exportWindow_exportObjects: "Objektauswahl",
      exportWindow_exportCitationTexts: "verwende Zitate",
      exportWindow_allCitationTexts: "aus allen Texten",
      exportWindow_checkedCitationTexts: "aus den aktivierten Texten",
      exportWindow_coveredCitationTexts: "aus den exportierten Texten",
      exportWindow_objectEditor: "Objektmuster",

      // properties tab
      exportWindow_propertiesTab: "Objekteigenschaften",
      exportWindow_propertiesEditor: "Muster einer Objekteigenschaft",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationWindowTitles.en,
      ...translationEditorBars.en,
      ...translationTime.en,
      ...translationPlaceholders.en,
      ...translationEditorContextMenu.en,

      // profile tab
      exportWindow_profileTab: "Profiles",
      exportWindow_addProfile: "Add Profile",
      exportWindow_copyProfile: "Copy Profile",
      exportWindow_deleteProfile: "Delete Profile",
      exportWindow_saveProfile: "Save Profile",
      exportWindow_confirmDeleteProfile: 'Really delete Profile "%{name}"?',
      exportWindow_newProfile: "New Profile (%{time})",
      exportWindow_profileCopy: 'Copy of "%{name}"',
      exportWindow_profileName: "Profile name",
      exportWindow_profileCreated: "Created",
      exportWindow_profileChanged: "Last changed",
      exportWindow_previewButton: "Preview",
      exportWindow_exportButton: "Export",

      // document tab
      exportWindow_documentTab: "Document",
      exportWindow_exportType: "Export format",
      exportWindow_typeTXT: "Plain text (no paragraph or character formatting)",
      exportWindow_typeHTML: "HTML (all formatting is supported)",
      exportWindow_typeRTF: "RTF (most formatting is supported)",
      exportWindow_typeDOCX: "DOCX (most formatting is supported)",
      exportWindow_documentEditor: "Document Pattern",

      // texts tab
      exportWindow_textsTab: "Texts",
      exportWindow_exportTexts: "Text selection",
      exportWindow_allTexts: "export all Texts",
      exportWindow_checkedTexts: "export activated Texts",
      exportWindow_ignoreEmptyTexts: "ignore empty Texts",
      exportWindow_useTextFormats: "Use Paragraph formats",
      exportWindow_textEditor: "Text Pattern",

      // object text tab
      exportWindow_objectTextTab: "Object markings",
      exportWindow_exportObjectsText: "Object selection",
      exportWindow_allObjects: "include all Objects",
      exportWindow_checkedObjects: "include activated Objects",
      exportWindow_usedObjects: "include used Objects",
      exportWindow_noObjects: "include no Objects",
      exportWindow_useObjectFormats: "Use Object formats",
      exportWindow_objectStartEditor: "Pattern at beginning of Object marking",
      exportWindow_objectEndEditor: "Pattern at end of Object marking",

      // object tab
      exportWindow_objectTab: "Objects",
      exportWindow_exportObjects: "Object selection",
      exportWindow_exportCitationTexts: "use Quotes",
      exportWindow_allCitationTexts: "from all Texts",
      exportWindow_checkedCitationTexts: "from activated Texts",
      exportWindow_coveredCitationTexts: "from exported Texts",
      exportWindow_objectEditor: "Object Pattern",

      // properties tab
      exportWindow_propertiesTab: "Object Properties",
      exportWindow_propertiesEditor: "Object Property Pattern",
    },
  }),
};

function __(lang, ...x) {
  return translationExportWindow[lang](...x);
}

module.exports = { __ };
