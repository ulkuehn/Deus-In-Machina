/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for language relative default settings
 */

const translationSettingDefaults = {
  // German
  de: {
    settingDefaults_importSearchURL: "https://duckduckgo.com/?q=$",
    settingDefaults_webtools:
      "Suche mit DuckDuckGo::https://duckduckgo.com/?q=$\n" +
      "Suche mit Google::https://www.google.de/search?q=$\n" +
      "Wikipedia::https://de.wikipedia.org/wiki/$\n" +
      "Wiktionary::https://de.wiktionary.org/wiki/$\n" +
      "Duden Online::https://www.duden.de/suchen/dudenonline/$\n" +
      "Digitales Wörterbuch der deutschen Sprache::https://www.dwds.de/wb/$\n" +
      "Open Thesaurus::https://www.openthesaurus.de/synonyme/$\n",
    settingDefaults_dateTimeFormatShort: "[ D ].[ M ].[ YY ], [ h ]:[ mm ]",
    settingDefaults_dateTimeFormatLong:
      "[ DDDD ], [ DD ].[ MM ].[ YYYY ], [ hh ]:[ mm ]:[ ss ]",
  },
  // English
  en: {
    settingDefaults_importSearchURL: "https://duckduckgo.com/?q=$",
    settingDefaults_webtools:
      "Search on DuckDuckGo::https://duckduckgo.com/?q=$\n" +
      "Search on Google::https://www.google.com/search?q=$\n" +
      "Wikipedia::https://en.wikipedia.org/wiki/$\n" +
      "Wiktionary::https://en.wiktionary.org/wiki/$\n" +
      "Dictionary::https://www.dictionary.com/browse/$\n" +
      "Thesaurus::https://www.thesaurus.com/browse/$\n",
    settingDefaults_dateTimeFormatShort:
      "[ M ]/[ D ]/[ YY ], [ h12 ]:[ mm ][ ap ]",
    settingDefaults_dateTimeFormatLong:
      "[ DDDD ], [ MM ]/[ DD ]/[ YYYY ], [ h12 ]:[ mm ]:[ ss ][ ap ]",
  },
};

module.exports = { translationSettingDefaults };
