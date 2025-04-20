/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of Settings class
 */

/**
 * @classdesc data and functions for global and project specific settings
 */
class Settings {
  /**
   * definition of all settings elements, organized in tabs
   * @static
   */
  static settings = [
    // general
    {
      tab: "settingTabs_general", // i18n string for tab name
      info: "settingsWindow_generalInfo", // i18n string for tab explanation
      globalOnly: true,
      settings: [
        {
          type: "separator",
          name: "settingsWindow_generalSetup",
        },
        {
          type: "select",
          name: "language",
          values: [...Languages.languages],
          default: "", // the real default will be the system's locale or the language set with electrons --lang=... option
        },
        {
          type: "text",
          name: "dateTimeFormatShort",
          default: "settingDefaults_dateTimeFormatShort",
          i18n: true,
        },
        {
          type: "text",
          name: "dateTimeFormatLong",
          default: "settingDefaults_dateTimeFormatLong",
          i18n: true,
        },
        {
          type: "select",
          name: "closingType",
          values: [
            "settingsWindow_closeByButtons",
            "settingsWindow_closeByX",
            "settingsWindow_closeByBoth",
          ],
          default: "settingsWindow_closeByBoth",
        },
        {
          type: "range",
          name: "projectsListLength",
          min: 0,
          max: 30,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 10,
        },
        {
          type: "range",
          name: "exportsListLength",
          min: 0,
          max: 30,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 10,
        },
        {
          type: "check",
          name: "openRecentOnLaunch",
          default: false,
        },
        {
          type: "select",
          name: "autoSaveTime",
          default: "60_AST",
          // values must parseInt to int value
          values: [
            "0_AST", // no auto save
            "10_AST",
            "30_AST",
            "60_AST",
            "120_AST",
            "300_AST",
            "600_AST",
          ],
        },
        {
          type: "select",
          name: "palette",
          default: Object.keys(systemPalettes)[0],
          values: [...Object.keys(systemPalettes), noPalette],
        },
        {
          type: "select",
          name: "splash",
          // values must parseInt to int value -- bit 1 is for splash, bit 2 is for sound
          values: ["0_noSplash", "1_silentSplash", "3_fullSplash"],
          default: "1_silentSplash",
        },
        {
          type: "check",
          name: "debug",
          default: false,
        },
        {
          type: "separator",
          name: "settingsWindow_generalManagement",
        },
      ],
    },
    // layout
    {
      tab: "settingTabs_layout",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_layoutGutters",
        },
        {
          type: "color",
          name: "gutterColor",
          default: "#d0d0d0",
        },
        {
          type: "range",
          name: "gutterSize",
          min: 1,
          max: 20,
          step: 1,
          unit: "px",
          unitI18n: "units_pixel",
          default: 3,
        },
        {
          type: "separator",
          name: "settingsWindow_scrollbars",
        },
        {
          type: "check",
          name: "scrollbarThin",
          default: true,
        },
        {
          type: "select",
          name: "scrollbarStyle",
          values: ["sb_system", "sb_soft", "sb_hard"],
          default: "sb_soft",
        },
        {
          type: "separator",
          name: "settingsWindow_backgroundColors",
        },
        {
          type: "color",
          name: "generalBackgroundColor",
          default: "#ffffff",
        },
        {
          type: "emptycolor",
          name: "TTBackgroundColor",
          default: "#fafafa",
        },
        {
          type: "emptycolor",
          name: "TCLBackgroundColor",
          default: "#fafafa",
        },
        {
          type: "emptycolor",
          name: "TEBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "ORBackgroundColor",
          default: "#f0f0f0",
        },
        {
          type: "emptycolor",
          name: "OTBackgroundColor",
          default: "#fafafa",
        },
        {
          type: "separator",
          name: "settingsWindow_windowBackgroundColors",
        },
        {
          type: "emptycolor",
          name: "settingsBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "textBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "collectionBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "objectBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "propertiesBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "exportBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "previewBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "formatsBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "symbolsBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "spellcheckBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "wordlistBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "passwordBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "transferBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "importfromurlBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "aboutBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "imageBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "textSearchBackgroundColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "objectSearchBackgroundColor",
          default: "",
        },
        {
          type: "separator",
          name: "settingsWindow_layoutWordcloud",
        },
        {
          type: "font",
          name: "wordcloudFont",
          default: "'sansSerif'",
        },
        {
          type: "select",
          name: "wordcloudColorScheme",
          values: [
            "settingsWindow_wordcloudColorLight",
            "settingsWindow_wordcloudColorDark",
            "settingsWindow_wordcloudColorUser",
          ],
          default: "settingsWindow_wordcloudColorDark",
        },
        {
          type: "color",
          name: "wordcloudColor",
          default: "#000000",
        },
        {
          type: "color",
          name: "wordcloudBackgroundColor",
          default: "#ffffff",
        },
      ],
    },
    // editor
    {
      tab: "settingTabs_editor",
      info: "settingsWindow_editorInfo",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_editorGeneral",
        },
        {
          type: "color",
          name: "selectionColor",
          default: "#0000ff",
        },
        {
          type: "emptycolor",
          name: "selectionObjectColor",
          default: "#0000c0",
        },
        {
          type: "check",
          name: "selectionCheckedObjects",
          default: false,
        },
        {
          type: "check",
          name: "selectionUnstyledObjects",
          default: true,
        },
        {
          type: "check",
          name: "showLogo",
          default: true,
        },
        {
          type: "range",
          name: "firstLineIndent",
          min: 0,
          max: 100,
          step: 10,
          unit: "%",
          unitI18n: "units_percent",
          default: 0,
        },
        {
          type: "check",
          name: "firstLineIndentFormats",
          default: true,
        },
        {
          type: "check",
          name: "autoSelectTreeItem",
          default: true,
        },
        {
          type: "emptycolor",
          name: "lockedBackgroundColor",
          default: "",
        },
        {
          type: "range",
          name: "lockedOpacity",
          min: 0,
          max: 100,
          step: 10,
          unit: "",
          unitI18n: "",
          default: 50,
        },
        {
          type: "separator",
          name: "settingsWindow_editorBars",
        },
        {
          type: "range",
          name: "contrastLevel",
          min: -5,
          max: 5,
          step: 1,
          unit: "",
          unitI18n: "",
          default: -1,
        },
        {
          type: "check",
          name: "borderLine",
          default: false,
        },
        {
          type: "check",
          name: "textPath",
          default: false,
        },
        {
          type: "check",
          name: "objectsOnOver",
          default: false,
        },
        {
          type: "check",
          name: "objectsOnClick",
          default: true,
        },
        {
          type: "range",
          name: "objectsShowTime",
          unit: "s",
          unitI18n: "units_s",
          min: 0.5,
          max: 5,
          step: 0.5,
          default: 2,
        },
        {
          type: "separator",
          name: "settingsWindow_editorSeparator",
        },
        {
          type: "emptycolor",
          name: "textSeparatorColor",
          default: "#757575",
        },
        {
          type: "select",
          name: "textSeparatorStyle",
          values: ["none", "solid", "double", "dotted", "dashed"],
          default: "dotted",
        },
        {
          type: "range",
          name: "textSeparatorWidth",
          min: 1,
          max: 20,
          step: 1,
          unit: "px",
          unitI18n: "units_pixel",
          default: 2,
        },
        {
          type: "range",
          name: "textSeparatorAbove",
          min: 0,
          max: 100,
          step: 1,
          unit: "px",
          unitI18n: "units_pixel",
          default: 15,
        },
        {
          type: "range",
          name: "textSeparatorBelow",
          min: 0,
          max: 100,
          step: 1,
          unit: "px",
          unitI18n: "units_pixel",
          default: 15,
        },
        {
          type: "separator",
          name: "settingsWindow_editorSearch",
        },
        {
          type: "check",
          name: "searchWithRegex",
          default: true,
        },
        {
          type: "check",
          name: "replaceAllConfirm",
          default: true,
        },
        {
          type: "range",
          name: "replaceBlinkBefore",
          min: 0,
          max: 5,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 0,
        },
        {
          type: "range",
          name: "replaceBlinkAfter",
          min: 0,
          max: 5,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 0,
        },
        {
          type: "range",
          name: "replaceBlinkTime",
          min: 200,
          max: 1000,
          step: 100,
          unit: "ms",
          unitI18n: "units_ms",
          default: 500,
        },
        {
          type: "separator",
          name: "settingsWindow_editorSpellcheck",
        },
        {
          type: "emptycolor",
          name: "spellcheckDecorationColor",
        },
        {
          type: "select",
          name: "spellcheckDecorationThickness",
          values: ["0_thin", "5_medium", "10_thick"],
          default: "5_medium",
        },
        {
          type: "emptycolor",
          name: "spellcheckShadowColor",
        },
        {
          type: "separator",
          name: "settingsWindow_editorSpellCorrection",
        },
        {
          type: "emptycolor",
          name: "spellCorrectionSelectionColor",
          default: "",
        },
        {
          type: "check",
          name: "spellCorrectionMovingWindow",
          default: true,
        },
        {
          type: "range",
          name: "correctionBlinkBefore",
          min: 0,
          max: 5,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 0,
        },
        {
          type: "range",
          name: "correctionBlinkAfter",
          min: 0,
          max: 5,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 0,
        },
        {
          type: "range",
          name: "correctionBlinkTime",
          min: 200,
          max: 1000,
          step: 100,
          unit: "ms",
          unitI18n: "units_ms",
          default: 500,
        },
        {
          type: "check",
          name: "spellCorrectionRestoreSelection",
          default: true,
        },
        {
          type: "separator",
          name: "settingsWindow_editorContextMenu",
        },
        {
          type: "check",
          name: "editorCompactContextMenu",
          default: false,
        },
        {
          type: "check",
          name: "editorContextMenuStats",
          default: false,
        },
        {
          type: "select",
          name: "editorContextMenuTime",
          values: ["noTime", "compactTime", "fullTime"],
          default: "compactTime",
        },
        {
          type: "check",
          name: "editorContextMenuFormat",
          default: true,
        },
        {
          type: "textarea",
          i18n: true,
          name: "editorContextMenuWeb",
          rows: 5,
          default: "settingDefaults_webtools",
        },
        {
          type: "separator",
          name: "settingsWindow_editorFormats",
        },
        {
          type: "check",
          name: "previewFormats",
          default: true,
        },
        {
          type: "textarea",
          i18n: true,
          name: "editorFormatSample",
          rows: 5,
          default: "sampleTexts_long",
        },
      ],
    },
    // focus editor / distraction free mode
    {
      tab: "settingTabs_focusEditor",
      info: "settingsWindow_focusEditorInfo",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_focusEditorGeneral",
        },
        {
          type: "check",
          name: "focusEditorAnimation",
          default: true,
        },
        {
          type: "range",
          name: "focusEditorWidth",
          unit: "%",
          unitI18n: "units_percent",
          default: 80,
          min: 20,
          max: 100,
          step: 1,
        },
        {
          type: "range",
          name: "focusEditorHeight",
          unit: "%",
          unitI18n: "units_percent",
          default: 80,
          min: 20,
          max: 100,
          step: 1,
        },
        {
          type: "check",
          name: "focusEditorObjects",
          default: true,
        },
        {
          type: "check",
          name: "focusEditorContextMenuWeb",
          default: true,
        },
        {
          type: "separator",
          name: "settingsWindow_focusEditorBackgrounds",
        },
        { type: "color", name: "focusEditorBarColor", default: "#ffffff" },
        { type: "emptycolor", name: "focusEditorWallpaperColor", default: "" },
        {
          type: "image",
          name: "focusEditorWallpaper",
          height: "200px",
          default:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NoaGj4DwAFhAKAEgUrPQAAAABJRU5ErkJggg==", // 1x1 pixel gray
        },
        {
          type: "range",
          name: "focusEditorWallpaperOpacity",
          unit: "%",
          unitI18n: "units_percent",
          default: 100,
          min: 0,
          max: 100,
          step: 1,
        },
        { type: "emptycolor", name: "focusEditorBackgroundColor", default: "" },
        {
          type: "image",
          name: "focusEditorBackground",
          height: "200px",
          default:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2O4efPofwAIfQN3mgQNkgAAAABJRU5ErkJggg==", // 1x1 pixel yellowish
        },
        {
          type: "range",
          name: "focusEditorBackgroundOpacity",
          unit: "%",
          unitI18n: "units_percent",
          default: 100,
          min: 0,
          max: 100,
          step: 1,
        },
        {
          type: "separator",
          name: "settingsWindow_focusEditorSounds",
        },
        { type: "check", name: "focusEditorSoundOn", default: true },
        {
          type: "sounds",
          name: "focusEditorSound",
          min: 5, // volume %
          max: 100,
          step: 5,
          default: -80, // negative value meaning sound is checked off
        },
      ],
    },
    // text tree
    {
      tab: "settingTabs_textTree",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_textTreeStyle",
        },
        {
          type: "select",
          name: "textTreeEmptyIcon",
          values: [
            "settingsWindow_always",
            "settingsWindow_leaves",
            "settingsWindow_never",
          ],
          default: "settingsWindow_leaves",
        },
        {
          type: "check",
          name: "textTreeLockedIcon",
          default: true,
        },
        {
          type: "check",
          name: "textTreeSmall",
          default: false,
        },
        {
          type: "check",
          name: "textTreeDots",
          default: false,
        },
        {
          type: "check",
          name: "textTreeWholerow",
          default: false,
        },
        {
          type: "color",
          name: "textTreeSelectionColor",
          default: "#7678ed",
        },
        {
          type: "check",
          name: "textTreeSelectionBorder",
          default: false,
        },
        {
          type: "color",
          name: "textTreeHoverColor",
          default: "#adaeee",
        },
        {
          type: "separator",
          name: "settingsWindow_textTreeContextMenu",
        },
        {
          type: "check",
          name: "textTreeCompactContextMenu",
          default: false,
        },
        {
          type: "check",
          name: "textTreeContextMenuStats",
          default: true,
        },
        {
          type: "check",
          name: "textTreeContextMenuBranchStats",
          default: true,
        },
        {
          type: "select",
          name: "textTreeContextMenuTime",
          values: ["noTime", "compactTime", "fullTime"],
          default: "compactTime",
        },
        {
          type: "range",
          name: "textTreeNameWords",
          min: 1,
          max: 10,
          step: 1,
          unit: "",
          unitI18n: "",
          default: 3,
        },
        {
          type: "select",
          name: "textTreeAppendName",
          values: ["", " ...", " . . .", " ---", " - - -", " ***", " * * *"],
          default: " . . .",
        },
        {
          type: "separator",
          name: "settingsWindow_textTreeDecorationStatus",
        },
        {
          type: "check",
          name: "textTreeShowStatus",
          default: true,
        },
        {
          type: "check",
          name: "textTreeShowNoStatus",
          default: false,
        },
        {
          type: "select",
          name: "textTreeShowStatusForm",
          values: [
            "circle",
            "square",
            "heart",
            "star",
            "flag",
            "comment",
            "bookmark",
            "bell",
            "clipboard",
            "clock",
            "user",
          ],
          default: "circle",
        },
        {
          type: "separator",
          name: "settingsWindow_textTreeDecorationType",
        },
        {
          type: "check",
          name: "textTreeShowType",
          default: true,
        },
        {
          type: "check",
          name: "textTreeShowNoType",
          default: false,
        },
        {
          type: "select",
          name: "textTreeShowTypeForm",
          values: [
            "circle",
            "square",
            "heart",
            "star",
            "flag",
            "comment",
            "bookmark",
            "bell",
            "clipboard",
            "clock",
            "user",
          ],
          default: "circle",
        },
        {
          type: "separator",
          name: "settingsWindow_textTreeDecorationUser",
        },
        {
          type: "check",
          name: "textTreeShowUser",
          default: true,
        },
        {
          type: "check",
          name: "textTreeShowNoUser",
          default: false,
        },
        {
          type: "select",
          name: "textTreeShowUserForm",
          values: [
            "circle",
            "square",
            "heart",
            "star",
            "flag",
            "comment",
            "bookmark",
            "bell",
            "clipboard",
            "clock",
            "user",
          ],
          default: "circle",
        },
        {
          type: "separator",
          name: "settingsWindow_textTreeProperties",
        },
        {
          type: "check",
          name: "textsHighlightCheckedObjects",
          default: false,
        },
      ],
    },
    // text collections
    {
      tab: "settingTabs_textCollectionTree",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_textCollectionStyle",
        },
        {
          type: "check",
          name: "textCollectionTreeEmptyIcon",
          default: true,
        },
        {
          type: "check",
          name: "textCollectionTreeSmall",
          default: false,
        },
        {
          type: "check",
          name: "textCollectionTreeAutoActivate",
          default: true,
        },
        {
          type: "check",
          name: "textCollectionTreeShowSearchProperties",
          default: true,
        },
        {
          type: "separator",
          name: "settingsWindow_textCollectionTreeNew",
        },
        {
          type: "check",
          name: "textCollectionTreeNewCollectionRandomColor",
          default: true,
        },
        {
          type: "emptycolor",
          name: "textCollectionTreeNewCollectionColor",
          default: "",
        },
        {
          type: "emptycolor",
          name: "textCollectionTreeNewSearchCollectionColor",
          default: "",
        },
        {
          type: "separator",
          name: "settingsWindow_textCollectionTreeContextMenu",
        },
        {
          type: "check",
          name: "textCollectionCompactContextMenu",
          default: false,
        },
        {
          type: "check",
          name: "textCollectionTreeContextMenuStats",
          default: true,
        },
        {
          type: "select",
          name: "textCollectionTreeContextMenuTime",
          values: ["noTime", "compactTime", "fullTime"],
          default: "compactTime",
        },
      ],
    },
    // object tree
    {
      tab: "settingTabs_objectTree",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_objectTreeStyle",
        },
        {
          type: "select",
          name: "objectTreeEmptyIcon",
          values: [
            "settingsWindow_always",
            "settingsWindow_leaves",
            "settingsWindow_never",
          ],
          default: "settingsWindow_leaves",
        },
        {
          type: "check",
          name: "objectTreeSmall",
          default: false,
        },
        {
          type: "check",
          name: "objectTreeDots",
          default: false,
        },
        {
          type: "check",
          name: "objectTreeWholerow",
          default: false,
        },
        {
          type: "color",
          name: "objectTreeSelectionColor",
          default: "#f7b801",
        },
        {
          type: "check",
          name: "objectTreeSelectionBorder",
          default: false,
        },
        {
          type: "color",
          name: "objectTreeHoverColor",
          default: "#dfc680",
        },
        {
          type: "separator",
          name: "settingsWindow_objectTreeContextMenu",
        },
        {
          type: "check",
          name: "objectTreeCompactContextMenu",
          default: false,
        },
        {
          type: "check",
          name: "objectTreeContextMenuStats",
          default: true,
        },
        {
          type: "select",
          name: "objectTreeContextMenuTime",
          values: ["noTime", "compactTime", "fullTime"],
          default: "compactTime",
        },
        {
          type: "separator",
          name: "settingsWindow_objectTreeAction",
        },
        {
          type: "check",
          name: "objectTreeNewObjectUnderline",
          default: false,
        },
        {
          type: "check",
          name: "objectTreeNewObjectItalic",
          default: false,
        },
        {
          type: "emptycolor",
          name: "objectTreeNewObjectColor",
          default: "",
        },
        {
          type: "separator",
          name: "settingsWindow_objectTreeProperties",
        },
        {
          type: "check",
          name: "objectsHighlightCheckedTexts",
          default: false,
        },
        {
          type: "check",
          name: "objectsShowParentScheme",
          default: true,
        },
        {
          type: "textarea",
          i18n: true,
          name: "objectsTextSample",
          rows: 3,
          default: "sampleTexts_medium",
        },
      ],
    },
    // scheme properties
    {
      tab: "settingTabs_scheme",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_schemeRelation",
        },
        {
          type: "check",
          name: "relationSortAlpha",
          default: true,
        },
        {
          type: "separator",
          name: "settingsWindow_schemeEditor",
        },
        {
          type: "range",
          name: "schemeEditorHeight",
          min: 100,
          max: 1000,
          step: 10,
          unit: "px",
          unitI18n: "units_pixel",
          default: 300,
        },
        {
          type: "separator",
          name: "settingsWindow_schemeMap",
        },
        {
          type: "range",
          name: "schemeMapHeight",
          min: 100,
          max: 1000,
          step: 10,
          unit: "px",
          unitI18n: "units_pixel",
          default: 500,
        },
        {
          type: "color",
          name: "schemeMapMarkerColor",
          default: "#f1c232",
        },
        {
          type: "check",
          name: "schemeMapMarkerConfirmDelete",
          default: true,
        },
        {
          type: "map",
          name: "schemeMapBounds",
          default: {
            center: [0, 0],
            zoom: 1,
            marker: [],
          },
        },
      ],
    },
    // images
    {
      tab: "settingTabs_image",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_imageDefaults",
        },
        {
          type: "check",
          name: "imageShadow",
          default: true,
        },
        {
          type: "select",
          name: "imageAlignment",
          values: DIMImage.alignments,
          default: DIMImage.alignmentDefault,
        },
        {
          type: "range",
          name: "imageWidth",
          min: 0,
          max: 1000,
          step: 100,
          default: 500,
          unitI18n: "units_pixel",
          unit: "px",
        },
        {
          type: "range",
          name: "imageHeight",
          min: 0,
          max: 1000,
          step: 100,
          default: 500,
          unitI18n: "units_pixel",
          unit: "px",
        },
        {
          type: "separator",
          name: "settingsWindow_imageObjectReference",
        },
        {
          type: "select",
          name: "imageReference",
          values: [
            "imageReferenceFull",
            "imageReferenceThumb",
            "imageReferenceText",
            "imageReferenceIcon",
            "imageReferenceIconLarge",
            "imageReferenceEmpty",
          ],
          default: "imageReferenceThumb",
        },
      ],
    },
    // import
    {
      tab: "settingTabs_import",
      settings: [
        {
          type: "separator",
          name: "settingsWindow_importFile",
        },
        {
          type: "select",
          name: "importName",
          values: ["importNameFile", "importNameExt", "importNamePath"],
          default: "importNameFile",
        },
        {
          type: "select",
          name: "importTree",
          values: ["importTreeFlat", "importTreeTrimmed", "importTreeTree"],
          default: "importTreeTree",
        },
        {
          type: "separator",
          name: "settingsWindow_importWeb",
        },
        {
          type: "select",
          name: "importNameWeb",
          values: [
            "importNameWebTitle",
            "importNameWebURL",
            "importNameWebDomain",
          ],
          default: "importNameWebTitle",
        },
        {
          type: "text",
          i18n: true,
          name: "importSearch",
          default: "settingDefaults_importSearchURL",
        },
      ],
    },
    // export
    {
      tab: "settingTabs_export",
      settings: [
        { type: "separator", name: "settingsWindow_exportPlaceholders" },
        {
          type: "emptycolor",
          name: "exportPlaceholderBackgroundColor",
          default: "#e0e0e0",
        },
        {
          type: "emptycolor",
          name: "exportPlaceholderBorderColor",
          default: "",
        },
        {
          type: "select",
          name: "exportPlaceholderStuffing",
          // left stuffing is from begin up to first space, right stuffing is from last space to end, rex is /^(\S*)\s.+\s(\S*)$/
          values: [
            "exportPlaceholderStuffingNone",
            "\u2605 &middot; &middot; &middot; \u2605",
            "\u2605\u2605\u2605 &middot; &middot; &middot; \u2605\u2605\u2605",
            "( &middot; &middot; &middot; )",
            "((( &middot; &middot; &middot; )))",
            "< &middot; &middot; &middot; >",
            "<<< &middot; &middot; &middot; >>>",
            "[ &middot; &middot; &middot; ]",
            "[[[ &middot; &middot; &middot; ]]]",
            "\u25c0 &middot; &middot; &middot; \u25b6",
            "\u25c0\u25c0\u25c0 &middot; &middot; &middot; \u25b6\u25b6\u25b6",
            "\u25cf &middot; &middot; &middot; \u25cf",
            "\u25cf\u25cf\u25cf &middot; &middot; &middot; \u25cf\u25cf\u25cf",
          ],
          default: "exportPlaceholderStuffingNone",
        },
        {
          type: "separator",
          name: "settingsWindow_exportSample",
        },
        {
          type: "textarea",
          i18n: true,
          name: "exportTextSample",
          rows: 3,
          default: "sampleTexts_medium",
        },
        {
          type: "separator",
          name: "settingsWindow_exportTexts",
        },
        {
          type: "check",
          name: "exportTextImage",
          default: true,
        },
        {
          type: "select",
          name: "exportSubstituteBold",
          values: [
            "exportSubstituteNone",
            "exportSubstituteUpper",
            "exportSubstituteSpaced",
            "exportSubstituteScored",
            "exportSubstituteStriked",
            "exportSubstituteUpperSpaced",
            "exportSubstituteUpperScored",
            "exportSubstituteUpperStriked",
          ],
          default: "exportSubstituteUpper",
        },
        {
          type: "select",
          name: "exportSubstituteItalic",
          values: [
            "exportSubstituteNone",
            "exportSubstituteUpper",
            "exportSubstituteSpaced",
            "exportSubstituteScored",
            "exportSubstituteStriked",
            "exportSubstituteUpperSpaced",
            "exportSubstituteUpperScored",
            "exportSubstituteUpperStriked",
          ],
          default: "exportSubstituteSpaced",
        },
        {
          type: "select",
          name: "exportSubstituteUnderline",
          values: [
            "exportSubstituteNone",
            "exportSubstituteUpper",
            "exportSubstituteSpaced",
            "exportSubstituteScored",
            "exportSubstituteStriked",
            "exportSubstituteUpperSpaced",
            "exportSubstituteUpperScored",
            "exportSubstituteUpperStriked",
          ],
          default: "exportSubstituteScored",
        },
        {
          type: "select",
          name: "exportSubstituteStrike",
          values: [
            "exportSubstituteNone",
            "exportSubstituteUpper",
            "exportSubstituteSpaced",
            "exportSubstituteScored",
            "exportSubstituteStriked",
            "exportSubstituteUpperSpaced",
            "exportSubstituteUpperScored",
            "exportSubstituteUpperStriked",
          ],
          default: "exportSubstituteStriked",
        },
        {
          type: "range",
          name: "exportTableLineLength",
          min: 40,
          max: 200,
          step: 1,
          unit: "",
          unitI18n: "units_character",
          default: 80,
        },
        {
          type: "separator",
          name: "settingsWindow_exportMaps",
        },
        {
          type: "select",
          name: "exportRasterizeMaps",
          values: ["noRaster", "overviewRaster", "detailRaster", "fullRaster"],
          default: "fullRaster",
        },
        {
          type: "range",
          name: "exportOverwiewmapWidth",
          min: 100,
          max: 1000,
          unit: "px",
          unitI18n: "units_pixel",
          step: 10,
          default: 800,
        },
        {
          type: "range",
          name: "exportOverwiewmapHeight",
          min: 100,
          max: 1000,
          unit: "px",
          unitI18n: "units_pixel",
          step: 10,
          default: 500,
        },
        {
          type: "select",
          name: "exportOverwiewmapMaxZoom",
          values: [
            "3_zoomLargeCountry",
            "5_zoomMidCountry",
            "7_zoomSmallCountry",
            "9_zoomMetropolitanArea",
            "11_zoomCity",
            "13_zoomVillage",
            "15_zoomSmallRoad",
            "17_zoomBlock",
            "19_zoomHouse",
          ],
          default: "5_zoomMidCountry",
        },
        {
          type: "range",
          name: "exportDetailmapWidth",
          min: 100,
          max: 1000,
          unit: "px",
          unitI18n: "units_pixel",
          step: 10,
          default: 400,
        },
        {
          type: "range",
          name: "exportDetailmapHeight",
          min: 100,
          max: 1000,
          unit: "px",
          unitI18n: "units_pixel",
          step: 10,
          default: 400,
        },
        {
          type: "select",
          name: "exportDetailmapMaxZoom",
          values: [
            "3_zoomLargeCountry",
            "5_zoomMidCountry",
            "7_zoomSmallCountry",
            "9_zoomMetropolitanArea",
            "11_zoomCity",
            "13_zoomVillage",
            "15_zoomSmallRoad",
            "17_zoomBlock",
            "19_zoomHouse",
          ],
          default: "13_zoomVillage",
        },
      ],
    },
  ];

  /**
   * returns all settings defaults as object
   *
   * @param {String} language
   * @returns {Object}
   */
  static defaultSettings(language = theLanguage) {
    let def = {};
    Settings.settings.forEach((tab) => {
      tab.settings.forEach((setting) => {
        if ("default" in setting) {
          switch (setting.type) {
            case "sounds":
              Sounds.backgroundSounds.forEach((sound) => {
                def[`${setting.name}_${sound.name}`] = setting.default;
              });
              break;
            default:
              if ("i18n" in setting) {
                def[setting.name] = _(setting.default);
              } else {
                def[setting.name] = setting.default;
              }
          }
        }
      });
    });
    def.language = language;

    return def;
  }

  #globalSettings; // global settings object
  #projectSettings; // project specific settings object
  #dirty; // true if changed

  /**
   * class constructor
   *
   * @param {Object} globalSettings
   * @param {Object} projectSettings
   */
  constructor(globalSettings = null, projectSettings = null) {
    this.#dirty = false;
    this.#globalSettings =
      globalSettings ??
      Object.assign(
        {},
        Settings.defaultSettings(theLanguage),
        Categories.defaultCategories(),
      );
    this.#projectSettings = projectSettings ?? {};
  }

  // getters and setters

  get globalSettings() {
    return JSON.stringify(this.#globalSettings);
  }

  set globalSettings(value) {
    this.#globalSettings = JSON.parse(value);
    ipcRenderer.invoke("mainProcess_storeGlobalSettings", this.#globalSettings);
  }

  get projectSettings() {
    return JSON.stringify(this.#projectSettings);
  }

  set projectSettings(value) {
    this.#projectSettings = value
      ? JSON.parse(value)
      : Settings.defaultProjectSettings();
    this.applySettings();
    this.#dirty = true;
  }

  setLanguage(language) {
    this.#globalSettings.language = language;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * retrieve global settings from file storage
   *
   * @returns {Promise} resolves on successful load
   */
  loadGlobalSettings() {
    return new Promise((resolve) => {
      ipcRenderer.invoke("mainProcess_getGlobalSettings").then((result) => {
        if (result) {
          // read from global settings file
          Object.keys(result).forEach((setting) => {
            this.#globalSettings[setting] = result[setting];
          });
        } else {
          // no global settings file yet, create it
          this.#globalSettings = Object.assign(
            {},
            Settings.defaultSettings(theLanguage),
            Categories.defaultCategories(),
          );
          ipcRenderer.invoke(
            "mainProcess_storeGlobalSettings",
            this.#globalSettings,
          );
        }
        resolve("ready");
      });
    });
  }

  /**
   * unset project specific settings
   *
   * @param {Boolean} apply if true apply the changed settings
   */
  resetProjectSettings(apply = true) {
    this.#projectSettings = {};
    if (apply) {
      this.applySettings();
    }
  }

  /**
   * apply current effective settings in all affected places
   *
   * @param {Boolean} initTrees if to (re)initialize trees such as text tree
   */
  applySettings(initTrees = false) {
    let settings = this.effectiveSettings();
    theLanguage = settings.language;
    ipcRenderer.invoke("mainProcess_setAppMenu", [
      settings.language,
      settings.projectsListLength,
      settings.exportsListLength,
      settings.dateTimeFormatShort,
      theLayout.displayLeft,
      theLayout.displayRight,
      theLayout.displayBottom,
    ]);

    ipcRenderer.invoke("mainProcess_setBrowserWindow", settings);

    if (theProject) {
      theProject.setup(settings);
    }
    if (theLayout) {
      theLayout.setup(settings);
    }
    if (theTextCollectionTree) {
      theTextCollectionTree.setupTree(undefined, initTrees);
    }
    if (theTextTree) {
      theTextTree.setupTree(undefined, initTrees);
    }
    if (theObjectTree) {
      theObjectTree.setupTree(undefined, initTrees);
    }
    if (theTextEditor) {
      setTimeout(() => theTextEditor.setup(settings), 250);
    }
    if (theObjectReference) {
      setTimeout(() => theObjectReference.setup(settings), 500);
    }
  }

  /**
   * combine global and project settings to the respective values that are effective
   *
   * @returns {Object}
   */
  effectiveSettings() {
    let effective = {};

    Settings.settings.forEach((tab) => {
      tab.settings.forEach((setting) => {
        if (setting.type == "sounds") {
          Sounds.backgroundSounds.forEach((sound) => {
            let name = `${setting.name}_${sound.name}`;
            effective[name] =
              name in this.#projectSettings
                ? this.#projectSettings[name]
                : name in this.#globalSettings
                  ? this.#globalSettings[name]
                  : setting.default;
          });
        }
        effective[setting.name] =
          setting.name in this.#projectSettings
            ? this.#projectSettings[setting.name]
            : setting.name in this.#globalSettings
              ? this.#globalSettings[setting.name]
              : setting.default;
      });
    });

    return effective;
  }

  /**
   * provide a copy of the standard categories for further use as project categories
   *
   * @returns {Object}
   */
  categories() {
    let categories = {};
    Categories.categories.forEach((list) => {
      categories[list.name] = [...this.#globalSettings[list.name]];
    });
    return categories;
  }
}
