/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file collection of all ipcRenderer event listeners
 */

// general functions

/**
 * on program start
 *
 * @param {Object} info
 */
ipcRenderer.on("rendererProcess_startup", (event, info) => {
  theWindowBounds = info.bounds;
  theLanguage = info.language;
  theSchemeVersion = info.schemeVersion;
  theProgramFullName = info.fullName;
  theProgramShortName = info.shortName;
  theProgramLongName = info.longName;
  theProgramExtension = info.extension;
  theProgramID = info.programID;
  debugMode = info.debugMode;
  theStartTime = info.created;
  theTmpDir = info.tmpDir;

  ipcRenderer.invoke("mainProcess_loggingInfo", ["*** startup environment:"]);
  Object.keys(info).map((key) => {
    ipcRenderer.invoke("mainProcess_loggingInfo", ["   ", key, ":", info[key]]);
  });

  theFonts = new Fonts();
  let t0 = performance.now();
  theFonts.loadStandardFonts("..").then(() => {
    ipcRenderer.invoke("mainProcess_loggingInfo", [
      "standard fonts loaded after",
      Math.round(performance.now() - t0),
      "ms",
    ]);
  });
  theFonts.getAvailableFamilies().then((f) => {
    ipcRenderer.invoke("mainProcess_loggingInfo", [
      "got available font families after",
      Math.round(performance.now() - t0),
      "ms",
    ]);
  });

  // do a "still alive" message every minute
  setInterval(() => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      `running for ${new Timestamp(theStartTime).timeToNow()}`,
    ]);
  }, 60000);

  ipcRenderer.invoke("mainProcess_setAppTitle", ["", "", false, false]);
  theSettings = new Settings();
  theSettings.loadGlobalSettings().then(() => {
    if (theSettings.effectiveSettings().language) {
      theLanguage = theSettings.effectiveSettings().language;
    } else {
      theSettings.setLanguage(theLanguage);
    }
    theSettings.resetProjectSettings(false);
    theFormats = new Formats();
    theProject = new Project();
    theFiles = {};
    theProperties = new Properties(theSettings.categories());
    theLayout = new Layout();
    theObjectTree = new ObjectTree();
    theTextTree = new TextTree();
    theTextCollectionTree = new CollectionTree($("#TCL"), $("#TT"));
    theExporter = new Exporter();
    theSettings.applySettings(true);
    theTextEditor = new TextEditor();
    theSpellChecker = new Spellchecker(theLanguage);
    theProject.undirty();
    theProject.showState();
    if (
      info.openOnLaunch ||
      theSettings.effectiveSettings().openRecentOnLaunch
    ) {
      ipcRenderer.invoke("mainProcess_openRecentProject", info.openOnLaunch);
      setTimeout(() => theProject.undirty(), 5000);
    }
    !info.lastRun && setTimeout(() => (theGuidedTour = new GuidedTour()), 500);
  });
});

/**
 * on window resize
 *
 * @param {Object} bounds
 */
ipcRenderer.on("rendererProcess_windowResize", (event, bounds) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_windowResize",
    { bounds },
  ]);
  theWindowBounds = bounds;
  theGuidedTour && theGuidedTour.abort();
});

/**
 * close program
 */
ipcRenderer.on("rendererProcess_closeApp", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_closeApp",
  ]);
  theProject.close(true);
});

/**
 * open program info window
 */
ipcRenderer.on(
  "rendererProcess_openAbout",
  (
    event,
    programVersion,
    chromeVersion,
    electronVersion,
    osInfo,
    tmpDir,
    userPath,
    logFile,
    startTime,
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_openAbout",
      { programVersion },
      { chromeVersion },
      { electronVersion },
      { osInfo },
      { tmpDir },
      { userPath },
      { logFile },
      { startTime },
    ]);

    ipcRenderer.invoke("mainProcess_openWindow", [
      "about",
      true,
      true,
      600,
      450,
      theProgramLongName,
      "./aboutWindow/aboutWindow.html",
      "aboutWindow_init",
      null,
      [
        theSettings.effectiveSettings(),
        theProgramLongName,
        programVersion,
        theSchemeVersion,
        chromeVersion,
        electronVersion,
        osInfo,
        tmpDir,
        userPath,
        logFile,
        startTime,
      ],
    ]);
  },
);

/**
 * start a guided tour of the program
 */
ipcRenderer.on("rendererProcess_startGuidedTour", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_startGuidedTour",
  ]);
  theGuidedTour = new GuidedTour();
});

/**
 * end or abort a guided tour
 */
ipcRenderer.on("rendererProcess_endGuidedTour", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_endGuidedTour",
  ]);
  theGuidedTour.abort();
  theGuidedTour = null;
});

/**
 * load a file
 *
 * @param {String} tmpDir
 * @param {String} id
 * @param {String} ext
 */
ipcRenderer.on("rendererProcess_loadFile", (event, [tmpDir, id, ext]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_loadFile",
    { tmpDir },
    { id },
    { ext },
  ]);
  let tmpPath = tmpDir + id + ext;
  fs.promises
    .access(tmpPath, fs.F_OK)
    .then(() => {
      shell.openPath(tmpPath);
    })
    .catch((err) => {
      let content = theProject.loadFile(id);
      if (content) {
        fs.writeFileSync(tmpPath, content);
        fs.chmodSync(tmpPath, fs.constants.O_RDONLY);
        shell.openPath(tmpPath);
      } else {
        ipcRenderer.invoke("mainProcess_loggingError", [
          "couldn't load content from db",
          tmpPath,
        ]);
      }
    });
});

