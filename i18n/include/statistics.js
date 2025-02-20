/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for text statistics
 */

const translationStatistics = {
  // German
  "de": {
    // tabs
    statistics_statisticsTabName: "Statistiken",
    statistics_wordlistTabName: "Wortfrequenzen",
    statistics_wordcloudTabName: "Wortwolke",
    // statistics
    statistics_absoluteNumbers: "absolute Zahlen",
    statistics_characters: [[0, null, "Zeichen gesamt"]],
    statistics_nonSpaceCharacters: [[0, null, "Zeichen ohne Leerzeichen"]],
    statistics_words: [
      [0, 0, "Wörter"],
      [1, 1, "Wort"],
      [2, null, "Wörter"],
    ],
    statistics_sentences: [
      [0, 0, "Sätze"],
      [1, 1, "Satz"],
      [2, null, "Sätze"],
    ],
    statistics_paragraphs: [
      [0, 0, "Absätze"],
      [1, 1, "Absatz"],
      [2, null, "Absätze"],
    ],
    statistics_averageNumbers: "Durchschnittswerte",
    statistics_charactersPerWord: "Zeichen pro Wort",
    statistics_wordsPerSentence: "Wörter pro Satz",
    statistics_charactersPerSentence: "Zeichen pro Satz",
    statistics_charactersPerParagraph: "Zeichen pro Absatz",
    statistics_wordsPerParagraph: "Wörter pro Absatz",
    statistics_sentencesPerParagraph: "Sätze pro Absatz",
    // word frequencies table
    statistics_wordlistWord: "Wort",
    statistics_wordlistLength: "Länge",
    statistics_wordlistFrequency: "Häufigkeit",
    statistics_wordlistEmpty: "keine Wörter",
    statistics_wordlistSearch: "Wortfilter ",
    statistics_wordFrequency: [
      [0, 0, "?"], // this should not happen
      [
        1,
        1,
        `<div style="display:flex;"><div style="width:20%">%{absolute}</div><div style="width:30%">%{relative}</div><div style="width:50%">jedes Wort</div></div>`,
      ],
      [
        2,
        null,
        `<div style="display:flex;"><div style="width:20%">%{absolute}</div><div style="width:30%">%{relative}</div><div style="width:50%">jedes %{every}. Wort</div></div>`,
      ],
    ],
    // texts, objects
    statistics_texts: "Texte",
    statistics_totalTexts: [
      [0, 0, "Texte insgesamt"],
      [1, 1, "Text insgesamt"],
      [2, null, "Texte insgesamt"],
    ],
    statistics_textsWithObjects: "davon mit zugeordneten Objekten",
    statistics_charactersInObjects: "aller Zeichen sind Objekten zugeordnet",
    statistics_objects: "Objekte",
    statistics_totalObjects: [
      [0, 0, "Objekte insgesamt"],
      [1, 1, "Objekt insgesamt"],
      [2, null, "Objekte insgesamt"],
    ],
    statistics_objectsWithTexts: [
      [0, 0, "davon sind Texten zugeordnet"],
      [1, 1, "davon ist Texten zugeordnet"],
      [2, null, "davon sind Texten zugeordnet"],
    ],
  },
  // English
  "en": {
        // tabs
        statistics_statisticsTabName: "Statistics",
        statistics_wordlistTabName: "Word frequencies",
        statistics_wordcloudTabName: "Wordcloud",
        // statistics
        statistics_absoluteNumbers: "Absolute values",
        statistics_characters: [[0, null, "Total characters"]],
        statistics_nonSpaceCharacters: [[0, null, "Characters w/o white space"]],
        statistics_words: [
          [0, 0, "Words"],
          [1, 1, "Word"],
          [2, null, "Words"],
        ],
        statistics_sentences: [
          [0, 0, "Sentences"],
          [1, 1, "Sentence"],
          [2, null, "Sentences"],
        ],
        statistics_paragraphs: [
          [0, 0, "Paragraphs"],
          [1, 1, "Paragraph"],
          [2, null, "Paragraphs"],
        ],
        statistics_averageNumbers: "Averages",
        statistics_charactersPerWord: "Characters per Word",
        statistics_wordsPerSentence: "Words per Sentence",
        statistics_charactersPerSentence: "Characters per Sentence",
        statistics_charactersPerParagraph: "Characters per Paragraph",
        statistics_wordsPerParagraph: "Words per Paragraph",
        statistics_sentencesPerParagraph: "Sentences per Paragraph",
        // word frequencies table
        statistics_wordlistWord: "Word",
        statistics_wordlistLength: "Length",
        statistics_wordlistFrequency: "Frequency",
        statistics_wordlistEmpty: "no Words",
        statistics_wordlistSearch: "Word filter ",
        statistics_wordFrequency: [
          [0, 0, "?"], // this should not happen
          [
            1,
            1,
            `<div style="display:flex;"><div style="width:20%">%{absolute}</div><div style="width:30%">%{relative}</div><div style="width:50%">every Word</div></div>`,
          ],
          [
            2,
            null,
            `<div style="display:flex;"><div style="width:20%">%{absolute}</div><div style="width:30%">%{relative}</div><div style="width:50%">every %{every}. Word</div></div>`,
          ],
        ],
        // texts, objects
        statistics_texts: "Texts",
        statistics_totalTexts: [
          [0, 0, "Texts overall"],
          [1, 1, "Text overall"],
          [2, null, "Texts overall"],
        ],
        statistics_textsWithObjects: "of which having Objects",
        statistics_charactersInObjects: "of all Characters connected to Objects",
        statistics_objects: "Objects",
        statistics_totalObjects: [
          [0, 0, "Objects overall"],
          [1, 1, "Object overall"],
          [2, null, "Objects overall"],
        ],
        statistics_objectsWithTexts: [
          [0, 0, "of which are connected to Texts"],
          [1, 1, "of which is connected to Texts"],
          [2, null, "of which are connected to Texts"],
        ],    
  },
};

module.exports = { translationStatistics };
