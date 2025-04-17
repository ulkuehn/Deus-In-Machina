/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file electron main process
 */

/**
 * i18n related stuff
 */
const { __ } = require("./i18n/mainProcess.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

const {
  app,
  BrowserWindow,
  BrowserView,
  Menu,
  dialog,
  ipcMain,
  screen,
  shell,
} = require("electron");
const fs = require("fs");
const os = require("os");
const path = require("path");
const url = require("url");
const crypto = require("crypto");
const { v4, NIL } = require("uuid");
// define uuid, UUID0 so they always start with a letter like symbol, never with a digit
const uuid = () => {
  return "_" + v4();
};
const UUID0 = "_" + NIL;
const { htmlToText } = require("html-to-text");
const { Logger } = require("./include/Logger.js");
const { Timestamp } = require("./include/Timestamp.js");
const { Languages } = require("./include/Languages.js");
const log = require("electron-log/main");

// the program's name
const theProgramShortName = "DIM";
const theProgramLongName = "Deus In Machina";
const theProgramExtension = theProgramShortName.toLowerCase();
// version info  -- scheme version of dim file and DIM must match, program version may be higher in DIM than in dim file provided scheme versions match
const theVersionScheme = app.getVersion().split("+")[1];
const [theVersionMajor, theVersionMinor, theVersionPatch] = app
  .getVersion()
  .split("+")[0]
  .split(".");
// global settings are stored here
const settingsFilePath = path.join(app.getPath("userData"), "settings.json");
// current state is stored here (recent projects, recent exports)
const stateFilePath = path.join(app.getPath("userData"), "state.json");
// program icon
const iconPath = path.join(__dirname, "icons/dim1024x1024.png");
// minimal dimensions for main window
const minWidth = 1400;
const minHeight = 800;
// window dimensions and placement
const windowXSize = process.platform == "win32" ? -16 : 0;
const windowYSize = process.platform == "win32" ? -39 : 0;
const windowXOffset = process.platform == "win32" ? -8 : 0;
const windowYOffset = process.platform == "win32" ? -57 : -30;
// spellcorrection window placement
const leftOffset = process.platform == "win32" ? 6 : 0;
const rightOffset = process.platform == "win32" ? -4 : 4;
const aboveOffset = process.platform == "win32" ? 4 : -4;
const belowOffset = process.platform == "win32" ? -5 : -42;

// main program window
let mainWindow = null;
// printing window
let printingWindow = null;
// busy overlay window and timer
let busyWindow = null;
let busyTimer = null;
// references to currently open windows
let openWindows = {};
let closeByButton = false;
let debugMode = false;
let theState = { recentExports: [], recentProjects: [] };
let theExportsListLen = 0;
let theProjectsListLen = 0;
// flags to indicate what areas are displayed
let showLeft = false;
let showRight = false;
let showBottom = false;
let spellLanguage = theLanguage;
let distractionFreeWindow = null;
let fullTextMenu = true;
let theDateTimeFormat = undefined;
let theTmpDir = null;
// path of file to open on launch
let openOnLaunch = "";

// purge log dir (keep at most maxLogFiles log files)
const maxLogFiles = 25;
try {
  let logFiles = [];
  fs.readdirSync(app.getPath("logs")).forEach((file) => {
    let filePath = path.join(app.getPath("logs"), file);
    let stat = fs.statSync(filePath);
    logFiles.push({ name: filePath, time: stat.ctimeMs });
  });
  if (logFiles.length >= maxLogFiles) {
    logFiles.sort((a, b) => b.time - a.time);
    for (let file of logFiles.splice(maxLogFiles - 1)) {
      fs.rmSync(file.name, { force: true });
    }
  }
} catch (err) {
  console.error("error while trying to purge log dir", err);
}
// logging
let theLogger = new Logger(
  log,
  "info",
  false,
  app.getPath("logs"),
  `${new Date().getTime()}_${process.pid}.log`,
);

// dismiss unsupported platforms
if (process.platform != "win32" && process.platform != "linux") {
  theLogger.error(
    `currently only windows and linux support (this is ${process.platform} instead) -- quitting`,
  );
  app.quit();
}

// do not allow second instance
if (!app.requestSingleInstanceLock()) {
  console.error(`trying to open a second program instance -- quitting`);
  app.quit();
}
// someone tried to run a second instance, we should focus our window
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

// process program arguments
const args = [...process.argv];
args.shift(); // exe
while (args.length > 0) {
  let arg = args.shift();
  if (path.isAbsolute(arg)) {
    openOnLaunch = arg;
  }
}

/*
we set the app's language to English, no matter what the system's language is
so the keyboard shortcut infos in the app's menu is always the same (in English, e.g. using "Ctrl")
this comes at the cost of non-i18n of the shortcut infos
but it gives a more consistent approach when changing the app's language on the fly in the settings
*/
app.commandLine.appendSwitch("lang", "en");

// Electron initialization has finished
app.whenReady().then(() => {
  // create a tempory dir for file contents
  theTmpDir = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
  // load state info
  getGlobalState();
  // set the app's default ui language (may be orverriden by global state)
  theLanguage = app.getLocale().toLowerCase().split("-")[0];
  if (!Languages.languages.includes(theLanguage)) {
    theLanguage = Languages.languages[0]; // system default
  }
  // try to load global settings
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsFilePath));
    debugMode = settings.debug;
  } catch (err) {}
  if (debugMode) {
    theLogger.level = "verbose";
  }
  theLogger.verbose("app ready");
  // open main and auxilary windows
  createWindows(
    Boolean(parseInt(settings.splash ?? 1) & 1),
    Boolean(parseInt(settings.splash ?? 1) & 2),
    theState.lastRun,
  );
  theState.lastRun = new Date().getTime();
  setGlobalState();
});

// quit when all windows are closed
app.on("window-all-closed", function () {
  theLogger.info("all windows closed");
  app.quit();
});

/**
 * returns an array of language specific menu objects (subject to value of "language")
 *
 * @param {Boolean} left if left panel is being shown (sets check indicator in menu item) -- if undefined, sets global value "showLeft"
 * @param {Boolean} right
 * @param {Boolean} bottom
 * @returns {Object[]} application menu
 */