// project related functions

/**
 * create a new empty project
 */
ipcRenderer.on("rendererProcess_newProject", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_newProject",
  ]);
  theProject.new();
});

/**
 * open a project from a given path
 *
 * @param {String} file
 */
ipcRenderer.on("rendererProcess_openProject", (event, file) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openProject",
    { file },
  ]);
  theProject.open(file);
});

/**
 * save current project asking for file location
 */
ipcRenderer.on("rendererProcess_saveProjectAs", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_saveProjectAs",
  ]);
  theProject.save(true);
});

/**
 * save current project
 */
ipcRenderer.on("rendererProcess_saveProject", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_saveProject",
  ]);
  theProject.save();
});

/**
 * close current project
 */
ipcRenderer.on("rendererProcess_closeProject", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_closeProject",
  ]);
  theProject.close();
});

/**
 * use a user typed password for opening a crypted project
 *
 * @param {String} password
 */
ipcRenderer.on("rendererProcess_tryPassword", (event, password) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_tryPassword",
    { password: password.replace(/./g, "*") },
  ]);
  theProject.tryPassword(password);
});

/**
 * cancel password dialog
 */
ipcRenderer.on("rendererProcess_cancelPassword", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_cancelPassword",
  ]);
  theProject.cancelPassword();
});

// project properties related functions

/**
 * open project properties window
 */
ipcRenderer.on("rendererProcess_openProjectProperties", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openProjectProperties",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "properties",
    theSettings.effectiveSettings().closingType,
    true,
    0,
    0,
    _("windowTitles_projectPropertiesWindow"),
    "./projectPropertiesWindow/projectPropertiesWindow.html",
    "projectPropertiesWindow_init",
    null,
    [
      theSettings.effectiveSettings(),
      theProperties.title,
      theProperties.subtitle,
      theProperties.author,
      theProperties.info,
      theProperties.categories,
      theProject.statistics(),
      theProject.properties(),
    ],
  ]);
});

/**
 * save project properties from properties window
 *
 * @param {String} title
 * @param {String} subtitle
 * @param {String} author
 * @param {String} info
 * @param {String} password
 * @param {Object} categories
 */
ipcRenderer.on(
  "rendererProcess_saveProjectProperties",
  (event, [title, subtitle, author, info, password, categories]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_saveProjectProperties",
      { title },
      { subtitle },
      { author },
      { info },
      { password: password.replace(/./g, "*") },
      { categories },
    ]);
    theProperties.title = title;
    theProperties.subtitle = subtitle;
    theProperties.author = author;
    theProperties.info = info;
    theProperties.categories = categories;
    theProject.password = password;
  },
);

// settings related functions

/**
 * open settings window
 */
ipcRenderer.on("rendererProcess_openSettings", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openSettings",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "settings",
    theSettings.effectiveSettings().closingType,
    true,
    0,
    0,
    _("windowTitles_settingsWindow"),
    "./settingsWindow/settingsWindow.html",
    "settingsWindow_init",
    null,
    [
      theSettings.effectiveSettings(),
      theSettings.globalSettings,
      theSettings.projectSettings,
      theFonts.availableFamilies,
    ],
  ]);
});

/**
 * set global settings
 *
 * @param {Object} settings
 * @param {Boolean} ignore if true just save but do not apply settings
 */
ipcRenderer.on(
  "rendererProcess_setGlobalSettings",
  (event, [settings, ignore]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_setGlobalSettings",
      { settings },
      { ignore },
    ]);
    theSettings.globalSettings = JSON.stringify(settings);
    if (!ignore) {
      theSettings.applySettings();
    }
  },
);

/**
 * set project settings
 *
 * @param {Object} settings
 * @param {Boolean} merge
 */
ipcRenderer.on(
  "rendererProcess_setProjectSettings",
  (event, [settings, merge]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_setProjectSettings",
      { settings },
      { merge },
    ]);
    if (merge) {
      for (const [key, value] of Object.entries(
        JSON.parse(theSettings.projectSettings),
      )) {
        if (!(key in settings)) {
          settings[key] = value;
        }
      }
    }
    theSettings.projectSettings = JSON.stringify(settings); // going dirty
  },
);

// export related functions

/**
 * open export window
 */
ipcRenderer.on("rendererProcess_openExportWindow", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openExportWindow",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "export",
    "settingsWindow_closeByX",
    // true,
    true,
    0,
    0,
    _("windowTitles_exportWindow"),
    "./exportWindow/exportWindow.html",
    "exportWindow_init",
    null,
    [
      theSettings.effectiveSettings(),
      theExporter.profiles,
      theExporter.recentProfileID,
      theFormats.formats,
      theFonts.availableFamilies,
    ],
  ]);
});

/**
 * build new Exporter from profiles
 *
 * @param {Object} profiles
 * @param {String} profileID
 */
