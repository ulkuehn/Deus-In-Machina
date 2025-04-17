/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for text menu entries 
 */

const translationTextMenu = {
  // German
  de: {
    textMenu_menu: "Texte",
    textMenu_newText: "Neuen Text einfügen",
    textMenu_deleteText: "Ausgewählten Text löschen",
    textMenu_deleteBranch: "Ausgewählten Zweig löschen",
    textMenu_joinTexts: "Ausgewählte Texte nahtlos verbinden",
    textMenu_joinTextsSep: "Ausgewählte Texte verbinden",
    textMenu_expandAll: "Alles aufklappen",
    textMenu_collapseAll: "Alles einklappen",
    textMenu_expandBranch: "Zweig(e) aufklappen",
    textMenu_collapseBranch: "Zweig(e) einklappen",
    textMenu_checkAll: "Alle Texte aktivieren",
    textMenu_uncheckAll: "Alle Texte deaktivieren",
    textMenu_checkBranch: "Zweig(e) aktivieren",
    textMenu_uncheckBranch: "Zweig(e) deaktivieren",
    textMenu_invertCheck: "Aktivierung invertieren",
    textMenu_checkCheckedObjects:
      "Aktiviere alle Texte mit Bezug zu den aktivierten Objekten",
    textMenu_checkHasObjects:
      "Aktiviere alle Texte mit Bezug zu irgendeinem Objekt",
    textMenu_search: "Suchen und filtern ...",
    textMenu_newCollection: "Neue Textliste einfügen",
  },
  // English
  en: {
    textMenu_menu: "Texts",
    textMenu_newText: "New Text",
    textMenu_deleteText: "Delete Text",
    textMenu_deleteBranch: "Delete Branch",
    textMenu_joinTexts: "Join selected Texts seamlessly",
    textMenu_joinTextsSep: "Join selected Texts",
    textMenu_expandAll: "Expand all",
    textMenu_collapseAll: "Collapse all",
    textMenu_expandBranch: "Expand Branch(es)",
    textMenu_collapseBranch: "Collapse Branch(es)",
    textMenu_checkAll: "Activate all Texts",
    textMenu_uncheckAll: "Dectivate all Texts",
    textMenu_checkBranch: "Activate Branch(es)",
    textMenu_uncheckBranch: "Deactivate Branch(es)",
    textMenu_invertCheck: "Invert Activation",
    textMenu_checkCheckedObjects:
      "Activate all Texts related to activated Objects",
    textMenu_checkHasObjects: "Activate all Texts related to any Object",
    textMenu_search: "Search and filter ...",
    textMenu_newCollection: "New Text Collection",
  },
};

if (typeof module != "undefined") {
  module.exports = { translationTextMenu };
}