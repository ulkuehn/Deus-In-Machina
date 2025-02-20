/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for export placeholders
 */

const translationPlaceholders = {
  // German
  de: {
    // placeholder
    placeholders_insertPlaceholder: "Platzhalter einsetzen",
    // document
    placeholders_projectTitlePlaceholder: `Projekttitel`,
    placeholders_projectSubtitlePlaceholder: "Projektuntertitel",
    placeholders_projectAuthorPlaceholder: "Autoreninfo",
    placeholders_projectInfoPlaceholder: "Projektinfo",
    placeholders_projectCreatedPlaceholder:
      "Zeitstempel, an dem das Projekt begonnen wurde",
    placeholders_projectChangedPlaceholder:
      "Zeitstempel, an dem das Projekt zuletzt geändert wurde",
    placeholders_projectVersionPlaceholder: "Speicherversion des Projekts",
    placeholders_projectPathPlaceholder:
      "Pfad, unter dem das Projekt gespeichert ist",
    placeholders_projectCharactersPlaceholder:
      "Zeichenzahl der exportierten Texte",
    placeholders_projectWordsPlaceholder:
      "Anzahl der Wörter der exportierten Texte",
    placeholders_projectNowPlaceholder: "aktueller Zeitstempel",
    placeholders_textsBlockPlaceholder: `<abbr title='zum Inhalt siehe Tab "Texte"'>exportierte Texte</<abbr>`,
    placeholders_objsBlockPlaceholder: `<abbr title='zum Inhalt siehe Tab "Objekte"'>exportierte Objekte</abbr>`,
    // text
    placeholders_textNamePlaceholder: "Textname",
    placeholders_textPathPlaceholder: "Texthierarchie",
    placeholders_textStatusPlaceholder: "Textstatus",
    placeholders_textTypePlaceholder: "Texttyp",
    placeholders_textUserPlaceholder: "Nutzerwert des Texts",
    placeholders_textCreatedPlaceholder:
      "Zeitstempel, an dem der Text erzeugt wurde",
    placeholders_textChangedPlaceholder:
      "Zeitstempel, an dem der Text zuletzt geändert wurde",
    placeholders_textCharactersPlaceholder: "Zeichenzahl des Texts",
    placeholders_textWordsPlaceholder: "Anzahl der Wörter des Texts",
    placeholders_textContentBlockPlaceholder: `<abbr title='ob und wie Objekte in den Texten angezeigt werden, siehe Tab "Objektmarkierungen"'>Textinhalt</abbr>`,
    // objects in text
    placeholders_objTextNamePlaceholder: "Objektname",
    placeholders_objTextNameUpperPlaceholder: "OBJEKTNAME (in Großbuchstaben)",
    placeholders_objTextPathPlaceholder: "Objekthierarchie",
    placeholders_objTextPathUpperPlaceholder:
      "OBJEKTHIERARCHIE (in Großbuchstaben)",
    // objects
    placeholders_objNamePlaceholder: "Objektname",
    placeholders_objPathPlaceholder: "Objekthierarchie",
    placeholders_objCreatedPlaceholder:
      "Zeitstempel, an dem das Objekt erzeugt wurde",
    placeholders_objChangedPlaceholder:
      "Zeitstempel, an dem das Objekt zuletzt geändert wurde",
    placeholders_objContentBlockPlaceholder: `<abbr title='zum Inhalt siehe Tab "Objekteigenschaften"'>Objektinhalt als Liste</abbr>`,
    placeholders_objContentTablePlaceholder: "Objektinhalt als Tabelle",
    placeholders_objStyleSamplePlaceholder: "Textprobe im Objektstil",
    placeholders_objTextReferencesPlaceholder: "Textzitate als Liste",
    placeholders_objTextReferencesTablePlaceholder: "Textzitate als Tabelle",
    // object properties
    placeholders_propertyNamePlaceholder: "Name der Eigenschaft",
    placeholders_propertyTypePlaceholder: "Typ der Eigenschaft",
    placeholders_propertyContentPlaceholder: "Inhalt der Eigenschaft",
  },
  // English
  en: {
    // placeholder
    placeholders_insertPlaceholder: "insert Placeholder",
    // document
    placeholders_projectTitlePlaceholder: "Project Title",
    placeholders_projectSubtitlePlaceholder: "Project Subtitle",
    placeholders_projectAuthorPlaceholder: "Author Info",
    placeholders_projectInfoPlaceholder: "Project Info",
    placeholders_projectCreatedPlaceholder:
      "Timestamp when Project was created",
    placeholders_projectChangedPlaceholder:
      "Timestamp when Project was last changed",
    placeholders_projectVersionPlaceholder: "Storage version of Project",
    placeholders_projectPathPlaceholder: "Path of Project file",
    placeholders_projectCharactersPlaceholder:
      "Character count of exported Texts",
    placeholders_projectWordsPlaceholder: "Word count of exported Texts",
    placeholders_projectNowPlaceholder: "Current Timestamp",
    placeholders_textsBlockPlaceholder: `<abbr title='contents in tab "Texts"'>exported Texts</abbr>`,
    placeholders_objsBlockPlaceholder: `<abbr title='contents in tab "Objects"'>exported Objects</abbr>`,
    // text
    placeholders_textNamePlaceholder: "Text Name",
    placeholders_textPathPlaceholder: "Text Path",
    placeholders_textStatusPlaceholder: "Text Status",
    placeholders_textTypePlaceholder: "Text Type",
    placeholders_textUserPlaceholder: "User Value of Text",
    placeholders_textCreatedPlaceholder: "Timestamp when Text was created",
    placeholders_textChangedPlaceholder: "Timestamp when Text was last changed",
    placeholders_textCharactersPlaceholder: "Character count of Text",
    placeholders_textWordsPlaceholder: "Word count of Text",
    placeholders_textContentBlockPlaceholder: `<abbr title='if and how objects are displayed in a text is set in tab "Object markings"'>Text Content</abbr>`,
    // objects in text
    placeholders_objTextNamePlaceholder: "Object Name",
    placeholders_objTextNameUpperPlaceholder: "OBJECT NAME (in Capitals)",
    placeholders_objTextPathPlaceholder: "Object Path",
    placeholders_objTextPathUpperPlaceholder: "OBJECT PATH (in Capitals)",
    // objects
    placeholders_objNamePlaceholder: "Object Name",
    placeholders_objPathPlaceholder: "Object Path",
    placeholders_objCreatedPlaceholder: "Timestamp when Object was created",
    placeholders_objChangedPlaceholder:
      "Timestamp when Object was last changed",
    placeholders_objContentBlockPlaceholder: `<abbr title='contents in tab "Object Properties"'>Object Content as List</abbr>`,
    placeholders_objContentTablePlaceholder: "Object Content as Table",
    placeholders_objStyleSamplePlaceholder: "Sample Text in Object Style",
    placeholders_objTextReferencesPlaceholder: "Quotes as List",
    placeholders_objTextReferencesTablePlaceholder: "Quotes as Table",
    // object properties
    placeholders_propertyNamePlaceholder: "Property Name",
    placeholders_propertyTypePlaceholder: "Property Type",
    placeholders_propertyContentPlaceholder: "Property Content",
  },
};

module.exports = { translationPlaceholders };
