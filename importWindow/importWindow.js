/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of import from project window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/importWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theSettings;
let thePath;
let theProjectName;
let theCollections;
let theWords;
let theFormats;
let theTexts;
let theTextTree;
let theFiles;
let theObjects;
let theObjectTree;
let theTransferSettings;
let theExportProfiles;
let objectsInTexts = {}; // textID --> [objectID1,objectID2,...]
let formatsInTexts = {}; // textID --> [formatID1,formatID2,...]
let formatsInObjects = {}; // objectID --> [formatID1,formatID2,...]
let formatsInExportProfiles = {}; // profileID --> [formatID1,formatID2,...]

let textStates = {};
let objectStates = {};
let formatStates = {};

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} path path of the project file to import from
 */
ipcRenderer.on(
  "importWindow_init",
  (
    event,
    [
      settings,
      path,
      collections,
      texts,
      textTree,
      files,
      objects,
      objectTree,
      formats,
      words,
      exportProfiles,
      transferSettings,
    ],
  ) => {
    ipcRenderer.invoke("mainProcess_loggingVerbose", [
      "importWindow_init",
      { settings },
      { path },
      { collections },
      { texts },
      { textTree },
      { files },
      { objects },
      { objectTree },
      { formats },
      { words },
      { exportProfiles },
      { transferSettings },
    ]);

    theLanguage = settings.language;
    theSettings = settings;
    thePath = path;
    theProjectName = nodePath.basename(path);
    theCollections = JSON.parse(collections);
    theWords = JSON.parse(words);
    theFormats = JSON.parse(formats);
    theTexts = JSON.parse(texts);
    theTextTree = JSON.parse(textTree);
    theFiles = JSON.parse(files);
    theObjects = JSON.parse(objects);
    theObjectTree = JSON.parse(objectTree);
    theTransferSettings = JSON.parse(transferSettings);
    theExportProfiles = JSON.parse(exportProfiles);

    // unset all category related values -- possible improvement: also import categories (either all values or only those related to the imported texts)
    Object.values(theTexts).forEach((text) => {
      text[8] = UUID0;
      text[9] = UUID0;
      text[10] = UUID0;
    });

    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });

    // texts
    Util.addTab(
      $tabs,
      $content,
      true,
      "textsTab",
      _("importWindow_texts"),
      () => {
        if (theTexts && Object.keys(theTexts).length) {
          let $tabContent = $("<p>").html(_("importWindow_autoTexts"));
          $tabContent.append(itemControls("text", true));

          $tabContent.append(
            itemList(
              $("<ul>").attr({
                id: "texts",
                style: "list-style:none; margin:0; padding:10px",
              }),
            ),
          );
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noTexts", { project: theProjectName }),
          );
        }
      },
    );

    // collections
    Util.addTab(
      $tabs,
      $content,
      false,
      "collectionsTab",
      _("importWindow_collections"),
      () => {
        if (theCollections && Object.keys(theCollections).length) {
          let $tabContent = itemControls(
            "collection",
            false,
            "clearcollections",
            _("importWindow_clearCollections"),
          );
          let $ul = $("<ul>").attr({
            style: "list-style:none; margin:0; padding:10px",
          });
          Object.keys(theCollections).forEach((id) => {
            $ul.append(
              $("<li>").html(
                `<input class="form-check-input" type="checkbox" id="collection${id}" onclick="showElements()"></input> <span title="${_(
                  "importWindow_created",
                  {
                    time: new Timestamp(theCollections[id][5]).toLocalString(
                      theSettings.dateTimeFormatLong,
                    ),
                  },
                )} -- ${_("importWindow_changed", {
                  time: new Timestamp(theCollections[id][6]).toLocalString(
                    theSettings.dateTimeFormatLong,
                  ),
                })}">${theCollections[id][3] ? '<i class="fas fa-magnifying-glass"></i> ' : ""}${theCollections[id][1]}</span>`,
              ),
            );
          });
          $tabContent.append(itemList($ul));
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noCollections", { project: theProjectName }),
          );
        }
      },
    );

    // objects
    Util.addTab(
      $tabs,
      $content,
      false,
      "objectsTab",
      _("importWindow_objects"),
      () => {
        if (theObjects && Object.keys(theObjects).length) {
          let $tabContent = $("<p>").html(_("importWindow_autoObjects"));
          $tabContent.append(itemControls("object", true));
          $tabContent.append(
            itemList(
              $("<ul>").attr({
                id: "objects",
                style: "list-style:none; margin:0; padding:10px",
              }),
            ),
          );
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noObjects", { project: theProjectName }),
          );
        }
      },
    );

    // formats
    Util.addTab(
      $tabs,
      $content,
      false,
      "formatstab",
      _("importWindow_formats"),
      () => {
        if (theFormats && Object.keys(theFormats).length) {
          let $tabContent = $("<p>").html(_("importWindow_autoFormats"));
          $tabContent.append(
            itemControls(
              "format",
              false,
              "clearformats",
              _("importWindow_clearFormats"),
            ),
          );
          $tabContent.append(
            itemList(
              $("<ul>").attr({
                id: "formats",
                style: "list-style:none; margin:0; padding:10px",
              }),
            ),
          );
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noFormats", { project: theProjectName }),
          );
        }
      },
    );

    // list of words
    Util.addTab(
      $tabs,
      $content,
      false,
      "wordsTab",
      _("importWindow_words"),
      () => {
        if (theWords && theWords.length) {
          let $tabContent = itemControls(
            "word",
            false,
            "clearwords",
            _("importWindow_clearWords"),
          );
          let $ul = $("<ul>").attr({
            style: "list-style:none; margin:0; padding:10px",
          });
          let i = 0;
          theWords.forEach((word) => {
            $ul.append(
              $("<li>").html(
                `<input class="form-check-input" type="checkbox" id="word${i}"></input> ${word}`,
              ),
            );
            i += 1;
          });
          $tabContent.append(itemList($ul));
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noWords", { project: theProjectName }),
          );
        }
      },
    );

    // export profiles
    Util.addTab(
      $tabs,
      $content,
      false,
      "exportsTab",
      _("importWindow_exportProfiles"),
      () => {
        let $tabContent = itemControls(
          "export",
          false,
          "clearexports",
          _("importWindow_clearExports"),
        );
        let $ul = $("<ul>").attr({
          style: "list-style:none; margin:0; padding:10px",
        });
        Object.keys(theExportProfiles).forEach((id) => {
          $ul.append(
            $("<li>").html(
              `<input class="form-check-input" type="checkbox" id="export${id}" onclick="showElements()"></input> <span title="${_(
                "importWindow_created",
                {
                  time: new Timestamp(
                    theExportProfiles[id].profileCreated,
                  ).toLocalString(theSettings.dateTimeFormatLong),
                },
              )} -- ${_("importWindow_changed", {
                time: new Timestamp(
                  theExportProfiles[id].profileChanges,
                ).toLocalString(theSettings.dateTimeFormatLong),
              })}">${theExportProfiles[id].profileName}</span>`,
            ),
          );
        });
        $tabContent.append(itemList($ul));
        $tabContent.append(buttons());
        return $tabContent;
      },
    );

    // settings
    Util.addTab(
      $tabs,
      $content,
      false,
      "settingsTab",
      _("importWindow_settings"),
      () => {
        let $tabContent = itemControls(
          "setting",
          false,
          "clearsettings",
          _("importWindow_clearSettings"),
        );
        let $ul = null;
        let i = 0;
        Settings.settings.forEach((tab) => {
          if (!tab.globalOnly && "settings" in tab) {
            let doTab = false;
            tab.settings.forEach((setting) => {
              if (setting.name in theTransferSettings) {
                doTab = true;
              }
            });
            if (doTab) {
              if (!$ul) {
                $ul = $("<ul>").attr({
                  style: "list-style:none; margin:0; padding:10px",
                });
              }
              $ul.append(
                $("<li>").html(
                  `<input class="form-check-input" type="checkbox" id="setting${i}"></input> ${_(
                    tab.tab,
                  )}`,
                ),
              );
            }
          }
          i += 1;
        });
        if ($ul) {
          $tabContent.append(itemList($ul));
          $tabContent.append(buttons());
          return $tabContent;
        } else {
          return emptyTab(
            _("importWindow_noSettings", { project: theProjectName }),
          );
        }
      },
    );

    // main
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.transferBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.transferBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.transferBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.transferBackgroundColor || settings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content);

    Util.initTabs();

    showElements();
  },
);