function menuList(left, right, bottom) {
  theLogger.info("menuList", { left }, { right }, { bottom });

  if (left != undefined) {
    showLeft = left;
  }
  if (right != undefined) {
    showRight = right;
  }
  if (bottom != undefined) {
    showBottom = bottom;
  }

  // populate recent projects menu item
  let projectItems = [];
  theState.recentProjects.forEach((project) => {
    projectItems.push({
      label: `${project.path}   [ ${new Timestamp(project.time).toLocalString(
        theDateTimeFormat,
      )} / ${_(project.type)} ]`,
      click(item, focusedWindow) {
        focusedWindow.webContents.send(
          "rendererProcess_openProject",
          project.path,
        );
      },
    });
  });
  if (theState.recentProjects.length) {
    projectItems.push({
      type: "separator",
    });
  }
  projectItems.push({
    label: _("mainProcess_menuFileClearProjectsList"),
    enabled: theState.recentProjects.length,
    click() {
      theState.recentProjects = [];
      setGlobalState();
      mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
    },
  });

  // populate recent exports menu item
  let exportItems = [];
  theState.recentExports.forEach((exported) => {
    if (
      [".txt", ".html", ".rtf", ".docx"].includes(path.parse(exported.path).ext)
    ) {
      exportItems.push({
        label: `${exported.path}  [ ${exported.time} / ${exported.type} ]`,
        click() {
          fs.access(exported.path, fs.F_OK, (err) => {
            if (err) {
              dialog.showMessageBoxSync(mainWindow, {
                type: "none",
                title: _("mainProcess_fileNotFoundTitle"),
                message: _("mainProcess_fileNotFoundMessage", {
                  path: exported.path,
                }),
              });
            } else {
              shell.openPath(exported.path).then((error) => {
                if (error) {
                  shell.showItemInFolder(exported.path);
                }
              });
            }
          });
        },
      });
    }
  });
  if (theState.recentExports.length) {
    exportItems.push({
      type: "separator",
    });
  }
  exportItems.push({
    label: _("mainProcess_menuFileClearRecentExports"),
    enabled: theState.recentExports.length,
    click() {
      theState.recentExports = [];
      setGlobalState();
      mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
    },
  });

  // build file menu
  let fileMenu = {
    label: _("mainProcess_menuFile"),
    submenu: [
      {
        label: _("mainProcess_menuFileOpen"),
        accelerator: "ctrl+o",
        click(item, focusedWindow) {
          focusedWindow.webContents.send("rendererProcess_openProject", null);
        },
      },
      {
        label: _("mainProcess_menuFileSave"),
        accelerator: "ctrl+s",
        click(item, focusedWindow) {
          focusedWindow.webContents.send("rendererProcess_saveProject");
        },
      },
      {
        label: _("mainProcess_menuFileSaveAs"),
        accelerator: "ctrl+shift+s",
        click(item, focusedWindow) {
          focusedWindow.webContents.send("rendererProcess_saveProjectAs");
        },
      },
      {
        label: _("mainProcess_menuFileClose"),
        id: "menuFileClose",
        click(item, focusedWindow) {
          focusedWindow.webContents.send("rendererProcess_closeProject");
        },
      },
    ],
  };
  if (theProjectsListLen > 0) {
    fileMenu.submenu.push({
      label: _("mainProcess_menuFileProjects"),
      submenu: projectItems,
    });
  }
  fileMenu.submenu.push(
    {
      type: "separator",
    },
    {
      label: _("mainProcess_menuFileProperties"),
      accelerator: "ctrl+p",
      click(item, focusedWindow) {
        focusedWindow.webContents.send("rendererProcess_openProjectProperties");
      },
    },
    {
      type: "separator",
    },
    {
      label: _("mainProcess_menuFileImport"),
      submenu: [
        {
          label: _("mainProcess_menuFileImportFile"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_importFromFiles",
              false,
            );
          },
        },
        {
          label: _("mainProcess_menuFileImportDir"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_importFromFiles",
              true,
            );
          },
        },
        {
          label: _("mainProcess_menuFileImportURL"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_importFromURL");
          },
        },
        {
          label: _("mainProcess_menuFileImportFromProject", {
            name: theProgramShortName,
          }),
          click(item, focusedWindow) {
            let result = dialog.showOpenDialogSync(focusedWindow, {
              properties: ["openFile"],
              filters: [
                {
                  name: _("mainProcess_projectFilter", {
                    name: theProgramShortName,
                  }),
                  extensions: [theProgramExtension],
                },
                {
                  name: _("mainProcess_allFilter"),
                  extensions: ["*"],
                },
              ],
            });
            if (result) {
              focusedWindow.webContents.send(
                "rendererProcess_importFromProject",
                result[0],
              );
            }
          },
        },
      ],
    },
    {
      label: _("mainProcess_menuFileExport"),
      accelerator: "ctrl+e",
      click(item, focusedWindow) {
        focusedWindow.webContents.send("rendererProcess_openExportWindow");
      },
    },
  );
  if (theExportsListLen > 0) {
    fileMenu.submenu.push({
      label: _("mainProcess_menuFileRecentExports"),
      submenu: exportItems,
    });
  }
  fileMenu.submenu.push(
    {
      type: "separator",
    },
    {
      label: _("mainProcess_menuFileSettings"),
      accelerator: "ctrl+$",
      click(item, focusedWindow) {
        focusedWindow.webContents.send("rendererProcess_openSettings");
      },
    },
    {
      type: "separator",
    },
    {
      label: _("mainProcess_menuFileExit"),
      accelerator: "ctrl+q",
      click() {
        app.quit();
      },
    },
  );

  // build the whole application menu
  let appMenu = [
    // file menu as defined above
    fileMenu,
    // view menu
    {
      label: _("mainProcess_menuView"),
      id: "menuView",
      submenu: [
        {
          label: _("mainProcess_menuViewToggleLeft"),
          accelerator: "f1",
          type: "checkbox",
          id: "menuViewToggleLeft",
          checked: showLeft,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_toggleLeftPane");
          },
        },
        {
          label: _("mainProcess_menuViewToggleRight"),
          accelerator: "f2",
          type: "checkbox",
          id: "menuViewToggleRight",
          checked: showRight,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_toggleRightPane");
          },
        },
        {
          label: _("mainProcess_menuViewToggleBottom"),
          accelerator: "f3",
          type: "checkbox",
          id: "menuViewToggleBottom",
          checked: showBottom,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_toggleBottomPane");
          },
        },
        { type: "separator" },
        {
          label: _("mainProcess_menuViewAll"),
          accelerator: "f4",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_showAllPanes");
          },
        },
        {
          label: _("mainProcess_menuViewEditorOnly"),
          accelerator: "f5",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_showEditorOnly");
          },
        },
        {
          label: _("mainProcess_menuViewDistractionFree"),
          accelerator: "f6",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_distractionFreeMode",
            );
          },
        },
        // add invisible entry so that shift inverts object usage setting in focus editor
        {
          label: null,
          accelerator: "shift+f6",
          visible: false,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_distractionFreeMode",
              true,
            );
          },
        },
      ],
    },
    // text tree menu
    {
      label: _("textMenu_menu"),
      submenu: [
        {
          label: _("textMenu_newText"),
          accelerator: "alt+n",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_newText");
          },
        },
        {
          label: _("textMenu_deleteText"),
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_deleteText");
          },
        },
        {
          label: _("textMenu_deleteBranch"),
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeDeleteBranch",
            );
          },
        },
        {
          label: _("textMenu_joinTextsSep"),
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_mergeTextsWithParagraph",
            );
          },
        },
        {
          label: _("textMenu_joinTexts"),
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_mergeTextsNoParagraph",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("textMenu_expandAll"),
          accelerator: "alt+1",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_textTreeExpandAll");
          },
        },
        {
          label: _("textMenu_collapseAll"),
          accelerator: "alt+2",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeCollapseAll",
            );
          },
        },
        {
          label: _("textMenu_expandBranch"),
          accelerator: "alt+3",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeExpandBranch",
            );
          },
        },
        {
          label: _("textMenu_collapseBranch"),
          accelerator: "alt+4",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeCollapseBranch",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("textMenu_checkAll"),
          accelerator: "alt+5",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_textTreeCheckAll");
          },
        },
        {
          label: _("textMenu_uncheckAll"),
          accelerator: "alt+6",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeUncheckAll",
            );
          },
        },
        {
          label: _("textMenu_checkBranch"),
          accelerator: "alt+7",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeCheckBranch",
            );
          },
        },
        {
          label: _("textMenu_uncheckBranch"),
          accelerator: "alt+8",
          enabled: fullTextMenu,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeUncheckBranch",
            );
          },
        },
        {
          label: _("textMenu_invertCheck"),
          accelerator: "alt+9",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeInvertCheck",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("textMenu_checkCheckedObjects"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeCheckCheckedObjects",
            );
          },
        },
        {
          label: _("textMenu_checkHasObjects"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_textTreeCheckHavingObjects",
            );
          },
        },
        {
          label: _("textMenu_search"),
          enabled: fullTextMenu,
          accelerator: "alt+f",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_openTextSearch");
          },
        },
        {
          type: "separator",
        },
        {
          label: _("textMenu_newCollection"),
          accelerator: "alt+m",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_newTextCollection");
          },
        },
      ],
    },
    // object tree menu
    {
      label: _("objectMenu_menu"),
      submenu: [
        {
          label: _("objectMenu_singleSelect"),
          type: "checkbox",
          id: "mainProcess_menuObjectTreeSingle",
          checked: false,
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeSingleActivation",
              item.checked,
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("objectMenu_newObject"),
          accelerator: "alt+shift+n",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_newObject");
          },
        },
        {
          label: _("objectMenu_deleteObject"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_deleteObject");
          },
        },
        {
          label: _("objectMenu_deleteBranch"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeDeleteBranch",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("objectMenu_expandAll"),
          accelerator: "alt+shift+1",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeExpandAll",
            );
          },
        },
        {
          label: _("objectMenu_collapseAll"),
          accelerator: "alt+shift+2",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCollapseAll",
            );
          },
        },
        {
          label: _("objectMenu_expandBranch"),
          accelerator: "alt+shift+3",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeExpandBranch",
            );
          },
        },
        {
          label: _("objectMenu_collapseBranch"),
          accelerator: "alt+shift+4",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCollapseBranch",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("objectMenu_checkAll"),
          accelerator: "alt+shift+5",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCheckAll",
            );
          },
        },
        {
          label: _("objectMenu_uncheckAll"),
          accelerator: "alt+shift+6",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeUncheckAll",
            );
          },
        },
        {
          label: _("objectMenu_checkBranch"),
          accelerator: "alt+shift+7",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCheckBranch",
            );
          },
        },
        {
          label: _("objectMenu_uncheckBranch"),
          accelerator: "alt+shift+8",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeUncheckBranch",
            );
          },
        },
        {
          label: _("objectMenu_invertCheck"),
          accelerator: "alt+shift+9",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeInvertCheck",
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("objectMenu_checkHavingCheckedTexts"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCheckCheckedTexts",
            );
          },
        },
        {
          label: _("objectMenu_checkHavingTexts"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_objectTreeCheckHavingTexts",
            );
          },
        },
        {
          label: _("objectMenu_search"),
          accelerator: "alt+shift+f",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_openObjectSearch");
          },
        },
      ],
    },
    // editor menu
    {
      label: _("mainProcess_menuEditor"),
      submenu: [
        {
          label: _("mainProcess_menuTextEditorFormats"),
          accelerator: "ctrl+g",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_openFormats");
          },
        },
        {
          label: _("mainProcess_menuTextEditorSpellcheck"),
          accelerator: "ctrl+k",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_startSpellcheck");
          },
        },
        {
          label: _("mainProcess_menuTextEditorWordlist"),
          accelerator: "ctrl+l",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_openWordlist");
          },
        },
        {
          label: _("mainProcess_menuTextEditorLanguage"),
          submenu: Languages.languages.map((lang) => ({
            label: _(lang),
            type: "checkbox",
            checked: lang == spellLanguage,
            click(item, focusedWindow) {
              spellLanguage = lang;
              focusedWindow.webContents.send(
                "rendererProcess_setEditorLanguage",
                spellLanguage,
              );
              mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
            },
          })),
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTextEditorSetObjects"),
          accelerator: "ctrl+m",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_setCheckedObjects");
          },
        },
        {
          label: _("mainProcess_menuTextEditorUnsetObjects"),
          accelerator: "ctrl+u",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_unsetCheckedObjects",
            );
          },
        },
        {
          label: _("mainProcess_menuTextEditorUnsetAllObjects"),
          accelerator: "ctrl+shift+u",
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_unsetAllObjects");
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuEditorPrint"),
          submenu: [
            {
              label: _("mainProcess_menuEditorPrinter"),
              click(item, focusedWindow) {
                focusedWindow.webContents.send(
                  "rendererProcess_printEditor",
                  false,
                );
              },
            },
            {
              label: _("mainProcess_menuEditorPDF"),
              click(item, focusedWindow) {
                focusedWindow.webContents.send(
                  "rendererProcess_printEditor",
                  true,
                );
              },
            },
          ],
        },
        {
          label: _("mainProcess_menuEditorWhereAmI"),
          accelerator: "ctrl+w",
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_highlightEditorCursor",
            );
          },
        },
      ],
    },
    // help menu
    {
      label: _("mainProcess_menuHelp"),
      submenu: [
        {
          label: _("mainProcess_menuHelpGuide"),
          click(item, focusedWindow) {
            // shut down app menu to inhibit user interference while in tour -- this must be done async to avoid cutting the branch we are sitting on, i.e. this very function
            setTimeout(() => Menu.setApplicationMenu(null), 0);
            focusedWindow.webContents.send("rendererProcess_startGuidedTour");
          },
        },
        {
          label: _("mainProcess_menuHelpAbout", {
            name: theProgramShortName,
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_openAbout",
              `${theVersionMajor}.${theVersionMinor}.${theVersionPatch}`,
              process.versions.chrome,
              process.versions.electron,
              `${os.type()} ${os.platform()} ${os.release()}`,
              theTmpDir,
              app.getPath("userData"),
              path.join(app.getPath("logs"), theLogger.file),
              process.getCreationTime(),
            );
          },
        },
      ],
    },
  ];
  // debug and test menu, needed for development
  if (debugMode) {
    appMenu.push({
      label: _("mainProcess_menuTest"),
      submenu: [
        {
          label: _("mainProcess_menuTestLorum", {
            length: Intl.NumberFormat(theLanguage).format(1000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_insertLorum", [
              1000,
            ]);
          },
        },
        {
          label: _("mainProcess_menuTestLorum", {
            length: Intl.NumberFormat(theLanguage).format(10000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_insertLorum", [
              10000,
            ]);
          },
        },
        {
          label: _("mainProcess_menuTestLorum", {
            length: Intl.NumberFormat(theLanguage).format(100000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_insertLorum", [
              100000,
            ]);
          },
        },
        {
          label: _("mainProcess_menuTestLorum", {
            length: Intl.NumberFormat(theLanguage).format(1000000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_insertLorum", [
              1000000,
            ]);
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTestRandomTextTree", {
            length: Intl.NumberFormat(theLanguage).format(1000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_randomTextTree",
              1000,
            );
          },
        },
        {
          label: _("mainProcess_menuTestRandomTextTree", {
            length: Intl.NumberFormat(theLanguage).format(10000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_randomTextTree",
              10000,
            );
          },
        },
        {
          label: _("mainProcess_menuTestRandomTextTree", {
            length: Intl.NumberFormat(theLanguage).format(100000),
          }),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_randomTextTree",
              100000,
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTestRandomObjectFullStyle"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_randomObject",
              true,
            );
          },
        },
        {
          label: _("mainProcess_menuTestRandomObjectSimpleStyle"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_randomObject",
              false,
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTestRandomObjectTreeFullStyle"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_randomObjectTree", [
              true,
            ]);
          },
        },
        {
          label: _("mainProcess_menuTestRandomObjectTreeSimpleStyle"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_randomObjectTree", [
              false,
            ]);
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTestSpreadObjects"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send("rendererProcess_spreadObjects");
          },
        },
        {
          type: "separator",
        },
        {
          label: _("mainProcess_menuTestSampleProjectDE"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_sampleProject",
              "de",
            );
          },
        },
        {
          label: _("mainProcess_menuTestSampleProjectEN"),
          click(item, focusedWindow) {
            focusedWindow.webContents.send(
              "rendererProcess_sampleProject",
              "en",
            );
          },
        },
      ],
    });
  }

  return appMenu;
}