ipcRenderer.on(
  "rendererProcess_newExporter",
  (event, [changed, profiles, profileID]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_newExporter",
      { changed },
      { profiles },
      { profileID },
    ]);
    theExporter = new Exporter(profiles, profileID, changed);
  },
);

/**
 * export project using given profile
 *
 * @param {Object} profile
 */
ipcRenderer.on("rendererProcess_doExport", (event, profile) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_doExport",
    { profile },
  ]);
  theExporter.export(profile, false);
});

/**
 * preview project export using given profile
 *
 * @param {Object} profile
 */
ipcRenderer.on("rendererProcess_previewExport", (event, profile) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_previewExport",
    { profile },
  ]);
  theExporter.export(profile, true);
});

/**
 * save an export preview to file
 *
 * @param {String} content
 * @param {Object} profile
 */
ipcRenderer.on(
  "rendererProcess_saveExportPreview",
  (event, [content, profile]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_saveExportPreview",
      { profile },
    ]);
    Exporter.savePreview(content, profile);
  },
);

// import related functions

/**
 * import content into text(s)
 *
 * @param {Boolean} fromDir if true import from directory, else from file
 */
ipcRenderer.on("rendererProcess_importFromFiles", (event, fromDir) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_importFromFiles",
    { fromDir },
  ]);
  if (fromDir) {
    Project.importDir();
  } else {
    Project.importFile();
  }
});

/**
 * import from project
 *
 * @param {String} path
 */
ipcRenderer.on("rendererProcess_importFromProject", (event, path) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_importFromProject",
    { path },
  ]);
  if (path) {
    theProject
      .importProjectFile(path)
      .then((db) => {
        ipcRenderer.invoke("mainProcess_openWindow", [
          "transfer",
          true,
          true,
          0,
          0,
          _("windowTitles_importWindow", { path: path }),
          "./importWindow/importWindow.html",
          "importWindow_init",
          null,
          [
            theSettings.effectiveSettings(),
            path,
            JSON.stringify(Project.loadCollections(db)),
            JSON.stringify(Project.loadTexts(db)),
            JSON.stringify(Project.loadTree(db, "text")),
            JSON.stringify(Project.loadFiles(db)),
            JSON.stringify(Project.loadObjects(db)),
            JSON.stringify(Project.loadTree(db, "object")),
            JSON.stringify(Project.loadFormats(db)),
            JSON.stringify(Project.loadWords(db)),
            JSON.stringify(Project.loadExportProfiles(db)),
            JSON.stringify(Project.loadSettings(db)),
          ],
        ]);
        db.close();
      })
      .catch((err) => {
        ipcRenderer.invoke("mainProcess_loggingError", [
          "theProject.importProjectFile: error",
          err,
        ]);
      });
  }
});

/**
 * open window for importing from an internet page
 */
ipcRenderer.on("rendererProcess_importFromURL", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_importFromURL",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "importfromurl",
    false,
    true,
    0,
    0,
    _("windowTitles_importFromURLWindow", { title: "" }),
    "./importFromURLWindow/importFromURLWindow.html",
    "importFromURLWindow_init",
    nodePath.join(__dirname, "../importFromURLWindow/preload.js"),
    theSettings.effectiveSettings(),
  ]);
});

/**
 * import text from an internet page
 *
 * @param {String} text
 * @param {String} title
 * @param {String} url
 */
ipcRenderer.on(
  "rendererProcess_importFromBrowser",
  (event, [text, title, url]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_importFromBrowser",
      { text },
      { title },
      { url },
    ]);
    let name = "";
    switch (theSettings.effectiveSettings().importNameWeb) {
      case "importNameWebTitle":
        name = title ? title : url;
        break;
      case "importNameWebURL":
        name = url;
        break;
      case "importNameWebDomain":
        name = new URL(url).hostname;
        break;
    }
    theTextTree.addText(text, name);
  },
);

/**
 * transfer texts from project
 *
 * @param {Object[]} texts
 */
ipcRenderer.on("rendererProcess_transferTexts", (event, texts) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_transferTexts",
    { texts },
  ]);
  if (texts && texts.length) {
    let nodes = theTextTree.transferTexts(texts);
    theTextTree.selectSome(nodes, true);
    theTextTree.checkSome(nodes, true);
  }
});

/**
 * transfer objects from project
 *
 * @param {} objects
 * @param {} files
 * @param {String} path
 */