/**
 * import and cancel buttons
 *
 * @returns {Object} jquery div with buttons
 */
function buttons() {
  return $("<div>")
    .attr({
      style: "margin-top:30px;",
    })
    .html(
      `<div style="display:flex; justify-content:flex-end; padding:10px"><div><button type="button" class="btn btn-primary" onclick="doTransfer()">${_(
        "importWindow_import",
      )}</button> <button type="button" class="btn btn-secondary" onclick="closeWindow()">${_(
        "general_cancelButton",
      )}</button></div></div>`,
    );
}

/**
 * display a list of items
 *
 * @param {Object} elem jquery element to display
 * @returns {Object} jquery div
 */
function itemList(elem) {
  return $("<div>")
    .attr({
      style: `margin-top:20px; border:1px dotted; background-color:#fff`,
    })
    .append(elem);
}

/**
 * show texts, objects, formats with their respective user and auto selections
 */
function showElements() {
  // reset states
  Object.keys(theTexts).forEach((textID) => {
    textStates[textID] = [$(`#text${textID}`).prop("checked"), false];
    if ($(`#text${textID}`).prop("checked")) {
      activateText(textID);
    }
  });
  Object.keys(theObjects).forEach((objectID) => {
    objectStates[objectID] = [$(`#object${objectID}`).prop("checked"), false];
    if ($(`#object${objectID}`).prop("checked")) {
      activateObject(objectID);
    }
  });
  Object.keys(theFormats).forEach((formatID) => {
    formatStates[formatID] = [$(`#format${formatID}`).prop("checked"), false];
  });

  // texts
  Object.keys(theCollections).forEach((collectionID) => {
    if ($(`#collection${collectionID}`).prop("checked")) {
      theCollections[collectionID][2].forEach((textID) => {
        textStates[textID][1] = true;
        activateText(textID);
      });
    }
  });

  // objects
  Object.keys(theTexts).forEach((textID) => {
    if (textStates[textID][0] || textStates[textID][1]) {
      objectsInTexts[textID].forEach((objectID) => {
        objectStates[objectID][1] = true;
        activateObject(objectID);
      });
    }
  });

  // formats
  Object.keys(theTexts).forEach((textID) => {
    if (textStates[textID][0] || textStates[textID][1]) {
      formatsInTexts[textID].forEach((formatID) => {
        formatStates[formatID][1] = true;
      });
    }
  });
  Object.keys(theObjects).forEach((objectID) => {
    if (objectStates[objectID][0] || objectStates[objectID][1]) {
      formatsInObjects[objectID].forEach((formatID) => {
        formatStates[formatID][1] = true;
      });
    }
  });
  $("li input[id^='export']:checked").each(function (index, element) {
    let id = element.id.substring("export".length);
    if (!formatsInExportProfiles[id]) {
      let formats = {};
      Exporter.settings.forEach((tab) => {
        tab.settings.forEach((setting) => {
          if (setting.type == "editor") {
            theExportProfiles[id][setting.name].ops.forEach((op) => {
              if (op.insert && op.attributes) {
                Object.keys(op.attributes).forEach((att) => {
                  if (att.startsWith("format")) {
                    formats[att.substring("format".length)] = true;
                  }
                });
              }
            });
          }
        });
      });
      formatsInExportProfiles[id] = Object.keys(formats);
    }
    formatsInExportProfiles[id].forEach((formatID) => {
      formatStates[formatID][1] = true;
    });
  });

  // texts
  $("#texts").empty();
  showTextTree($("#texts"), theTextTree, 0);
  // objects
  $("#objects").empty();
  showObjectTree($("#objects"), theObjectTree, 0);
  // formats
  $("#formats").empty();
  Object.keys(theFormats).forEach((id) => {
    $("#formats").append(
      $("<li>").append(
        $("<input>").attr({
          class: "form-check-input",
          type: "checkbox",
          checked: formatStates[id][0] || formatStates[id][1],
          disabled: formatStates[id][1],
        }),
        ` ${theFormats[id].formats_name}`,
      ),
    );
  });
}