/**
 * create windows and start going
 */
function createWindows(doSplash, splashSound, lastRun) {
  theLogger.info("createWindows", { doSplash }, { splashSound }, { lastRun });

  // show splash window first -- splash window will be shown until main window comes up
  let splashWindow = null;
  if (doSplash) {
    splashWindow = new BrowserWindow({
      width: 500,
      height: 450,
      frame: false,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
      },
    });
    if (debugMode) {
      splashWindow.webContents.openDevTools({
        mode: "detach",
      });
    }
    splashWindow.loadFile("./splashWindow/splashWindow.html");
    splashWindow.once("ready-to-show", () => {
      theLogger.info("showing splash window");
      splashWindow.show();
      splashWindow.webContents.send("splashWindow_init", [
        splashSound,
        theProgramLongName,
        `${_("mainProcess_version", {
          version: `${theVersionMajor}.${theVersionMinor}.${theVersionPatch}`,
          scheme: theVersionScheme,
        })}`,
      ]);
    });
  }

  // create main window
  mainWindow = new BrowserWindow({
    width: Math.max(
      minWidth,
      Math.round((screen.getPrimaryDisplay().workAreaSize.width * 80) / 100),
    ),
    height: Math.max(
      minHeight,
      Math.round((screen.getPrimaryDisplay().workAreaSize.height * 80) / 100),
    ),
    minWidth: minWidth,
    minHeight: minHeight,
    useContentSize: true,
    show: false,
    spellcheck: false, // spellchecking will be provided by Spellchecker.js
    title: " ", // title will be set programatically
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      sandbox: false,
    },
    icon: iconPath,
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuList()));

  if (debugMode) {
    mainWindow.webContents.openDevTools({
      mode: "detach",
    });
  }

  mainWindow.loadFile("./mainWindow/mainWindow.html");

  // main window must only been shown when ready to show AND splash window has terminated
  let promises = [
    new Promise((resolve) => {
      mainWindow.once("ready-to-show", () => {
        resolve();
      });
    }),
  ];

  splashWindow &&
    promises.push(
      new Promise((resolve) => {
        ipcMain.handle("mainProcess_closeSplashWindow", () => {
          resolve();
        });
      }),
    );

  Promise.allSettled(promises).then(() => {
    splashWindow && splashWindow.destroy();
    theLogger.info("showing main window");
    mainWindow.show();
    mainWindow.webContents.send("rendererProcess_startup", {
      shortName: theProgramShortName,
      longName: theProgramLongName,
      extension: theProgramExtension,
      fullName: `${theProgramLongName} (${theProgramShortName})`,
      programVersion: `${theVersionMajor}.${theVersionMinor}.${theVersionPatch}`,
      programID: `${theProgramShortName} ${theVersionMajor}.${theVersionMinor}.${theVersionPatch} (${theVersionScheme})`,
      schemeVersion: theVersionScheme,
      commandLine: process.argv.join(" "),
      debugMode: debugMode,
      logFile: theLogger.file,
      logLevel: theLogger.level,
      openOnLaunch: openOnLaunch,
      platform: process.platform,
      userPath: app.getPath("userData"),
      logPath: app.getPath("logs"),
      tmpDir: theTmpDir,
      language: theLanguage,
      bounds: mainWindow.getBounds(),
      created: process.getCreationTime(),
      startTime: new Timestamp(process.getCreationTime()).toLocalString(),
      lastRun: lastRun ? new Timestamp(lastRun).toLocalString() : false,
    });
    mainWindow.webContents.send(
      "rendererProcess_windowResize",
      mainWindow.getBounds(),
    );
  });

  mainWindow.on("resize", () => {
    theLogger.info("main window resize", mainWindow.getBounds());
    mainWindow.webContents.send(
      "rendererProcess_windowResize",
      mainWindow.getBounds(),
    );
  });

  mainWindow.on("close", (event) => {
    theLogger.info("main window close event");
    event.preventDefault();
    mainWindow.webContents.send("rendererProcess_closeApp");
  });

  mainWindow.on("closed", () => {
    theLogger.info("main window closed event");
    // remove tempdir on close
    try {
      fs.readdirSync(theTmpDir).forEach((file) =>
        fs.rmSync(`${theTmpDir}${path.sep}${file}`, { force: true }),
      );
      fs.rmdirSync(theTmpDir);
    } catch (err) {
      theLogger.error("error when deleting tmpDir", theTmpDir, err);
    }
  });

  // create printing window
  printingWindow = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: debugMode,
    fullscreenable: false,
    closable: false,
    movable: false,
    show: debugMode,
    spellcheck: false,
    title: " ",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      sandbox: false,
    },
    icon: iconPath,
  });
  if (debugMode)
    printingWindow.webContents.openDevTools({
      mode: "bottom",
    });
  printingWindow.setMenu(null);
  printingWindow.loadFile("./printingWindow/printingWindow.html");
}

