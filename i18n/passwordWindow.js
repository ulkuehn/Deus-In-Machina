/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for password window
 */

const { translationGeneral } = require("./include/general.js");

const translationPasswordWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
      passwordWindow_openButton: "Projekt öffnen",
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
      passwordWindow_openButton: "Open Project",
    },
  }),
};

function __(lang, ...x) {
  return translationPasswordWindow[lang](...x);
}

module.exports = { __ };