/**
 * recursively build text tree
 *
 * @param {Object} elem jquery element to append (sub)tree to
 * @param {Object} tree tree structure
 * @param {Number} level depth level of subtree
 */
function showTextTree(elem, tree, level) {
  tree.forEach((node) => {
    elem.append(
      $("<li>").append(
        $("<input>").attr({
          class: "form-check-input",
          type: "checkbox",
          checked: textStates[node.id][0] || textStates[node.id][1],
          disabled: textStates[node.id][1],
          id: `text${node.id}`,
          style: `margin-left:${level * 20}px`,
          onchange: "showElements()",
        }),
        $("<span>")
          .attr(
            "title",
            `${_("importWindow_created", {
              time: new Timestamp(theTexts[node.id][11]).toLocalString(
                theSettings.dateTimeFormatLong,
              ),
            })} -- ${_("importWindow_changed", {
              time: new Timestamp(theTexts[node.id][12]).toLocalString(
                theSettings.dateTimeFormatLong,
              ),
            })}`,
          )
          .text(" " + theTexts[node.id][1]),
      ),
    );
    if (node.children.length) {
      showTextTree(elem, node.children, level + 1);
    }
  });
}

/**
 * recursively build object tree
 *
 * @param {Object} elem jquery element to append (sub)tree to
 * @param {Object} tree tree structure
 * @param {Number} level depth level of subtree
 */