ipcRenderer.on(
  "rendererProcess_transferObjects",
  (event, [objects, files, path]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_transferObjects",
      { objects },
      { files },
      { path },
    ]);
    if (objects && objects.length) {
      let objectFiles = {};
      // find all files referenced in transferred objects (file props have an "id" property)
      objects.flat(Infinity).forEach((object) => {
        let properties = object.object[5];
        Object.keys(properties).forEach((oid) => {
          Object.values(properties[oid]).forEach((prop) => {
            if (prop.id) {
              objectFiles[prop.id] = false;
            }
          });
        });
      });
      // files coming with objects must be compared (matching hash, extension and size) with those already in the project
      Object.keys(objectFiles).forEach((objectFileID) => {
        for (let fileID of Object.keys(theFiles)) {
          if (
            files[objectFileID].extension == theFiles[fileID].extension &&
            files[objectFileID].size == theFiles[fileID].size &&
            files[objectFileID].hash == theFiles[fileID].hash
          ) {
            objectFiles[objectFileID] = fileID; // matching entries -> existing file ID
            break;
          }
        }
      });
      // open import db
      try {
        let db = new Database(path, {
          fileMustExist: true,
        });
        let statement = db.prepare(
          "select content,hash,extension,size from files where id=?",
        );
        Object.keys(objectFiles).forEach((objectFileID) => {
          // if a match is found, replace the file id in the imported object with the id of the matched file (keep path and timestamp untouched)
          if (objectFiles[objectFileID]) {
            objects.flat(Infinity).forEach((object) => {
              let properties = object.object[5];
              Object.keys(properties).forEach((oid) => {
                Object.values(properties[oid]).forEach((prop) => {
                  if (prop.id && prop.id == objectFileID) {
                    prop.id = objectFiles[objectFileID];
                  }
                });
              });
            });
          }
          // if no match is found, load the file from the import db to file system
          else {
            try {
              fs.accessSync(theTmpDir, fs.F_OK);
            } catch (err) {
              fs.mkdirSync(theTmpDir);
            }
            let file = statement.get(objectFileID);
            let tmpPath = `${theTmpDir}${nodePath.sep}${objectFileID}${file.extension}`;
            fs.writeFileSync(tmpPath, file.content);
            fs.chmodSync(tmpPath, fs.constants.O_RDONLY);
            theFiles[objectFileID] = {
              hash: file.hash,
              extension: file.extension,
              size: file.size,
            };
          }
        });
        db.close();
      } catch (err) {
        ipcRenderer.invoke("mainProcess_loggingError", [
          "fileSQLiteOpenError error",
          err,
        ]);
      }

      // now do the transfer
      let nodes = theObjectTree.transferObjects(objects);
      theObjectTree.selectSome(nodes, true);
      theObjectTree.checkSome(nodes, true);
    }
  },
);

/**
 * transfer collections from project
 *
 * @param {String[]} collections
 * @param {Boolean} merge if true add collections to existing ones else substitute them
 */
ipcRenderer.on(
  "rendererProcess_transferCollections",
  (event, [collections, merge]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_transferCollections",
      { collections },
      { merge },
    ]);
    Object.keys(collections).forEach((id) => {
      collections[id] = new Collection(...collections[id]);
    });
    if (merge) {
      Object.keys(collections).forEach((id) => {
        theTextCollectionTree.addCollection(collections[id]);
      });
    } else {
      theTextCollectionTree.collections = collections;
    }
  },
);

/**
 * transfer export profiles from project
 *
 * @param {String[]} profiles
 * @param {Boolean} merge if true add profiles to existing ones else substitute them
 */
ipcRenderer.on(
  "rendererProcess_transferExportProfiles",
  (event, [profiles, merge]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_transferExportProfiles",
      { profiles },
      { merge },
    ]);
    if (merge) {
      for (let [id, profile] of Object.entries(theExporter.profiles)) {
        profiles[id] = profile;
      }
    }
    theExporter.profiles = profiles;
  },
);

// view and display related functions

/**
 * toggle text tree pane
 */
ipcRenderer.on("rendererProcess_toggleLeftPane", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_toggleLeftPane",
  ]);
  theLayout.toggleLeft();
});

/**
 * toggle object tree pane
 */
ipcRenderer.on("rendererProcess_toggleRightPane", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_toggleRightPane",
  ]);
  theLayout.toggleRight();
});

/**
 * toggle object reference pane
 */
ipcRenderer.on("rendererProcess_toggleBottomPane", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_toggleBottomPane",
  ]);
  theLayout.toggleBottom();
});

/**
 * display editor only
 */
ipcRenderer.on("rendererProcess_showEditorOnly", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_showEditorOnly",
  ]);
  theLayout.viewEditor();
});

/**
 * display all panes
 */
ipcRenderer.on("rendererProcess_showAllPanes", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_showAllPanes",
  ]);
  theLayout.viewAll();
});

/**
 * open distraction free editor
 */
ipcRenderer.on(
  "rendererProcess_distractionFreeMode",
  (event, invert = false) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_distractionFreeMode",
      { invert },
    ]);
    let texts = [];
    let items;
    if (theTextCollectionTree.isActive()) {
      items = theTextCollection.getChecked();
    } else {
      items = theTextTree.getChecked();
    }
    items.forEach((id) => {
      texts.push({
        id: id,
        changed: theTextTree.getText(id).changed.epochSeconds,
        created: theTextTree.getText(id).created.epochSeconds,
        name: theTextTree.getText(id).name,
        path: theTextTree.getPath(id, true),
        editable: theTextTree.getText(id).editable,
        delta: theTextTree.getText(id).delta,
      });
    });

    if (texts.length) {
      let settings = theSettings.effectiveSettings();
      if (invert) {
        settings.focusEditorObjects = !settings.focusEditorObjects;
      }
      ipcRenderer.invoke("mainProcess_distractionFreeMode", [
        settings,
        theLayout.zoomValue,
        texts,
        theObjectTree.getCheckInfo().reduce(function (result, item) {
          result[item.id] = {
            name: theObjectTree.getObject(item.id).name,
            style: theObjectTree.getObject(item.id).styleProperties,
            checked: item.checked,
          };
          return result;
        }, {}),
        theFormats.formats,
        theFonts.availableFamilies,
      ]);
    }
  },
);