/**
 * load global state
 */
function getGlobalState() {
  theLogger.info("getting global state");
  try {
    theState = JSON.parse(fs.readFileSync(stateFilePath));
  } catch (err) {}
}

/**
 * store global state
 */
function setGlobalState() {
  theLogger.info("setting global state");
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(theState, null, 2));
  } catch (err) {}
}

/*
IPC section
*/

/**
 * info logging
 */
ipcMain.handle("mainProcess_loggingInfo", (event, args) => {
  theLogger.info(...args);
});

/**
 * verbose logging
 */
ipcMain.handle("mainProcess_loggingVerbose", (event, args) => {
  theLogger.verbose(...args);
});

/**
 * error logging
 */
ipcMain.handle("mainProcess_loggingError", (event, args) => {
  theLogger.error(...args);
});

/**
 * show file in explorer
 *
 * @param {String} path
 * @TODO path should be sanitized to avoid opening arbitrary file locations
 */
ipcMain.handle("mainProcess_openFileInExplorer", (event, path) => {
  theLogger.verbose("mainProcess_openFileInExplorer", path);
  shell.showItemInFolder(path);
});

/**
 * open file
 *
 * @param {String} path
 */
ipcMain.handle("mainProcess_openPath", (event, path) => {
  theLogger.verbose("mainProcess_openPath", path);
  shell.openPath(path).then((error) => {
    if (error) {
      shell.showItemInFolder(path);
    }
  });
});

/**
 * set the app's title
 *
 * @param {String} projectTitle name or tile of the project
 * @param {String} filePath path of the project file
 * @param {Boolean} isEncrypted true if project is encrypted
 * @param {Boolean} isChanged true if project was changed since last save
 */
ipcMain.handle(
  "mainProcess_setAppTitle",
  (event, [projectTitle, filePath, isEncrypted, isChanged]) => {
    let appTitle = theProgramShortName;
    if (!filePath && !projectTitle) {
      appTitle += `  \u2012 ${theProgramLongName}`;
    } else {
      if (projectTitle) {
        appTitle += ` \u2012 ${projectTitle}`;
      }
      if (filePath) {
        appTitle += ` \u2012 ${filePath}`;
      }
      if (isChanged) {
        appTitle += "*";
      }
      if (isEncrypted) {
        appTitle += _("mainProcess_cryptedTitle");
      }
    }
    mainWindow.setTitle(appTitle);
  },
);

/**
 * show an overlay window to signal being busy with some lengthy op
 *
 * @param {Number} ms overlay only shows if not cancelled before ms millisecs -- to cancel, call with ms<=0
 * @param {String} message busy message to display
 */
ipcMain.handle("mainProcess_busyOverlayWindow", (event, ms, message = "") => {
  if (busyTimer) {
    clearTimeout(busyTimer);
    busyTimer = null;
  }
  if (ms > 0) {
    busyTimer = setTimeout(() => {
      busyWindow = new BrowserWindow({
        width: mainWindow.getContentBounds().width,
        height: mainWindow.getContentBounds().height,
        x: mainWindow.getContentBounds().x,
        y: mainWindow.getContentBounds().y,
        parent: BrowserWindow.getFocusedWindow(),
        modal: true,
        show: false,
        maximizable: false,
        minimizable: false,
        movable: false,
        resizable: false,
        frame: false,
        transparent: true,
        opacity: 0.9,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          sandbox: false,
        },
      });
      // busyWindow.webContents.openDevTools({
      //   mode: "detach",
      // });
      busyWindow.setMenu(null);
      busyWindow.loadFile("./dimBusy.html");
      busyWindow.once("ready-to-show", () => {
        theLogger.verbose("showing busy window");
        busyWindow.webContents.send("busyWindow_setMessage", message);
        busyWindow.show();
      });
    }, ms);
  } else {
    if (busyWindow) {
      theLogger.verbose("destroying busy window");
      busyWindow.destroy();
      busyWindow = null;
    }
  }
});

/**
 * display or clear a message in busy window
 *
 * @param {String} message busy message to display
 */
ipcMain.handle("mainProcess_busyMessage", (event, message) => {
  if (busyWindow) busyWindow.webContents.send("busyWindow_setMessage", message);
});

/**
 * change appearance of the menus
 *
 * @param {String} language
 * @param {Number} projectsListLen number of recent projects to display
 * @param {Number} exportsListLen number of recent exports to display
 * @param {String} format date / time format to use
 * @param {Boolean} showLeft true if left panel should be shown
 * @param {Boolean} showRight
 * @param {Boolean} showBottom
 */
ipcMain.handle(
  "mainProcess_setAppMenu",
  (
    event,
    [
      language,
      projectsListLen,
      exportsListLen,
      format,
      showLeft,
      showRight,
      showBottom,
    ],
  ) => {
    theLogger.verbose(
      "mainProcess_setAppMenu",
      { language },
      { projectsListLen },
      { exportsListLen },
      { format },
      { showLeft },
      { showRight },
      { showBottom },
    );
    if (Languages.languages.includes(language)) {
      theLanguage = language;
      spellLanguage = language;
    }
    theProjectsListLen = projectsListLen;
    theExportsListLen = exportsListLen;
    theDateTimeFormat = format;
    theState.recentProjects.splice(projectsListLen);
    theState.recentExports.splice(exportsListLen);
    mainWindow.setMenu(
      Menu.buildFromTemplate(menuList(showLeft, showRight, showBottom)),
    );
  },
);

ipcMain.handle("mainProcess_clearMenu", () => {
  theLogger.verbose("mainProcess_clearMenu");
  mainWindow.setMenu(Menu.buildFromTemplate([]));
  // mainWindow.setMenu(null);
});

/**
 * change appearance of text menu
 *
 * @param {Boolean} enable if to enable menu items related to regular text tree (not text collection)
 */
ipcMain.handle("mainProcess_setTextMenu", (event, enable) => {
  theLogger.verbose("mainProcess_setTextMenu", { enable });
  fullTextMenu = enable;
  mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
});

/**
 * add a project to the recent projects list
 *
 * @param {String} path file path
 * @param {String} type action like open, save
 * @param {Number} time timestamp
 */
ipcMain.handle("mainProcess_addRecentProject", (event, [path, type, time]) => {
  theLogger.info("mainProcess_addRecentProject", { path }, { type }, { time });
  // each path just once
  theState.recentProjects = theState.recentProjects.filter(
    (project) => project.path != path,
  );
  // add item
  theState.recentProjects.unshift({ path: path, type: type, time: time });
  // limit to so many entries
  theState.recentProjects.splice(theProjectsListLen);
  setGlobalState();
  // update menu
  mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
});

/**
 * add an export to the recent exports list
 *
 * @param {String} path file path
 * @param {String} type export file type
 * @param {Number} time timestamp
 */
