/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for main process
 */

const i18n = require("roddeh-i18n");
const { translationGeneral } = require("./include/general.js");
const { translationLanguages } = require("./include/languages.js");
const { translationWindowTitles } = require("./include/windowTitles.js");
const { translationObjectMenu } = require("./include/objectMenu.js");
const { translationTextMenu } = require("./include/textMenu.js");

const translationMainProcess = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationLanguages.de,
      ...translationWindowTitles.de,
      ...translationObjectMenu.de,
      ...translationTextMenu.de,

      // splash
      mainProcess_version: "Version %{version} (%{scheme})",

      // file menu
      mainProcess_menuFile: "Datei",
      mainProcess_menuFileNew: "Neues Projekt",
      mainProcess_menuFileOpen: "Projekt öffnen ...",
      mainProcess_menuFileSave: "Projekt speichern",
      mainProcess_menuFileSaveAs: "Projekt speichern unter ...",
      mainProcess_menuFileClose: "Projekt schließen",
      mainProcess_menuFileProjects: "Kürzliche Projekte",
      mainProcess_menuFileClearProjectsList: "Liste löschen",
      mainProcess_menuFileProperties: "Projekteigenschaften ...",
      mainProcess_menuFileImport: "Importieren",
      mainProcess_menuFileImportFile: "aus Datei ...",
      mainProcess_menuFileImportDir: "aus Verzeichnis ...",
      mainProcess_menuFileImportURL: "von Webseite ...",
      mainProcess_menuFileImportFromProject: "aus %{name}-Projekt ...",
      mainProcess_allFilter: "alle Dateien",
      mainProcess_projectFilter: "%{name}-Projektdateien",
      mainProcess_menuFileExport: "Exportieren ...",
      mainProcess_menuFileRecentExports: "Kürzliche Exporte",
      mainProcess_menuFileClearRecentExports: "Liste löschen",
      mainProcess_menuFileSettings: "Einstellungen ...",
      mainProcess_menuFileExit: "Beenden",

      // view menu
      mainProcess_menuView: "Ansicht",
      mainProcess_menuViewToggleLeft: "Textbereich anzeigen",
      mainProcess_menuViewToggleRight: "Objektbereich anzeigen",
      mainProcess_menuViewToggleBottom: "Zitatbereich anzeigen",
      mainProcess_menuViewAll: "vollständige Ansicht",
      mainProcess_menuViewEditorOnly: "nur den Editor anzeigen",
      mainProcess_menuViewFullScreen: "Vollbildansicht",
      mainProcess_menuViewDistractionFree: "Fokuseditor",

      // text editor menu
      mainProcess_menuEditor: "Editor",
      mainProcess_menuEditorWhereAmI: "Cursorstelle hervorheben",
      mainProcess_menuTextEditorFormats: "Absatzformate ...",
      mainProcess_menuTextEditorSpellcheck: "Rechtschreibkorrektur ...",
      mainProcess_menuTextEditorWordlist: "Liste korrekter Wörter ...",
      mainProcess_menuTextEditorLanguage: "Textsprache",
      mainProcess_menuTextEditorSetObjects: "Objekt(e) setzen",
      mainProcess_menuTextEditorUnsetObjects: "Objekt(e) entfernen",
      mainProcess_menuTextEditorUnsetAllObjects: "Alle Objekte entfernen",
      mainProcess_menuEditorPrint: "Editorinhalt drucken",
      mainProcess_menuEditorPrinter: "mittels Drucker ...",
      mainProcess_menuEditorPDF: "in PDF-Datei ...",

      // help menu
      mainProcess_menuHelp: "Hilfe",
      mainProcess_menuHelpGuide: "Rundgang",
      mainProcess_menuHelpWeb: "%{name}-Website",
      mainProcess_menuHelpAbout: "Über %{name}",

      // debug and test menu
      mainProcess_menuTest: "TEST",
      mainProcess_menuTestLorum: "Neuer Text mit %{length} Zeichen Blindtext",
      mainProcess_menuTestRandomTextTree:
        "ergänze zufällige Textstruktur (Gesamtlänge %{length} Zeichen)",
      mainProcess_menuTestRandomObjectFullStyle:
        "Neues Objekt (alle Objektstile)",
      mainProcess_menuTestRandomObjectSimpleStyle:
        "Neues Objekt (einfacher Objektstil)",
      mainProcess_menuTestRandomObjectTreeFullStyle:
        "ergänze zufällige Objektstruktur (alle Objektstile)",
      mainProcess_menuTestRandomObjectTreeSimpleStyle:
        "ergänze zufällige Objektstruktur (einfacher Objektstil)",
      mainProcess_menuTestSpreadObjects:
        "Markiere zufällige Passagen in den aktivierten Texte mit den aktivierten Objekten",
      mainProcess_menuTestSampleProjectDE: "deutsches Beispielprojekt",
      mainProcess_menuTestSampleProjectEN: "englisches Beispielprojekt",

      // confirm close by "x" action
      mainProcess_windowCloseTitle: `Fenster '%{title}' schließen`,
      mainProcess_windowCloseMessage: "Änderungen speichern?",
      mainProcess_windowCloseNoSave: "Verwerfen",
      mainProcess_windowCloseSave: "Speichern",
      mainProcess_cryptedTitle: " (verschlüsselt)",
      mainProcess_fileFilterImages: "Bilder",
      //
      mainProcess_fileNotFoundTitle: "Datei nicht gefunden",
      mainProcess_fileNotFoundMessage:
        'Die Datei "%{path}" existiert nicht (mehr)',
      mainProcess_projectTypeNew: "neues Projekt",
      mainProcess_projectTypeSave: "manuell gespeichert",
      mainProcess_projectTypeAuto: "automatisch gespeichert",
      mainProcess_projectTypeOpen: "geöffnet",

      // for printing
      mainWindow_printingError: "Fehler beim PDF-Druck",
      mainWindow_printingWriteError: `Datei "%{file}" konnte nicht erzeugt werden`,
      mainWindow_printingCloseError: `Datei "%{file}" konnte nicht geschlossen werden`,
      mainWindow_printingDone: "PDF-Druck erfolgreich",
      mainWindow_printingOpen: `Datei "%{file}" öffnen?`,
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationLanguages.en,
      ...translationWindowTitles.en,
      ...translationObjectMenu.en,
      ...translationTextMenu.en,

      // splash
      mainProcess_version: "Version %{version} (%{scheme})",

      // file menu
      mainProcess_menuFile: "File",
      mainProcess_menuFileNew: "New Project",
      mainProcess_menuFileOpen: "Open Project ...",
      mainProcess_menuFileSave: "Save Project",
      mainProcess_menuFileSaveAs: "Save Project as ...",
      mainProcess_menuFileClose: "Close Project",
      mainProcess_menuFileProjects: "Recent Projects",
      mainProcess_menuFileClearProjectsList: "Clear list",
      mainProcess_menuFileProperties: "Project Properties ...",
      mainProcess_menuFileImport: "Import",
      mainProcess_menuFileImportFile: "from file ...",
      mainProcess_menuFileImportDir: "from folder ...",
      mainProcess_menuFileImportURL: "from web page ...",
      mainProcess_menuFileImportFromProject: "from %{name} project ...",
      mainProcess_allFilter: "all files",
      mainProcess_projectFilter: "%{name} project files",
      mainProcess_menuFileExport: "Export ...",
      mainProcess_menuFileRecentExports: "Recent Exports",
      mainProcess_menuFileClearRecentExports: "Clear list",
      mainProcess_menuFileSettings: "Settings ...",
      mainProcess_menuFileExit: "Exit",

      // view menu
      mainProcess_menuView: "View",
      mainProcess_menuViewToggleLeft: "Show text area",
      mainProcess_menuViewToggleRight: "Show object area",
      mainProcess_menuViewToggleBottom: "Show reference area",
      mainProcess_menuViewAll: "Show all",
      mainProcess_menuViewEditorOnly: "Show Editor only",
      mainProcess_menuViewFullScreen: "Full screen",
      mainProcess_menuViewDistractionFree: "Focus mode",

      // text editor menu
      mainProcess_menuEditor: "Editor",
      mainProcess_menuEditorWhereAmI: "Highlight Cursor Position",
      mainProcess_menuTextEditorFormats: "Paragraph Formats ...",
      mainProcess_menuTextEditorSpellcheck: "Spellcheck ...",
      mainProcess_menuTextEditorWordlist: "List of correctly spelled words ...",
      mainProcess_menuTextEditorLanguage: "Language",
      mainProcess_menuTextEditorSetObjects: "Set Object(s)",
      mainProcess_menuTextEditorUnsetObjects: "Unset Object(s)",
      mainProcess_menuTextEditorUnsetAllObjects: "Remove all Objects",
      mainProcess_menuEditorPrint: "Print editor contents",
      mainProcess_menuEditorPrinter: "on Printer ...",
      mainProcess_menuEditorPDF: "to PDF file ...",

      // help menu
      mainProcess_menuHelp: "Help",
      mainProcess_menuHelpGuide: "Guided Tour",
      mainProcess_menuHelpWeb: "%{name} Website",
      mainProcess_menuHelpAbout: "About %{name}",

      // debug and test menu
      mainProcess_menuTest: "TEST",
      mainProcess_menuTestLorum: "New Dummy Text of length %{length}",
      mainProcess_menuTestRandomTextTree:
        "Insert Random Texts in Tree (%{length} total length)",
      mainProcess_menuTestRandomObjectFullStyle: "New Object (all Styles)",
      mainProcess_menuTestRandomObjectSimpleStyle: "New Object (simple Style)",
      mainProcess_menuTestRandomObjectTreeFullStyle:
        "Insert Random Objects in Tree (all Styles)",
      mainProcess_menuTestRandomObjectTreeSimpleStyle:
        "Insert Random Objects in Tree (simple Style)",
      mainProcess_menuTestSpreadObjects:
        "Mark random passages in Checked Texts with Checked Objects",
      mainProcess_menuTestSampleProjectDE: "German Sample Project",
      mainProcess_menuTestSampleProjectEN: "English Sample Project",

      // confirm close by "x" action
      mainProcess_windowCloseTitle: `Close Window '%{title}'`,
      mainProcess_windowCloseMessage: "Save changes?",
      mainProcess_windowCloseNoSave: "Discard",
      mainProcess_windowCloseSave: "Save",
      mainProcess_cryptedTitle: " (encrypted)",
      mainProcess_fileFilterImages: "Images",
      mainProcess_fileNotFoundTitle: "File not found",
      mainProcess_fileNotFoundMessage: `File "%{path}" doesn't exist (any longer)`,
      mainProcess_projectTypeNew: "New Project",
      mainProcess_projectTypeSave: "Saved by user",
      mainProcess_projectTypeAuto: "Saved automatically",
      mainProcess_projectTypeOpen: "Opened",

      // for printing
      mainWindow_printingError: "Printing to PDF Error",
      mainWindow_printingWriteError: "File %{file} couldn't be created",
      mainWindow_printingCloseError: "File %{file} couldn't be closed",
      mainWindow_printingDone: "Printing to PDF done",
      mainWindow_printingOpen: `Open file "%{file}"?`,
    },
  }),
};

function __(lang, ...x) {
  return translationMainProcess[lang](...x);
}

module.exports = { __ };