// text tree related functions

/**
 * save properties of a text
 *
 * @param {String} id
 * @param {Boolean} editable
 * @param {String} name
 * @param {Object} decoration
 * @param {String} status
 * @param {String} type
 * @param {String} userValue
 */
ipcRenderer.on(
  "rendererProcess_saveText",
  (event, [id, editable, name, decoration, status, type, userValue]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_saveText",
      { id },
      { editable },
      { name },
      { decoration },
      { status },
      { type },
      { userValue },
    ]);
    if (theTextTree.getText(id).editable != editable) {
      theTextTree.getText(id).editable = editable;
      theTextEditor.setEditable(id);
    }
    theTextTree.getText(id).name = name;
    theTextTree.getText(id).decoration = decoration;
    theTextTree.getText(id).status = status;
    theTextTree.getText(id).type = type;
    theTextTree.getText(id).userValue = userValue;
    theTextTree.updateName(id, name);
    if (theTextCollection) {
      theTextCollection.updateNode(id);
    }
  },
);

/**
 * save properties of a text collection
 *
 * @param {String} id
 * @param {String} name
 * @param {Object} decoration
 * @param {Object} search
 */
ipcRenderer.on(
  "rendererProcess_saveCollection",
  (event, [id, name, decoration, search]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_saveCollection",
      { id },
      { name },
      { decoration },
      { search },
    ]);
    theTextCollectionTree.getCollection(id).name = name;
    theTextCollectionTree.getCollection(id).decoration = decoration;
    theTextCollectionTree.getCollection(id).search = search;
    theTextCollectionTree.updateName(id, name);
    theTextCollectionTree.checkSome(id, true);
  },
);

/**
 * create a new empty text
 */
ipcRenderer.on("rendererProcess_newText", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", ["rendererProcess_newText"]);
  theTextTree.newText();
});

/**
 * check all items in text tree
 */
ipcRenderer.on("rendererProcess_textTreeCheckAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCheckAll",
  ]);
  if (theTextCollectionTree.isActive()) {
    theTextCollection.checkAll();
  } else {
    theTextTree.checkAll();
  }
});

/**
 * uncheck all items in text tree
 */
ipcRenderer.on("rendererProcess_textTreeUncheckAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeUncheckAll",
  ]);
  if (theTextCollectionTree.isActive()) {
    theTextCollection.uncheckAll();
  } else {
    theTextTree.uncheckAll();
  }
});

/**
 * check all items in selected branch of text tree
 */
ipcRenderer.on("rendererProcess_textTreeCheckBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCheckBranch",
  ]);
  theTextTree.checkBranch();
});

/**
 * uncheck all items in selected branch of text tree
 */
ipcRenderer.on("rendererProcess_textTreeUncheckBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeUncheckBranch",
  ]);
  theTextTree.uncheckBranch();
});

/**
 * invert checking of all items in text tree
 */
ipcRenderer.on("rendererProcess_textTreeInvertCheck", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeInvertCheck",
  ]);
  if (theTextCollectionTree.isActive()) {
    theTextCollection.invertCheck();
  } else {
    theTextTree.invertCheck();
  }
});

/**
 * expand all branches of text tree
 */
ipcRenderer.on("rendererProcess_textTreeExpandAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeExpandAll",
  ]);
  theTextTree.expandAll();
});

/**
 * collapse all branches of text tree
 */
ipcRenderer.on("rendererProcess_textTreeCollapseAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCollapseAll",
  ]);
  theTextTree.collapseAll();
});

/**
 * expand selected branch of text tree
 */
ipcRenderer.on("rendererProcess_textTreeExpandBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeExpandBranch",
  ]);
  theTextTree.expandBranch();
});

/**
 * collapse selected branch of text tree
 */
ipcRenderer.on("rendererProcess_textTreeCollapseBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCollapseBranch",
  ]);
  theTextTree.collapseBranch();
});

/**
 * check all texts of text tree that are connected to the currently checked objects
 */
ipcRenderer.on("rendererProcess_textTreeCheckCheckedObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCheckCheckedObjects",
  ]);
  if (theTextCollectionTree.isActive()) {
    theTextCollection.checkCheckedObjects();
  } else {
    theTextTree.checkCheckedObjects();
  }
});

/**
 * check all texts of text tree that are connected to any object
 */
ipcRenderer.on("rendererProcess_textTreeCheckHavingObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_textTreeCheckHavingObjects",
  ]);
  if (theTextCollectionTree.isActive()) {
    theTextCollection.checkHasObjects();
  } else {
    theTextTree.checkHasObjects();
  }
});

/**
 * delete selected texts
 */
ipcRenderer.on("rendererProcess_deleteTexts", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_deleteTexts",
  ]);
  theTextTree.deleteTexts();
});

/**
 * merge selected texts seamlessly
 */
ipcRenderer.on("rendererProcess_mergeTextsNoParagraph", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_mergeTextsNoParagraph",
  ]);
  theTextTree.mergeTexts(false);
});

/**
 * merge selected texts inserting new lines between texts
 */
ipcRenderer.on("rendererProcess_mergeTextsWithParagraph", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_mergeTextsWithParagraph",
  ]);
  theTextTree.mergeTexts(true);
});