ipcMain.handle("mainProcess_addRecentExport", (event, [path, type, time]) => {
  theLogger.info("mainProcess_addRecentExport", { path }, { type }, { time });
  // each path just once
  theState.recentExports = theState.recentExports.filter(
    (exported) => exported.path != path,
  );
  // add item
  theState.recentExports.unshift({
    path: path,
    type: type,
    time: time,
  });
  // limit to so many entries
  theState.recentExports.splice(theExportsListLen);
  setGlobalState();
  // update menu
  mainWindow.setMenu(Menu.buildFromTemplate(menuList()));
});

/**
 * to open an encrypted project show a password dialog and return the password as string or null on cancel
 *
 * @param {Object} settings effective settings
 * @param {String} path path of the file to open
 * @param {String} password password value
 */
ipcMain.handle(
  "mainProcess_passwordDialog",
  (event, [settings, path, password]) => {
    theLogger.verbose(
      "mainProcess_passwordDialog",
      { settings },
      { path },
      { password: password.replace(/./g, "*") },
    );

    let fWindowW = mainWindow.getSize()[0] + windowXSize;
    let fWindowH = mainWindow.getSize()[1] + windowYSize;
    let width = 800;
    let height = 80;
    let passwordWindow = new BrowserWindow({
      width: width,
      height: height,
      x:
        mainWindow.getContentBounds().x +
        windowXOffset +
        Math.round((fWindowW - width) / 2),
      y:
        mainWindow.getContentBounds().y +
        windowYOffset +
        Math.round((fWindowH - height) / 2),
      parent: mainWindow,
      modal: true,
      useContentSize: true,
      show: false,
      maximizable: false,
      minimizable: false,
      icon: iconPath,
      title: _("windowTitles_passwordWindow", { path: path }),
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false,
      },
    });
    passwordWindow.setMenu(null);

    if (debugMode) {
      passwordWindow.webContents.openDevTools({
        mode: "detach",
      });
    }

    passwordWindow.on("close", () =>
      mainWindow.webContents.send("rendererProcess_cancelPassword"),
    );
    passwordWindow.loadFile("./passwordWindow/passwordWindow.html");
    passwordWindow.once("ready-to-show", () => {
      passwordWindow.show();
      passwordWindow.webContents.send("passwordWindow_init", [
        settings,
        password,
      ]);
    });
  },
);

/**
 * send a  value from the password window to main window
 *
 * @param {String} password password value
 */
ipcMain.handle("mainProcess_sendPassword", (event, password) => {
  theLogger.verbose("mainProcess_sendPassword", {
    password: password.replace(/./g, "*"),
  });
  mainWindow.webContents.send("rendererProcess_tryPassword", password);
  BrowserWindow.getFocusedWindow().removeAllListeners();
  BrowserWindow.getFocusedWindow().close();
});

/**
 * open a yes/no message box
 *
 * @param {String} title box title
 * @param {String} question box message
 * @param {Boolean} yesNo if true "yes" first, then "no"
 * @returns {Promise} 0 if first option is chosen (i.e. "yes" if yesNo==true), 1 on second option
 */
ipcMain.handle(
  "mainProcess_yesNoDialog",
  (event, [title, question, yesNo = true]) => {
    theLogger.verbose(
      "mainProcess_yesNoDialog",
      { title },
      { question },
      { yesNo },
    );
    return dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
      type: "none",
      title: title,
      message: question,
      cancelId: -1,
      buttons: yesNo
        ? [_("general_answerYes"), _("general_answerNo")]
        : [_("general_answerNo"), _("general_answerYes")],
    });
  },
);

/**
 * show an error box
 *
 * @param {String} title box title
 * @param {String} message box message
 */
ipcMain.handle("mainProcess_errorMessage", (event, [title, message]) => {
  theLogger.verbose("mainProcess_errorMessage", { title }, { message });
  dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    type: "none",
    title: title,
    message: message,
  });
});

/**
 * show an info box
 *
 * @param {String} title box title
 * @param {String} message box message
 */
ipcMain.handle("mainProcess_infoMessage", (event, [title, message]) => {
  theLogger.verbose("mainProcess_infoMessage", { title }, { message });
  dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
    type: "none",
    title: title,
    message: message,
  });
});

/**
 * show file explorer for saving
 *
 * @param {FileFilter[]} filter
 * @returns {String} path of the file chosen by the user -- empty string if the dialog is cancelled
 */
ipcMain.handle("mainProcess_fileSaveDialog", (event, filter = null) => {
  theLogger.verbose("mainProcess_fileSaveDialog", { filter });
  return dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
    properties: ["showOverwriteConfirmation"],
    filters: filter,
  });
});

/**
 * show file explorer for opening
 *
 * @param {FileFilter[]} filter
 * @returns {String} path of file to open or undefined if dialog is cancelled
 */
ipcMain.handle("mainProcess_fileOpenDialog", (event, filter = null) => {
  theLogger.verbose("mainProcess_fileOpenDialog", { filter });
  let result = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
    properties: ["openFile"],
    filters: filter,
  });
  if (result) {
    result = result[0];
  }
  return result;
});

/**
 * show file explorer to open directory
 *
 * @returns {String} path of dir to open or undefined if dialog is cancelled
 */
ipcMain.handle("mainProcess_directoryOpenDialog", () => {
  theLogger.verbose("mainProcess_directoryOpenDialog");
  let result = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
    properties: ["openDirectory"],
  });
  if (result) {
    result = result[0];
  }
  return result;
});

/**
 * open last used file (on startup)
 */
ipcMain.handle("mainProcess_openRecentProject", (event, path) => {
  theLogger.verbose("mainProcess_openRecentProject", { path });
  if (!path && theState.recentProjects.length) {
    path = theState.recentProjects[0].path;
  }
  if (path) mainWindow.send("rendererProcess_openProject", path);
});

/**
 * open a (modal) window
 *
 * @param {String} name window name
 * @param {} closeMode false: never close, just unshow; true: always close; String: depending on value
 * @param {Boolean} modal if window should be modal
 * @param {Number} width <=100: percentage of opening window; >100: absolute pixel size
 * @param {Number} height
 * @param {String} title window title
 * @param {String} filePath path of html file to load
 * @param {String} ipcMessage message to send to loaded file
 * @param {String} preload path of a preload file (or null)
 * @param {Array} args list of arguments to send with ipcMessage
 */
ipcMain.handle(
  "mainProcess_openWindow",
  (
    event,
    [
      name,
      closeMode,
      modal,
      width,
      height,
      title,
      filePath,
      ipcMessage,
      preload,
      args,
    ],
  ) => {
    theLogger.info(
      "mainProcess_openWindow",
      { name },
      { closeMode },
      { modal },
      { width },
      { height },
      { title },
      { filePath },
      { ipcMessage },
      { preload },
      { args },
    );

    if (!closeMode && name in openWindows) {
      openWindows[name].show();
    } else {
      // do not open same window twice
      if (!(name in openWindows)) {
        let focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
          focusedWindow = mainWindow;
        }

        let fWindowW = focusedWindow.getSize()[0] + windowXSize;
        let fWindowH = focusedWindow.getSize()[1] + windowYSize;

        if (width <= 0) {
          width = 90;
        }
        // relative width
        if (width <= 100) {
          width = Math.round((fWindowW * width) / 100);
        }

        if (height <= 0) {
          height = 90;
        }
        // relative height
        if (height <= 100) {
          height = Math.round((fWindowH * height) / 100);
        }

        let newWindow = new BrowserWindow({
          width: width,
          height: height,
          x:
            focusedWindow.getContentBounds().x +
            windowXOffset +
            Math.round((fWindowW - width) / 2),
          y:
            focusedWindow.getContentBounds().y +
            windowYOffset +
            Math.round((fWindowH - height) / 2),
          parent: focusedWindow,
          modal: modal,
          skipTaskbar: true,
          useContentSize: true,
          show: false,
          maximizable: true,
          minimizable: true,
          title: `${theProgramShortName} - ${title}`,
          webPreferences: {
            nodeIntegration: preload ? false : true,
            contextIsolation: preload ? true : false,
            sandbox: false,
            ...(preload ? { preload } : {}),
          },
          icon: iconPath,
        });
        openWindows[name] = newWindow;
        closeByButton = false;
        newWindow.setMenu(null);

        if (debugMode) {
          newWindow.webContents.openDevTools({
            mode: "detach",
          });
        }

        newWindow.loadFile(filePath);
        newWindow.once("ready-to-show", () => {
          newWindow.show();
          newWindow.webContents.send(ipcMessage, args);
        });

        // close handler to adapt for closing behaviour chosen in settings
        newWindow.on("close", (event) => {
          if (closeMode) {
            // close is done by window "x"
            if (
              typeof closeMode == "string" &&
              closeMode != "settingsWindow_closeByButtons" &&
              !closeByButton &&
              name in openWindows
            ) {
              event.preventDefault();
              newWindow.webContents.send("mainProcess_checkIfChanged");
              ipcMain.once(
                "mainProcess_isChanged",
                (e, changed, message, yes, no) => {
                  if (typeof changed == "boolean") {
                    // ask for user confirmation if saving is necessary
                    if (changed) {
                      switch (
                        dialog.showMessageBoxSync(
                          BrowserWindow.getFocusedWindow(),
                          {
                            type: "none",
                            title: _("mainProcess_windowCloseTitle", {
                              title: title,
                            }),
                            message:
                              message || _("mainProcess_windowCloseMessage"),
                            buttons: [
                              yes || _("mainProcess_windowCloseSave"),
                              no || _("mainProcess_windowCloseNoSave"),
                            ],
                            cancelId: -1,
                          },
                        )
                      ) {
                        // abort message window
                        case -1:
                          break;
                        // save and close
                        case 0:
                          delete openWindows[name];
                          newWindow.webContents.send("mainProcess_saveContent");
                          break;
                        // close w/o saving
                        case 1:
                          delete openWindows[name];
                          if (newWindow) {
                            newWindow.close();
                          }
                          break;
                      }
                    }
                    // no saving necessary, close right away
                    else {
                      delete openWindows[name];
                      mainWindow.webContents.send(
                        "rendererProcess_windowClosed",
                        [name],
                      );
                      if (newWindow) {
                        newWindow.close();
                      }
                    }
                  }
                },
              );
            }
            // close immediately, no matter if contents changed
            else {
              closeByButton = false;
              delete openWindows[name];
              newWindow.removeAllListeners("close");
              mainWindow.webContents.send("rendererProcess_windowClosed", [
                name,
              ]);
            }
          } else {
            event.preventDefault();
            newWindow.hide();
          }
        });
      }
    }
  },
);

