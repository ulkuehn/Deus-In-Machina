/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for spelling correction window
 */

const translationSpellingCorrectionWindow = {
  // German
  de: i18n.create({
    values: {
      spellingCorrectionWindow_misspelledWord: "unbekanntes Wort",
      spellingCorrectionWindow_correctedWord: "Korrektur",
      spellingCorrectionWindow_spellingSuggestions: "Korrekturvorschläge",
      spellingCorrectionWindow_correctMisspelled: "korrigieren",
      spellingCorrectionWindow_ignoreMisspelled: "nicht korrigieren",
      spellingCorrectionWindow_notMisspelled: "nie korrigieren",
      spellingCorrectionWindow_finishedTitle: "Rechtschreibkorrektur",
      spellingCorrectionWindow_finishedMessage:
        "Die Rechtschreibkorrektur ist abgeschlossen",
    },
  }),
  // English
  en: i18n.create({
    values: {
      spellingCorrectionWindow_misspelledWord: "unknown Word",
      spellingCorrectionWindow_correctedWord: "Correction",
      spellingCorrectionWindow_spellingSuggestions: "Suggestions",
      spellingCorrectionWindow_correctMisspelled: "correct",
      spellingCorrectionWindow_ignoreMisspelled: "ignore",
      spellingCorrectionWindow_notMisspelled: "always ignore",
      spellingCorrectionWindow_finishedTitle: "Spell Correction",
      spellingCorrectionWindow_finishedMessage: "Spell Correction has finished",
    },
  }),
};

function __(lang, ...x) {
  return translationSpellingCorrectionWindow[lang](...x);
}

module.exports = { __ };
