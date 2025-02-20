/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for scheme map window
 */

const { translationGeneral } = require("./include/general.js");
const { translationSchemeMap } = require("./include/SchemeMap.js");
const { translationColorPicker } = require("./include/colorpicker.js");

const translationSchemeMapWindow = {
  // German
  "de": i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationColorPicker.de,
      ...translationSchemeMap.de,
    },
  }),
  // English
  "en": i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationColorPicker.en,
      ...translationSchemeMap.en,
    },
  }),
};

function __(lang, ...x) {
  return translationSchemeMapWindow[lang](...x);
}

module.exports = { __ };
