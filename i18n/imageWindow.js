/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for image window
 */

const { translationGeneral } = require("./include/general.js");
const { translationImage } = require("./include/image.js");

const translationImageWindow = {
  // German
  "de": i18n.create({
    values: {
      ...translationGeneral.de,
      ...translationImage.de,

      imageWindow_thumbnail: "Ansicht",
      imageWindow_size: "Größe",
      imageWindow_settings: "Einstellungen",
      imageWindow_width: "Breite",
      imageWindow_height: "Höhe",
      imageWindow_keepRatio: "Seitenverhältnis beibehalten",
      imageWindow_originalSize:
        "auf Originalgröße zurücksetzen (%{width} breit, %{height} hoch)",
      imageWindow_title: "Titel",
    },
  }),
  // English
  "en": i18n.create({
    values: {
      ...translationGeneral.en,
      ...translationImage.en,

      imageWindow_thumbnail: "Preview",
      imageWindow_size: "Size",
      imageWindow_settings: "Settings",
      imageWindow_width: "Width",
      imageWindow_height: "Height",
      imageWindow_keepRatio: "Keep aspect ratio",
      imageWindow_originalSize:
        "Reset to original size (%{width} wide, %{height} heigh)",
      imageWindow_title: "Title",
    },
  }),
};

function __(lang, ...x) {
  return translationImageWindow[lang](...x);
}

module.exports = { __ };
