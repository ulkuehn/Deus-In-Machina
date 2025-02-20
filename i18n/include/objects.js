/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for objects
 */

const translationObjects = {
  // German
  de: {
    objects_empty: "ohne Textbezug",
    objects_newObject: "Objekt %{count}",
    objects_deleteTitle: "Objekt löschen",
    objects_deleteMessage: '"%{name}" wirklich löschen?',
    objects_deleteWarning:
      "\n\nACHTUNG: Die Objekte in diesem Zweig verlieren alle Eigenschaften, die auf dem Schema dieses Objekts beruhen!",
    objects_deleteBranchTitle: "Zweig löschen",
    objects_deleteBranchMessage:
      '"%{name}" und alle untergeordneten Objekte wirklich löschen?',
    objects_objectCopy: 'Kopie von "%{name}"',

    // object tree context menu
    objects_infoMenu: "Infos",
    objects_connectedTexts: [
      [0, 0, "0 Texte mit diesem Objekt"],
      [1, 1, "1 Text mit diesem Objekt"],
      [2, null, "%{value} Texte mit diesem Objekt"],
    ],
    objects_menuStyle: "Textstil anzeigen",
    objects_editMenu: "Anpassen",
    objects_menuEdit: "Umbenennen",
    objects_menuProperties: "Objekteigenschaften ...",
    objects_deleteMenu: "Löschen",
    objects_menuDelete: "Objekt löschen",
    objects_menuDeleteBranch: "Zweig löschen",
    objects_insertMenu: "Neues Objekt",
    objects_menuInsertBefore: "Neues Objekt davor",
    objects_menuInsertAfter: "Neues Objekt danach",
    objects_branchMenu: "Zweig",
    objects_menuExpand: "Zweig komplett öffnen",
    objects_menuCollapse: "Zweig schließen",
    objects_menuActivate: "Zweig aktivieren",
    objects_menuDeactivate: "Zweig deaktivieren",
    objects_textMenu: "Verbundene Texte",
    objects_menuTextsPlus: "Alle Texte mit diesem Objekt aktivieren",
    objects_menuTextsMinus: "Alle Texte mit diesem Objekt deaktivieren",
    objects_menuTextsSet: "Genau die Texte mit diesem Objekt aktivieren",
  },
  // English
  en: {
    objects_empty: "no Text Connection",
    objects_newObject: "Object %{count}",
    objects_deleteTitle: "Delete Object",
    objects_deleteMessage: 'Really delete "%{name}"?',
    objects_deleteWarning:
      "\n\nPLEASE NOTE: All objects in this branch will loose any property based upon this object's scheme!",
    objects_deleteBranchTitle: "Delete Branch",
    objects_deleteBranchMessage:
      'Really delete "%{name}" and all Objects in the Branch?',
    objects_objectCopy: 'Copy of "%{name}"',

    // object tree context menu
    objects_infoMenu: "Infos",
    objects_connectedTexts: [
      [0, 0, "0 Texts connected to this Object"],
      [1, 1, "1 Text connected to this Object"],
      [2, null, "%{value} Texts connected to this Object"],
    ],
    objects_menuStyle: "Show Text Style",
    objects_editMenu: "Edit",
    objects_menuEdit: "Rename",
    objects_menuProperties: "Properties ...",
    objects_deleteMenu: "Delete",
    objects_menuDelete: "Delete Object",
    objects_menuDeleteBranch: "Delete Branch",
    objects_insertMenu: "New Object",
    objects_menuInsertBefore: "New Object above",
    objects_menuInsertAfter: "New Object below",
    objects_branchMenu: "Branch",
    objects_menuExpand: "Open Branch completely",
    objects_menuCollapse: "Close Brnach",
    objects_menuActivate: "Activate Branch",
    objects_menuDeactivate: "Deactivate Branch",
    objects_textMenu: "Connected Texts",
    objects_menuTextsPlus: "Activate all Texts connected to this Object",
    objects_menuTextsMinus: "Deactivate all Texts connected to this Object",
    objects_menuTextsSet: "Activate just the Texts connected to this Object",
  },
};

module.exports = { translationObjects };