/**
 * open distraction free window
 *
 * @param {Array} args arguments to pass to the window
 */
ipcMain.handle("mainProcess_distractionFreeMode", (event, args) => {
  theLogger.info("mainProcess_distractionFreeMode", { args });
  mainWindow.setSkipTaskbar(true);
  distractionFreeWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    titleBarStyle: "hidden",
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });
  if (debugMode) {
    distractionFreeWindow.webContents.openDevTools({ mode: "detach" });
  }
  distractionFreeWindow.loadFile(
    "./distractionFreeWindow/distractionFreeWindow.html",
  );
  distractionFreeWindow.once("ready-to-show", () => {
    distractionFreeWindow.show();
    distractionFreeWindow.webContents.send("distractionFreeWindow_init", args);
  });
  distractionFreeWindow.on("close", (event) => {
    mainWindow.setSkipTaskbar(false);
    distractionFreeWindow.destroy();
  });
});

/**
 * load an image file
 *
 * @returns {Promise} resolves to a data:image string or rejects on cancel
 */
ipcMain.handle("mainProcess_loadImageAsDataURL", () => {
  return new Promise((resolve, reject) => {
    let result = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
      properties: ["openFile"],
      filters: [
        {
          name: _("mainProcess_fileFilterImages"),
          extensions: ["jpg", "jpeg", "png"],
        },
      ],
    });
    if (result) {
      resolve(
        `data:image/${
          result[0].endsWith("png") ? "png" : "jpeg"
        };base64,${fs.readFileSync(result[0], "base64")}`,
      );
    } else {
      reject();
    }
  });
});

/**
 * open a web browser
 *
 * @param {Number} x horizontal position
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
ipcMain.handle("mainProcess_newBrowser", (event, [x, y, width, height]) => {
  theLogger.verbose(
    "mainProcess_newBrowser",
    { x },
    { y },
    { width },
    { height },
  );
  const view = new BrowserView();
  BrowserWindow.getFocusedWindow().setBrowserView(view);
  view.setBounds({ x: x, y: y, width: width, height: height });

  view.webContents.once("ready-to-show", () => {
    view.webContents.setZoomFactor(1);
  });

  view.webContents.on("did-finish-load", () => {
    BrowserWindow.getFocusedWindow().webContents.send(
      "importFromURLWindow_readyToImport",
    );
  });

  view.webContents.on("did-navigate", (event, url) => {
    view.webContents.executeJavaScript("document.title", true).then((title) => {
      BrowserWindow.getFocusedWindow().setTitle(
        _("windowTitles_importFromURLWindow", {
          title: title ? ` - "${title}"` : ` - "${url}"`,
        }),
      );
    });
    BrowserWindow.getFocusedWindow().webContents.send(
      "importFromURLWindow_changeURL",
      url,
    );
  });

  // no new windows on top of BrowserView, rather open them in existing BrowserView
  view.webContents.setWindowOpenHandler(({ url }) => {
    view.webContents.loadURL(url);
    return { action: "deny" };
  });
});

/**
 * setup browser window
 *
 * @param {Object} settings effective settings
 */
ipcMain.handle("mainProcess_setBrowserWindow", (event, settings) => {
  theLogger.verbose(
    "mainProcess_setBrowserWindow",
    { settings },
    // { settings },
  );
  if ("importfromurl" in openWindows) {
    openWindows.importfromurl.webContents.send(
      "importFromURLWindow_changeSettings",
      settings,
    );
  }
});

/**
 * move browser window
 *
 * @param {Number} x horizontal position
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
ipcMain.handle("mainProcess_moveBrowser", (event, [x, y, width, height]) => {
  theLogger.verbose(
    "mainProcess_moveBrowser",
    { x },
    { y },
    { width },
    { height },
  );
  if ("importfromurl" in openWindows) {
    openWindows.importfromurl
      .getBrowserView()
      .setBounds({ x: x, y: y, width: width, height: height });
  }
});

/**
 * open URL in browser window
 *
 * @param {String} href url to navigate to
 */
ipcMain.handle("mainProcess_browserOpenURL", (event, href) => {
  theLogger.verbose("mainProcess_browserOpenURL", { href });
  try {
    const url = new URL(href);
    if (url.protocol.startsWith("http")) {
      if ("importfromurl" in openWindows) {
        openWindows.importfromurl
          .getBrowserView()
          .webContents.loadURL(url.href);
      }
    }
  } catch (err) {
    console.error("error in mainProcess_browserOpenURL", err);
  }
});

/**
 * change browser zoom
 *
 * @param {Number} zoom in percent
 */
ipcMain.handle("mainProcess_browserZoom", (event, zoom) => {
  theLogger.verbose("mainProcess_browserZoom", { zoom });
  if ("importfromurl" in openWindows) {
    openWindows.importfromurl
      .getBrowserView()
      .webContents.setZoomFactor(zoom / 100);
  }
});

/**
 * stop page load in browser window
 */
ipcMain.handle("mainProcess_browserStop", () => {
  theLogger.verbose("mainProcess_browserStop");
  if ("importfromurl" in openWindows) {
    openWindows.importfromurl.getBrowserView().webContents.stop();
    openWindows.importfromurl.webContents.send(
      "importFromURLWindow_readyToImport",
    );
  }
});

/**
 * import web content from browser window
 */
ipcMain.handle("mainProcess_browserContent", () => {
  theLogger.verbose("mainProcess_browserContent");
  if ("importfromurl" in openWindows) {
    const view = openWindows.importfromurl.getBrowserView();
    view.webContents
      .executeJavaScript("document.URL", true)
      .then((url) => {
        view.webContents
          .executeJavaScript("document.title", true)
          .then((title) => {
            view.webContents
              .executeJavaScript("document.body.outerHTML", true)
              .then((html) => {
                let text = htmlToText(html, {
                  wordwrap: null,
                  selectors: [
                    {
                      selector: "a",
                      options: {
                        ignoreHref: true,
                      },
                    },
                    {
                      selector: "img",
                      format: "skip",
                    },
                  ],
                });
                mainWindow.webContents.send(
                  "rendererProcess_importFromBrowser",
                  [text, title, url],
                );
                openWindows.importfromurl.close();
              });
          });
      })
      .catch((error) => {
        openWindows.importfromurl.close();
      });
  }
});

/**
 * close a (modal) window
 */
ipcMain.handle("mainProcess_closeModalWindow", () => {
  theLogger.verbose("mainProcess_closeModalWindow");
  closeByButton = true;
  if (BrowserWindow.getFocusedWindow()) {
    BrowserWindow.getFocusedWindow().close();
  } else {
    Object.keys(openWindows).forEach((name) => openWindows[name].close());
  }
});

