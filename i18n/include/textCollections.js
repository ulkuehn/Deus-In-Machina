/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for text collections
 */

const translationTextCollections = {
  // German
  de: {
    textCollections_treeDescription:
      "Bereich für Textlisten<br><br>in diesem Projekt sind noch keine Textlisten vorhanden",
    // text collection
    textCollections_newCollection: "Textliste %{count}",
    textCollections_newSearchCollection: "Such- und Filterliste %{count}",
    textCollections_deleteTitle: "Textliste löschen",
    textCollections_deleteMessage: '"%{name}" wirklich löschen?',
    textCollections_collectionCopy: `Kopie von "%{name}"`,
    //
    textCollections_contextMenuRename: "Umbenennen",
    textCollections_contextMenuResearch: "erneut suchen",
    textCollections_contextMenuProps: "Eigenschaften ...",
    textCollections_contextMenuNonSearch: "in reguläre Textliste kopieren",
    textCollections_contextMenuDelete: "Textliste löschen",
    textCollections_withFilter: [
      [1, 1, "Ein Filter"],
      [2, null, "%{filters} Filter"],
    ],
    textCollections_withSearch: `Suche nach "%{text}"`,
    textCollections_searchFilter: [
      [1, 1, `Ein Filter und Suche nach "%{text}"`],
      [2, null, `%{filters} Filter und Suche nach "%{text}"`],
    ],
    textCollections_nonSearchCopy: `Kopie von "%{search}"`,
    textCollections_empty: "Leere Textliste",
  },
  // English
  en: {
    textCollections_treeDescription:
      "Collection area<br><br>there are no collections in this project yet",
    // text collection
    textCollections_newCollection: "New Collection %{count}",
    textCollections_newSearchCollection:
      "Search and Filter Collection %{count}",
    textCollections_deleteTitle: "Delete Collection",
    textCollections_deleteMessage: 'Really delete "%{name}"?',
    textCollections_collectionCopy: `Copy of "%{name}"`,
    //
    textCollections_contextMenuRename: "Rename",
    textCollections_contextMenuResearch: "Search again",
    textCollections_contextMenuProps: "Properties ...",
    textCollections_contextMenuNonSearch: "Copy to non-search Collection",
    textCollections_contextMenuDelete: "Delete Collection",
    textCollections_withFilter: [
      [1, 1, "One Filter"],
      [2, null, "%{filters} Filters"],
    ],
    textCollections_withSearch: `Search for "%{text}"`,
    textCollections_searchFilter: [
      [1, 1, `One Filter and Search for "%{text}"`],
      [2, null, `%{filters} Filters and Search for "%{text}"`],
    ],
    textCollections_nonSearchCopy: `Copy of "%{search}"`,
    textCollections_empty: "Empty Collection",
  },
};

module.exports = { translationTextCollections };
