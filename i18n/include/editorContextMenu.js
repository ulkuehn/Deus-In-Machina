/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file i18n translations for editor context menu
 */

const translationEditorContextMenu = {
  // German
  "de": {
    editorContextMenu_imageInfo: "Bild %{width} breit, %{height} hoch",
    editorContextMenu_imageProperties: "Bildeigenschaften ...",
    editorContextMenu_selectImage: "Bild selektieren",
    editorContextMenu_infoMenu: "Infos",
    editorContextMenu_selection: "Auswahl: ",
    editorContextMenu_formatMenu: "Formatieren",
    editorContextMenu_bold: `<span style="display:inline-block; width:25px; font-weight:bold; font-size:18px; text-shadow:black 0px 0px 1px">F</span> Fett`,
    editorContextMenu_italic: `<span style="display:inline-block; width:25px; font-style:italic">K</span> Kursiv`,
    editorContextMenu_underline: `<span style="display:inline-block; width:28px; margin-left:-3px; text-decoration:underline">&thinsp;U&thinsp;</span> Unterstrichen`,
    editorContextMenu_strike: `<span style="display:inline-block; width:28px; margin-left:-3px; text-decoration:line-through">&thinsp;D&thinsp;</span> Durchgestrichen`,
    editorContextMenu_editMenu: "Editieren",
    editorContextMenu_copy: "Kopieren",
    editorContextMenu_cut: "Ausschneiden",
    editorContextMenu_paste: "Einfügen",
    editorContextMenu_pasteText: "Einfügen als Text",
    editorContextMenu_pastePlain: "Einfügen und Formatierung entfernen",
    editorContextMenu_insertImage: "Bild aus Datei einfügen ...",
    editorContextMenu_changeMenu: "Anpassen",
    editorContextMenu_focusEditor: "Im Fokuseditor öffnen",
    editorContextMenu_lock: "Text sperren",
    editorContextMenu_split: "Text teilen",
    editorContextMenu_reveal: "Im Textnavigator selektieren",
    editorContextMenu_deriveName: "Textname ändern wie ausgewählt",
    editorContextMenu_editObjectsMenu: "Objekte ändern",
    editorContextMenu_addObjects: [
      [1, 1, "Das aktivierte Objekt hinzufügen"],
      [2, null, "Die aktivierten Objekte hinzufügen"],
    ],
    editorContextMenu_removeObjects: [
      [1, 1, "Das aktivierte Objekt entfernen"],
      [2, null, "Die aktivierten Objekte entfernen"],
    ],
    editorContextMenu_removeAllObjects: [
      [1, 1, "Das Objekt aus der Selektion entfernen"],
      [2, null, "Sämtliche Objekte aus der Selektion entfernen"],
    ],
    editorContextMenu_removeObject: `Entferne "%{name}"`,
    editorContextMenu_changeObjectsMenu: "Objekte (de)aktivieren",
    editorContextMenu_activateExactly: [
      [1, 1, "Nur das Objekt der Selektion aktivieren"],
      [2, null, "Nur die Objekte der Selektion aktivieren"],
    ],
    editorContextMenu_activate: "Die Objekte der Selektion aktivieren",
    editorContextMenu_deactivate: "Die Objekte der Selektion deaktivieren",
    editorContextMenu_toolsMenu: "Online-Werkzeuge",
    editorContextMenu_words: [
      [0, 0, "0 Wörter"],
      [1, 1, "1 Wort"],
      [2, null, "%{words} Wörter"],
    ],
    editorContextMenu_characters: [[0, null, "%{characters} Zeichen"]],
    editorContextMenu_objects: [
      [0, 0, "0 Objekte"],
      [1, 1, "1 Objekt"],
      [2, null, "%{objects} Objekte"],
    ],
    editorContextMenu_texts: [
      [0, 0, "0 Texte"],
      [1, 1, "1 Text"],
      [2, null, "%{texts} Texte"],
    ],
    editorContextMenu_timestamps: "%{created} / %{changed}",
    editorContextMenu_created: "angelegt: %{created} (vor %{relative})",
    editorContextMenu_changed: "verändert: %{changed} (vor %{relative})",
  },
  // English
  "en": {
    editorContextMenu_imageInfo: "Image %{width} wide, %{height} high",
    editorContextMenu_imageProperties: "Image properties ...",
    editorContextMenu_selectImage: "Select Image",
    editorContextMenu_infoMenu: "Info",
    editorContextMenu_selection: "Selection: ",
    editorContextMenu_formatMenu: "Format",
    editorContextMenu_bold: `<span style="display:inline-block; width:25px; font-weight:bold; font-size:18px; text-shadow:black 0px 0px 1px">B</span> Bold`,
    editorContextMenu_italic: `<span style="display:inline-block; width:25px; font-style:italic">I</span> Italic`,
    editorContextMenu_underline: `<span style="display:inline-block; width:28px; margin-left:-3px; text-decoration:underline">&thinsp;U&thinsp;</span> Underline`,
    editorContextMenu_strike: `<span style="display:inline-block; width:28px; margin-left:-3px; text-decoration:line-through">&thinsp;S&thinsp;</span> Strikethrough`,
        editorContextMenu_editMenu: "Edit",
    editorContextMenu_copy: "Copy",
    editorContextMenu_cut: "Cut",
    editorContextMenu_paste: "Insert",
    editorContextMenu_pasteText: "Insert as plain text",
    editorContextMenu_pastePlain: "Insert and remove formatting",
    editorContextMenu_insertImage: "Insert Image from file ...",
    editorContextMenu_changeMenu: "Change",
    editorContextMenu_focusEditor: "Open in focus mode",
    editorContextMenu_lock: "Lock Text",
    editorContextMenu_split: "Split Text",
    editorContextMenu_reveal: "Select in Text Tree",
    editorContextMenu_deriveName: "Rename Text from selection",
    editorContextMenu_editObjectsMenu: "Objects",
    editorContextMenu_addObjects: [
      [1, 1, "Set activated Object"],
      [2, null, "Set activated Objects"],
    ],
    editorContextMenu_removeObjects: [
      [1, 1, "Unset activated Object"],
      [2, null, "Unset activated Objects"],
    ],
    editorContextMenu_removeAllObjects: [
      [1, 1, "Remove the Object in Selection"],
      [2, null, "Remove all Objects in Selection"],
    ],
    editorContextMenu_removeObject: `Remove "%{name}"`,
    editorContextMenu_changeObjectsMenu: "Change Objects",
    editorContextMenu_activateExactly: [
      [1, 1, "Activate just the Object contained in Selection"],
      [2, null, "Activate just the Objects contained in Selection"],
    ],
    editorContextMenu_activate: "Activate the Objects contained in Selection",
    editorContextMenu_deactivate:
      "Deactivate the Objects contained in Selection",
    editorContextMenu_toolsMenu: "Online Tools",
    editorContextMenu_words: [
      [0, 0, "0 Words"],
      [1, 1, "1 Word"],
      [2, null, "%{words} Words"],
    ],
    editorContextMenu_characters: [[0, null, "%{characters} Characters"]],
    editorContextMenu_objects: [
      [0, 0, "0 Objects"],
      [1, 1, "1 Object"],
      [2, null, "%{objects} Objects"],
    ],
    editorContextMenu_texts: [
      [0, 0, "0 Texts"],
      [1, 1, "1 Text"],
      [2, null, "%{texts} Texts"],
    ],
    editorContextMenu_timestamps: "%{created} / %{changed}",
    editorContextMenu_created: "Created: %{created} (%{relative} ago)",
    editorContextMenu_changed: "Last changed: %{changed} (%{relative} ago)",
  },
};

module.exports = { translationEditorContextMenu };
