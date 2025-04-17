/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of Project class
 */

/**
 * @classdesc data and function to handle project files and their internal structur (SQLite database)
 */
class Project {
  #filePath; // path of the project when saved to file system
  #created; // timestamp of creation
  #changed; // timestamp of last change
  #version; // storage version
  #database; // Database object
  #autoSaveTimer; // timer to control auto saving
  #doAutoSave; // flag to indicate if auto saving should happen asyncronically (not while manual saving is underway)
  #cryptoPassword; // password used for crypting the database
  #passwordChanged; // true if password was changed and project not saved
  #resolveOpenPromise;
  #rejectOpenPromise;
  #dirty; // true if project was changed

  /**
   * collection of sql statements to create all necessary tables
   * @static
   */
  static #createTables = [
    // general info (software version, creation time etc)
    `create table info (
            key text not null,
            value text not null
        )`,
    // project state (meta data, settings, layout etc)
    `create table state (
            key text not null,
            value text not null
        )`,
    // export profiles
    `create table exportprofiles (
            id text primary key not null,
            profile text not null
        )`,
    // (paragraph) formats
    `create table formats (
            id text primary key not null,
            format text not null
        )`,
    // texts
    `create table styledtexts (
            id text primary key not null,
            editable int not null,
            name text not null,
            decoration text not null,
            status int not null,
            type int not null,
            uservalue int not null,
            created int not null,
            changed int not null,
            delta text not null,
            characters int not null,
            words int not null,
            objects text not null
        )`,
    // objects
    `create table styledobjects (
            id text primary key not null,
            name text not null,
            decoration text not null,
            created int not null,
            changed int not null,
            styleproperties text not null,
            scheme text not null,
            properties text not null,
            texts text not null
        )`,
    // files
    `create table files (
      id text primary key not null,
      content blob not null,
      hash text not null,
      extension text not null,
      size int not null
    )`,
    // collections
    `create table collections (
            id text primary key not null,
            name text not null,
            items text not null,
            search text not null,
            decoration text not null,
            created int not null,
            changed int not null
        )`,
    // tree structure as json from jstree
    `create table trees (
            name text not null,
            data text not null
        )`,
  ];

  /**
   * quote strings for use in sqlite
   *
   * @param {string} string The string to quote
   * @return {string} quoted string
   */
  static #sqliteQuote(string) {
    if (typeof string != "string") {
      return string;
    }
    return string.replace(/\'/g, "''");
  }

  /**
   * unquote strings from sqlite
   *
   * @param {string} string The string to unquote
   * @return {string} unquoted string
   */
  static #sqliteUnquote(string) {
    if (typeof string != "string") {
      return string;
    }
    return string.replace(/\'\'/g, "'");
  }

  /**
   * return name of imported file (name only or full path according to settings)
   * @static
   * @private
   *
   * @param {Object} settings
   * @param {String} path
   * @returns {String}
   */
  static #importName(settings, path) {
    switch (settings.importName) {
      case "importNameFile":
        return nodePath.parse(path).name;
      case "importNameExt":
        return nodePath.basename(path);
      case "importNamePath":
        return path;
    }
  }

  /**
   * return a flat unordered list of paths by enumerating all files in a path that are not dirs
   * @static
   * @private
   *
   * @param {String} path
   * @returns {String[]}
   */
  static #filesInDir(path) {
    let result = [];
    fs.readdirSync(path).forEach((file) => {
      let fullPath = nodePath.join(path, file);
      if (fs.statSync(fullPath).isDirectory()) {
        result.push(...Project.#filesInDir(fullPath));
      } else {
        result.push(fullPath);
      }
    });
    return result;
  }

  /**
   * extract text from file; text, html or rtf files are supported
   * returns a promise, resolving to the file's text content
   * rejects to 0 if file can't be read
   * rejects to 1 if file type is not supported
   * rejects to 2 if file exists but can't be converted / error on conversion
   * @static
   * @private
   *
   * @param {String} path
   * @returns {Promise}
   */
  static #convertFile(path) {
    return new Promise((resolve, reject) => {
      fs.promises
        .access(path, fs.F_OK | fs.R_OK)
        .then(() => {
          switch (nodePath.extname(path)) {
            case ".txt":
            case ".text":
              fs.promises
                .readFile(path)
                .then((content) => {
                  resolve(content.toString());
                })
                .catch(() => {
                  reject(2);
                });
              break;
            case ".htm":
            case ".html":
              fs.promises
                .readFile(path)
                .then((content) => {
                  resolve(
                    htmlToText(content.toString(), {
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
                    }),
                  );
                })
                .catch(() => {
                  reject(2);
                });
              break;
            case ".rtf":
              fs.promises.readFile(path).then((content) => {
                try {
                  let spans = [];
                  parseRTF.string(content.toString(), (err, doc) => {
                    if (doc.content && doc.content.length) {
                      doc.content.forEach((part) => {
                        if (part.constructor.name == "RTFSpan") {
                          spans.push(part);
                        } else if (part.content) {
                          spans.push(...part.content);
                          spans.push({ value: "\n" });
                        }
                      });
                    }
                    let text = "";
                    for (let i = 0; i < spans.length; i++) {
                      if (spans[i].value.startsWith("\0")) {
                        text += spans[i].value.substr(1);
                        i += 1;
                      } else {
                        text += spans[i].value;
                      }
                    }
                    resolve(text);
                  });
                } catch (err) {
                  reject(2);
                }
              });
              break;
            default:
              reject(1);
          }
        })
        .catch(() => {
          reject(0);
        });
    });
  }

  /**
   * add texts to text tree
   * @static
   */
  static #addTexts(path, node, texts) {
    let settings = theSettings.effectiveSettings();
    let result = [];
    let newNode = node;
    let files = fs.readdirSync(path);
    let doDir;
    switch (settings.importTree) {
      case "importTreeFlat":
        doDir = false;
        break;
      case "importTreeTrimmed":
        files.forEach((file) => {
          let fullPath = nodePath.join(path, file);
          if (fs.statSync(fullPath).isFile()) {
            doDir = true;
          }
        });
        break;
      case "importTreeTree":
        doDir = true;
        break;
    }
    if (doDir) {
      let id = uuid();
      theTextTree.setText(
        id,
        new StyledText(id, Project.#importName(settings, path)),
      );
      newNode = theTextTree.tree.jstree().create_node(node, {
        id: id.toString(),
        text: theTextTree.texts[id].decoratedName(),
      });
      result.push(id);
    }

    files.sort(
      Intl.Collator(settings.language, {
        numeric: true,
      }).compare,
    );
    files.forEach((file) => {
      let fullPath = nodePath.join(path, file);
      if (fs.statSync(fullPath).isDirectory()) {
        result.push(...Project.#addTexts(fullPath, newNode, texts));
      } else {
        for (let i = 0; i < texts.length; i++) {
          if (texts[i] && texts[i].file == fullPath) {
            let id = uuid();
            theTextTree.setText(
              id,
              new StyledText(id, Project.#importName(settings, fullPath), [
                { insert: texts[i].content },
              ]),
            );
            theTextTree.texts[id].calcSimpleStatistics();
            // no need to to calcObjectLength() here, as no objects involved
            theTextTree.tree.jstree().create_node(newNode, {
              id: id.toString(),
              text: theTextTree.texts[id].decoratedName(),
            });
            result.push(id);
            break;
          }
        }
      }
    });
    return result;
  }

  /**
   * import single file to text tree
   * @static
   */
  static importFile() {
    ipcRenderer
      .invoke("mainProcess_fileOpenDialog", [
        {
          name: _("project_fileTypes"),
          extensions: ["txt", "text", "htm", "html", "rtf"],
        },
      ])
      .then((path) => {
        if (path) {
          Project.#convertFile(path)
            .then((text) => {
              let id = uuid();
              theTextTree.setText(
                id,
                new StyledText(
                  id,
                  Project.#importName(theSettings.effectiveSettings(), path),
                  [{ insert: text }],
                ),
              );
              theTextTree.texts[id].calcSimpleStatistics();
              // no need to to calcObjectLength() here, as no objects involved
              theTextTree.tree
                .jstree()
                .create_node(theTextTree.singleSelected(), {
                  id: id.toString(),
                  text: theTextTree.texts[id].decoratedName(),
                });
              theTextTree.checkSome(id, true);
              theTextTree.selectSome(id, true);
            })
            .catch((error) => {
              switch (error) {
                case 0:
                  ipcRenderer.invoke("mainProcess_errorMessage", [
                    _("project_importErrorTitle"),
                    _("project_importReadError", {
                      file: path,
                    }),
                  ]);
                  break;
                case 1:
                  ipcRenderer.invoke("mainProcess_errorMessage", [
                    _("project_importErrorTitle"),
                    _("project_importTypeError", {
                      file: path,
                    }),
                  ]);
                  break;
                case 2:
                  ipcRenderer.invoke("mainProcess_errorMessage", [
                    _("project_importErrorTitle"),
                    _("project_importConversionError", {
                      file: path,
                    }),
                  ]);
                  break;
              }
            });
        }
      });
  }

  /**
   * import directory to text tree
   * @static
   */
  static importDir() {
    ipcRenderer.invoke("mainProcess_directoryOpenDialog").then((path) => {
      if (path) {
        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
        // read all file paths in dir (recursively)
        let files = Project.#filesInDir(path);
        // map paths to import promises
        let promises = files.map(
          (path) =>
            new Promise((resolve, reject) => {
              Project.#convertFile(path)
                .then((text) => {
                  resolve({ file: path, content: text });
                })
                .catch((error) => {
                  reject({ file: path, error: error });
                });
            }),
        );
        // wait for all imports to finish
        Promise.allSettled(promises).then((results) => {
          // build tree from sucessful imports
          let errors = [];
          let ids = Project.#addTexts(
            path,
            theTextTree.singleSelected(),
            results.map((result) => {
              switch (result.status) {
                case "fulfilled":
                  return result.value;
                  break;
                case "rejected":
                  errors.push(result.reason);
                  break;
              }
            }),
          );
          ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
          // activate and select new texts in tree
          theTextTree.checkSome(ids, true);
          theTextTree.selectSome(ids, true);
          if (errors.length) {
            let message = _("project_importDirError", ids.length, {
              path: path,
              imported: ids.length,
            });
            errors.forEach((error) => {
              switch (error.error) {
                case 0:
                  message +=
                    "\n-- " +
                    _("project_importReadError", {
                      file: error.file.substr(path.length + 1),
                    });
                  break;
                case 1:
                  message +=
                    "\n-- " +
                    _("project_importTypeError", {
                      file: error.file.substr(path.length + 1),
                    });
                  break;
                case 2:
                  message +=
                    "\n-- " +
                    _("project_importConversionError", {
                      file: error.file.substr(path.length + 1),
                    });
                  break;
              }
            });
            ipcRenderer.invoke("mainProcess_infoMessage", [
              _("project_importDirTitle"),
              message,
            ]);
          }
        });
      }
    });
  }

  /**
   * check if file exists and is both readable and writable; returns non null on error
   * @static
   *
   * @param {String} path
   * @returns {Error|null}
   */
  static fileOpenError(path) {
    try {
      fs.accessSync(path, fs.R_OK | fs.W_OK);
      return null;
    } catch (err) {
      return err;
    }
  }

  /**
   * check if file is a dim sqlite database; returns non null on error
   * @static
   *
   * @param {String} path
   * @param {String} password
   * @returns {Error|null}
   */
  static fileSQLiteOpenError(path, password = "") {
    try {
      let db = new Database(path, {
        fileMustExist: true,
      });
      if (password) {
        // in debug mode keep compatibility with DB Browser for SQlite
        if (debugMode) {
          db.pragma(`cipher="sqlcipher"`);
          db.pragma(`legacy=4`);
        }
        // optionally encrypt the file using the current password
        db.pragma(`key="${password}"`);
      }
      if (
        !db
          .prepare("select sql from sqlite_master where tbl_name=?")
          .get("info")
      ) {
        throw "project_noInfoError";
      }
      let software = db
        .prepare("select value from info where key=?")
        .get("software");
      if (!software) {
        throw "project_noSoftwareInfoError";
      }
      let schemeVersion = db
        .prepare("select value from info where key=?")
        .get("schemeVersion");
      if (
        !schemeVersion ||
        !parseInt(schemeVersion.value) ||
        parseInt(schemeVersion.value) < parseInt(theSchemeVersion)
      ) {
        throw "project_wrongSchemeError";
      }
      db.close();
      return null;
    } catch (err) {
      return err;
    }
  }

  /**
   * open (possibly encrypted) SQLite database; returns -1 on error, 0 on wrong password, 1 on success
   * @static
   *
   * @param {String} path
   * @param {String} password
   * @returns {Number}
   */
  static fileSQLiteOpen(path, password) {
    let err = Project.fileOpenError(path);
    if (err) {
      ipcRenderer.invoke("mainProcess_errorMessage", [
        _("project_openErrorTitle"),
        err.code == "ENOENT"
          ? _("project_nonExistingFile", { path: path })
          : _("project_nonWritableFile", { path: path }),
      ]);
      return -1;
    } else {
      let err = Project.fileSQLiteOpenError(path, password);
      if (err) {
        if (err.code == "SQLITE_NOTADB") {
          // not a sqlite db
          return 0;
        } else {
          ipcRenderer.invoke("mainProcess_errorMessage", [
            _("project_openErrorTitle"),
            _("project_openErrorMessage", { path: path, error: _(err) }),
          ]);
          return -1;
        }
      } else {
        return 1;
      }
    }
  }

  /**
   * load text collections from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadCollections(db) {
    if (db) {
      try {
        let collections = {};
        let statement = db.prepare(
          "select id,name,items,search,decoration,created,changed from collections",
        );
        for (const collection of statement.iterate()) {
          collections[collection.id] = [
            collection.id,
            Project.#sqliteUnquote(collection.name),
            JSON.parse(collection.items),
            JSON.parse(collection.search),
            JSON.parse(collection.decoration),
            collection.created,
            collection.changed,
          ];
        }
        return collections;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load styled texts from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadTexts(db) {
    if (db) {
      try {
        let texts = {};
        let statement = db.prepare(
          "select id,editable,name,decoration,created,changed,status,type,uservalue,delta,characters,words,objects from styledtexts",
        );
        for (const styledText of statement.iterate()) {
          texts[styledText.id] = [
            styledText.id,
            Project.#sqliteUnquote(styledText.name),
            JSON.parse(styledText.delta),
            styledText.characters,
            styledText.words,
            JSON.parse(styledText.objects),
            styledText.editable != 0,
            JSON.parse(styledText.decoration),
            styledText.status,
            styledText.type,
            styledText.uservalue,
            styledText.created,
            styledText.changed,
          ];
        }
        return texts;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load tree info from a database table into an object
   * @static
   *
   * @param {Database} db
   * @param {String} tree denotes the tree to load
   * @returns {Object}
   */
  static loadTree(db, tree) {
    if (db) {
      try {
        return JSON.parse(
          db.prepare("select data from trees where name=?").get(tree).data,
        );
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load styled objects from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadObjects(db) {
    if (db) {
      try {
        let objects = {};
        let statement = db.prepare(
          "select id,name,decoration,created,changed,styleproperties,scheme,properties,texts from styledobjects",
        );
        for (const styledObject of statement.iterate()) {
          objects[styledObject.id] = [
            styledObject.id,
            Project.#sqliteUnquote(styledObject.name),
            JSON.parse(styledObject.decoration),
            JSON.parse(Project.#sqliteUnquote(styledObject.styleproperties)),
            JSON.parse(Project.#sqliteUnquote(styledObject.scheme)),
            JSON.parse(Project.#sqliteUnquote(styledObject.properties)),
            JSON.parse(styledObject.texts),
            styledObject.created,
            styledObject.changed,
          ];
        }
        return objects;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load files metadata from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadFiles(db) {
    if (db) {
      try {
        let files = {};
        let statement = db.prepare("select id,hash,extension,size from files");
        for (const file of statement.iterate()) {
          files[file.id] = {
            hash: file.hash,
            extension: file.extension,
            size: file.size,
          };
        }
        return files;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load user words from a database table into an array
   * @static
   *
   * @param {Database} db
   * @returns {String[]}
   */
  static loadWords(db) {
    if (db) {
      try {
        return JSON.parse(
          db.prepare("select value from state where key=?").get("wordlist")
            .value,
        );
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load formats from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadFormats(db) {
    if (db) {
      try {
        let formats = {};
        let statement = db.prepare("select id,format from formats");
        for (const format of statement.iterate()) {
          formats[format.id] = JSON.parse(
            Project.#sqliteUnquote(format.format),
          );
        }
        return formats;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load export profiles from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadExportProfiles(db) {
    if (db) {
      try {
        let profiles = {};
        let statement = db.prepare("select id,profile from exportprofiles");
        for (const profile of statement.iterate()) {
          profiles[profile.id] = JSON.parse(
            Project.#sqliteUnquote(profile.profile),
          );
        }
        return profiles;
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * load settings from a database table into an object
   * @static
   *
   * @param {Database} db
   * @returns {Object}
   */
  static loadSettings(db) {
    if (db) {
      try {
        let statement = db.prepare("select value from state where key=?");
        return JSON.parse(statement.get("settings").value);
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * class constuctor
   *
   * @param {String} path
   */
  constructor(path = null) {
    this.#filePath = path;
    this.#created = null;
    this.#changed = null;
    this.#version = null;
    this.#database = null;
    this.#autoSaveTimer = null;
    this.#doAutoSave = true;
    this.#cryptoPassword = "";
    this.#passwordChanged = false;
    this.#dirty = false;

    this.setup(theSettings.effectiveSettings());
  }

  // getters and setters

  get created() {
    return this.#created;
  }

  get changed() {
    return this.#changed;
  }

  get version() {
    return this.#version;
  }

  get path() {
    return this.#filePath;
  }

  get password() {
    return this.#cryptoPassword;
  }

  set password(v) {
    if (v != this.#cryptoPassword) {
      this.#passwordChanged = true;
      this.#cryptoPassword = v;
      this.#dirty = true;
    }
  }

  /**
   * setup project according to settings
   *
   * @param {Object} settings
   */
  setup(settings) {
    this.autoSave(parseInt(settings.autoSaveTime));
  }

  /**
   * start a new autosave period
   *
   * @param {Number} seconds no autosave if zero
   */
  autoSave(seconds) {
    if (this.#autoSaveTimer) {
      clearInterval(this.#autoSaveTimer);
    }
    if (seconds > 0) {
      this.#doAutoSave = true;
      this.#autoSaveTimer = setInterval(() => {
        if (this.#database && this.#doAutoSave) {
          this.#saveData(undefined, true);
        }
      }, seconds * 1000);
    }
  }

  /**
   * called when password is provided by user
   *
   * @param {String} password
   */
  tryPassword(password) {
    this.#resolveOpenPromise(password);
  }

  /**
   * called when password dialog is cancelled by user
   */
  cancelPassword() {
    this.#rejectOpenPromise("cancel");
  }

  /**
   * check if project is dirty (if any project part is dirty)
   *
   * @param {Boolean} dirtyLayout if true layout changes will be part of the result
   * @returns {Boolean}
   */
  isDirty(dirtyLayout = true) {
    if (
      this.#dirty ||
      (dirtyLayout && theLayout.isDirty()) ||
      theSettings.isDirty() ||
      theProperties.isDirty() ||
      theSpellChecker.isDirty() ||
      theExporter.isDirty() ||
      theFormats.isDirty() ||
      theTextCollectionTree.isDirty() ||
      theTextTree.isDirty() ||
      theObjectTree.isDirty()
    )
      return true;

    for (let collection of theTextCollectionTree.collections) {
      if (collection.isDirty()) return true;
    }
    for (let id of theTextTree.textIDs()) {
      if (theTextTree.getText(id).isDirty()) return true;
    }
    for (let id of theObjectTree.objectIDs()) {
      if (theObjectTree.getObject(id).isDirty()) return true;
    }

    return false;
  }

  /**
   * set all parts as undirty
   */
  undirty(timed = 0) {
    setTimeout(() => {
      this.#dirty = false;
      theLayout && theLayout.undirty();
      theSettings && theSettings.undirty();
      theProperties && theProperties.undirty();
      theSpellChecker && theSpellChecker.undirty();
      theExporter && theExporter.undirty();
      theFormats && theFormats.undirty();
      if (theTextCollectionTree) {
        theTextCollectionTree.collections.forEach((collection) => {
          collection.undirty();
        });
        theTextCollectionTree.undirty();
      }
      if (theTextTree) {
        theTextTree.textIDs().forEach((id) => {
          theTextTree.getText(id).undirty();
        });
        theTextTree.undirty();
      }
      if (theObjectTree) {
        theObjectTree.objectIDs().forEach((id) => {
          theObjectTree.getObject(id).undirty();
        });
        theObjectTree.undirty();
      }
    }, timed);
  }

  /**
   * helper function to show what contributes to a dirty state (just for debugging)
   */
  whatDirty() {
    this.#dirty && console.info(`Project.js isDirty: theProject`);
    theLayout.isDirty() && console.info(`Project.js isDirty: theLayout`);
    theSettings.isDirty() && console.info(`Project.js isDirty: theSettings`);
    theProperties.isDirty() &&
      console.info(`Project.js isDirty: theProperties`);
    theSpellChecker.isDirty() &&
      console.info(`Project.js isDirty: theSpellChecker`);
    theExporter.isDirty() && console.info(`Project.js isDirty: theExporter`);
    theFormats.isDirty() && console.info(`Project.js isDirty: theFormats`);
    theTextTree.isDirty() && console.info(`Project.js isDirty: theTextTree`);
    theTextCollectionTree.isDirty() &&
      console.info(`Project.js isDirty: theTextCollectionTree`);
    theObjectTree.isDirty() &&
      console.info(`Project.js isDirty: theObjectTree`);
    theTextTree.textIDs().forEach((id) => {
      theTextTree.getText(id).isDirty() &&
        console.info(
          `Project.js isDirty: text "${theTextTree.getText(id).name}"`,
        );
    });
    theObjectTree.objectIDs().forEach((id) => {
      theObjectTree.getObject(id).isDirty() &&
        console.info(
          `Project.js isDirty: object "${theObjectTree.getObject(id).name}"`,
        );
    });
  }

  /**
   * return the properties of the project
   *
   * @returns {Object[]}
   */
  properties() {
    return [
      this.#created ? this.#created.epochSeconds : null,
      this.#changed ? this.#changed.epochSeconds : null,
      this.#version,
      this.#filePath,
      this.#filePath ? fs.statSync(this.#filePath).size : 0,
      this.#cryptoPassword,
      theProgramID,
    ];
  }

  /**
   * collect statistical info of the project
   *
   * @param {String[]} texts ids of texts to include; if null include all texts
   * @returns {Object}
   */
  statistics(texts = null) {
    if (!texts) {
      texts = theTextTree.getAll();
    }

    let statistics = {
      texts: Object.keys(theTextTree.texts).length,
      objects: Object.keys(theObjectTree.objects).length,
      textsWithObjects: 0,
      objectsWithTexts: 0,
      objectCharacters: 0,
      characters: 0,
      nonSpaceCharacters: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      wordCounts: {},
    };

    texts.forEach((textID) => {
      let s = theTextTree.getText(textID).calcStatistics();
      [
        "characters",
        "words",
        "nonSpaceCharacters",
        "sentences",
        "paragraphs",
      ].forEach((item) => {
        statistics[item] += s[item];
      });
      Object.keys(s.wordCounts).forEach((word) => {
        if (!(word in statistics.wordCounts)) {
          statistics.wordCounts[word] = 0;
        }
        statistics.wordCounts[word] += s.wordCounts[word];
      });
      let objectCharacters = 0;
      let objects = theTextTree.getText(textID).objects;
      for (let objectID in objects) {
        objectCharacters += objects[objectID];
      }
      statistics.objectCharacters += objectCharacters;
      if (objectCharacters > 0) {
        statistics.textsWithObjects += 1;
      }
    });
    for (let objectID in theObjectTree.objects) {
      if (Object.keys(theObjectTree.getObject(objectID).texts).length > 0) {
        statistics.objectsWithTexts += 1;
      }
    }

    return statistics;
  }

  /**
   * create an empty project
   */
  emptyProject() {
    theObjectTree.setupTree([], true);
    theTextTree.setupTree([], true);
    theTextCollectionTree.setupTree([], true);
    setTimeout(()=>this.undirty(),500);
  }

  /**
   * open a project; if no path is given, ask user
   *
   * @param {String} path
   */
  open(path = null) {
    this.#doAutoSave = false;
    this.#closeProject()
      .then(() => {
        this.#reset();
        this.#openProject(path)
          .then(() => {
            ipcRenderer.invoke("mainProcess_addRecentProject", [
              this.#filePath,
              "mainProcess_projectTypeOpen",
              new Timestamp().epochSeconds,
            ]);
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => {
        this.#doAutoSave = true;
      });
  }

  /**
   * close a project, possibly saving its contents
   *
   * @param {Boolean} exit if true exit app after closing
   */
  close(exit = false) {
    this.#doAutoSave = false;
    this.#closeProject()
      .then((closed) => {
        if (closed) {
          if (exit) {
            ipcRenderer.invoke("mainProcess_exitApp");
          } else {
            this.#reset();
            this.emptyProject();
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        this.#doAutoSave = true;
      });
  }

  /**
   * save a project
   *
   * @param {Boolean} saveAs if true ask user for file location
   */
  save(saveAs = false) {
    this.#doAutoSave = false;
    this.#saveProject(saveAs)
      .then(() => {})
      .catch((path) => {
        ipcRenderer.invoke("mainProcess_errorMessage", [
          _("project_saveErrorTitle"),
          _("project_saveErrorMessage", { path: path }),
        ]);
      })
      .finally(() => {
        this.#doAutoSave = true;
      });
  }

  /**
   * save a project
   * @private
   *
   * @param {Boolean} saveAs if true ask user for file location
   * @returns {Promise} resolve true/false = saved/not saved; reject on error
   */
  #saveProject(saveAs) {
    return new Promise((resolve, reject) => {
      if (this.#database && !saveAs) {
        this.#saveData()
          .then((saved) => {
            resolve(saved);
          })
          .catch(() => {
            reject(this.#database.name);
          });
      } else {
        if (this.#database) {
          this.#database.close();
        }
        ipcRenderer
          .invoke("mainProcess_fileSaveDialog", [
            {
              name: _("project_projectType", {
                name: theProgramShortName,
              }),
              extensions: [theProgramExtension],
            },
          ])
          .then((path) => {
            if (path) {
              // as under linux (other than windows) the filter extension is not added automatically we need to do it ourselves; see https://github.com/electron/electron/issues/21935
              if (!nodePath.parse(path).ext) {
                path += `.${theProgramExtension}`;
              }
              fs.access(path, fs.F_OK, (err) => {
                // delete file if exists
                if (!err) {
                  try {
                    fs.unlinkSync(path);
                  } catch (err) {
                    reject(path);
                    return;
                  }
                }
                this.#filePath = path;
                this.#createDatabase()
                  .then((saved) => {
                    resolve(saved);
                  })
                  .catch(() => {
                    reject(path);
                  });
              });
            } else {
              resolve(false);
            }
          })
          .catch(() => {
            reject();
          });
      }
    });
  }

  /**
   * open a project; if no path is given, ask user
   * @private
   *
   * @param {String} path
   * @returns {Promise} resolve = opened
   */
  #openProject(path = null) {
    return new Promise((resolve, reject) => {
      if (path) {
        this.#openFile(path)
          .then(() => resolve())
          .catch(() => this.#reset());
      } else {
        ipcRenderer
          .invoke("mainProcess_fileOpenDialog", [
            {
              name: _("project_projectType", {
                name: theProgramShortName,
              }),
              extensions: [theProgramExtension],
            },
            { name: _("project_allType"), extensions: ["*"] },
          ])
          .then((path) => {
            if (path) {
              this.#openFile(path)
                .then(() => resolve())
                .catch(() => this.#reset());
            }
          });
      }
    });
  }

  /**
   * @private
   *
   * @param {String} path
   * @param {String} password
   * @returns {Promise}
   */
  #openFilePassword(path, password = "") {
    return new Promise((resolve, reject) => {
      this.#resolveOpenPromise = resolve;
      this.#rejectOpenPromise = reject;
      switch (Project.fileSQLiteOpen(path, password)) {
        case -1:
          reject("err");
          break;
        case 1:
          resolve(password);
          break;
        case 0:
          ipcRenderer.invoke("mainProcess_passwordDialog", [
            theSettings.effectiveSettings(),
            path,
            password,
          ]);
      }
    });
  }

  /**
   * open file
   * @private
   *
   * @param {String} path
   * @param {String} password
   * @returns {Promise} resolves upon load of all data
   */
  #openFile(path, password = "") {
    return new Promise((resolve, reject) => {
      this.#openFilePassword(path, password)
        .then((password) => {
          let err = Project.fileSQLiteOpenError(path, password);
          if (err) {
            return this.#openFile(path, password);
          } else {
            let db = new Database(path, {
              fileMustExist: true,
            });
            if (password) {
              // in debug mode keep compatibility with DB Browser for SQlite
              if (debugMode) {
                db.pragma(`cipher="sqlcipher"`);
                db.pragma(`legacy=4`);
              }
              // optionally encrypt the file using the current password
              db.pragma(`key="${password}"`);
            }
            this.#database = db;
            this.#filePath = path;
            this.#cryptoPassword = password;
            this.#passwordChanged = false;
            if (this.#loadData()) {
              resolve();
            } else {
              reject();
            }
          }
        })
        .catch(() => {});
    });
  }

  /**
   * close a project
   * @private
   *
   * @returns {Promise} resolve true/false = closed/not closed
   */
  #closeProject() {
    return new Promise((resolve, reject) => {
      // no changes, no save
      // for new projects change means not only layout changed (but contents)
      // for existing projects change means any change, including layout changes
      if (!this.isDirty(Boolean(this.#database))) {
        resolve(true);
      }
      // if autosave, save silently
      else if (
        parseInt(theSettings.effectiveSettings().autoSaveTime) > 0 &&
        this.#database
      ) {
        this.#saveData(undefined, true)
          .then((saved) => {
            resolve(saved);
          })
          .catch(() => {
            reject();
          });
      }
      // if no autosave, ask user
      else {
        ipcRenderer
          .invoke("mainProcess_yesNoDialog", [
            _("project_unsavedContent"),
            _("project_saveChanges"),
            true,
          ])
          .then((result) => {
            switch (result) {
              case -1:
                resolve(false);
                break;
              case 0:
                if (this.#database) {
                  this.#saveData()
                    .then((saved) => {
                      resolve(saved);
                    })
                    .catch(() => {
                      reject();
                    });
                } else {
                  ipcRenderer
                    .invoke("mainProcess_fileSaveDialog", [
                      {
                        name: _("project_projectType", {
                          name: theProgramShortName,
                        }),
                        extensions: [theProgramExtension],
                      },
                    ])
                    .then((path) => {
                      if (path) {
                        // as under linux (other than windows) the filter extension is not added automatically we need to do it ourselves
                        if (!nodePath.parse(path).ext) {
                          path += `.${theProgramExtension}`;
                        }
                        this.#filePath = path;
                        this.#createDatabase()
                          .then((saved) => {
                            resolve(saved);
                          })
                          .catch(() => {
                            reject();
                          });
                      }
                    });
                }
                break;
              case 1:
                resolve(true);
                break;
            }
          });
      }
    });
  }

  /**
   * show state in title bar (and repeat periodically)
   */
  showState() {
    ipcRenderer.invoke("mainProcess_setAppTitle", [
      theProperties.title,
      this.#filePath,
      this.#cryptoPassword != "",
      this.isDirty(),
    ]);
    setTimeout(() => {
      this.showState();
    }, 500);
  }

  /**
   * (re)set everything to an initial state
   * @private
   */
  #reset() {
    // finally compress the db file and close the connection
    if (this.#database) {
      this.#database.exec("vacuum");
      this.#database.close();
    }
    this.#filePath = null;
    this.#created = null;
    this.#changed = null;
    this.#version = null;
    this.#database = null;
    this.#cryptoPassword = "";
    this.#passwordChanged = false;
    theSettings.resetProjectSettings();
    theFiles = {};
    ipcRenderer.invoke("mainProcess_clearTmpDir");
    theFormats = new Formats();
    theProperties = new Properties(theSettings.categories());
    theTextTree = new TextTree();
    theObjectTree = new ObjectTree();
    theTextCollectionTree = new CollectionTree($("#TCL"), $("#TT"));
    theTextEditor = new TextEditor();
    theObjectReference = new ObjectReference();
    theSpellChecker = new Spellchecker(theLanguage);
    theExporter = new Exporter();
    theLayout.reset(true);
    this.undirty();
  }

  /**
   * create a new database
   * @private
   *
   * @returns {Promise} resolve true if saved, false if not; reject on failure
   */
  #createDatabase() {
    return new Promise((resolve, reject) => {
      try {
        let db = new Database(this.#filePath);
        this.#database = db;
        this.#created = new Timestamp();
        this.#changed = this.#created;
        this.#version = 0;

        Project.#createTables.forEach((create) => {
          db.prepare(create).run();
        });

        let statement = db.prepare("insert into info values (?,?)");
        statement.run("software", theProgramID);
        statement.run("schemeVersion", theSchemeVersion);
        statement.run("scheme", Project.#createTables.join(";\n"));
        statement.run("created", this.#created.epochSeconds.toString());

        this.#saveData(true).then((saved) => {
          resolve(saved);
        });
      } catch (err) {
        ipcRenderer.invoke("mainProcess_errorMessage", [
          _("project_createErrorTitle"),
          err.toString(),
        ]);
        reject();
      }
    });
  }

  /**
   * save project data to an opened database
   * @private
   *
   * @param {Boolean} newDB
   * @param {Boolean} autoSave
   * @returns {Promise} resolve true on saved, false on not saved; reject on error
   */
  #saveData(newDB = false, autoSave = false) {
    return new Promise((resolve, reject) => {
      if (this.#database) {
        theTextEditor.allEditorsSaved().then((r) => {
          if (newDB || this.isDirty()) {
            if (this.#passwordChanged) {
              // possible feature: we could ask user to confirm password on save to alert her that a password is set and file will be stored encrypted
              this.#passwordChanged = false;
            }
            try {
              let db = this.#database;
              // in debug mode keep compatibility with DB Browser for SQlite
              if (debugMode) {
                db.pragma(`cipher="sqlcipher"`);
                db.pragma(`legacy=4`);
              }
              // optionally encrypt the file using the current password
              db.pragma(`rekey="${this.#cryptoPassword}"`);

              // info -- always updates on save
              this.#version += 1;
              this.#changed = new Timestamp();
              let deleteStatement = db.prepare("delete from info where key=?");
              let insertStatement = db.prepare("insert into info values (?,?)");
              deleteStatement.run("changed");
              insertStatement.run(
                "changed",
                this.#changed.epochSeconds.toString(),
              );
              deleteStatement.run("version");
              insertStatement.run("version", this.#version.toString());
              // save changed properties
              if (theProperties.isDirty() || newDB) {
                deleteStatement.run("title");
                insertStatement.run("title", theProperties.title);
                deleteStatement.run("subtitle");
                insertStatement.run("subtitle", theProperties.subtitle);
                deleteStatement.run("author");
                insertStatement.run("author", theProperties.author);
                deleteStatement.run("info");
                insertStatement.run("info", theProperties.info);
                deleteStatement.run("categories");
                insertStatement.run(
                  "categories",
                  JSON.stringify(theProperties.categories),
                );
              }
              // state
              deleteStatement = db.prepare("delete from state where key=?");
              insertStatement = db.prepare("insert into state values (?,?)");
              // layout
              if (theLayout.isDirty() || newDB) {
                deleteStatement.run("zoom");
                insertStatement.run("zoom", theLayout.zoomValue);
                deleteStatement.run("displayLeft");
                insertStatement.run(
                  "displayLeft",
                  JSON.stringify(theLayout.displayLeft),
                );
                deleteStatement.run("displayRight");
                insertStatement.run(
                  "displayRight",
                  JSON.stringify(theLayout.displayRight),
                );
                deleteStatement.run("displayBottom");
                insertStatement.run(
                  "displayBottom",
                  JSON.stringify(theLayout.displayBottom),
                );
                deleteStatement.run("horizontalSizes");
                insertStatement.run(
                  "horizontalSizes",
                  JSON.stringify(theLayout.horizontalSizes),
                );
                deleteStatement.run("verticalSizes");
                insertStatement.run(
                  "verticalSizes",
                  JSON.stringify(theLayout.verticalSizes),
                );
              }
              // settings
              if (theSettings.isDirty() || newDB) {
                deleteStatement.run("settings");
                insertStatement.run("settings", theSettings.projectSettings);
              }
              // wordlist
              if (theSpellChecker.isDirty() || newDB) {
                deleteStatement.run("wordlist");
                insertStatement.run(
                  "wordlist",
                  JSON.stringify(theSpellChecker.userWords),
                );
              }
              // export profiles
              if (theExporter.isDirty() || newDB) {
                db.prepare("delete from exportprofiles").run();
                insertStatement = db.prepare(
                  "insert into exportprofiles values (?,?)",
                );
                for (let [id, profile] of Object.entries(
                  theExporter.profiles,
                )) {
                  insertStatement.run(id, JSON.stringify(profile));
                }
                theExporter.undirty();
              }
              // formats
              if (theFormats.isDirty() || newDB) {
                db.prepare("delete from formats").run();
                insertStatement = db.prepare(
                  "insert into formats values (?,?)",
                );
                for (let [id, format] of Object.entries(theFormats.formats)) {
                  insertStatement.run(id, JSON.stringify(format));
                }
                theFormats.undirty();
              }
              // text collections
              theTextCollectionTree.collections.forEach((collection) => {
                if (collection.isDirty() || newDB) {
                  if (collection.inDB && !newDB) {
                    db.prepare(
                      "update collections set name=?,decoration=?,items=?,search=?,created=?,changed=? where id=?",
                    ).run(
                      Project.#sqliteQuote(collection.name),
                      JSON.stringify(collection.decoration),
                      JSON.stringify(collection.items),
                      JSON.stringify(collection.search),
                      collection.created.epochSeconds,
                      collection.changed.epochSeconds,
                      collection.id,
                    );
                  } else {
                    db.prepare(
                      "insert into collections values (?,?,?,?,?,?,?)",
                    ).run(
                      collection.id,
                      Project.#sqliteQuote(collection.name),
                      JSON.stringify(collection.items),
                      JSON.stringify(collection.search),
                      JSON.stringify(collection.decoration),
                      collection.created.epochSeconds,
                      collection.changed.epochSeconds,
                    );
                    collection.inDB = true;
                  }
                }
              });
              // deleted collections
              if (!newDB) {
                let statement = db.prepare(
                  "delete from collections where id=?",
                );
                theTextCollectionTree.deletedIDs.forEach((id) => {
                  statement.run(id);
                });
              }
              theTextCollectionTree.clearDeleted();
              // collection tree
              if (theTextCollectionTree.isDirty() || newDB) {
                if (!newDB) {
                  db.prepare("delete from trees where name=?").run(
                    "collection",
                  );
                  db.prepare("delete from trees where name=?").run(
                    "collectionCounter",
                  );
                }
                // save the collection tree with all nodes unchecked so the full text tree is displayed on project load, not any text collection
                db.prepare("insert into trees values (?,?)").run(
                  "collection",
                  theTextCollectionTree.toJSON(false),
                );
                db.prepare("insert into trees values (?,?)").run(
                  "collectionCounter",
                  theTextCollectionTree.newCounter.toString(),
                );
              }
              // texts
              theTextTree.textIDs().forEach((id) => {
                let styledText = theTextTree.getText(id);
                if (styledText) {
                  if (styledText.isDirty() || newDB) {
                    if (styledText.inDB && !newDB) {
                      db.prepare(
                        "update styledtexts set editable=?,name=?,decoration=?,status=?,type=?,uservalue=?,delta=?,characters=?,words=?,objects=?,changed=? where id=?",
                      ).run(
                        styledText.editable ? 1 : 0,
                        Project.#sqliteQuote(styledText.name),
                        JSON.stringify(styledText.decoration),
                        styledText.status,
                        styledText.type,
                        styledText.userValue,
                        JSON.stringify(styledText.delta),
                        styledText.characters,
                        styledText.words,
                        JSON.stringify(styledText.objects),
                        styledText.changed.epochSeconds,
                        styledText.id,
                      );
                    } else {
                      db.prepare(
                        "insert into styledtexts values (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                      ).run(
                        styledText.id,
                        styledText.editable ? 1 : 0,
                        Project.#sqliteQuote(styledText.name),
                        JSON.stringify(styledText.decoration),
                        styledText.status,
                        styledText.type,
                        styledText.userValue,
                        styledText.created.epochSeconds,
                        styledText.changed.epochSeconds,
                        JSON.stringify(styledText.delta),
                        styledText.characters,
                        styledText.words,
                        JSON.stringify(styledText.objects),
                      );
                      styledText.inDB = true;
                    }
                  }
                }
              });
              // deleted texts
              if (!newDB) {
                let statement = db.prepare(
                  "delete from styledtexts where id=?",
                );
                theTextTree.deletedIDs.forEach((id) => {
                  statement.run(id);
                });
              }
              theTextTree.clearDeleted();
              // text tree
              if (theTextTree.isDirty() || newDB) {
                if (!newDB) {
                  db.prepare("delete from trees where name=?").run("text");
                  db.prepare("delete from trees where name=?").run(
                    "textCounter",
                  );
                }
                db.prepare("insert into trees values (?,?)").run(
                  "text",
                  theTextTree.toJSON(),
                );
                db.prepare("insert into trees values (?,?)").run(
                  "textCounter",
                  theTextTree.newCounter.toString(),
                );
              }
              // objects
              theObjectTree.objectIDs().forEach((id) => {
                let styledObject = theObjectTree.getObject(id);
                if (styledObject != null) {
                  if (styledObject.isDirty() || newDB) {
                    if (styledObject.inDB && !newDB) {
                      db.prepare(
                        "update styledobjects set name=?,decoration=?,styleproperties=?,scheme=?,properties=?,changed=?,texts=? where id=?",
                      ).run(
                        Project.#sqliteQuote(styledObject.name),
                        JSON.stringify(styledObject.decoration),
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.styleProperties),
                        ),
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.scheme),
                        ),
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.properties),
                        ),
                        styledObject.changed.epochSeconds,
                        JSON.stringify(styledObject.texts),
                        styledObject.id,
                      );
                    } else {
                      db.prepare(
                        "insert into styledobjects values (?,?,?,?,?,?,?,?,?)",
                      ).run(
                        styledObject.id,
                        Project.#sqliteQuote(styledObject.name),
                        JSON.stringify(styledObject.decoration),
                        styledObject.created.epochSeconds,
                        styledObject.changed.epochSeconds,
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.styleProperties),
                        ),
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.scheme),
                        ),
                        Project.#sqliteQuote(
                          JSON.stringify(styledObject.properties),
                        ),
                        JSON.stringify(styledObject.texts),
                      );
                      styledObject.inDB = true;
                    }
                  }
                }
              });
              if (!newDB) {
                let statement = db.prepare(
                  "delete from styledobjects where id=?",
                );
                theObjectTree.deletedIDs.forEach((id) => {
                  statement.run(id);
                });
              }
              theObjectTree.clearDeleted();
              // object tree
              if (theObjectTree.isDirty() || newDB) {
                if (!newDB) {
                  db.prepare("delete from trees where name=?").run("object");
                  db.prepare("delete from trees where name=?").run(
                    "objectCounter",
                  );
                }
                db.prepare("insert into trees values (?,?)").run(
                  "object",
                  theObjectTree.toJSON(),
                );
                db.prepare("insert into trees values (?,?)").run(
                  "objectCounter",
                  theObjectTree.newCounter.toString(),
                );
              }
              // files
              let dbFileIDs = db
                .prepare("select id from files")
                .all()
                .map((x) => x.id);
              let referencedFileIDs = {};
              theObjectTree.objectIDs().forEach((id) => {
                let styledObject = theObjectTree.getObject(id);
                Object.keys(styledObject.properties).forEach((objectID) => {
                  Object.keys(styledObject.properties[objectID]).forEach(
                    (item) => {
                      if (styledObject.properties[objectID][item].id) {
                        referencedFileIDs[
                          styledObject.properties[objectID][item].id
                        ] = true;
                      }
                    },
                  );
                });
              });
              deleteStatement = db.prepare("delete from files where id=?");
              let statement = db.prepare(
                "insert into files values (?,?,?,?,?)",
              );
              // delete all files from DB not referenced by any object
              dbFileIDs.forEach((id) => {
                if (!(id in referencedFileIDs)) {
                  deleteStatement.run(id);
                }
              });
              // save all files that are not yet in DB
              let promises = [];
              Object.keys(referencedFileIDs).forEach((id) => {
                if (!dbFileIDs.includes(id)) {
                  promises.push(
                    ipcRenderer
                      .invoke(
                        "mainProcess_saveFile",
                        id + theFiles[id].extension,
                      )
                      .then((result) => {
                        statement.run(
                          id,
                          result,
                          theFiles[id].hash,
                          theFiles[id].extension,
                          theFiles[id].size,
                        );
                      }),
                  );
                }
              });
              // all file saves (may take some time for large files) must be completed before resolving
              Promise.allSettled(promises).then(() => {
                // take care of menu
                ipcRenderer.invoke("mainProcess_addRecentProject", [
                  this.#filePath,
                  newDB
                    ? "mainProcess_projectTypeNew"
                    : autoSave
                      ? "mainProcess_projectTypeAuto"
                      : "mainProcess_projectTypeSave",
                  new Timestamp().epochSeconds,
                ]);
                // undirty
                this.undirty();
                // finally resolve
                resolve(true);
              });
            } catch (err) {
              reject();
            }
          } else {
            // no need to save
            resolve(false);
          }
        });
      } else {
        // no database
        resolve(false);
      }
    });
  }

  /**
   * load file content
   *
   * @param {String} fileId
   * @returns {String}
   */
  loadFile(fileId) {
    try {
      return this.#database
        .prepare("select content from files where id=?")
        .get(fileId).content;
    } catch (err) {
      return null;
    }
  }

  /**
   * load project data from an opened database and set globals like theLayout, theTextTree
   * @private
   *
   * @returns {Boolean} true on success, false on error
   */
  #loadData() {
    const db = this.#database;
    try {
      // info
      let statement = db.prepare("select value from info where key=?");
      this.#created = new Timestamp(parseInt(statement.get("created").value));
      this.#changed = new Timestamp(parseInt(statement.get("changed").value));
      this.#version = parseInt(statement.get("version").value);
      theProperties.title = statement.get("title").value;
      theProperties.subtitle = statement.get("subtitle").value;
      theProperties.author = statement.get("author").value;
      theProperties.info = statement.get("info").value;
      theProperties.categories = JSON.parse(statement.get("categories").value);
      // state
      statement = db.prepare("select value from state where key=?");
      theSettings.projectSettings = statement.get("settings").value;
      theSpellChecker = new Spellchecker(
        theLanguage,
        JSON.parse(statement.get("wordlist").value),
      );
      theLayout.zoomValue = statement.get("zoom").value;
      theLayout.displayLeft = JSON.parse(statement.get("displayLeft").value);
      theLayout.displayRight = JSON.parse(statement.get("displayRight").value);
      theLayout.displayBottom = JSON.parse(
        statement.get("displayBottom").value,
      );
      theLayout.horizontalSizes = JSON.parse(
        statement.get("horizontalSizes").value,
      );
      theLayout.verticalSizes = JSON.parse(
        statement.get("verticalSizes").value,
      );
      theLayout.layout(theSettings.effectiveSettings());
      // export profiles
      let profiles = {};
      statement = db.prepare("select id,profile from exportprofiles");
      for (const profile of statement.iterate()) {
        profiles[profile.id] = JSON.parse(
          Project.#sqliteUnquote(profile.profile),
        );
      }
      theExporter = new Exporter(profiles, undefined, false); // not dirty
      // formats
      let formats = {};
      statement = db.prepare("select id,format from formats");
      for (const format of statement.iterate()) {
        formats[format.id] = JSON.parse(Project.#sqliteUnquote(format.format));
      }
      theFormats = new Formats(formats, false); // not dirty
      // files (metainfos only; content is only loaded on demand)
      theFiles = {};
      statement = db.prepare("select id,hash,extension,size from files");
      for (const file of statement.iterate()) {
        theFiles[file.id] = {
          hash: file.hash,
          extension: file.extension,
          size: file.size,
        };
      }
      // objects (load before texts!)
      statement = db.prepare("select data from trees where name=?");
      let objectCounter = parseInt(statement.get("objectCounter").data);
      theObjectTree = new ObjectTree(
        JSON.parse(statement.get("object").data),
        objectCounter,
      );
      statement = db.prepare(
        "select id,name,decoration,created,changed,styleproperties,scheme,properties,texts from styledobjects",
      );
      for (const styledObject of statement.iterate()) {
        theObjectTree.setObject(
          styledObject.id,
          new StyledObject(
            styledObject.id,
            Project.#sqliteUnquote(styledObject.name),
            JSON.parse(styledObject.decoration),
            JSON.parse(Project.#sqliteUnquote(styledObject.styleproperties)),
            JSON.parse(Project.#sqliteUnquote(styledObject.scheme)),
            JSON.parse(Project.#sqliteUnquote(styledObject.properties)),
            JSON.parse(styledObject.texts),
            styledObject.created,
            styledObject.changed,
            false,
            true,
          ),
        );
      }
      // collections
      statement = db.prepare("select data from trees where name=?");
      let collectionCounter = parseInt(statement.get("collectionCounter").data);
      theTextCollectionTree = new CollectionTree(
        $("#TCL"),
        $("#TT"),
        JSON.parse(statement.get("collection").data),
        collectionCounter,
      );
      statement = db.prepare(
        "select id,name,items,search,decoration,created,changed from collections",
      );
      for (const collection of statement.iterate()) {
        theTextCollectionTree.setCollection(
          collection.id,
          new Collection(
            collection.id,
            Project.#sqliteUnquote(collection.name),
            JSON.parse(collection.items),
            JSON.parse(collection.search),
            JSON.parse(collection.decoration),
            collection.created,
            collection.changed,
            false,
            true,
          ),
        );
      }
      // texts
      statement = db.prepare("select data from trees where name=?");
      let textCounter = parseInt(statement.get("textCounter").data);
      theTextTree = new TextTree(
        JSON.parse(statement.get("text").data),
        textCounter,
      );
      statement = db.prepare(
        "select id,editable,name,decoration,created,changed,status,type,uservalue,delta,characters,words,objects from styledtexts",
      );
      for (const styledText of statement.iterate()) {
        theTextTree.setText(
          styledText.id,
          new StyledText(
            styledText.id,
            Project.#sqliteUnquote(styledText.name),
            JSON.parse(styledText.delta),
            styledText.characters,
            styledText.words,
            JSON.parse(styledText.objects),
            styledText.editable != 0,
            JSON.parse(styledText.decoration),
            styledText.status,
            styledText.type,
            styledText.uservalue,
            styledText.created,
            styledText.changed,
            false,
            true,
          ),
        );
      }
      this.undirty(250);
      return true;
    } catch (err) {
      console.error("error while loading data", err);
      return false;
    }
  }

  /**
   * open another project for importing its data
   *
   * @param {String} path
   * @param {String} password
   * @returns {Promise} resolves to Database on success
   */
  importProjectFile(path, password = "") {
    return new Promise((resolve, reject) => {
      this.#openFilePassword(path, password)
        .then((password) => {
          let err = Project.fileSQLiteOpenError(path, password);
          if (err) {
            resolve(this.importProjectFile(path, password));
          } else {
            let db = new Database(path, {
              fileMustExist: true,
            });
            if (password) {
              // in debug mode keep compatibility with DB Browser for SQlite
              if (debugMode) {
                db.pragma(`cipher="sqlcipher"`);
                db.pragma(`legacy=4`);
              }
              // optionally encrypt the file using the current password
              db.pragma(`key="${password}"`);
            }
            resolve(db);
          }
        })
        .catch(() => {
          reject();
        });
    });
  }
}
