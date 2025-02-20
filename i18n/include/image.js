/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for images
 */

const translationImage = {
  // German
  de: {
    image_alignment: "Anordnung",
    image_shadow: "Schatteneffekt",
    image_alignmentBottom: "unten in der Textzeile",
    image_alignmentMiddle: "mittig in der Textzeile",
    image_alignmentTop: "oben in der Textzeile",
    image_alignmentLeft: "linksbündig als Textzeile",
    image_alignmentCenter: "zentriert als Textzeile",
    image_alignmentRight: "rechtsbündig als Textzeile",
    image_reference: `[Bild%{title}, %{width} breit, %{height} hoch]`,
  },
  // English
  en: {
    image_alignment: "Alignment",
    image_shadow: "Shadow",
    image_alignmentBottom: "Bottom aligned with Text",
    image_alignmentMiddle: "Center aligned with Text",
    image_alignmentTop: "Top aligned with Text",
    image_alignmentLeft: "Left aligned as Text Line",
    image_alignmentCenter: "Center aligned as Text Line",
    image_alignmentRight: "Right aligned as Text Line",
    image_reference: `[Image%{title}, %{width} wide, %{height} high]`,
  },
};

module.exports = { translationImage };
