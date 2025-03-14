/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for import from URL window
 */

const translationImportFromURLWindow = {
  // German
  de: i18n.create({
    values: {
      importFromURLWindow_back: `eine Seite zurück (%{url})`,
      importFromURLWindow_forward: `eine Seite vor (%{url}`,
      importFromURLWindow_zoom: "Zoom",
      importFromURLWindow_zoom100: "Ansicht zurücksetzen",
      importFromURLWindow_stop: "Laden abbrechen",
      importFromURLWindow_reload: "neu laden",
      importFromURLWindow_import: "Text der Webseite importieren",
    },
  }),
  // English
  en: i18n.create({
    values: {
      importFromURLWindow_back: "page back (%{url})",
      importFromURLWindow_forward: "page forward (%{url})",
      importFromURLWindow_zoom: "Zoom",
      importFromURLWindow_zoom100: "Reset zoom",
      importFromURLWindow_stop: "stop loading",
      importFromURLWindow_reload: "reload page",
      importFromURLWindow_import: "Import Text of Web page",
    },
  }),
};

function __(lang, ...x) {
  return translationImportFromURLWindow[lang](...x);
}