/**
 * create a new text collection
 */
ipcRenderer.on("rendererProcess_newTextCollection", (event, populate) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_newTextCollection",
  ]);
  theTextCollectionTree.newCollection(populate);
});

// object tree related functions

/**
 * create a new object
 */
ipcRenderer.on("rendererProcess_newObject", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_newObject",
  ]);
  theObjectTree.newObject();
});

/**
 * delete selected object
 */
ipcRenderer.on("rendererProcess_deleteObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_deleteObjects",
  ]);
  theObjectTree.deleteObjects();
});

/**
 * expand all branches of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeExpandAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeExpandAll",
  ]);
  theObjectTree.expandAll();
});

/**
 * collapse all branches of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeCollapseAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCollapseAll",
  ]);
  theObjectTree.collapseAll();
});

/**
 * expand selected branch of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeExpandBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeExpandBranch",
  ]);
  theObjectTree.expandBranch();
});

/**
 * collapse selected branch of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeCollapseBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCollapseBranch",
  ]);
  theObjectTree.collapseBranch();
});

/**
 * check all items in object tree
 */
ipcRenderer.on("rendererProcess_objectTreeCheckAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCheckAll",
  ]);
  theObjectTree.checkAll();
});

/**
 * uncheck all items in object tree
 */
ipcRenderer.on("rendererProcess_objectTreeUncheckAll", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeUncheckAll",
  ]);
  theObjectTree.uncheckAll();
});

/**
 * check all items in selected branch of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeCheckBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCheckBranch",
  ]);
  theObjectTree.checkBranch();
});

/**
 * uncheck all items in selected branch of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeUncheckBranch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeUncheckBranch",
  ]);
  theObjectTree.uncheckBranch();
});

/**
 * invert checking state of object tree
 */
ipcRenderer.on("rendererProcess_objectTreeInvertCheck", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeInvertCheck",
  ]);
  theObjectTree.invertCheck();
});

/**
 * check all objects in tree that are connected with the currently checked texts
 */
ipcRenderer.on("rendererProcess_objectTreeCheckCheckedTexts", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCheckCheckedTexts",
  ]);
  theObjectTree.checkCheckedTexts();
});

/**
 * check all objects in tree that are connected with any text
 */
ipcRenderer.on("rendererProcess_objectTreeCheckHavingTexts", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeCheckHavingTexts",
  ]);
  theObjectTree.checkHasTexts();
});

/**
 * set single object checking state
 *
 * @param {Boolean} state
 */
ipcRenderer.on("rendererProcess_objectTreeSingleActivation", (event, state) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_objectTreeSingleActivation",
    { state },
  ]);
  theObjectTree.setSingleActivation(state);
});

/**
 * open object properties window
 *
 * @param {String} id
 */
ipcRenderer.on("rendererProcess_openObject", (event, [id]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openObject",
    { id },
  ]);
  theObjectTree.editProps(id);
});

/**
 * retrieve property information of an object
 *
 * @param {String} id object id
 * @param {Number} depth tree depth
 * @param {String} currentObject JSON of StyledObject being edited
 */
ipcRenderer.on(
  "rendererProcess_objectOverview",
  (event, id, currentObject, files) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_objectOverview",
      { id },
      { currentObject },
      { files },
    ]);
    ipcRenderer.invoke(
      "mainWindow_objectOverviewResult",
      id,
      theObjectTree.propertyInformation(
        id,
        new StyledObject(...JSON.parse(currentObject)),
        files,
      ),
    );
  },
);

/**
 * save an object's properties
 *
 * @param {String} id
 * @param {String} name
 * @param {Object} decoration
 * @param {} scheme
 * @param {} properties
 * @param {} styleProperties
 * @param {} files
 */
ipcRenderer.on(
  "rendererProcess_saveObject",
  (
    event,
    [id, name, decoration, scheme, properties, styleProperties, files],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_saveObject",
      { id },
      { name },
      { decoration },
      { scheme },
      { properties },
      { styleProperties },
      { files },
    ]);
    theFiles = files;
    theObjectTree.getObject(id).name = name;
    theObjectTree.getObject(id).decoration = decoration;
    theObjectTree.getObject(id).styleProperties = styleProperties;
    theObjectTree.getObject(id).scheme = scheme;
    theObjectTree.getObject(id).properties = properties;
    theObjectTree.updateName(id, name);
    theObjectTree.buildObjectSheet();
  },
);

// editor related functions

/**
 * print the texts shown in the editor
 */
ipcRenderer.on("rendererProcess_printEditor", (event, toPDF) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_printEditor",
    { toPDF },
  ]);
  ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
  theExporter.exportForPrint().then(([head, body]) => {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
    ipcRenderer.invoke("mainWindow_printEditor", [toPDF, head, body]);
  });
});

/**
 * show where the cursor is positioned in the editor
 */
ipcRenderer.on("rendererProcess_highlightEditorCursor", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_highlightEditorCursor",
  ]);
  theTextEditor.showWhere();
});

/**
 * add checked objects to text selected in editor
 */
ipcRenderer.on("rendererProcess_setCheckedObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_setCheckedObjects",
  ]);
  theTextEditor.markCheckedObjects();
});

