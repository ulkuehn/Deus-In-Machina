/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file i18n translations for export preview window
 */

const { translationGeneral } = require("./include/general.js");

const translationExportPreviewWindow = {
  // German
  de: i18n.create({
    values: {
      ...translationGeneral.de,
    },
  }),
  // English
  en: i18n.create({
    values: {
      ...translationGeneral.en,
    },
  }),
};

function __(lang, ...x) {
  return translationExportPreviewWindow[lang](...x);
}

module.exports = { __ };
