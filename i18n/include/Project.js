/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for Project class
 */

const translationProject = {
  // German
  de: {
    project_saveErrorTitle: "Fehler beim Speichern des Projekts",
    project_saveErrorMessage: "%{path}",
    project_openErrorTitle: "Fehler beim Öffnen einer Datei",
    project_openErrorMessage:
      "%{path} ist keine gültige Projektdatei (%{error})",
    project_noInfoError: `Tabelle "info" fehlt`,
    project_noSoftwareInfoError: "Versionsinformationen fehlen",
    project_wrongSchemeError: "falsches Datenbankschema",
    project_nonExistingFile: `Die Datei "%{path}" ist nicht vorhanden`,
    project_nonWritableFile: `Die Datei "%{path}" ist nicht schreibbar`,
    project_createErrorTitle: "Fehler beim Anlegen der Datenbank",
    project_unsavedContent: "Das Projekt wurde geändert",
    project_saveChanges: "Änderungen speichern?",
    project_importErrorTitle: "Fehler beim Dateiimport",
    project_importDirTitle: "Verzeichnisimport",
    project_importDirError: [
      [
        0,
        0,
        `Keine Datei erfolgreich aus dem Verzeichnis "%{path}" importiert, denn`,
      ],
      [
        1,
        1,
        `Eine Datei erfolgreich aus dem Verzeichnis "%{path}" importiert, aber`,
      ],
      [
        2,
        null,
        `%{imported} Dateien erfolgreich aus dem Verzeichnis "%{path}" importiert, aber`,
      ],
    ],
    project_importReadError: `Fehler beim Lesen der Datei "%{file}"`,
    project_importTypeError: `Nicht unterstützter Typ der Datei "%{file}"`,
    project_importConversionError: `Fehler während des Konvertierens der Datei "%{file}"`,
    project_fileTypes: "unterstützte Dateitypen",
    project_allType: "alle Dateitypen",
    project_projectType: "%{name}-Dateien",
    project_exportTypes: "Standard-Dateityp",
  },
  // English
  en: {
    project_saveErrorTitle: "Error while saving Project",
    project_saveErrorMessage: "%{path}",
    project_openErrorTitle: "Error while opening File",
    project_openErrorMessage: "%{path} is no valid Project File (%{error})",
    project_noInfoError: `missing table "info"`,
    project_noSoftwareInfoError: "missing version information",
    project_wrongSchemeError: "wrong datenbase scheme",
    project_nonExistingFile: `File "%{path}" not found`,
    project_nonWritableFile: `File "%{path}" is not writable`,
    project_createErrorTitle: "Error while creating database",
    project_unsavedContent: "Project was changed",
    project_saveChanges: "Save changes?",
    project_importErrorTitle: "Error while importing File",
    project_importDirTitle: "Directory Import",
    project_importDirError: [
      [0, 0, `No File successfully imported from Directory "%{path}", as`],
      [
        1,
        1,
        `One File successfully imported from Directory "%{path}" importiert, but`,
      ],
      [
        2,
        null,
        `%{imported} Files successfully imported from Directory "%{path}", but`,
      ],
    ],
    project_importReadError: `Error while Reading File "%{file}"`,
    project_importTypeError: `Not supported File Type "%{file}"`,
    project_importConversionError: `Error while Converting File "%{file}"`,
    project_fileTypes: "supported File Types",
    project_allType: "all Files",
    project_projectType: "%{name} Files",
    project_exportTypes: "Standard File Type",
  },
};

module.exports = { translationProject };