/**
 * remove checked objects from text selected in editor
 */
ipcRenderer.on("rendererProcess_unsetCheckedObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_unsetCheckedObjects",
  ]);
  theTextEditor.unmarkCheckedObjects();
});

/**
 * remove all objects from text selected in editor
 */
ipcRenderer.on("rendererProcess_unsetAllObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_unsetAllObjects",
  ]);
  theTextEditor.unmarkAllObjects();
});

/**
 * insert special symbol at cursor position
 *
 * @param {Number} code
 */
ipcRenderer.on("rendererProcess_insertSymbol", (event, code) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_insertSymbol",
    { code },
  ]);
  if (theTextEditor) {
    theTextEditor.insertSymbol(code);
  }
});

/**
 * set the language for spellchecking in the editor
 *
 * @param {String} language
 */
ipcRenderer.on("rendererProcess_setEditorLanguage", (event, language) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_setEditorLanguage",
    { language },
  ]);
  theSpellChecker = new Spellchecker(language, theSpellChecker.userWords);
});

/**
 * save editor content from distraction free window
 *
 * @param {String} id editor id
 * @param {Object[]} ops delta ops
 */
ipcRenderer.on("rendererProcess_updateText", (event, [id, ops]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_updateText",
    { id },
    { ops },
  ]);
  theTextEditor.updateText(id, ops);
});

/**
 * save parameters for images in main editor
 *
 * @param {Array} args
 */
ipcRenderer.on("rendererProcess_saveImage", (event, args) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_saveImage",
    { args },
  ]);
  theTextEditor.setImage(...args);
});

// functions related to spellchecking

/**
 * start spellchecking
 */
ipcRenderer.on("rendererProcess_startSpellcheck", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_startSpellcheck",
  ]);
  theTextEditor.startSpellcheck();
});

/**
 * handle a misspelled word
 *
 * @param {Number} editorIndex
 * @param {Number} textIndex
 * @param {Number} wordIndex
 * @param {Number} wordPos
 * @param {Boolean} change if true change editor text else do not change editor text
 * @param {String} word
 *
 */
ipcRenderer.on(
  "rendererProcess_handleMisspelledWord",
  (event, [editorIndex, textIndex, wordIndex, wordPos, change, word]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_handleMisspelledWord",
      { editorIndex },
      { textIndex },
      { wordIndex },
      { wordPos },
      { change },
      { word },
    ]);

    if (theTextEditor) {
      if (change) {
        let r = theTextEditor.changeMisspelledWord(editorIndex, word);
        if (r) {
          r.then(() =>
            theTextEditor.nextMisspelledWord(
              editorIndex,
              textIndex,
              wordIndex,
              wordPos,
            ),
          );
        } else {
          theTextEditor.nextMisspelledWord(
            editorIndex,
            textIndex,
            wordIndex,
            wordPos,
          );
        }
      } else {
        if (word != "" && theSpellChecker) {
          theSpellChecker.addCorrect(word);
        }
        theTextEditor.nextMisspelledWord(
          editorIndex,
          textIndex,
          wordIndex,
          wordPos,
        );
      }
    }
  },
);

/**
 * open wordlist window
 */
ipcRenderer.on("rendererProcess_openWordlist", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openWordlist",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "wordlist",
    true,
    true,
    400,
    600,
    _("windowTitles_wordlistWindow"),
    "./wordlistWindow/wordlistWindow.html",
    "wordlistWindow_init",
    null,
    [theSettings.effectiveSettings(), theSpellChecker.userWords],
  ]);
});

/**
 * save word list
 *
 * @param {String[]} words
 * @param {Boolean} merge if true add words to existing ones else substitute
 */
ipcRenderer.on("rendererProcess_saveWordlist", (event, [words, merge]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_saveWordlist",
    { words },
    { merge },
  ]);
  if (merge) {
    words = [...new Set([...[...theSpellChecker.userWords, ...words]])];
  }
  // we need to create a new spellchecker as removing words from an existing one is not working properly in this nodehun version (?)
  theSpellChecker = new Spellchecker(theLanguage, words);
});

/**
 * on closing spellchecking window terminate spellchecking routine
 *
 * @param {String} windowName
 */
ipcRenderer.on("rendererProcess_windowClosed", (event, [windowName]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_windowClosed",
    { windowName },
  ]);
  switch (windowName) {
    case "spellcheck":
      theTextEditor.endSpellcheck();
      break;
  }
});

// functions related to finding texts

/**
 * open text search window
 */
ipcRenderer.on("rendererProcess_openTextSearch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openTextSearch",
  ]);
  let settings = theSettings.effectiveSettings();
  ipcRenderer.invoke("mainProcess_openWindow", [
    "textSearch",
    settings.closingType,
    true,
    0,
    0,
    _("windowTitles_textSearchWindow"),
    "./textSearchWindow/textSearchWindow.html",
    "textSearchWindow_init",
    null,
    [
      settings,
      Object.entries(theObjectTree.objects)
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .map(([id, o]) => ({
          id: id,
          name: o.name,
        })),
      ...theProperties.lists,
    ],
  ]);
});

/**
 * execute a text search
 *
 * @param {String} searchText
 * @param {Boolean} searchCase
 * @param {Boolean} searchWord
 * @param {Boolean} searchRegex
 * @param {Object[]} filters
 *
 */