/**
 * save editor contents from distraction free window
 */
ipcMain.handle("mainProcess_updateText", (event, args) => {
  theLogger.verbose("mainProcess_updateText", { args });
  mainWindow.webContents.send("rendererProcess_updateText", args);
});

/**
 * demand object property information
 */
ipcMain.handle(
  "mainProcess_objectOverview",
  (event, oID, currentObject, files) => {
    theLogger.verbose(
      "mainProcess_objectOverview",
      { oID },
      { currentObject },
      { files },
    );
    mainWindow.webContents.send(
      "rendererProcess_objectOverview",
      oID,
      currentObject,
      files,
    );
  },
);

/**
 * retrieve object property information and send them to object window
 */
ipcMain.handle("mainWindow_objectOverviewResult", (event, id, result) => {
  theLogger.verbose("mainWindow_objectOverviewResult", { id }, { result });
  BrowserWindow.getFocusedWindow().webContents.send(
    "objectWindow_objectOverviewResult",
    id,
    result,
  );
});

/**
 * save an edited object
 */
ipcMain.handle("mainProcess_saveObject", (event, args) => {
  theLogger.verbose("mainProcess_saveObject", { args });
  mainWindow.webContents.send("rendererProcess_saveObject", args);
});

/**
 * save an edited text
 */
ipcMain.handle("mainProcess_saveText", (event, args) => {
  theLogger.verbose("mainProcess_saveText", { args });
  mainWindow.webContents.send("rendererProcess_saveText", args);
});

/**
 * save an edited collection
 */
ipcMain.handle("mainProcess_saveCollection", (event, args) => {
  theLogger.verbose("mainProcess_saveCollection", { args });
  mainWindow.webContents.send("rendererProcess_saveCollection", args);
});

/**
 * save an image
 *
 * @param {Array} args first element denotes the place to send the image to
 */
ipcMain.handle("mainProcess_saveImage", (event, args) => {
  theLogger.verbose("mainProcess_saveImage", { args });
  let action = args.shift();
  const actions = {
    main: () => mainWindow.webContents.send("rendererProcess_saveImage", args),
    distractionFree: () =>
      distractionFreeWindow.send("distractionFreeWindow_saveImage", args),
    object: () => openWindows.object.send("objectWindow_saveImage", args),
    schemeEditor: () =>
      openWindows.schemeEditor.send("schemeEditorWindow_saveImage", args),
    export: () => openWindows.export.send("exportWindow_saveImage", args),
    exportEditor: () =>
      openWindows.exportEditor.send("exportEditorWindow_saveImage", args),
  };
  actions[action]();
});

/**
 * save project settings
 */
ipcMain.handle("mainProcess_setProjectSettings", (event, args) => {
  theLogger.verbose("mainProcess_setProjectSettings", { args });
  mainWindow.webContents.send("rendererProcess_setProjectSettings", args);
});

/**
 * retreive global settings
 *
 * @returns {Object} settings
 */
ipcMain.handle("mainProcess_getGlobalSettings", () => {
  theLogger.verbose("mainProcess_getGlobalSettings");
  let settings = null;
  try {
    settings = JSON.parse(fs.readFileSync(settingsFilePath));
  } catch (err) {}
  return settings;
});

/**
 * save global settings
 */
ipcMain.handle("mainProcess_setGlobalSettings", (event, args) => {
  theLogger.verbose("mainProcess_setGlobalSettings", { args });
  mainWindow.webContents.send("rendererProcess_setGlobalSettings", args);
});

/**
 * store global settings in file
 */
ipcMain.handle("mainProcess_storeGlobalSettings", (event, settings) => {
  theLogger.verbose("mainProcess_storeGlobalSettings", { settings });
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
  } catch (err) {}
});

/**
 * save properties
 */
ipcMain.handle("mainProcess_saveProjectProperties", (event, args) => {
  theLogger.verbose("mainProcess_saveProjectProperties", { args });
  mainWindow.webContents.send("rendererProcess_saveProjectProperties", args);
});

/**
 * update exporter
 */
ipcMain.handle("mainProcess_updateExporter", (event, args) => {
  theLogger.verbose("mainProcess_updateExporter", { args });
  mainWindow.webContents.send("rendererProcess_newExporter", args);
});

/**
 * do an export
 */
ipcMain.handle("mainProcess_doExport", (event, args) => {
  theLogger.verbose("mainProcess_doExport", { args });
  mainWindow.webContents.send("rendererProcess_doExport", args);
});

/**
 * preview export
 */
ipcMain.handle("mainProcess_previewExport", (event, args) => {
  theLogger.verbose("mainProcess_previewExport", { args });
  mainWindow.webContents.send("rendererProcess_previewExport", args);
});

/**
 * save export preview to file
 */
ipcMain.handle("mainProcess_saveExportPreview", (event, args) => {
  theLogger.verbose("mainProcess_saveExportPreview", { args });
  mainWindow.webContents.send("rendererProcess_saveExportPreview", args);
});

/**
 * save collections
 */
ipcMain.handle("mainProcess_saveCollections", (event, args) => {
  theLogger.verbose("mainProcess_saveCollections", { args });
  mainWindow.webContents.send("rendererProcess_saveCollections", args);
});

/**
 * save formats
 */
ipcMain.handle("mainProcess_saveFormats", (event, args) => {
  theLogger.verbose("mainProcess_saveFormats", { args });
  mainWindow.webContents.send("rendererProcess_saveFormats", args);
});

/**
 * insert smybol (either to text editor or to focus editor)
 */
ipcMain.handle("mainProcess_insertSymbol", (event, code) => {
  theLogger.verbose("mainProcess_insertSymbol", { code });
  BrowserWindow.getFocusedWindow()
    .getParentWindow()
    .webContents.send("rendererProcess_insertSymbol", code);
});

/**
 * action for misspelled word
 */
ipcMain.handle("mainProcess_nextMisspelledWord", (event, args) => {
  theLogger.verbose("mainProcess_nextMisspelledWord", { args });
  mainWindow.webContents.send("rendererProcess_handleMisspelledWord", args);
});

/**
 * process a misspelled word (send message to spellingCorrectionWindow)
 */
ipcMain.handle(
  "mainProcess_misspelledWord",
  (event, [moveWindow, wordXPos, wordYPos, wordWidth, wordHeight, ...args]) => {
    theLogger.verbose(
      "mainProcess_misspelledWord",
      { moveWindow },
      { wordXPos },
      { wordYPos },
      { wordWidth },
      { wordHeight },
      { args },
    );

    if (moveWindow) {
      let screenPos = mainWindow.getContentBounds();
      let screenSize = mainWindow.getSize();
      let windowPos = mainWindow.getChildWindows()[0].getContentBounds();
      let windowSize = mainWindow.getChildWindows()[0].getSize();
      // left of word
      let windowXPos = screenPos.x + wordXPos - windowSize[0] + leftOffset;
      // right of word
      if (wordXPos < screenSize[0] - wordXPos - wordWidth) {
        windowXPos = screenPos.x + wordXPos + wordWidth + rightOffset;
      }
      // above word
      let windowYPos = screenPos.y + wordYPos - windowSize[1] + aboveOffset;
      // below word
      if (wordYPos < screenSize[1] - wordYPos - wordHeight) {
        windowYPos = screenPos.y + wordYPos + wordHeight - belowOffset;
      }
      mainWindow.getChildWindows()[0].setPosition(windowXPos, windowYPos);
    }
    mainWindow
      .getChildWindows()[0]
      .webContents.send("spellingCorrectionWindow_misspelledWord", args);
  },
);

/**
 * spelling correction reached end of editor
 */
ipcMain.handle("mainProcess_spellCheckFinished", () => {
  theLogger.verbose("mainProcess_spellCheckFinished");
  mainWindow
    .getChildWindows()[0]
    .webContents.send("spellingCorrectionWindow_spellCheckFinished");
});

/**
 * save map state (send to first [and only] child window of main window)
 */
ipcMain.handle("mainProcess_saveSchemeMap", (event, args) => {
  theLogger.verbose("mainProcess_saveSchemeMap", { args });
  mainWindow
    .getChildWindows()[0]
    .webContents.send("objectWindow_saveSchemeMap", args);
});

/**
 * save detached scheme editor state (send to first [and only] child window of main window)
 */
ipcMain.handle("mainProcess_changeSchemeEditor", (event, args) => {
  theLogger.verbose("mainProcess_changeSchemeEditor", { args });
  mainWindow
    .getChildWindows()[0]
    .webContents.send("objectWindow_changeSchemeEditor", args);
});

