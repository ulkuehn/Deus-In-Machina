/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file i18n translations for texts
 */

const translationTexts = {
  // German
  de: {
    // text tree
    texts_treeDescription:
      "Bereich für Texte<br><br>in diesem Projekt sind noch keine Texte vorhanden",
    texts_newText: "Text %{count}",
    texts_textCopy: 'Kopie von "%{name}"',
    texts_emptyText: "leerer Text",
    texts_lockedText: "gesperrt",
    texts_status: "Status: %{text}",
    texts_type: "Typ: %{text}",
    texts_user: "%{text}",
    texts_deleteTitle: "Text(e) löschen",
    texts_deleteMessage: [
      [1, 1, '"%{name1}" wirklich löschen?'],
      [2, 2, '"%{name1}" und "%{name2}" wirklich löschen?'],
      [3, 3, '"%{name1}", "%{name2}" und "%{name3}" wirklich löschen?'],
      [4, null, '"%{name1}", "%{name2}" und %{texts} weitere Texte wirklich löschen?'],
    ],
    texts_deleteBranchTitle: "Zweig löschen",
    texts_deleteBranchMessage:
      '"%{name}" und alle untergeordneten Texte wirklich löschen?',
    texts_clearCollectionsTitle: "Aus Textlisten entfernen",
    texts_clearCollectionsMessage: `"%{name}" wirklich aus allen Textlisten entfernen?`,

    // text tree context menu
    texts_contextMenuInfoMenu: "Infos",
    texts_contextMenuEditMenu: "Anpassen",
    texts_contextMenuRename: "Umbenennen",
    texts_contextMenuDeriveName: "Name aus Inhalt ableiten",
    texts_contextMenuProps: "Texteigenschaften ...",
    texts_contextMenuLock: "Text sperren",
    texts_contextMenuUnlock: "Text entsperren",
    texts_contextMenuFocusEditor: "Im Fokuseditor öffnen",
    //
    texts_contextMenuAddCollection: "Zu Textliste hinzufügen",
    texts_contextMenuRemoveCollection: "Aus Textliste entfernen",
    texts_contextMenuRemoveAllCollections: "Aus allen Textlisten entfernen",
    //
    texts_contextMenuScrollMenu: "Anzeige",
    texts_contextMenuScrollBegin: "Zum Anfang des Texts",
    texts_contextMenuScrollEnd: "Zum Ende des Texts",
    texts_contextMenuSelectAll: "gesamten Text markieren",
    //
    texts_contextMenuObjectMenu: "Verbundene Objekte",
    texts_contextMenuActivateObjects: "Alle Objekte des Texts aktivieren",
    texts_contextMenuDeactivateObjects: "Alle Objekte des Texts deaktivieren",
    texts_contextMenuActivateTextObjects:
      "Genau die Objekte des Texts aktivieren",
    //
    texts_contextMenuInsertMenu: "Neuer Text",
    texts_contextMenuInsertBefore: "Neuer Text davor",
    texts_contextMenuInsertAfter: "Neuer Text danach",
    texts_contextMenuInsertChild: "Neuer Text unterhalb",
    //
    texts_contextMenuDeleteMenu: "Löschen",
    texts_contextMenuDeleteText: "Text löschen",
    texts_contextMenuDeleteBranch: "Zweig löschen",
    //
    texts_contextMenuBranchMenu: "Zweig",
    texts_contextMenuExpandBranch: "Zweig komplett öffnen",
    texts_contextMenuCollapseBranch: "Zweig schließen",
    texts_contextMenuActivateBranch: "Zweig aktivieren",
    texts_contextMenuActivateBranchNonEmpty:
      "Zweig aktivieren (ohne leere Texte)",
    texts_contextMenuDeactivateBranch: "Zweig deaktivieren",
  },
  // English
  en: {
    // text tree
    texts_treeDescription:
      "Text area<br><br>there are no texts in this project yet",
    texts_newText: "Text %{count}",
    texts_textCopy: 'Copy of "%{name}"',
    texts_emptyText: "empty Text",
    texts_lockedText: "locked",
    texts_status: "Status: %{text}",
    texts_type: "Type: %{text}",
    texts_user: "%{text}",
    texts_deleteTitle: "Delete Text(s)",
    texts_deleteMessage: 'Really delete "%{name}"?',
    texts_deleteBranchTitle: "Delete Branch",
    texts_deleteBranchMessage:
      'Really delete "%{name}" and all texts in the branch?',
    texts_clearCollectionsTitle: "Remove from Collections",
    texts_clearCollectionsMessage: `Really remove "%{name}" from all Collections?`,

    // text tree context menu
    texts_contextMenuInfoMenu: "Infos",
    texts_contextMenuEditMenu: "Edit",
    texts_contextMenuRename: "Rename",
    texts_contextMenuDeriveName: "Derive name from content",
    texts_contextMenuProps: "Properties ...",
    texts_contextMenuLock: "Lock Text",
    texts_contextMenuUnlock: "Unlock Text",
    texts_contextMenuFocusEditor: "Open in Focus Editor",
    //
    texts_contextMenuAddCollection: "Add to Collection",
    texts_contextMenuRemoveCollection: "Remove from Collection",
    texts_contextMenuRemoveAllCollections: "Remove from all Collections",
    //
    texts_contextMenuScrollMenu: "Cursor",
    texts_contextMenuScrollBegin: "Go to Start of Text",
    texts_contextMenuScrollEnd: "Go to End of Text",
    texts_contextMenuSelectAll: "Select whole Text",
    //
    texts_contextMenuObjectMenu: "Objects",
    texts_contextMenuActivateObjects: "Activate all Objects connected to Text",
    texts_contextMenuDeactivateObjects:
      "Deactivate all Objects connected to Text",
    texts_contextMenuActivateTextObjects:
      "Activate just the Objects connected to Text",
    //
    texts_contextMenuInsertMenu: "New Text",
    texts_contextMenuInsertBefore: "New Text Before",
    texts_contextMenuInsertAfter: "New Text after",
    texts_contextMenuInsertChild: "New Text below",
    //
    texts_contextMenuDeleteMenu: "Delete",
    texts_contextMenuDeleteText: "Delete Text",
    texts_contextMenuDeleteBranch: "Delete Branch",
    //
    texts_contextMenuBranchMenu: "Branch",
    texts_contextMenuExpandBranch: "Open Branch completely",
    texts_contextMenuCollapseBranch: "Close branch",
    texts_contextMenuActivateBranch: "Activate Branch",
    texts_contextMenuActivateBranchNonEmpty:
      "Activate Branch (w/o empty Texts)",
    texts_contextMenuDeactivateBranch: "Deactivate Branch",
  },
};

module.exports = { translationTexts };