function showObjectTree(elem, tree, level) {
  tree.forEach((node) => {
    elem.append(
      $("<li>").append(
        $("<input>").attr({
          class: "form-check-input",
          type: "checkbox",
          checked: objectStates[node.id][0] || objectStates[node.id][1],
          disabled: objectStates[node.id][1],
          id: `object${node.id}`,
          style: `margin-left:${level * 20}px`,
          onchange: "showElements()",
        }),
        $("<span>")
          .attr(
            "title",
            `${_("importWindow_created", {
              time: new Timestamp(theObjects[node.id][7]).toLocalString(
                theSettings.dateTimeFormatLong,
              ),
            })} -- ${_("importWindow_changed", {
              time: new Timestamp(theObjects[node.id][8]).toLocalString(
                theSettings.dateTimeFormatLong,
              ),
            })}`,
          )
          .text(" " + theObjects[node.id][1]),
      ),
    );
    if (node.children.length) {
      showObjectTree(elem, node.children, level + 1);
    }
  });
}

/**
 * upon object activation collect ids of all formats the object uses
 *
 * @param {String} objectID id of the activated object
 */
function activateObject(objectID) {
  if (!formatsInObjects[objectID]) {
    let formats = {};
    if (objectID in theObjects[objectID][5]) {
      Object.values(theObjects[objectID][5][objectID]).forEach((prop) => {
        if ("ops" in prop) {
          prop.ops.forEach((op) => {
            if (op.insert && op.attributes) {
              Object.keys(op.attributes).forEach((att) => {
                if (att.startsWith("format")) {
                  formats[att.substring("format".length)] = true;
                }
              });
            }
          });
        }
      });
    }
    formatsInObjects[objectID] = Object.keys(formats);
  }
}

/**
 * upon text activation collect ids of all objects and formats the text is connected with
 *
 * @param {String} textID id of activated text
 */
function activateText(textID) {
  // autoselect objects
  if (!objectsInTexts[textID]) {
    let objects = {};
    theTexts[textID][2].forEach((op) => {
      if (op.insert && op.attributes) {
        Object.keys(op.attributes).forEach((att) => {
          if (att.startsWith("object")) {
            objects[att.substring("object".length)] = true;
          }
        });
      }
    });
    objectsInTexts[textID] = Object.keys(objects);
  }
  // autoselect formats
  if (!formatsInTexts[textID]) {
    let formats = {};
    theTexts[textID][2].forEach((op) => {
      if (op.insert && op.attributes) {
        Object.keys(op.attributes).forEach((att) => {
          if (att.startsWith("format")) {
            formats[att.substring("format".length)] = true;
          }
        });
      }
    });
    formatsInTexts[textID] = Object.keys(formats);
  }
}

/**
 * fill an empty tab
 *
 * @param {String} info informational text to display
 * @returns {Object} jquery div to fill
 */
function emptyTab(info) {
  return $("<div>")
    .attr({
      style: "grid-column:1/span 2; margin-left:10px;",
    })
    .html(info);
}

