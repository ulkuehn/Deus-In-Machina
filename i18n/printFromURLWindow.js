/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file i18n translations for print from URL window
 */

const translationPrintFromURLWindow = {
  // German
  de: i18n.create({
    values: {
      printFromURLWindow_back: `eine Seite zurück (%{url})`,
      printFromURLWindow_forward: `eine Seite vor (%{url}`,
      printFromURLWindow_zoom: "Zoom",
      printFromURLWindow_zoom100: "Ansicht zurücksetzen",
      printFromURLWindow_stop: "Laden abbrechen",
      printFromURLWindow_reload: "neu laden",
      printFromURLWindow_save: "Webseite speichern",
    },
  }),
  // English
  en: i18n.create({
    values: {
      printFromURLWindow_back: "page back (%{url})",
      printFromURLWindow_forward: "page forward (%{url})",
      printFromURLWindow_zoom: "Zoom",
      printFromURLWindow_zoom100: "Reset zoom",
      printFromURLWindow_stop: "stop loading",
      printFromURLWindow_reload: "reload page",
      printFromURLWindow_save: "Save Web page",
    },
  }),
};

function __(lang, ...x) {
  return translationPrintFromURLWindow[lang](...x);
}