/**
 * save detached export editor state (send to first [and only] child window of main window)
 */
ipcMain.handle("mainProcess_changeExportEditor", (event, args) => {
  theLogger.verbose("mainProcess_changeExportEditor", { args });
  mainWindow
    .getChildWindows()[0]
    .webContents.send("exportWindow_changeExportEditor", args);
});

/**
 * save word list
 */
ipcMain.handle("mainProcess_saveWordlist", (event, args) => {
  theLogger.verbose("mainProcess_saveWordlist", { args });
  mainWindow.webContents.send("rendererProcess_saveWordlist", args);
});

/**
 * open URL
 * @todo: this must be sanitized/limited to avoid opening arbitrary web pages
 *
 * @param {String} url
 */
ipcMain.handle("mainProcess_openURL", (event, url) => {
  theLogger.verbose("mainProcess_openURL", { url });
  shell.openExternal(url);
});

/**
 * quit app
 */
ipcMain.handle("mainProcess_exitApp", () => {
  theLogger.verbose("mainProcess_exitApp");
  app.exit();
});

/**
 * transfer texts
 */
ipcMain.handle("mainProcess_transferTexts", (event, args) => {
  theLogger.verbose("mainProcess_transferTexts", { args });
  mainWindow.webContents.send("rendererProcess_transferTexts", args);
});

/**
 * transfer objects
 */
ipcMain.handle("mainProcess_transferObjects", (event, args) => {
  theLogger.verbose("mainProcess_transferObjects", { args });
  mainWindow.webContents.send("rendererProcess_transferObjects", args);
});

/**
 * transfer collections
 */
ipcMain.handle("mainProcess_transferCollections", (event, args) => {
  theLogger.verbose("mainProcess_transferCollections", { args });
  mainWindow.webContents.send("rendererProcess_transferCollections", args);
});

/**
 * transfer export profiles
 */
ipcMain.handle("mainProcess_transferExportProfiles", (event, args) => {
  theLogger.verbose("mainProcess_transferExportProfiles", { args });
  mainWindow.webContents.send("rendererProcess_transferExportProfiles", args);
});

/**
 * text search
 */
ipcMain.handle("mainProcess_textSearch", (event, args) => {
  theLogger.verbose("mainProcess_textSearch", { args });
  mainWindow.webContents.send("rendererProcess_textSearch", args);
});

/**
 * object search
 */
ipcMain.handle("mainProcess_objectSearch", (event, args) => {
  theLogger.verbose("mainProcess_objectSearch", { args });
  mainWindow.webContents.send("rendererProcess_objectSearch", args);
});

/**
 * object search result
 */
ipcMain.handle("mainProcess_objectSearchResult", (event, args) => {
  theLogger.verbose("mainProcess_objectSearchResult", { args });
  BrowserWindow.getFocusedWindow().webContents.send(
    "objectSearchWindow_result",
    args,
  );
});

/**
 * open object
 */
ipcMain.handle("mainProcess_openObject", (event, args) => {
  theLogger.verbose("mainProcess_openObject", { args });
  mainWindow.webContents.send("rendererProcess_openObject", args);
});

// scheme file

/**
 * open a file as part of an object
 * files are identical (same ID) iff
 *     extensions (lowercase) identical
 *     && size (number of bytes) identical
 *     && cryptohash identical
 * (size not actually needed as included in hash, just to make it explicit)
 * (file name and time stamp don't matter)
 *
 * @param {Object} existingFiles
 *
 * @returns {Object} file specs
 */
ipcMain.handle("mainProcess_openFile", (event, existingFiles) => {
  theLogger.verbose("mainProcess_openFile", { existingFiles });
  let result = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
    properties: ["openFile"],
  });
  if (result) {
    let filePath = result[0];
    let fileParse = path.parse(filePath);
    let fileExtension = fileParse.ext.toLowerCase();
    let stat = fs.statSync(filePath);
    // we need to calc the crytpohash in any case -- either for comparison or for reference if no matching file in existingFiles
    let hashSum = crypto.createHash("sha1");
    hashSum.update(fs.readFileSync(filePath));
    let hash = hashSum.digest("hex");

    let fileID = null;
    for (let [id, file] of Object.entries(existingFiles)) {
      // existing file
      if (
        file.extension == fileExtension &&
        file.size == stat.size &&
        file.hash == hash
      ) {
        fileID = id;
      }
    }
    // new file
    if (!fileID) {
      try {
        fs.accessSync(theTmpDir, fs.F_OK);
      } catch (err) {
        fs.mkdirSync(theTmpDir);
      }
      fileID = uuid();
      let tmpPath = `${theTmpDir}${path.sep}${fileID}${fileExtension}`;
      fs.copyFileSync(filePath, tmpPath);
      fs.chmodSync(tmpPath, fs.constants.O_RDONLY);
    }
    return {
      filePath: filePath,
      fileExt: fileExtension,
      fileSize: stat.size,
      fileModtime: Math.floor(stat.mtimeMs),
      fileID: fileID,
      fileHash: hash,
    };
  }
  return null;
});

/**
 * load a file
 */
ipcMain.handle("mainProcess_loadFile", (event, args) => {
  theLogger.verbose("mainProcess_loadFile", { args });
  mainWindow.webContents.send("rendererProcess_loadFile", [
    `${theTmpDir}${path.sep}`,
    ...args,
  ]);
});

/**
 * save a file
 *
 * @param {String} fileName file name
 */
ipcMain.handle("mainProcess_saveFile", (event, fileName) => {
  theLogger.verbose("mainProcess_saveFile", { fileName });
  return fs.readFileSync(`${theTmpDir}${path.sep}${fileName}`);
});

/**
 * store content as file in local tmpdir
 *
 * @param {String} fileID
 * @param {String} fileExtension
 * @param {String} fileContent
 */
ipcMain.handle(
  "mainProcess_storeFile",
  (event, [fileID, fileExtension, fileContent]) => {
    theLogger.verbose(
      "mainProcess_storeFile",
      { fileID },
      { fileExtension },
      { fileContent: `${fileContent.length}Bytes` },
    );
    try {
      fs.accessSync(theTmpDir, fs.F_OK);
    } catch (err) {
      fs.mkdirSync(theTmpDir);
    }
    let tmpPath = `${theTmpDir}${path.sep}${fileID}${fileExtension}`;
    fs.writeFileSync(tmpPath, fileContent);
    fs.chmodSync(tmpPath, fs.constants.O_RDONLY);
  },
);

/**
 * empty local tmpdir
 */
ipcMain.handle("mainProcess_clearTmpDir", () => {
  theLogger.verbose("mainProcess_clearTmpDir");
  try {
    fs.readdirSync(theTmpDir).forEach((file) =>
      fs.rmSync(`${theTmpDir}${path.sep}${file}`, { force: true }),
    );
  } catch (err) {}
});

/**
 * initialize printing editor contents
 */
ipcMain.handle("mainWindow_printEditor", (event, args) => {
  printingWindow.webContents.send("printingWindow_print", args);
});

/**
 * print to printer
 */
ipcMain.handle("mainWindow_print", () => {
  printingWindow.webContents.print({}, (success, error) => {
    if (success) theLogger.verbose("mainWindow_print successful");
    else theLogger.verbose("mainWindow_print error", error);
  });
});

/**
 * print to PDF file
 */
ipcMain.handle("mainWindow_print2PDF", () => {
  let file = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
    properties: ["showOverwriteConfirmation"],
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (file) {
    printingWindow.webContents.printToPDF({}).then((data) => {
      fs.open(file, "w", (err, fd) => {
        if (err) {
          dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
            type: "none",
            title: _("mainWindow_printingError"),
            message: _("mainWindow_printingWriteError", {
              file: file,
            }),
          });
        } else {
          try {
            fs.writeSync(fd, data);
          } finally {
            fs.close(fd, (err) => {
              if (err) {
                dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                  type: "none",
                  title: _("mainWindow_printingError"),
                  message: _("mainWindow_printingCloseError", {
                    file: file,
                  }),
                });
              } else {
                switch (
                  dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(), {
                    type: "none",
                    title: _("mainWindow_printingDone"),
                    message: _("mainWindow_printingOpen", { file: file }),
                    cancelId: -1,
                    buttons: [_("general_answerYes"), _("general_answerNo")],
                  })
                ) {
                  case 0:
                    shell.openPath(file).then((error) => {
                      if (error) {
                        shell.showItemInFolder(file);
                      }
                    });
                    break;
                }
              }
            });
          }
        }
      });
    });
  }
});
