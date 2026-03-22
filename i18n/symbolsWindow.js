/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file i18n translations for symbols window
 */

const translationSymbolsWindow = {
  // German
  de: i18n.create({
    values: {},
  }),
  // English
  en: i18n.create({
    values: {},
  }),
};

function __(lang, ...x) {
  return translationSymbolsWindow[lang](...x);
}

module.exports = { __ };
