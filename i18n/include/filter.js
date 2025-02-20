/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for text filter
 */

const translationFilter = {
  // German
  de: {
    filter_filter:
      "Filter &ndash; es werden nur die Texte berücksichtigt, die alle Kriterien erfüllen",
    filter_negate: "Filter invertieren",
    filter_type: "Kriterium",
    filter_value: "Wert",
    //
    filter_sizes: "Textlänge",
    filter_minCharacters: "Zeichenanzahl größer oder gleich",
    filter_maxCharacters: "Zeichenanzahl kleiner als",
    filter_minWords: "Wortanzahl größer oder gleich",
    filter_maxWords: "Wortanzahl kleiner als",
    //
    filter_objects: "Objekte",
    filter_minObjects: "Anzahl der Objekte größer oder gleich",
    filter_maxObjects: "Anzahl der Objekte kleiner als",
    filter_anyObject: "irgendeinem Objekt",
    filter_hasObject: "Text hat Bezug zu",
    filter_hasntObject: "Text hat keinen Bezug zu",
    //
    filter_tree: "Hierarchieebene im Baum",
    filter_isLevel: "Ebene gleich",
    filter_isntLevel: "Ebene ungleich",
    filter_maxLevel: "Ebene kleiner als",
    filter_minLevel: "Ebene größer oder gleich",
    //
    filter_name: "Textname (Groß- oder Kleinschreibung)",
    filter_nameIncludes: "Textname enthält",
    filter_nameExcludes: "Textname enthält nicht",
    filter_nameStarts: "Textname beginnt mit",
    filter_nameStartsNot: "Textname beginnt nicht mit",
    filter_nameEnds: "Textname endet mit",
    filter_nameEndsNot: "Textname endet nicht mit",
    //
    filter_properties: "Texteigenschaften",
    filter_hasValue: "gesetzt",
    filter_locked: "Text ist gesperrt",
    filter_unlocked: "Text ist nicht gesperrt",
    filter_textstatus: "Textstatus ist",
    filter_notStatus: "Textstatus ist nicht",
    filter_texttype: "Texttyp ist",
    filter_notType: "Texttyp ist nicht",
    filter_textuser: "Nutzerspezifischer Wert ist",
    filter_notUser: "Nutzerspezifischer Wert ist nicht",
    //
    filter_time: "Zeitstempel",
    filter_maxCreated: "erzeugt spätestens", // created on 09:34:17 -> true ... 9:33, 9:34
    filter_minCreated: "erzeugt frühestens", // created on 09:34:17 -> true 9:34, 9:35, ...
    filter_maxChanged: "verändert spätestens",
    filter_minChanged: "verändert frühestens",
    filter_timeFormat: "DD.MM.YYYY, HH:mm",
    filter_timeApply: "Speichern",
    filter_timeCancel: "Abbrechen",
    filter_timeWeek: "W",
    filter_firstDayOfWeek: "1", // first day of week, 0=Sun
  },
  // English
  en: {
    filter_filter: "Filter &ndash; limit search to texts having all properties",
    filter_negate: "Invert filter",
    filter_type: "Property",
    filter_value: "Value",
    //
    filter_sizes: "Text length",
    filter_minCharacters: "Character count greater or equal",
    filter_maxCharacters: "Character count less than",
    filter_minWords: "Word count greater or equal",
    filter_maxWords: "Word count less than",
    //
    filter_objects: "Objects",
    filter_minObjects: "Object count greater or equal",
    filter_maxObjects: "Object count less than",
    filter_anyObject: "any object",
    filter_hasObject: "Text is connected with",
    filter_hasntObject: "Text is not connected with",
    //
    filter_tree: "Tree level",
    filter_isLevel: "Level equal to",
    filter_isntLevel: "Level not equal to",
    filter_minLevel: "Level less than",
    filter_maxLevel: "Level greater or equal",
    //
    filter_name: "Text name (ignoring case)",
    filter_nameIncludes: "Text name includes",
    filter_nameExcludes: "Text name does not include",
    filter_nameStarts: "Text name begins with",
    filter_nameStartsNot: "Text name begins not with",
    filter_nameEnds: "Text name ends with",
    filter_nameEndsNot: "Text name ends not with",
    //
    filter_properties: "Text properties",
    filter_hasValue: "set",
    filter_locked: "Text is locked",
    filter_unlocked: "Text is unlocked",
    filter_textstatus: "Text status is",
    filter_notStatus: "Text status ist not",
    filter_texttype: "Text type is",
    filter_notType: "Text type is not",
    filter_textuser: "User value is",
    filter_notUser: "User value is not",
    //
    filter_time: "Timestamp",
    filter_maxCreated: "Created latest",
    filter_minCreated: "Created earliest",
    filter_maxChanged: "Changed latest",
    filter_minChanged: "Changed earliest",
    filter_timeFormat: "MM/DD/YYYY, HH:mm",
    filter_timeApply: "Apply",
    filter_timeCancel: "Cancel",
    filter_timeWeek: "W",
    filter_firstDayOfWeek: "0", // first day of week, 0=Sun
  },
};

module.exports = { translationFilter };
