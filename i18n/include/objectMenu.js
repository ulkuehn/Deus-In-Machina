/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for object menu entries
 */

const translationObjectMenu = {
  // German
  de: {
    objectMenu_menu: "Objekte",
    objectMenu_singleSelect: "Einzelobjektauswahl",
    objectMenu_newObject: "Neues Objekt einfügen",
    objectMenu_deleteObjects: "Ausgewählte Objekte löschen",
    objectMenu_expandAll: "Alles aufklappen",
    objectMenu_collapseAll: "Alles einklappen",
    objectMenu_expandBranch: "Zweig(e) aufklappen",
    objectMenu_collapseBranch: "Zweig(e) einklappen",
    objectMenu_checkAll: "Alle Objekte aktivieren",
    objectMenu_uncheckAll: "Alle Objekte deaktivieren",
    objectMenu_checkBranch: "Zweig(e) aktivieren",
    objectMenu_uncheckBranch: "Zweig(e) deaktivieren",
    objectMenu_invertCheck: "Aktivierung invertieren",
    objectMenu_checkHavingCheckedTexts:
      "Aktiviere alle Objekte mit Bezug zu den aktivierten Texten",
    objectMenu_checkHavingTexts:
      "Aktiviere alle Objekte mit Bezug zu irgendeinem Text",
    objectMenu_search: "Suchen ...",
  },
  // English
  en: {
    objectMenu_menu: "Objects",
    objectMenu_single: "Single select mode",
    objectMenu_newObject: "New Object",
    objectMenu_deleteObject: "Delete selected Objects",
    objectMenu_expandAll: "Expand all",
    objectMenu_collapseAll: "Collapse all",
    objectMenu_expandBranch: "Expand Branch(es)",
    objectMenu_collapseBranch: "Collapse Branch(es)",
    objectMenu_checkAll: "Activate all Objects",
    objectMenu_uncheckAll: "Deactivate all Objects",
    objectMenu_checkBranch: "Activate Branch(es)",
    objectMenu_uncheckBranch: "Dectivate Branch(es)",
    objectMenu_invertCheck: "Invert Activation",
    objectMenu_checkHavingCheckedTexts:
      "Activate all Objects related to activated Texts",
    objectMenu_checkHavingTexts:
      "Activate all Objects related to any Text",
    objectMenu_search: "Search ...",
  },
};

if (typeof module != "undefined") {
  module.exports = { translationObjectMenu };
}