/**
 * controls for items (de)selection
 *
 * @param {String} prefix name of item group
 * @param {Boolean} connect add controls to upconnect tree items
 * @param {String} clearID id of checkbox to clear existing elements - none if falsy value
 * @param {String} clearText info text for element clearing
 *
 * @returns {Object} jquery div containing controls
 */
function itemControls(prefix, connect = false, clearID = null, clearText = "") {
  return $("<div>")
    .attr({ style: "margin:10px 0 20px 0;" })
    .append(
      `<button type="button" class="btn btn-outline-success btn-sm" onclick="changeAll('${prefix}',true)" title="${_(
        "importWindow_selectAll",
      )}"><i class="fa-solid fa-check-double"></i> <i class="fa-solid fa-plus"></i></button> <button type="button" class="btn btn-outline-danger btn-sm" onclick="changeAll('${prefix}',false)" title="${_(
        "importWindow_unselectAll",
      )}"><i class="fa-solid fa-check-double"></i> <i class="fa-solid fa-minus"></i></button>
            ${
              connect
                ? `<button type="button" class="btn btn-outline-dark btn-sm" onclick="upConnect('${prefix}')" title="${_(
                    "importWindow_upConnect",
                  )}"><i class="fa-solid fa-ellipsis fa-rotate-by" style="--fa-rotate-angle: 45deg;"></i></button>`
                : ""
            }
            ${
              clearID
                ? `<input class="form-check-input" type="checkbox" id="${clearID}" style="margin:7px 0 0 20px"></input> ${clearText}`
                : ``
            }`,
    );
}

/**
 * select or deselect all items in a named group
 *
 * @param {String} prefix name of item group
 * @param {Boolean} on select (true) or deselect (false)
 */
function changeAll(prefix, on) {
  $(`li input[id^="${prefix}"]`).each(function () {
    $(this).prop("checked", on);
  });
  showElements();
}

/**
 * close window
 */
function closeWindow() {
  ipcRenderer.invoke("mainProcess_closeModalWindow");
}

/**
 * check items higher up in the tree hierarchy so there is no gap in the cascade of items from the lowest checked leaf to all higher branches
 *
 * @param {String} prefix name of item group
 */
function upConnect(prefix) {
  treeConnect(
    prefix,
    prefix == "text" ? theTextTree : theObjectTree,
    $(`li input[id^='${prefix}']:checked`)
      .toArray()
      .map((i) => i.id.substring(prefix.length)),
    [],
  );
}

/**
 * recursively check tree items
 *
 * @param {String} prefix tree id
 * @param {*} tree
 * @param {*} checked
 * @param {*} path
 */
function treeConnect(prefix, tree, checked, path) {
  tree.forEach((node) => {
    if (checked.includes(node.id)) {
      path.forEach((id) => {
        $(`#${prefix}${id}`).prop("checked", true);
      });
    }
    if (node.children.length) {
      treeConnect(prefix, node.children, checked, [...path, node.id]);
    }
  });
}

/**
 * returns nested list reflecting the tree structure plus a flat mapping of old ids to new ones

* @param {Object[]} tree
 * @param {Object} mapping
 * @returns {[Object[],Object]} 
 */
function collectTexts(tree, mapping) {
  let result = [];
  tree.forEach((node) => {
    if (textStates[node.id][0] || textStates[node.id][1]) {
      let newID = uuid();
      mapping[node.id] = newID;
      let text = theTexts[node.id];
      text[0] = newID;
      result.push({ text: text });
    }
    if (node.children.length) {
      let [r, m] = collectTexts(node.children, mapping);
      mapping = m;
      if (r.length) {
        result.push(r);
      }
    }
  });
  return [result, mapping];
}

/**
 * returns nested list of {id:object} reflecting the tree structure plus a flat mapping of old ids to new ones
 *
 * @param {Object[]} tree
 * @param {Object} mapping
 * @returns {[Object[],Object]}
 */
function collectObjects(tree, mapping) {
  let result = [];
  tree.forEach((node) => {
    if (objectStates[node.id][0] || objectStates[node.id][1]) {
      let newID = uuid();
      mapping[node.id] = newID;
      let object = theObjects[node.id];
      object[0] = newID;
      // adjust properties to new object IDs (and get rid of unused props)
      let newProperties = {};
      Object.keys(object[5]).forEach((id) => {
        if (id in mapping) {
          newProperties[mapping[id]] = JSON.parse(
            JSON.stringify(object[5][id]),
          );
        }
      });
      object[5] = newProperties;
      result.push({ object: object });
    }
    if (node.children.length) {
      let [r, m] = collectObjects(node.children, mapping);
      mapping = m;
      if (r.length) {
        result.push(r);
      }
    }
  });
  return [result, mapping];
}

