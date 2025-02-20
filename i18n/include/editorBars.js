/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for editor top and bottom bars
 */

const translationEditorBars = {
  // German
  de: {
    editorBars_boldTitle: "Fett",
    editorBars_boldLabel: "F",
    editorBars_italicTitle: "Kursiv",
    editorBars_italicLabel: "K",
    editorBars_underlineTitle: "Unterstrichen",
    editorBars_underlineLabel: "&thinsp;U&thinsp;",
    editorBars_strikeTitle: "Durchgestrichen",
    editorBars_strikeLabel: "&thinsp;D&thinsp;",
    editorBars_symbolsTitle: "Sonderzeichen",
    editorBars_symbolsLabel: "&alpha;&Omega;",
    editorBars_resetZoomTitle: "Textgröße zurücksetzen",
    editorBars_textZoomTitle: "Anzeigegröße des Texts",
    editorBars_allTextsTitle: "alle Texte im Editor",
    editorBars_focusedTextTitle: "fokussierter Text",
    editorBars_textNameTitle: "Name des fokussierten Texts",
    editorBars_textPathTitle: "Pfad des fokussierten Texts",
    editorBars_textPath: "%{value}",
    editorBars_textLength:
      "%{words} W %{sep} %{characters} Z %{sep} %{objects} O",
    editorBars_regexError: "fehlerhafter regulärer Ausdruck",
    editorBars_noSearchResults: "--/--",
    editorBars_searchModeTitle: "Suchbegriff",
    editorBars_replaceModeTitle: "Ersatztext",
    editorBars_searchPrevTitle: "vorherige Fundstelle",
    editorBars_searchNextTitle: "nächste Fundstelle",
    editorBars_replaceNextTitle: "nächste Fundstelle ersetzen",
    editorBars_replaceAllTitle: "alle Fundstellen ersetzen",
    editorBars_confirmReplace: [
      [
        1,
        1,
        `soll die Fundstelle im Editor durch "%{replaceBy}" ersetzt werden?`,
      ],
      [
        2,
        2,
        `sollen beide Fundstellen im Editor durch "%{replaceBy}" ersetzt werden?`,
      ],
      [
        3,
        null,
        `sollen alle %{count} Fundstellen im Editor durch "%{replaceBy}" ersetzt werden?`,
      ],
    ],
    editorBars_showSpellingTitle: "Rechtschreibprüfung",
    editorBars_showObjectStylesTitle: "Objektstile anzeigen",
    editorBars_resetOpacityTitle: "Deckkraft zurücksetzen",
    editorBars_textOpacityTitle: "Deckkraft von Text ohne Objektbezug",
  },
  // English
  en: {
    editorBars_boldTitle: "Bold",
    editorBars_boldLabel: "B",
    editorBars_italicTitle: "Italic",
    editorBars_italicLabel: "I",
    editorBars_underlineTitle: "Underline",
    editorBars_underlineLabel: "&thinsp;U&thinsp;",
    editorBars_strikeTitle: "Strikethrough",
    editorBars_strikeLabel: "&thinsp;S&thinsp;",
    editorBars_symbolsTitle: "Special characters",
    editorBars_symbolsLabel: "&alpha;&Omega;",
    editorBars_resetZoomTitle: "Reset text zoom",
    editorBars_textZoomTitle: "Text zoom",
    editorBars_allTextsTitle: "All texts",
    editorBars_focusedTextTitle: "Focussed text",
    editorBars_textNameTitle: "Name of focussed text",
    editorBars_textPathTitle: "Path of focussed text",
    editorBars_textPath: "%{value}",
    editorBars_textLength:
      "%{words} W %{sep} %{characters} C %{sep} %{objects} O",
    editorBars_regexError: "Illegal regular expression",
    editorBars_noSearchResults: "--/--",
    editorBars_searchModeTitle: "Search text",
    editorBars_replaceModeTitle: "Replace text",
    editorBars_searchPrevTitle: "Previous match",
    editorBars_searchNextTitle: "Next match",
    editorBars_replaceNextTitle: "Replace next match",
    editorBars_replaceAllTitle: "Replace all",
    editorBars_confirmReplace: [
      [1, 1, `Replace the single match by "%{replaceBy}"?`],
      [2, 2, `Replace both matches by "%{replaceBy}"?`],
      [3, null, `Replace all %{count} matches by "%{replaceBy}"?`],
    ],
    editorBars_showSpellingTitle: "Spellcheck",
    editorBars_showObjectStylesTitle: "Show Object styles",
    editorBars_resetOpacityTitle: "Reset opacity",
    editorBars_textOpacityTitle: "Opacity of text not linked to objects",
  },
};

module.exports = { translationEditorBars };
