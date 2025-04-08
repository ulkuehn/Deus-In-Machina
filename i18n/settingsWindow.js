/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for settings window
 */

const { translationGeneral } = require("./include/general.js");
const { translationLanguages } = require("./include/languages.js");
const { translationSettingDefaults } = require("./include/SettingDefaults.js");
const { translationSampleTexts } = require("./include/sampleTexts.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationSettingTabs } = require("./include/settingTabs.js");
const { translationImage } = require("./include/image.js");
const { translationCategories } = require("./include/categories.js");
const { translationUnits } = require("./include/units.js");
const { translationSounds } = require("./include/Sounds.js");
const { translationFonts } = require("./include/Fonts.js");

const translationSettingsWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationLanguages.de,
      ...translationSettingDefaults.de,
      ...translationColorPicker.de,
      ...translationSettingTabs.de,
      ...translationCategories.de,
      ...translationUnits.de,
      ...translationImage.de,
      ...translationSampleTexts.de,
      ...translationSounds.de,
      ...translationFonts.de,

      // general
      "settingsWindow_globalSetting": "Globale Einstellung",
      "settingsWindow_projectSetting": "Projekteinstellung",
      "settingsWindow_switchProjectSetting":
        "Projekteinstellung (de)aktivieren",
      "settingsWindow_loadImage": "Bild laden",
      "settingsWindow_resetImage": "Bild zurücksetzen",

      // settingTabs_general
      "settingsWindow_generalSetup": "Verhalten und Aussehen",
      "settingsWindow_generalInfo":
        "Die Einstellungen in diesem Bereich gelten für das Programm als Ganzes. Sie wirken sich auf alle Projekte aus.",
      "settingsWindow_language": `Sprache <i class="fas fa-info-circle" title="Diese Einstellung betrifft sowohl die Programmoberfläche als auch die Standardsprache für die Rechtschreibkorrektur"></i>`,
      "settingsWindow_dateTimeFormatShort": `kompakter Zeitstempel <i class="fas fa-info-circle" title="Felder in eckigen Klammern\nz.B. [ D ].[ M ].[ YY ], [ h ]:[ mm ]\n\nYY: Jahr zweistellig\nYYYY: Jahr vierstellig\nM: Monat 1-12\nMM: Monat 01-12\nMMM: Monatsname kurz\nMMMM: Monatsname lang\nD: Tag 1-31\nDD: Tag 01-31\nDDD: Wochentag kurz\nDDDD: Wochentag lang\n\nh: Stunde 1-23\nhh: Stunde 01-23\nh12: Stunde 1-12\nmm: Minute 00-59\nss: Sekunde 00-59\nap: am/pm\nAP: AM/PM"></i>`,
      "settingsWindow_dateTimeFormatLong": `ausführlicher Zeitstempel <i class="fas fa-info-circle" title="Felder in eckigen Klammern\nz.B. [ DDDD ], [ DD ].[ MM ].[ YYYY ], [ hh ]:[ mm ]:[ ss ]\n\nYY: Jahr zweistellig\nYYYY: Jahr vierstellig\nM: Monat 1-12\nMM: Monat 01-12\nMMM: Monatsname kurz\nMMMM: Monatsname lang\nD: Tag 1-31\nDD: Tag 01-31\nDDD: Wochentag kurz\nDDDD: Wochentag lang\n\nh: Stunde 1-23\nhh: Stunde 01-23\nh12: Stunde 1-12\nmm: Minute 00-59\nss: Sekunde 00-59\nap: am/pm\nAP: AM/PM"></i>`,
      "settingsWindow_closingType": `Schließen von Fenstern <i class="fas fa-info-circle" title="eine Änderung wirkt noch nicht für dieses Fenster"></i>`,
      "settingsWindow_closeByButtons": "Speichern/Abbrechen-Button",
      "settingsWindow_closeByX": "Fenster-Schließen-Kreuz rechts oben",
      "settingsWindow_closeByBoth":
        "Speichern/Abbrechen-Button oder Fenster-Schließen-Kreuz",
      "settingsWindow_projectsListLength":
        "max. Anzahl der zuletzt verwendeten Projekte",
      "settingsWindow_exportsListLength":
        "max. Anzahl der zuletzt erzeugten Exporte",
      "settingsWindow_openRecentOnLaunch":
        "zuletzt verwendetes Projekt beim Start automatisch öffnen",
      "settingsWindow_autoSaveTime": "automatisches Speichern",
      "0_AST": "deaktiviert",
      "10_AST": "alle 10 Sekunden",
      "30_AST": "alle 30 Sekunden",
      "60_AST": "jede Minute",
      "120_AST": "alle 2 Minuten",
      "300_AST": "alle 5 Minuten",
      "600_AST": "alle 10 Minuten",
      "settingsWindow_palette": "Farbpalette",
      "materialUI": "Material UI (große Palette)",
      "libreOfficeStandard": "Libre Office Standard (mittlere Palette)",
      "spectrumColorPicker": "Spectrum Color Picker (kleine Palette)",
      "noPalette": "ohne (keine Palette)",
      "settingsWindow_splash": "Splash-Screen",
      "0_noSplash": "nicht anzeigen",
      "1_silentSplash": "anzeigen, ohne Sound",
      "3_fullSplash": "anzeigen, mit Sound",
      "settingsWindow_debug": "im Test- und Debug-Modus starten",
      "settingsWindow_generalManagement": "Verwaltung",
      "settingsWindow_resetGlobalSettings": `globale Einstellungen zurücksetzen <i class="fas fa-eraser"></i>`,
      "settingsWindow_resetGlobalSettingsInfo": `alle globalen Einstellungen auf ihre Standardwerte setzen <i class="fas fa-info-circle" title="die Projekteinstellungen bleiben erhalten"></i>`,
      "settingsWindow_clearProjectSettings": `Projekteinstellungen zurücksetzen <i class="fas fa-eraser"></i>`,
      "settingsWindow_clearProjectSettingsInfo": `alle projektspezifischen Einstellungen löschen <i class="fas fa-info-circle" title="anschließend greifen durchgehend die globalen Einstellungen"></i>`,

      // settingTabs_layout
      "settingsWindow_layoutGutters": "Fensterbereiche",
      "settingsWindow_gutterColor": "Farbe der Griffe",
      "settingsWindow_gutterSize": "Breite der Griffe",
      "settingsWindow_scrollbars": "Rollbalken",
      "settingsWindow_scrollbarThin": "schmale Darstellung",
      "settingsWindow_scrollbarStyle": "Farbstil",
      "sb_system": "Systemstandard",
      "sb_soft": "geringer Kontrast",
      "sb_hard": "hoher Kontrast",
      "settingsWindow_backgroundColors": "Hintergrundfarben im Hauptfenster",
      "settingsWindow_generalBackgroundColor": `Standard <i class="fas fa-info-circle" title="diese Farbe wird bei den Bereichen und Fenstern verwendet, bei denen keine eigene Auswahl getroffen wurde"></i>`,
      "settingsWindow_TTBackgroundColor": "Textnavigator",
      "settingsWindow_TCLBackgroundColor": "Textlistennavigator",
      "settingsWindow_TEBackgroundColor": `Editor <i class="fas fa-info-circle" title="der Hintergrund des Fokuseditors wird in dem entsprechenden Tab festgelegt"></i>`,
      "settingsWindow_ORBackgroundColor": "Objektreferenzen / Zitate",
      "settingsWindow_OTBackgroundColor": "Objektnavigator",
      "settingsWindow_windowBackgroundColors":
        "Hintergrundfarben von weiteren Fenstern",
      "settingsWindow_settingsBackgroundColor": "Einstellungen",
      "settingsWindow_objectBackgroundColor": "Objekteigenschaften",
      "settingsWindow_textBackgroundColor": "Texteigenschaften",
      "settingsWindow_propertiesBackgroundColor": "Projekteigenschaften",
      "settingsWindow_collectionBackgroundColor": "Textlisteneigenschaften",
      "settingsWindow_exportBackgroundColor": "Export",
      "settingsWindow_previewBackgroundColor": "Exportvorschau",
      "settingsWindow_formatsBackgroundColor": "Absatzformate",
      "settingsWindow_symbolsBackgroundColor": "Sonderzeichen",
      "settingsWindow_spellcheckBackgroundColor": "Rechtschreibung",
      "settingsWindow_wordlistBackgroundColor": "Wortliste",
      "settingsWindow_passwordBackgroundColor": "Passworteingabe",
      "settingsWindow_transferBackgroundColor": "Projektimport",
      "settingsWindow_importfromurlBackgroundColor": "Webimport",
      "settingsWindow_aboutBackgroundColor": "Über",
      "settingsWindow_imageBackgroundColor": "Bildeigenschaften",
      "settingsWindow_textSearchBackgroundColor": "Textsuche",
      "settingsWindow_objectSearchBackgroundColor": "Objektsuche",
      "settingsWindow_layoutWordcloud": "Wortwolke",
      "settingsWindow_wordcloudFont": "Schriftart",
      "settingsWindow_wordcloudColorScheme": "Farbschema",
      "settingsWindow_wordcloudColorLight": "Helle Zufallsfarben",
      "settingsWindow_wordcloudColorDark": "Dunkle Zufallsfarben",
      "settingsWindow_wordcloudColorUser": "Feste Wortfarbe",
      "settingsWindow_wordcloudColor": "Wortfarbe",
      "settingsWindow_wordcloudBackgroundColor": "Hintergrundfarbe",

      // settingTabs_editor
      "settingsWindow_editorInfo":
        "Diese Einstellungen betreffen den Editor im normalen Modus. Die Konfiguration des Fokuseditors erfolgt in einem gesonderten Tab.",
      "settingsWindow_editorGeneral": "Verhalten und Aussehen",
      "settingsWindow_selectionColor": "Textauswahlfarbe",
      "settingsWindow_selectionObjectColor": `Auswahlfarbe von mit Objekten verbundenem Text <i class="fas fa-info-circle" title="bei leerem Wert wird die Standard-Textauswahlfarbe verwendet"></i>`,
      "settingsWindow_selectionCheckedObjects":
        "nur bei aktivierten Objekten anwenden",
      "settingsWindow_selectionUnstyledObjects":
        "auch anwenden wenn Objektstile nicht angezeigt werden",
      "settingsWindow_showLogo": "zeige Logo bei leerem Editor",
      "settingsWindow_firstLineIndent": `optische Einrückung am Absatzanfang <i class="fas fa-info-circle" title="nicht beim ersten Absatz eines Texts oder nach Leerzeilen"></i>`,
      "settingsWindow_firstLineIndentFormats":
        "keine optische Einrückung bei Formatwechsel",
      "settingsWindow_autoSelectTreeItem":
        "Text im Textnavigator automatisch selektieren",
      "settingsWindow_lockedBackgroundColor":
        "Hintergrundfarbe gesperrter Texte",
      "settingsWindow_lockedOpacity": `Kontrast gesperrter Texte <i class="fas fa-info-circle" title="0 = kein Kontrast (unsichtbar), 100 = voller Kontrast (normal)"></i>`,
      "settingsWindow_editorBars": "Menü- und Statusleiste",
      "settingsWindow_contrastLevel": `Kontrast zum Editor <i class="fas fa-info-circle" title="negativ für dunklen Kontrast, positiv für hellen Kontrast, bei Wert 0 ohne Kontrast"></i>`,
      "settingsWindow_borderLine": "Trennlinie zum Editor",
      "settingsWindow_textPath":
        "gesamten Textpfad in der Statusleiste anzeigen",
      "settingsWindow_objectsOnOver":
        "zeige Objektnamen in der Statuszeile beim Berühren von Textstellen mit Objektbezug",
      "settingsWindow_objectsOnClick":
        "zeige Objektnamen in der Statuszeile beim Klicken auf Textstellen mit Objektbezug",
      "settingsWindow_objectsShowTime":
        "Anzeigedauer von Objektnamen in der Statuszeile",
      "settingsWindow_editorSeparator": "Trennlinie zwischen Texten",
      "settingsWindow_textSeparatorColor": `Farbe <i class="fas fa-info-circle" title="ohne Auswahl automatisch schwarz oder weiß je nach Hintergrundfarbe des Editors"></i>`,
      "settingsWindow_textSeparatorStyle": "Art",
      "none": "keine",
      "solid": "durchgezogen",
      "double": "doppelt",
      "dotted": "gepunktet",
      "dashed": "gestrichelt",
      "wavy": "wellenförmig",
      "settingsWindow_textSeparatorWidth": "Stärke",
      "settingsWindow_textSeparatorAbove": "Abstand zum Text davor",
      "settingsWindow_textSeparatorBelow": "Abstand zum Text danach",
      "settingsWindow_editorSearch": "Suchen und Ersetzen",
      "settingsWindow_searchWithRegex": "reguläre Ausdrücke ermöglichen",
      "settingsWindow_replaceAllConfirm":
        "Bestätigung vor Ersetzen aller Fundstellen",
      "settingsWindow_replaceBlinkBefore": `Blinken vor dem Ersetzen <i class="fas fa-info-circle" title="0 für kein Blinken"></i>`,
      "settingsWindow_replaceBlinkAfter": `Blinken nach dem Ersetzen  <i class="fas fa-info-circle" title="0 für kein Blinken"></i>`,
      "settingsWindow_replaceBlinkTime": "Blinkdauer",
      "settingsWindow_editorSpellcheck": "Rechtschreibprüfung",
      "settingsWindow_spellcheckDecorationColor": `Farbe der Unterkringelung <i class="fas fa-info-circle" title="ohne Auswahl keine Unterstreichung bzw. Standardunterstreichung wenn auch keine Texthervorhebung"></i>`,
      "settingsWindow_spellcheckDecorationThickness":
        "Dicke der Unterkringelung",
      "0_thin": "dünn",
      "5_medium": "mittel",
      "10_thick": "dick",
      "settingsWindow_spellcheckShadowColor": `Farbe der Texthervorhebung`,
      "settingsWindow_editorSpellCorrection": "Rechtschreibkorrektur",
      "settingsWindow_spellCorrectionSelectionColor": `Auswahlfarbe unbekannter Wörter <i class="fas fa-info-circle" title="ohne Auswahl Standard-Textauswahlfarbe"></i>`,
      "settingsWindow_spellCorrectionMovingWindow":
        "Korrekturfenster neben dem jeweiligen unbekannten Wort anzeigen",
      "settingsWindow_correctionBlinkBefore": `Blinken vor der Korrektur <i class="fas fa-info-circle" title="0 für kein Blinken"></i>`,
      "settingsWindow_correctionBlinkAfter": `Blinken nach der Korrektur <i class="fas fa-info-circle" title="0 für kein Blinken"></i>`,
      "settingsWindow_correctionBlinkTime": "Blinkdauer",
      "settingsWindow_spellCorrectionRestoreSelection":
        "Textauswahl am Ende der Rechtschreibkorrektur wiederherstellen",
      "settingsWindow_editorContextMenu": "Kontextmenü",
      "settingsWindow_editorCompactContextMenu": "verwende Untermenüs",
      "settingsWindow_editorContextMenuStats": "Textstatistik anzeigen",
      "settingsWindow_editorContextMenuTime":
        "Zeitpunkte anzeigen (erzeugt, verändert)",
      "noTime": "nein",
      "compactTime": "kompakt (eine Zeile)",
      "fullTime": "ausführlich (zwei Zeilen)",
      "settingsWindow_editorContextMenuFormat": "Zeichenformatierung anzeigen",
      "settingsWindow_editorContextMenuWeb": `Webtools <i class="fas fa-info-circle" title="Name::URL, in URL wird '$' durch die jeweilige Selektion ersetzt"></i>`,
      "settingsWindow_editorFormats": "Absatzformate",
      "settingsWindow_previewFormats": "Absatzformat bei Auswahl anzeigen",
      "settingsWindow_editorFormatSample": "Mustertext für die Absätze",

      // settingTabs_focusEditor
      "settingsWindow_focusEditorInfo":
        "Diese Einstellungen betreffen den Editor im ablenkungsfreien Modus. Die Konfiguration des integrierten Editors erfolgt in einem gesonderten Tab.",
      "settingsWindow_focusEditorGeneral": "Verhalten und Aussehen",
      "settingsWindow_focusEditorAnimation": "langsames Öffnen und Schließen",
      "settingsWindow_focusEditorWidth": "relative Breite des Editors",
      "settingsWindow_focusEditorHeight": "relative Höhe des Editors",
      "settingsWindow_focusEditorObjects": "Objektmarkierungen anzeigen",
      "settingsWindow_focusEditorContextMenuWeb": "Webtools im Kontextmenü",
      "settingsWindow_focusEditorBackgrounds": "Hintergrund",
      "settingsWindow_focusEditorBarColor":
        "Hintergrundfarbe der Menü- und der Statusleiste",
      "settingsWindow_focusEditorWallpaperColor": `Hintergrundfarbe des Fensters <i class="fas fa-info-circle" title="leere Farbe auswählen, um ein Hintergrundbild anzuzeigen"></i>`,
      "settingsWindow_focusEditorWallpaper": `Hintergrundbild des Fensters <i class="fas fa-info-circle" title="wird nur angezeigt, wenn keine Hintergrundfarbe ausgewählt ist"></i>`,
      "settingsWindow_focusEditorWallpaperOpacity":
        "Deckkraft des Fensterhintergrundbilds",
      "settingsWindow_focusEditorBackgroundColor": `Hintergrundfarbe des Editors <i class="fas fa-info-circle" title="leere Farbe auswählen, um ein Hintergrundbild anzuzeigen"></i>`,
      "settingsWindow_focusEditorBackground": `Hintergrundbild des Editors <i class="fas fa-info-circle" title="wird nur angezeigt, wenn keine Hintergrundfarbe ausgewählt ist"></i>`,
      "settingsWindow_focusEditorBackgroundOpacity":
        "Deckkraft des Editorhintergrundbilds",
      "settingsWindow_focusEditorSounds": "Hintergrundgeräusche",
      "settingsWindow_focusEditorSoundOn": "beim Öffnen automatisch abspielen",

      // settingTabs_textTree
      "settingsWindow_textTreeStyle": "Darstellung",
      "settingsWindow_textTreeEmptyIcon": `Kennzeichnung leerer Texte <i class="fa-solid fa-text-slash">`,
      "settingsWindow_always": "immer",
      "settingsWindow_leaves": "nur unterste Gliederungsebene",
      "settingsWindow_never": "nie",
      "settingsWindow_textTreeLockedIcon": `Kennzeichnung gesperrter Texte <i class="fas fa-lock"></i>`,
      "settingsWindow_textTreeSmall": "kompakte Darstellung",
      "settingsWindow_textTreeDots": "Hilfslinien anzeigen",
      "settingsWindow_textTreeWholerow": "ganze Zeile hervorheben",
      "settingsWindow_textTreeSelectionColor":
        "Hintergrundfarbe ausgewählter Texte",
      "settingsWindow_textTreeSelectionBorder": "Hintergrund nicht füllen",
      "settingsWindow_textTreeHoverColor": "Hintergrundfarbe bei Mauskontakt",
      "settingsWindow_textTreeContextMenu": "Kontextmenü",
      "settingsWindow_textTreeCompactContextMenu": "verwende Untermenüs",
      "settingsWindow_textTreeContextMenuStats": "Textgröße anzeigen",
      "settingsWindow_textTreeContextMenuBranchStats": `auch Größensummen anzeigen <i class="fas fa-info-circle" title="bei Zweigen"></i>`,
      "settingsWindow_textTreeContextMenuTime":
        "Zeitpunkte anzeigen (erzeugt, verändert)",
      "settingsWindow_textTreeNameWords":
        "Anzahl von Wörtern für die Namenserzeugung",
      "settingsWindow_textTreeDecorationStatus": "Textstatus",
      "settingsWindow_textTreeShowStatus": "Icon anzeigen",
      "settingsWindow_textTreeShowNoStatus":
        "Icon auch bei nicht gesetztem Textstatus anzeigen",
      "settingsWindow_textTreeShowStatusForm": "Form des Icons",
      "circle": "Kreis",
      "square": "Quadrat",
      "heart": "Herz",
      "comment": "Denkblase",
      "star": "Stern",
      "bookmark": "Lesezeichen",
      "bell": "Glocke",
      "clipboard": "Schreibbrett",
      "clock": "Uhr",
      "flag": "Fahne",
      "user": "Figur",
      "settingsWindow_textTreeDecorationType": "Texttyp",
      "settingsWindow_textTreeShowType": "Icon anzeigen",
      "settingsWindow_textTreeShowNoType":
        "Icon auch bei nicht gesetztem Texttyp anzeigen",
      "settingsWindow_textTreeShowTypeForm": "Form des Icons",
      "settingsWindow_textTreeDecorationUser": "Benutzerspezische Kategorie",
      "settingsWindow_textTreeShowUser": "Icon anzeigen",
      "settingsWindow_textTreeShowNoUser":
        "Icon auch bei nicht gesetztem Wert anzeigen",
      "settingsWindow_textTreeShowUserForm": "Form des Icons",
      "settingsWindow_textTreeProperties": "Texteigenschaften",
      "settingsWindow_textsHighlightCheckedObjects":
        "aktivierte Objekte hervorheben",

      // settingTabs_textCollectionTree
      "settingsWindow_textCollectionStyle": "Darstellung",
      "settingsWindow_textCollectionTreeEmptyIcon": `Kennzeichnung leerer Textlisten <span class="fa fa-stack"><i class="fa-solid fa-list fa-stack-1x"></i><i class="fa-solid fa-slash fa-stack-1x"></i></span>`,
      "settingsWindow_textCollectionTreeSmall": "kompakte Darstellung",
      "settingsWindow_textCollectionTreeAutoActivate":
        "Texte aktivieren, wenn die Liste aktiviert wird",
      "settingsWindow_textCollectionTreeShowSearchProperties":
        "Suchparameter bei Suchlisten anzeigen",
      "settingsWindow_textCollectionTreeNew": "Neue Textlisten",
      "settingsWindow_textCollectionTreeNewCollectionRandomColor":
        "zufällige Farbe",
      "settingsWindow_textCollectionTreeNewCollectionColor": `Standardfarbe <i class="fas fa-info-circle" title="nur wenn nicht zufällige Farbe gewählt"></i>`,
      "settingsWindow_textCollectionTreeNewSearchCollectionColor": `Farbe von Such- und Filterlisten <i class="fas fa-info-circle" title="nur wenn nicht zufällige Farbe gewählt"></i>`,
      "settingsWindow_textCollectionTreeNewCollectionEditor":
        "neue Liste öffnet Listeneigenschaften",
      "settingsWindow_textCollectionTreeContextMenu": "Kontextmenü",
      "settingsWindow_textCollectionCompactContextMenu": "verwende Untermenüs",
      "settingsWindow_textCollectionTreeContextMenuStats":
        "Textstatistiken anzeigen",
      "settingsWindow_textCollectionTreeContextMenuTime":
        "Zeitpunkte anzeigen (erzeugt, verändert)",

      // settingTabs_objectTree
      "settingsWindow_objectTreeStyle": "Darstellung",
      "settingsWindow_objectTreeEmptyIcon": `Kennzeichnung von Objekten ohne Textbezug <i class="fa-solid fa-link-slash">`,
      "settingsWindow_objectTreeSmall": "kompakte Darstellung",
      "settingsWindow_objectTreeDots": "Hilfslinien anzeigen",
      "settingsWindow_objectTreeWholerow": "ganze Zeile hervorheben",
      "settingsWindow_objectTreeSelectionColor":
        "Hintergrundfarbe ausgewählter Objekte",
      "settingsWindow_objectTreeSelectionBorder": "Hintergrund nicht füllen",
      "settingsWindow_objectTreeHoverColor": "Hintergrundfarbe bei Mauskontakt",
      "settingsWindow_objectTreeContextMenu": "Kontextmenü",
      "settingsWindow_objectTreeCompactContextMenu": "verwende Untermenüs",
      "settingsWindow_objectTreeContextMenuStats": "Objektstatistik anzeigen",
      "settingsWindow_objectTreeContextMenuTime":
        "Zeitpunkte anzeigen (erzeugt, verändert)",
      "settingsWindow_objectTreeAction": "Neue Objekte",
      "settingsWindow_objectTreeNewObjectItalic": "Standardstil kursiv",
      "settingsWindow_objectTreeNewObjectUnderline":
        "Standardstil unterstrichen",
      "settingsWindow_objectTreeNewObjectColor": "Standardschriftfarbe",
      "settingsWindow_objectTreeProperties": "Objekteigenschaften",
      "settingsWindow_objectsHighlightCheckedTexts":
        "aktivierte Texte hervorheben",
      "settingsWindow_objectsShowParentScheme":
        "Schemaeinträge übergeordneter Objekte anzeigen",
      "settingsWindow_objectsTextSample": "Mustertext für Objektstil",

      // settingTabs_scheme
      "settingsWindow_schemeRelation": "Objektbeziehungen",
      "settingsWindow_relationSortAlpha": "Objekte alphabetisch sortieren",
      "settingsWindow_schemeEditor": "Editor",
      "settingsWindow_schemeEditorHeight": "Standardhöhe in Pixel",
      "settingsWindow_schemeMap": "Landkarte",
      "settingsWindow_schemeMapHeight": "Standardhöhe in Pixel",
      "settingsWindow_schemeMapMarkerColor":
        "Standardfarbe der Ortsmarkierungen",
      "settingsWindow_schemeMapMarkerConfirmDelete":
        "Löschen von Ortsmarkierungen bestätigen",
      "settingsWindow_schemeMapBounds": "Standardkartenausschnitt",

      // settingTabs_image
      "settingsWindow_imageDefaults": "Standardwerte bei neuen Bildern",
      "settingsWindow_imageShadow": "Schatteneffekt",
      "settingsWindow_imageAlignment": "Anordnung",
      "settingsWindow_imageWidth": `Bildbreite beim Einfügen begrenzen <i class="fas fa-info-circle" title="Wert 0 deaktiviert die Breitenbegrenzung"></i>`,
      "settingsWindow_imageHeight": `Bildhöhe beim Einfügen begrenzen <i class="fas fa-info-circle" title="Wert 0 deaktiviert die Höhenbegrenzung"></i>`,
      "settingsWindow_imageObjectReference": "Bilder in Objektreferenzen",
      "settingsWindow_imageReference": `Darstellung`,
      "imageReferenceFull": "wie im Editor",
      "imageReferenceThumb": "als Miniaturbild",
      "imageReferenceText": "Text mit Metadaten",
      "imageReferenceIcon": "Icon",
      "imageReferenceIconLarge": "großes Icon",
      "imageReferenceEmpty": "nichts",

      // settingTabs_import
      "settingsWindow_importFile": "Import aus Dateien",
      "settingsWindow_importName": `Benennung importierter Texte <i class="fas fa-info-circle" title="bei Import aus Datei '/a/b/c.html'\n- ist der Dateiname 'c'\n- der Dateiname mit Dateiendung ist 'c.html' und\n- der gesamte Dateipfad ist '/a/b/c.html'"></i>`,
      "importNameFile": "Dateiname",
      "importNameExt": "Dateiname mit Dateiendung",
      "importNamePath": "gesamter Dateipfad",
      "settingsWindow_importTree": "Verzeichnisimport",
      "importTreeFlat": "Verzeichisstruktur ignorieren",
      "importTreeTrimmed": "Verzeichnisse ohne Dateien ignorieren",
      "importTreeTree": "Verzeichisstruktur vollständig abbilden",
      "settingsWindow_importWeb": "Import aus dem Web",
      "settingsWindow_importNameWeb": `Benennung importierter Webseiten <i class="fas fa-info-circle" title="bei Import der Webseite mit dem Titel 'XYZ' von 'https://a.b.c/xyz.html'\n- ist der Seitentitel 'XYZ'\n- die URL ist 'https://a.b.c/xyz.html' und\n- der Domainname ist 'a.b.c'"></i>`,
      "importNameWebTitle": "Seitentitel (falls vorhanden)",
      "importNameWebURL": "URL der Seite",
      "importNameWebDomain": "Domainname",
      "settingsWindow_importSearch": `URL der Suchmaschine <i class="fas fa-info-circle" title="in der URL wird '$' durch den Suchtext ersetzt"></i>`,

      // settingTabs_export
      "settingsWindow_exportPlaceholders": "Platzhalter",
      "settingsWindow_exportPlaceholderBorderColor":
        "Rahmenfarbe von Platzhaltern",
      "settingsWindow_exportPlaceholderBackgroundColor":
        "Hintergrundfarbe von Platzhaltern",
      "settingsWindow_exportPlaceholderStuffing": "Begrenzungszeichen",
      "exportPlaceholderStuffingNone": "(ohne Begrenzungszeichen)",
      "settingsWindow_exportSample": "Stilprobe",
      "settingsWindow_exportTextSample": "Musterext",
      "settingsWindow_exportTexts": "Export im Textformat",
      "settingsWindow_exportTextImage": "Bilder beschreiben",
      "settingsWindow_exportSubstituteBold": "Fett ändern in",
      "settingsWindow_exportSubstituteItalic": "Kursiv ändern in",
      "settingsWindow_exportSubstituteUnderline": "Unterstrichen ändern in",
      "settingsWindow_exportSubstituteStrike": "Durchgestrichen ändern in",
      "exportSubstituteNone": "(ohne Änderung)",
      "exportSubstituteUpper": "GROSSBUCHSTABEN",
      "exportSubstituteSpaced": "G e s p e r r t",
      "exportSubstituteScored": "U_n_t_e_r_s_t_r_i_c_h_e_n",
      "exportSubstituteStriked": "D-u-r-c-h-g-e-s-t-r-i-c-h-e-n",
      "exportSubstituteUpperSpaced": "G E S P E R R T",
      "exportSubstituteUpperScored": "U_N_T_E_R_S_T_R_I_C_H_E_N",
      "exportSubstituteUpperStriked": "D-U-R-C-H-G-E-S-T-R-I-C-H-E-N",
      "settingsWindow_exportTableLineLength": "Tabellenbreite",
      "settingsWindow_exportMaps": "Export von Landkarten",
      "settingsWindow_exportRasterizeMaps": "graphische Darstellung",
      "noRaster": "ohne",
      "overviewRaster": "Übersichtskarte",
      "detailRaster": "Detailkarten",
      "fullRaster": "Übersichts- und Detailkarten",
      "settingsWindow_exportOverwiewmapWidth": "Breite der Übersichtskarte",
      "settingsWindow_exportOverwiewmapHeight": "Höhe der Übersichtskarte",
      "settingsWindow_exportOverwiewmapMaxZoom": "Maßstab der Übersichtskarte",
      "3_zoomLargeCountry": "Kontinent (ca. 1:70 Millionen)",
      "5_zoomMidCountry": "Großes Land (ca. 1:15 Millionen)",
      "7_zoomSmallCountry": "Kleines Land/Region (ca. 1:4 Millionen)",
      "9_zoomMetropolitanArea": "Metropolregion (ca. 1:1 Million)",
      "11_zoomCity": "Stadt (ca. 1:250.000)",
      "13_zoomVillage": "Ort/Stadtteil (ca. 1:70.000)",
      "15_zoomSmallRoad": "Straße (ca. 1:15.000)",
      "17_zoomBlock": "Wohnblock (ca. 1:4000)",
      "19_zoomHouse": "Gebäude (ca. 1:1000)",
      "settingsWindow_exportDetailmapWidth": "Breite der Detailkarten",
      "settingsWindow_exportDetailmapHeight": "Höhe der Detailkarten",
      "settingsWindow_exportDetailmapMaxZoom": "Maßstab der Detailkarten",

      // default categories tab
      "settingsWindow_categoriesInfo":
        "Hier werden die Standardwerte für verschiedene Texteigenschaften festgelegt. Es sind Kategorien Für den Bearbeitungsstand eines Texts und die Textart vorgesehen. Eine weitere Kategorie kann individuell genutzt werden.<br>Die hier eingestellten Standardwerte werden in neue Projekte übernommen. In den Projekteigenschaften können sie bei Bedarf projektspezifisch angepasst werden.",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationLanguages.en,
      ...translationSettingDefaults.en,
      ...translationColorPicker.en,
      ...translationSettingTabs.en,
      ...translationCategories.en,
      ...translationUnits.en,
      ...translationImage.en,
      ...translationSampleTexts.en,
      ...translationSounds.en,
      ...translationFonts.en,

      // general
      "settingsWindow_globalSetting": "Global Settings",
      "settingsWindow_projectSetting": "Project Settings",
      "settingsWindow_switchProjectSetting": "(de)activate Project Setting",
      "settingsWindow_loadImage": "Load Image",
      "settingsWindow_resetImage": "Reset Image",

      // settingTabs_general
      "settingsWindow_generalSetup": "General Setup",
      "settingsWindow_generalInfo":
        "These settings change the overall program behaviour. They affect all projects.",
      "settingsWindow_language": `Language <i class="fas fa-info-circle" title="This setting affects both the user interface and the standard language for spell correction"></i>`,
      "settingsWindow_dateTimeFormatShort": `short timestamp <i class="fas fa-info-circle" title="Use placeholders in brackets\ne.g. [ M ]/[ D ]/[ YY ], [ h ]:[ mm ]\n\nYY: Year (two figures)\nYYYY: Year (four figures)\nM: Month 1-12\nMM: Month 01-12\nMMM: Name of month, abbrev.\nMMMM: Name of month\nD: Day 1-31\nDD: Day 01-31\nDDD: Day of week, abbrev.\nDDDD: Day of week\n\nh: Houe 1-23\nhh: Hour 01-23\nh12: Hour 1-12\nmm: Minute 00-59\nss: Second 00-59\nap: am/pm\nAP: AM/PM"></i>`,
      "settingsWindow_dateTimeFormatLong": `long timestamp <i class="fas fa-info-circle" title="Use placeholders in brackets\ne.g. [ M ]/[ D ]/[ YY ], [ h ]:[ mm ]\n\nYY: Year (two figures)\nYYYY: Year (four figures)\nM: Month 1-12\nMM: Month 01-12\nMMM: Name of month, abbrev.\nMMMM: Name of month\nD: Day 1-31\nDD: Day 01-31\nDDD: Day of week, abbrev.\nDDDD: Day of week\n\nh: Houe 1-23\nhh: Hour 01-23\nh12: Hour 1-12\nmm: Minute 00-59\nss: Second 00-59\nap: am/pm\nAP: AM/PM"></i>`,
      "settingsWindow_closingType": `How to close Windows <i class="fas fa-info-circle" title="a change does not yet affect this window"></i>`,
      "settingsWindow_closeByButtons": "Save or Cancel Button",
      "settingsWindow_closeByX": "Cross in the upper right corner",
      "settingsWindow_closeByBoth":
        "Both Save/Cancel Buttons or Cross in the upper right corner",
      "settingsWindow_projectsListLength": "max. Number of recent Projects",
      "settingsWindow_exportsListLength": "max. Numer of recent Exports",
      "settingsWindow_openRecentOnLaunch": "open last used Project on Start",
      "settingsWindow_autoSaveTime": "Autosave",
      "0_AST": "deactivated",
      "10_AST": "every 10 Seconds",
      "30_AST": "every 30 Seconds",
      "60_AST": "every Minute",
      "120_AST": "every 2 Minutes",
      "300_AST": "every 5 Minutes",
      "600_AST": "every 10 Minutes",
      "settingsWindow_palette": "Color palette",
      "materialUI": "Material UI (large Palette)",
      "libreOfficeStandard": "Libre Office Standard (medium Palette)",
      "spectrumColorPicker": "Spectrum Color Picker (small Palette)",
      "noPalette": "none (no Palette)",
      "settingsWindow_splash": "Splash Screen",
      "0_noSplash": "hide",
      "1_silentSplash": "show, but silent",
      "3_fullSplash": "show and play sound",
      "settingsWindow_debug": "start in Test and Debug Mode",
      "settingsWindow_generalManagement": "Management",
      "settingsWindow_resetGlobalSettings": `reset global Settings <i class="fas fa-eraser"></i>`,
      "settingsWindow_resetGlobalSettingsInfo": `set all global Settings to their default values <i class="fas fa-info-circle" title="Project settings are nof affected by this"></i>`,
      "settingsWindow_clearProjectSettings": `reset Project Settings <i class="fas fa-eraser"></i>`,
      "settingsWindow_clearProjectSettingsInfo": `unset all Project Settings <i class="fas fa-info-circle" title="this will make the global Settings effective"></i>`,

      // settingTabs_layout
      "settingsWindow_layoutGutters": "Gutters",
      "settingsWindow_gutterColor": "Gutter color",
      "settingsWindow_gutterSize": "Gutter width",
      "settingsWindow_scrollbars": "Scrollbars",
      "settingsWindow_scrollbarThin": "Thin appearance",
      "settingsWindow_scrollbarStyle": "Color style",
      "sb_system": "System standard",
      "sb_soft": "low contrast",
      "sb_hard": "high contrast",
      "settingsWindow_backgroundColors": "Main window Background Colors",
      "settingsWindow_generalBackgroundColor": `Standard <i class="fas fa-info-circle" title="this color is used where no specific color is chosen"></i>`,
      "settingsWindow_TTBackgroundColor": "Text Navigator",
      "settingsWindow_TCLBackgroundColor": "Text Collection Navigator",
      "settingsWindow_TEBackgroundColor": `Editor <i class="fas fa-info-circle" title="the focus editor's background is set in the respective tab"></i>`,
      "settingsWindow_ORBackgroundColor": "Object References / Quotes",
      "settingsWindow_OTBackgroundColor": "Object Navigator",
      "settingsWindow_windowBackgroundColors":
        "Background Colors of additional Windows",
      "settingsWindow_settingsBackgroundColor": "Settings",
      "settingsWindow_objectBackgroundColor": "Object properties",
      "settingsWindow_textBackgroundColor": "Text properties",
      "settingsWindow_propertiesBackgroundColor": "Project properties",
      "settingsWindow_collectionBackgroundColor": "Text Collection properties",
      "settingsWindow_exportBackgroundColor": "Export",
      "settingsWindow_previewBackgroundColor": "Export Preview",
      "settingsWindow_formatsBackgroundColor": "Paragraph Formats",
      "settingsWindow_symbolsBackgroundColor": "Special Characters",
      "settingsWindow_spellcheckBackgroundColor": "Spellcheck",
      "settingsWindow_wordlistBackgroundColor": "Word list",
      "settingsWindow_passwordBackgroundColor": "Password",
      "settingsWindow_transferBackgroundColor": "Project Import",
      "settingsWindow_importfromurlBackgroundColor": "Web Import",
      "settingsWindow_aboutBackgroundColor": "About",
      "settingsWindow_imageBackgroundColor": "Image properties",
      "settingsWindow_textSearchBackgroundColor": "Text Search",
      "settingsWindow_objectSearchBackgroundColor": "Object Search",
      "settingsWindow_layoutWordcloud": "Wordcloud",
      "settingsWindow_wordcloudFont": "Font",
      "settingsWindow_wordcloudColorScheme": "Color Scheme",
      "settingsWindow_wordcloudColorLight": "Light Random Colors",
      "settingsWindow_wordcloudColorDark": "Dark Random Colors",
      "settingsWindow_wordcloudColorUser": "Fixed Word Color",
      "settingsWindow_wordcloudColor": "Word Color",
      "settingsWindow_wordcloudBackgroundColor": "Background Color",

      // settingTabs_editor
      "settingsWindow_editorInfo":
        "These settings apply to the regular editor. The focus edtor's settings are available in a seperate tab.",
      "settingsWindow_editorGeneral": "General",
      "settingsWindow_selectionColor": "Selection Color",
      "settingsWindow_selectionObjectColor": `Selection color of text connected to an object <i class="fas fa-info-circle" title="If not set standard selection color is used"></i>`,
      "settingsWindow_selectionCheckedObjects": "Apply only to checked objects",
      "settingsWindow_selectionUnstyledObjects":
        "also apply when object styles are not shown",
      "settingsWindow_showLogo": "show Logo on empty Editor",
      "settingsWindow_firstLineIndent": `first line indent <i class="fas fa-info-circle" title="not on first paragraph of a text or after blank lines"></i>`,
      "settingsWindow_firstLineIndentFormats":
        "no first line indent on format change",
      "settingsWindow_autoSelectTreeItem":
        "Automatically select Text in Navigator",
      "settingsWindow_lockedBackgroundColor":
        "Background Color of locked Texts",
      "settingsWindow_lockedOpacity": `Contrast of locked Texts <i class="fas fa-info-circle" title="0 = no contrast (invisible), 100 = full contrast (fully visible)"></i>`,
      "settingsWindow_editorBars": "Menu and Status bars",
      "settingsWindow_contrastLevel": `Contrast to the Editor <i class="fas fa-info-circle" title="negative for dark contrast, positive for light contrast, 0 for no contrast"></i>`,
      "settingsWindow_borderLine": "Border line to Editor",
      "settingsWindow_textPath": "Show full text path in Status bar",
      "settingsWindow_objectsOnOver":
        "show Object name in Status bar when pointing to a Text section connected to an activated Object",
      "settingsWindow_objectsOnClick":
        "show Object name in Status bar when clicking on a Text section connected to an activated Object",
      "settingsWindow_objectsShowTime":
        "Display duration of Object names in Status bar",
      "settingsWindow_editorSeparator": "Text seperator Line",
      "settingsWindow_textSeparatorColor": `Color <i class="fas fa-info-circle" title="if no color is selected it is set black or white according to the background color of the editor"></i>`,
      "settingsWindow_textSeparatorStyle": "Style",
      "none": "no line",
      "solid": "solid",
      "double": "double",
      "dotted": "dotted",
      "dashed": "dashed",
      "settingsWindow_textSeparatorWidth": "Width",
      "settingsWindow_textSeparatorAbove": "Distance to Text above",
      "settingsWindow_textSeparatorBelow": "Distance to Text below",
      "settingsWindow_editorSearch": "Search and Replace",
      "settingsWindow_searchWithRegex": "enable Regular Expressions",
      "settingsWindow_replaceAllConfirm": "Confirm global Replace",
      "settingsWindow_replaceBlinkBefore": `Blink selection before replacing <i class="fas fa-info-circle" title="select 0 for no blinking"></i>`,
      "settingsWindow_replaceBlinkAfter": `Blink selection after replacing <i class="fas fa-info-circle" title="select 0 for no blinking"></i>`,
      "settingsWindow_replaceBlinkTime": "Blinking time",
      "settingsWindow_editorSpellcheck": "Spell Checking",
      "settingsWindow_spellcheckDecorationColor": `Color of wavy underline <i class="fas fa-info-circle" title="without color no underline or standard underline when no text highlighting"></i>`,
      "settingsWindow_spellcheckDecorationThickness":
        "Strength of wavy underline",
      "0_thin": "thin",
      "5_medium": "medium",
      "10_thick": "thick",
      "settingsWindow_spellcheckShadowColor": `Color of text highlight`,
      "settingsWindow_editorSpellCorrection": "Spell Correction",
      "settingsWindow_spellCorrectionSelectionColor": `Selection Color of unknown Words <i class="fas fa-info-circle" title="if no value standard selection color is used"></i>`,
      "settingsWindow_spellCorrectionMovingWindow":
        "Move Spell Correction Window next to unknown Word",
      "settingsWindow_correctionBlinkBefore": `Blink selection before correction <i class="fas fa-info-circle" title="select 0 for no blinking"></i>`,
      "settingsWindow_correctionBlinkAfter": `Blink selection after correction <i class="fas fa-info-circle" title="select 0 for no blinking"></i>`,
      "settingsWindow_correctionBlinkTime": "Blinking time",
      "settingsWindow_spellCorrectionRestoreSelection":
        "Restore cursor selection at end of Spell Correction",
      "settingsWindow_editorContextMenu": "Context Menu",
      "settingsWindow_editorCompactContextMenu": "use Submenues",
      "settingsWindow_editorContextMenuStats": "Show Statistics",
      "settingsWindow_editorContextMenuTime":
        "Show Timestamps (created, last changed)",
      "noTime": "no",
      "compactTime": "compact (one line)",
      "fullTime": "extended (two lines)",
      "settingsWindow_editorContextMenuFormat": "Show Character Formating",
      "settingsWindow_editorContextMenuWeb": `Web Tools <i class="fas fa-info-circle" title="Name::URL, where a '$' sign in the URL is replaced by the current selection"></i>`,
      "settingsWindow_editorFormats": "Paragraph Formats",
      "settingsWindow_previewFormats": "Preview Format in Dropdown",
      "settingsWindow_editorFormatSample": "Sample Text for Paragraph Formats",

      // settingTabs_focusEditor
      "settingsWindow_focusEditorInfo":
        "These settings apply to the focus editor. Settings of the integrated editor are provided in a seperate tab.",
      "settingsWindow_focusEditorGeneral": "General",
      "settingsWindow_focusEditorAnimation": "animated Open and Close",
      "settingsWindow_focusEditorWidth": "Relative Width of Editor Pane",
      "settingsWindow_focusEditorHeight": "Relative Height of Editor Pane",
      "settingsWindow_focusEditorObjects": "Show Object Markings",
      "settingsWindow_focusEditorContextMenuWeb": "Webtools in Context Menu",
      "settingsWindow_focusEditorBackgrounds": "Background",
      "settingsWindow_focusEditorBarColor":
        "Background Color of Menu and Status Bar",
      "settingsWindow_focusEditorWallpaperColor": `Background Color of Window <i class="fas fa-info-circle" title="choose empty color to enable background image"></i>`,
      "settingsWindow_focusEditorWallpaper": `Background Image of Window <i class="fas fa-info-circle" title="displayed if no background color is chosen"></i>`,
      "settingsWindow_focusEditorWallpaperOpacity":
        "Opacity of Window Background Image",
      "settingsWindow_focusEditorBackgroundColor": `Background Color of Editor Pane <i class="fas fa-info-circle" title="choose empty color to enable background image"></i>`,
      "settingsWindow_focusEditorBackground": `Background Image of Editor Pane <i class="fas fa-info-circle" title="displayed if no background color is chosen"></i>`,
      "settingsWindow_focusEditorBackgroundOpacity":
        "Opacity of Editor Background Image",
      "settingsWindow_focusEditorSounds": "Background Sounds",
      "settingsWindow_focusEditorSoundOn": "Play automatically on Start",

      // settingTabs_textTree
      "settingsWindow_textTreeStyle": "Style",
      "settingsWindow_textTreeEmptyIcon": `Label empty Texts <i class="fa-solid fa-text-slash">`,
      "settingsWindow_always": "always",
      "settingsWindow_leaves": "Leave Elements only",
      "settingsWindow_never": "never",
      "settingsWindow_textTreeLockedIcon": `Label locked Texts <i class="fas fa-lock"></i>`,
      "settingsWindow_textTreeSmall": "Compact Tree",
      "settingsWindow_textTreeDots": "Show Tree Dots",
      "settingsWindow_textTreeWholerow": "Highlight whole Row",
      "settingsWindow_textTreeSelectionColor":
        "Background Color of selected Texts",
      "settingsWindow_textTreeSelectionBorder": "Non-solid Background",
      "settingsWindow_textTreeHoverColor": "Background Color on Hover",
      "settingsWindow_textTreeContextMenu": "Context Menu",
      "settingsWindow_textTreeCompactContextMenu": "use Submenus",
      "settingsWindow_textTreeContextMenuStats": "show Text Sizes",
      "settingsWindow_textTreeContextMenuBranchStats": `show added Sizes <i class="fas fa-info-circle" title="on Branches"></i>`,
      "settingsWindow_textTreeContextMenuTime":
        "Show Timestamps (created, last changed)",
      "settingsWindow_textTreeNameWords": "Number of Words for Name Generation",
      "settingsWindow_textTreeDecorationStatus": "Text Status",
      "settingsWindow_textTreeShowStatus": "Show Icon",
      "settingsWindow_textTreeShowNoStatus": "Show Icon also for unset Status",
      "settingsWindow_textTreeShowStatusForm": "Icon style",
      "circle": "Cirlce",
      "square": "Square",
      "heart": "Heart",
      "comment": "Comment",
      "star": "Star",
      "bookmark": "Bookmark",
      "bell": "Bell",
      "clipboard": "Clipboard",
      "clock": "Clock",
      "flag": "Flag",
      "user": "User",
      "settingsWindow_textTreeDecorationType": "Text Type",
      "settingsWindow_textTreeShowType": "Show Icon",
      "settingsWindow_textTreeShowNoType": "Show Icon also for unset Type",
      "settingsWindow_textTreeShowTypeForm": "Icon Style",
      "settingsWindow_textTreeDecorationUser": "User Value",
      "settingsWindow_textTreeShowUser": "Show Icon",
      "settingsWindow_textTreeShowNoUser": "Show Icon also for unset Value",
      "settingsWindow_textTreeShowUserForm": "Icon Style",
      "settingsWindow_textTreeProperties": "Text Properties",
      "settingsWindow_textsHighlightCheckedObjects":
        "highlight activated Objects",

      // settingTabs_textCollectionTree
      "settingsWindow_textCollectionStyle": "Style",
      "settingsWindow_textCollectionTreeEmptyIcon": `Label empty Collections <span class="fa fa-stack"><i class="fa-solid fa-list fa-stack-1x"></i><i class="fa-solid fa-slash fa-stack-1x"></i></span>`,
      "settingsWindow_textCollectionTreeSmall": "Compact Tree",
      "settingsWindow_textCollectionTreeAutoActivate":
        "Activate Texts on Collection Activation",
      "settingsWindow_textCollectionTreeShowSearchProperties":
        "Show Parameters of Search Collections",
      "settingsWindow_textCollectionTreeNew": "New Collections",
      "settingsWindow_textCollectionTreeNewCollectionRandomColor":
        "Random Color",
      "settingsWindow_textCollectionTreeNewCollectionColor": `Default Color <i class="fas fa-info-circle" title="only applid when random color not set"></i>`,
      "settingsWindow_textCollectionTreeNewSearchCollectionColor": `Default Color for Search Collections  <i class="fas fa-info-circle" title="only applid when random color not set"></i>`,
      "settingsWindow_textCollectionTreeNewCollectionEditor":
        "New Collection opens Properties Window",
      "settingsWindow_textCollectionTreeContextMenu": "Context Menu",
      "settingsWindow_textCollectionCompactContextMenu": "use Submenus",
      "settingsWindow_textCollectionTreeContextMenuStats": "Show Statistics",
      "settingsWindow_textCollectionTreeContextMenuTime":
        "Show Timestamps (created, last changed)",

      // settingTabs_objectTree
      "settingsWindow_objectTreeStyle": "Style",
      "settingsWindow_objectTreeEmptyIcon": `Label Objects unrelated to Texts <i class="fa-solid fa-link-slash">`,
      "settingsWindow_objectTreeSmall": "Compact Tree",
      "settingsWindow_objectTreeDots": "Show Tree Dots",
      "settingsWindow_objectTreeWholerow": "Highlight whole Row",
      "settingsWindow_objectTreeSelectionColor":
        "Background Color of selected Objects",
      "settingsWindow_objectTreeSelectionBorder": "Non-solid Background",
      "settingsWindow_objectTreeHoverColor": "Background Color on Hover",
      "settingsWindow_objectTreeContextMenu": "Context Menu",
      "settingsWindow_objectTreeCompactContextMenu": "use Subemnus",
      "settingsWindow_objectTreeContextMenuStats": "Show Statistics",
      "settingsWindow_objectTreeContextMenuTime":
        "Show Timestamps (created, last changed)",
      "settingsWindow_objectTreeAction": "New Objects",
      "settingsWindow_objectTreeNewObjectItalic": "Standard Style italic",
      "settingsWindow_objectTreeNewObjectUnderline": "Standard Style underline",
      "settingsWindow_objectTreeNewObjectColor": "Standard Color",
      "settingsWindow_objectTreeProperties": "Object Properties",
      "settingsWindow_objectsHighlightCheckedTexts":
        "Highlight activated Texts",
      "settingsWindow_objectsShowParentScheme":
        "Display Scheme of higher level Objects",
      "settingsWindow_objectsTextSample": "Sample Text for Object Style",

      // settingTabs_scheme
      "settingsWindow_schemeRelation": "Object relations",
      "settingsWindow_relationSortAlpha": "order objects alphabetically",
      "settingsWindow_schemeEditor": "Editor",
      "settingsWindow_schemeEditorHeight": "Standard Height in Pixels",
      "settingsWindow_schemeMap": "Map",
      "settingsWindow_schemeMapHeight": "Standard Height in Pixels",
      "settingsWindow_schemeMapMarkerColor": "Standard Color of Locations",
      "settingsWindow_schemeMapMarkerConfirmDelete":
        "Confirm deletion of Locations",
      "settingsWindow_schemeMapBounds": "Standard Map Section",

      // settingTabs_image
      "settingsWindow_imageDefaults": "Defaults for new images",
      "settingsWindow_imageShadow": "Shadow",
      "settingsWindow_imageAlignment": "Default alignment",
      "settingsWindow_imageWidth": `Limit Image width on insert <i class="fas fa-info-circle" title="set to 0 for no limitation"></i>`,
      "settingsWindow_imageHeight": `Limit Image height on insert <i class="fas fa-info-circle" title="set to 0 for no limitation"></i>`,
      "settingsWindow_imageObjectReference": "Images in Object references",
      "settingsWindow_imageReference": `Show as`,
      "imageReferenceFull": "in the Editor",
      "imageReferenceThumb": "Thumbnail",
      "imageReferenceText": "Text with Metadata",
      "imageReferenceIcon": "Icon",
      "imageReferenceIconLarge": "large Icon",
      "imageReferenceEmpty": "empty",

      // settingTabs_import
      "settingsWindow_importFile": "File Import",
      "settingsWindow_importName": `Naming Scheme <i class="fas fa-info-circle" title="on import from file '/a/b/c.html'\n- the file name is 'c'\n- the file name with extension is 'c.html' and\n- the full file path is '/a/b/c.html'"></i>`,
      "importNameFile": "File Name",
      "importNameExt": "File Name with Extension",
      "importNamePath": "Full Path",
      "settingsWindow_importTree": "Directory Import",
      "importTreeFlat": "Ignore Directory Structure",
      "importTreeTrimmed": "Ignore empty Directories",
      "importTreeTree": "Reflect full Directory Structure",
      "settingsWindow_importWeb": "Web Import",
      "settingsWindow_importNameWeb": `Name Scheme for Web Imports <i class="fas fa-info-circle" title="on import of web page with title 'XYZ' from URL 'https://a.b.c/xyz.html'\n- the page title is 'XYZ'\n- the page's URL is 'https://a.b.c/xyz.html' and\n- the domain name is 'a.b.c'"></i>`,
      "importNameWebTitle": "Page Title (if provided)",
      "importNameWebURL": "Page's URL",
      "importNameWebDomain": "Domain Name",
      "settingsWindow_importSearch": `URL of Search Engine <i class="fas fa-info-circle" title="a '$' sign in the URL is replaced by the search text"></i>`,

      // settingTabs_export
      "settingsWindow_exportPlaceholders": "Placeholders",
      "settingsWindow_exportPlaceholderBorderColor": "Placeholder Border Color",
      "settingsWindow_exportPlaceholderBackgroundColor":
        "Placeholder Background Color",
      "settingsWindow_exportPlaceholderStuffing": "Stuffing Text",
      "exportPlaceholderStuffingNone": "(no stuffing)",
      "settingsWindow_exportSample": "Style sample",
      "settingsWindow_exportTextSample": "Sample Text",
      "settingsWindow_exportTexts": "Export in Text format",
      "settingsWindow_exportTextImage": "Describe images",
      "settingsWindow_exportSubstituteBold": "Transform Bold",
      "settingsWindow_exportSubstituteItalic": "Transform Italic",
      "settingsWindow_exportSubstituteUnderline": "Transform Underline",
      "settingsWindow_exportSubstituteStrike": "Transform Strike",
      "exportSubstituteNone": "(no changes)",
      "exportSubstituteUpper": "UPPERCASE",
      "exportSubstituteSpaced": "S p a c e d",
      "exportSubstituteScored": "S_c_o_r_e_d",
      "exportSubstituteStriked": "S-t-r-i-k-e-d",
      "exportSubstituteUpperSpaced": "S P A C E D",
      "exportSubstituteUpperScored": "S_C_O_R_E_D",
      "exportSubstituteUpperStriked": "S-T-R-I-K-E-D",
      "settingsWindow_exportTableLineLength": "Table Width",
      "settingsWindow_exportMaps": "Maps Export",
      "settingsWindow_exportRasterizeMaps": "Map Representation",
      "noRaster": "none",
      "overviewRaster": "Overview Map",
      "detailRaster": "Detail Maps",
      "fullRaster": "Overview and Detail Maps",
      "settingsWindow_exportOverwiewmapWidth": "Width of Overview Map",
      "settingsWindow_exportOverwiewmapHeight": "Height of Overview Map",
      "settingsWindow_exportOverwiewmapMaxZoom": "Scale of Overview Map",
      "3_zoomLargeCountry": "Continent (about 1:70 Million)",
      "5_zoomMidCountry": "Large Country (about 1:15 Million)",
      "7_zoomSmallCountry": "Small Country/Region (about 1:4 Million)",
      "9_zoomMetropolitanArea": "Metropolitan Area (about 1:1 Million)",
      "11_zoomCity": "City (about 1:250,000)",
      "13_zoomVillage": "Village (about 1:70,000)",
      "15_zoomSmallRoad": "Road (about 1:15,000)",
      "17_zoomBlock": "Block (about 1:4000)",
      "19_zoomHouse": "House (about 1:1000)",
      "settingsWindow_exportDetailmapWidth": "Width of Detail Maps",
      "settingsWindow_exportDetailmapHeight": "Height of Detail Maps",
      "settingsWindow_exportDetailmapMaxZoom": "Scale of Detail Maps",

      // default categories tab
      "settingsWindow_categoriesInfo":
        "These settings determine standard values for several text properties. There is a  category to describe a text's status and another for its type. An additional category is available for individual use.<br>These standard settings are copied into to new projects and can be changed in the project settings.",
    },
  }),
};

function __(lang, ...x) {
  return translationSettingsWindow[lang](...x);
}

module.exports = { __ };
