/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for word list window
 */

const { translationGeneral } = require("./include/general.js");

const translationWordlistWindow = {
  // German
  "de": i18n.create({
    values: {
      ...translationGeneral.de,
    },
  }),
  // English
  "en": i18n.create({
    values: {
      ...translationGeneral.en,
    },
  }),
};

function __(lang, ...x) {
  return translationWordlistWindow[lang](...x);
}

module.exports = { __ };