/**
 * transfer data from other project into current project
 */
function doTransfer() {
  // collect texts and id mapping
  let [texts, mapTextIDs] = collectTexts(theTextTree, {});

  // collect objects and id mapping
  let [objects, mapObjectsIDs] = collectObjects(theObjectTree, {});
  // in objects adjust refs to exported texts and remove refs to texts that are not exported
  objects.flat(Infinity).forEach((object) => {
    let refs = object.object[6];
    Object.keys(refs).forEach((id) => {
      if (id in mapTextIDs) {
        refs[mapTextIDs[id]] = refs[id];
      }
      delete refs[id];
    });
  });
  // transfer objects
  if (objects.length) {
    ipcRenderer.invoke("mainProcess_transferObjects", [
      objects,
      theFiles,
      thePath,
    ]);
  }

  // adjust the text's delta to the object's new ID
  texts.flat(Infinity).forEach((text) => {
    text.text[2].forEach((op) => {
      if (op.insert && op.attributes) {
        Object.keys(op.attributes).forEach((att) => {
          if (att.startsWith("object")) {
            op.attributes[
              `object${mapObjectsIDs[att.substring("object".length)]}`
            ] = op.attributes[att];
            delete op.attributes[att];
          }
        });
      }
    });
  });
  // transfer texts
  if (Object.keys(texts).length) {
    ipcRenderer.invoke("mainProcess_transferTexts", texts);
  }

  // collect collections
  let collections = {};
  $("li input[id^='collection']:checked").each(function (index, element) {
    let id = element.id.substring("collection".length);
    // new collection id
    let newID = uuid();
    theCollections[id][0] = newID;
    let texts = [];
    theCollections[id][2].forEach((textID) => {
      texts.push(mapTextIDs[textID]);
    });
    theCollections[id][2] = texts;
    collections[newID] = theCollections[id];
  });
  // transfer collections
  if (Object.keys(collections).length) {
    ipcRenderer.invoke("mainProcess_transferCollections", [
      collections,
      !$("#clearcollections").prop("checked"),
    ]);
  }

  // collect formats - format ids are not changed to keep them unique - no need to import the same format twice
  let formats = {};
  Object.keys(formatStates).forEach((formatID) => {
    if (formatStates[formatID][0] || formatStates[formatID][1]) {
      formats[formatID] = theFormats[formatID];
    }
  });
  // transfer formats
  if (Object.keys(formats).length) {
    ipcRenderer.invoke("mainProcess_saveFormats", [
      formats,
      !$("#clearformats").prop("checked"),
    ]);
  }

  // collect words
  let words = [];
  $("li input[id^='word']:checked").each(function (index, element) {
    let id = element.id.substring("word".length);
    words.push(theWords[id]);
  });
  // transfer words
  if (words.length) {
    ipcRenderer.invoke("mainProcess_saveWordlist", [
      words,
      !$("#clearwords").prop("checked"),
    ]);
  }

  // collect export profiles
  let profiles = {};
  $("li input[id^='export']:checked").each(function (index, element) {
    let id = element.id.substring("export".length);
    profiles[uuid()] = theExportProfiles[id]; // new uuid
  });
  // transfer export profiles
  if (Object.keys(profiles).length) {
    ipcRenderer.invoke("mainProcess_transferExportProfiles", [
      profiles,
      !$("#clearexports").prop("checked"),
    ]);
  }

  // collect settings
  let settings = {};
  $("li input[id^='setting']:checked").each(function (index, element) {
    let id = element.id.substring("setting".length);
    Settings.settings[id].settings.forEach((setting) => {
      if (setting.name in theTransferSettings) {
        settings[setting.name] = theTransferSettings[setting.name];
      }
    });
  });
  // transfer settings
  if (Object.keys(settings).length) {
    ipcRenderer.invoke("mainProcess_setProjectSettings", [
      settings,
      !$("#clearsettings").prop("checked"),
    ]);
  }
}