ipcRenderer.on(
  "rendererProcess_textSearch",
  (event, [searchText, searchCase, searchWord, searchRegex, filters]) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_textSearch",
      { searchText },
      { searchCase },
      { searchWord },
      { searchRegex },
      { filters },
    ]);

    theTextCollectionTree.newSearchCollection({
      text: searchText,
      case: searchCase,
      word: searchWord,
      regex: searchRegex,
      filters: filters,
    });
  },
);

// functions related to finding objects

/**
 * open object search window
 */
ipcRenderer.on("rendererProcess_openObjectSearch", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openObjectSearch",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "objectSearch",
    true,
    true,
    0,
    0,
    _("windowTitles_objectSearchWindow"),
    "./objectSearchWindow/objectSearchWindow.html",
    "objectSearchWindow_init",
    null,
    [theSettings.effectiveSettings()],
  ]);
});

/**
 * execute an object search
 *
 * @param {String} searchText
 * @param {Boolean} searchCase
 * @param {Boolean} searchWord
 * @param {Boolean} searchRegex
 * @param {Boolean} searchNames
 * @param {Boolean} searchProperties
 * @param {Boolean} searchValues
 * @param {Boolean} searchTexts
 */
ipcRenderer.on(
  "rendererProcess_objectSearch",
  (
    event,
    [
      searchText,
      searchCase,
      searchWord,
      searchRegex,
      searchNames,
      searchProperties,
      searchValues,
      searchTexts,
    ],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "rendererProcess_objectSearch",
      { searchText },
      { searchCase },
      { searchWord },
      { searchRegex },
      { searchNames },
      { searchProperties },
      { searchValues },
      { searchTexts },
    ]);

    let foundObjects = [];
    if (searchText) {
      theObjectTree.getObjects().forEach((objectID) => {
        let result = theObjectTree
          .getObject(objectID)
          .find(
            searchText,
            searchCase,
            searchWord,
            searchRegex,
            searchNames,
            searchProperties,
            searchValues,
            searchTexts,
          );
        if (result.length) {
          foundObjects.push({
            id: objectID,
            name: theObjectTree.getObject(objectID).name,
            result: result,
          });
        }
      });
    }
    ipcRenderer.invoke("mainProcess_objectSearchResult", foundObjects);
  },
);

// formats related functions

/**
 * open formats window
 */
ipcRenderer.on("rendererProcess_openFormats", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_openFormats",
  ]);
  ipcRenderer.invoke("mainProcess_openWindow", [
    "formats",
    theSettings.effectiveSettings().closingType,
    true,
    0,
    0,
    _("windowTitles_formatsWindow"),
    "./formatsWindow/formatsWindow.html",
    "formatsWindow_init",
    null,
    [
      theSettings.effectiveSettings(),
      theFormats.formats,
      theFonts.availableFamilies,
    ],
  ]);
});

/**
 * save formats from formats window
 *
 * @param {formats}
 * @param {Boolean} merge if true add formats to existing ones else substitute
 */
ipcRenderer.on("rendererProcess_saveFormats", (event, [formats, merge]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_saveFormats",
    { formats },
    { merge },
  ]);
  if (merge) {
    Object.keys(theFormats.formats).forEach((id) => {
      if (!(id in formats)) formats[id] = theFormats.formats[id];
    });
  } else {
    if (!(UUID0 in formats)) formats[UUID0] = theFormats.formats[UUID0];
  }
  // compare new formats to old ones -- the deleted formats must be removed from all texts
  let oldIDs = Object.keys(theFormats.formats);
  let deletedIDs = [];
  theFormats = new Formats(formats); // dirty
  theObjectTree.buildObjectSheet();
  let newIDs = Object.keys(theFormats.formats);
  oldIDs.forEach((id) => {
    if (!newIDs.includes(id)) {
      deletedIDs.push(id);
    }
  });
  theTextTree.removeAttributes(deletedIDs, true);
  theObjectTree.removeFormatAttributes(deletedIDs);
  theExporter.removeFormatAttributes(deletedIDs);
});

// test related functions

ipcRenderer.on("rendererProcess_randomTextTree", (event, factor) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_randomTextTree",
    { factor },
  ]);
  Tests.randomTextTree(factor);
});

ipcRenderer.on("rendererProcess_randomObjectTree", (event, [allStyles]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_randomObjectTree",
    { allStyles },
  ]);
  Tests.randomObjectTree(allStyles);
});

ipcRenderer.on("rendererProcess_spreadObjects", () => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_spreadObjects",
  ]);
  Tests.spreadObjects();
});

ipcRenderer.on("rendererProcess_insertLorum", (event, [length]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_insertLorum",
    { length },
  ]);
  Tests.lorumText(length);
});

ipcRenderer.on("rendererProcess_randomObject", (event, allStyles) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_randomObject",
    { allStyles },
  ]);
  Tests.randomObject(allStyles);
});

ipcRenderer.on("rendererProcess_sampleProject", (event, lang) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "rendererProcess_sampleProject",
    { lang },
  ]);
  let saveTheLanguage = theLanguage;
  theLanguage = lang;
  Tests.sampleProject();
  theLanguage = saveTheLanguage;
});
