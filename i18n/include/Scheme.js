/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for Scheme class
 */

const translationSchemeValues = {
  // German
  de: {
    Scheme_addItem: "Eintrag hinzufügen",
    Scheme_removeItem: "Eintrag löschen",
    Scheme_moveItemUp: "nach oben schieben",
    Scheme_moveItemDown: "nach unten schieben",
    Scheme_name: "Bezeichnung",
    Scheme_type: "Typ",
    Scheme_parameters: "Parameter",
    Scheme_relationReverse: `Rückbeziehung <i class="fas fa-info-circle" title='Beschreibung der Beziehung des anderen Objekts zu diesem.\nWenn die Beziehung z.B. "Sohn von" ist, könnte die Rückbeziehung "Mutter/Vater von" lauten.\nWenn hier ein Text eingegeben wird, wird dies bei allen Objekt mit dieser Beziehung berücksichtigt.'></i>`,
    Scheme_editorHeight: "Höhe in Pixel",
    Scheme_checkTrue: "ja",
    Scheme_checkFalse: "nein",
    Scheme_rangeMin: "von",
    Scheme_rangeMax: "bis",
    Scheme_rangeStep: "Schrittweite",
    Scheme_rangeUnit: "Einheit",
    Scheme_rangeMinMax: "Wert zwischen %{min} und %{max}",
    Scheme_select: "Werte",
    Scheme_selectDefault: "Wert1#Wert2#Wert3#...",
    Scheme_selectList: "%{list}",
    Scheme_radio: "Optionen",
    Scheme_radioDefault: "ja#nein#vielleicht#...",
    Scheme_dateMinYear: "von Jahr",
    Scheme_dateMaxYear: "bis Jahr",
    Scheme_dateMin: "01.01.%{year}", // format must correspond to Scheme_dateFormat
    Scheme_dateMax: "31.12.%{year}",
    Scheme_dateFormat: "DD.MM.YYYY",
    Scheme_dateRangeSeparator: " ... ",
    Scheme_dateApply: "Speichern",
    Scheme_dateCancel: "Abbrechen",
    Scheme_dateWeek: "W",
    Scheme_dateFirstWeekday: "1", // first day of week, 0=Sun
    Scheme_mapHeight: "Höhe in Pixel",
    Scheme_overviewMap: "Übersicht",
    Scheme_locationLatLong: "%{lat} Breite, %{lng} Länge",
    Scheme_locationName: "Ort",
    Scheme_locationLat: "Breite",
    Scheme_locationLon: "Länge",
    Scheme_locationNoMarkers: "(keine Orte angegeben)",
    Scheme_locationMap: "Landkarte mit Zentrum",
    Scheme_locationOSM: "in Open Street Map anzeigen",
    Scheme_locationGMaps: "auf Google Maps anzeigen",
    Scheme_locationBing: "bei Bing Maps anzeigen",
    Scheme_fileName: "Dateipfad",
    Scheme_fileSize: "Dateigröße",
    Scheme_fileTime: "zuletzt geändert",
    Scheme_openFile: "neue Datei öffnen",
    Scheme_loadFile: "gespeicherten Inhalt ansehen",
    Scheme_showFile: "Datei im Ursprungsordner anzeigen (falls noch vorhanden)",
    Scheme_propertyName: "Bezeichnung",
    Scheme_propertyType: "Typ",
    Scheme_propertyContent: "Inhalt",
    Scheme_sortAlpha: "alphabetische Sortierung",
    Scheme_detach: "in eigenem Fenster öffnen",
    Scheme_showObject: "verbundenes Objekt anzeigen",
    Scheme_reverseInfo: `Rückbeziehung "%{relation}"`,
  },
  // English
  en: {
    Scheme_addItem: "Add Item",
    Scheme_removeItem: "Delete Item",
    Scheme_moveItemUp: "move up",
    Scheme_moveItemDown: "move down",
    Scheme_name: "Name",
    Scheme_type: "Type",
    Scheme_parameters: "Parameter",
    Scheme_relationReverse: `Reverse relation <i class="fas fa-info-circle" title='Description of the other object's relation to this one.\nE.g. if relating to some other object by "son of" the reverse relation might be "mother/father of".\nIf a description is given here any related object is affected automatically.'></i>`,
    Scheme_editorHeight: "Height in Pixels",
    Scheme_checkTrue: "yes",
    Scheme_checkFalse: "no",
    Scheme_rangeMin: "from",
    Scheme_rangeMax: "up to",
    Scheme_rangeStep: "Step",
    Scheme_rangeUnit: "Unit",
    Scheme_rangeMinMax: "Value between %{min} and %{max}",
    Scheme_select: "Values",
    Scheme_selectDefault: "Value1#Value2#Value3#...",
    Scheme_selectList: "%{list}",
    Scheme_radio: "Options",
    Scheme_radioDefault: "yes#no#maybe#...",
    Scheme_dateMinYear: "from Year",
    Scheme_dateMaxYear: "to Year",
    Scheme_dateMin: "01/01/%{year}", // format must correspond to Scheme_dateFormat
    Scheme_dateMax: "12/31/%{year}",
    Scheme_dateFormat: "MM/DD/YYYY",
    Scheme_dateRangeSeparator: " ... ",
    Scheme_dateApply: "Apply",
    Scheme_dateCancel: "Cancel",
    Scheme_dateWeek: "W",
    Scheme_dateFirstWeekday: "0", // first day of week, 0=Sun
    Scheme_mapHeight: "Height in Pixels",
    Scheme_overviewMap: "Overview",
    Scheme_locationLatLong: "%{lat} Latitude, %{lng} Longitude",
    Scheme_locationName: "Location",
    Scheme_locationLat: "Latitude",
    Scheme_locationLon: "Longitude",
    Scheme_locationNoMarkers: "(no locations)",
    Scheme_locationMap: "Map centered at",
    Scheme_locationOSM: "show in Open Street Map",
    Scheme_locationGMaps: "open with Google Maps",
    Scheme_locationBing: "open with Bing Maps",
    Scheme_fileName: "File path",
    Scheme_fileSize: "File size",
    Scheme_fileTime: "changed",
    Scheme_openFile: "Open File",
    Scheme_loadFile: "View saved Content",
    Scheme_showFile: "Show File in original Folder (if still present)",
    Scheme_propertyName: "Name",
    Scheme_propertyType: "Type",
    Scheme_propertyContent: "Content",
    Scheme_sortAlpha: "alphabetical order",
    Scheme_detach: "open in extra window",
    Scheme_showObject: "show connected object",
    Scheme_reverseInfo: `Reverse relation "%{relation}"`,
  },
};

module.exports = { translationSchemeValues };
