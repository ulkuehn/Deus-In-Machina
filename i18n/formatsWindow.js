/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for formats window
 */

const { translationGeneral } = require("./include/general.js");
const { translationColorPicker } = require("./include/colorpicker.js");
const { translationTime } = require("./include/time.js");
const { translationUnits } = require("./include/units.js");
const { translationFormats } = require("./include/formats.js");
const { translationFonts } = require("./include/Fonts.js");

const translationFormatsWindow = {
  // German
  "de": i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationColorPicker.de,
      ...translationTime.de,
      ...translationUnits.de,
      ...translationFormats.de,
      ...translationFonts.de,

      formatsWindow_addFormat: "Format hinzufügen",
      formatsWindow_copyFormat: "Format kopieren",
      formatsWindow_deleteFormat: "Format löschen",
      formatsWindow_confirmDelete: `Format "%{format}" wirklich löschen?`,
      formatsWindow_newFormat: "neues Format (%{time})",
      formatsWindow_copiedFormat: 'Kopie von "%{name}"',
      formatsWindow_formats: "Formate",
      formatsWindow_sample: "Textbeispiel",
      formatsWindow_settings: "Einstellungen",
      formatsWindow_sampleText: `DIES IST EIN ABSATZ IM FORMAT "%{name}": `,
    },
  }),
  // English
  "en": i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationColorPicker.en,
      ...translationTime.en,
      ...translationUnits.en,
      ...translationFormats.en,
      ...translationFonts.en,

      formatsWindow_addFormat: "Add Format",
      formatsWindow_copyFormat: "Copy Format",
      formatsWindow_deleteFormat: "Delete Format",
      formatsWindow_confirmDelete: `Really delete Format "%{format}"?`,
      formatsWindow_newFormat: "New Format (%{time})",
      formatsWindow_copiedFormat: 'Copy of "%{name}"',
      formatsWindow_formats: "Formats",
      formatsWindow_sample: "Sample text",
      formatsWindow_settings: "Settings",
      formatsWindow_sampleText: `THIS IS A PARAGRAPH USING FORMAT "%{name}": `,
    },
  }),
};

function __(lang, ...x) {
  return translationFormatsWindow[lang](...x);
}

module.exports = { __ };
