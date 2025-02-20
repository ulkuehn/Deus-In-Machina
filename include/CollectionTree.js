/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of CollectionTree class
 */

/**
 * @classdesc define the tree (which in effect is only a flat list) holding text collections
 */
class CollectionTree {
  static colors = [
    "#ff595e",
    "#ff924c",
    "#ffca3a",
    "#c5ca30",
    "#8ac926",
    "#52a675",
    "#1982c4",
    "#4267ac",
    "#6a4c93",
    "#d677b8",
  ];

  #$containerDiv; // div for the collection tree
  #treeDiv; // div for the jstree
  #$displayDiv; // div to display the collections of the tree
  #collections; // mapping of ids to Collection Objects
  #newCounter; // counter for naming new collections
  #deletedIDs; // array of collection ids that were deleted since last save
  #checkEvent = true; // if true check events are processed
  #dirty; // true if unsaved changes

  /**
   * class constructor
   *
   * @param {jQuery} $containerDiv nesessary
   * @param {jQuery} $displayDiv nesessary
   * @param {Object[]} data jstree data to populate the tree
   * @param {Number} counter
   * @param {Object} collections
   */
  constructor(
    $containerDiv,
    $displayDiv,
    data = [],
    counter = 0,
    collections = {},
  ) {
    this.#$containerDiv = $containerDiv;
    this.#$displayDiv = $displayDiv;
    this.#newCounter = counter;
    this.#collections = collections;
    this.#deletedIDs = [];
    this.#dirty = false;
    this.#treeDiv = $("<div>");
    $containerDiv.empty();
    $containerDiv.append(this.#treeDiv);
    this.setupTree(data, true);
  }

  // getters and setters

  get newCounter() {
    return this.#newCounter;
  }

  get deletedIDs() {
    return this.#deletedIDs;
  }

  get tree() {
    return this.#treeDiv;
  }

  /**
   * retrieve all collection, regular and search
   *
   * @returns {Collection[]}
   */
  get collections() {
    let collections = [];
    this.#treeDiv
      .jstree()
      .get_node("#")
      .children.forEach((childID) => {
        collections.push(this.#collections[childID]);
      });
    return collections;
  }

  /**
   * populate tree with given collections object
   *
   * @param {Object} collections
   */
  set collections(collections = {}) {
    Object.keys(this.#collections).forEach((id) => {
      this.#treeDiv.jstree().delete_node(id);
    });
    Object.keys(collections).forEach((id) => {
      this.#treeDiv
        .jstree()
        .create_node(null, { id: id, text: collections[id].decoratedName() });
    });
    this.#collections = Object.assign({}, collections);
  }

  /**
   * retrieve regular collections only (no search collections)
   *
   * @returns {Collection[]}
   */
  get regularCollections() {
    let collections = [];
    this.#treeDiv
      .jstree()
      .get_node("#")
      .children.forEach((childID) => {
        if (!this.#collections[childID].search) {
          collections.push(this.#collections[childID]);
        }
      });
    return collections;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  clearDeleted() {
    this.#deletedIDs = [];
  }

  /**
   * @returns {Boolean} true if at least one item is checked
   */
  isActive() {
    return this.#treeDiv.jstree().get_checked().length > 0;
  }

  getCollection(id) {
    return this.#collections[id];
  }

  setCollection(id, collection) {
    this.#collections[id] = collection;
    this.#treeSheet(id);
  }

  /**
   * retrieve tree info as JSON string
   *
   * @param {Boolean} state if node state info should be included
   * @returns {String} stringified tree json
   */
  toJSON(state = true) {
    return JSON.stringify(
      this.#treeDiv.jstree().get_json(null, { no_state: !state }),
    );
  }

  /**
   * initialize the tree using json data
   *
   * @param {JSON} data if null data is fetched from existing tree
   * @param {Boolean} doUndirty
   */
  setupTree(data = null, doUndirty = false) {
    let settings = theSettings.effectiveSettings();

    $("#TCL").css({
      "--foreground-color": Util.blackOrWhite(
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
    });

    if ($.jstree.reference(this.#treeDiv)) {
      if (!data) {
        data = this.#treeDiv.jstree().get_json();
      }
      this.#treeDiv.jstree().destroy();
    }
    let plugins = ["dnd", "checkbox", "wholerow"];

    this.#treeDiv.jstree({
      core: {
        check_callback: function (
          operation,
          node,
          node_parent,
          node_position,
          more,
        ) {
          if (more && more.dnd && more.is_multi) {
            return false;
          }
          if (operation == "move_node" || operation == "copy_node") {
            return node_parent.id == "#"; // allow only dnd on parent level
          }
          return true; // allow all other operations
        },
        dblclick_toggle: false,
        themes: {
          name: "dim",
          variant: settings.textCollectionTreeSmall ? "small" : "large",
          icons: false,
          dots: false,
        },
        data: data,
      },
      checkbox: {
        whole_node: false,
        three_state: false,
        tie_selection: false,
      },
      dnd: {
        copy: true,
      },
      plugins: plugins,
    });

    if (data && data.length == 0) {
      this.#collections = {};
      this.#newCounter = 0;
    }

    // prevent node selection, as only checking is needed
    this.#treeDiv.on("select_node.jstree", () => {
      this.#treeDiv.jstree().deselect_all(true);
    });

    this.#treeDiv.on("dblclick.jstree", (event) => {
      this.#editProps(this.#treeDiv.jstree().get_node(event.target).id);
    });

    this.#treeDiv.on(
      "create_node.jstree delete_node.jstree move_node.jstree",
      () => {
        this.#dirty = true;
      },
    );

    // copy by drag and drop
    this.#treeDiv.on("copy_node.jstree", (event, data) => {
      this.#dirty = true;
      let node = this.#treeDiv.jstree().get_node(data.node.id);
      let originalNode = this.#treeDiv.jstree().get_node(data.original.id);
      let id = uuid();
      this.#treeDiv.jstree().set_id(node, id);
      this.#collections[id] = new Collection(
        id,
        _("textCollections_collectionCopy", {
          name: this.#collections[originalNode.id].name,
        }),
        this.#collections[originalNode.id].items,
        this.#collections[originalNode.id].search,
        this.#collections[originalNode.id].decoration,
      );
      this.#treeDiv
        .jstree()
        .rename_node(node, this.#collections[id].decoratedName());
    });

    this.#treeDiv.on(
      "check_node.jstree uncheck_node.jstree check_all.jstree uncheck_all.jstree",
      (event, data) => {
        this.#dirty = true;
        if (this.#checkEvent) {
          switch (event.type) {
            case "check_node":
              if (theTextCollection) {
                theTextTree.checkSome(
                  theTextCollection.treeDiv.jstree().get_checked(),
                  true,
                );
              }
              this.#checkEvent = false;
              this.#treeDiv.jstree().uncheck_all();
              this.#treeDiv.jstree().check_node(data.node.id);
              this.#checkEvent = true;
              break;
          }
          this.#showTexts();
        }
      },
    );

    // context menu definition
    this.#treeDiv.contextMenu({
      selector: ".jstree-node",
      autoHide: true,
      build: ($trigger, e) => {
        return this.#contextMenu($trigger[0].id);
      },
    });

    this.#treeDiv.on("ready.jstree", () => {
      this.#showTexts();
      if (this.#collections) {
        Object.keys(this.#collections).forEach((id) => {
          this.#treeDiv
            .jstree()
            .rename_node(id, this.#collections[id].decoratedName());
        });
      }
      doUndirty && this.undirty();
    });

    this.#treeSheet();
  }

  /**
   * check specific nodes; generates just one check event
   *
   * @param {String[]} ids
   * @param {Boolean} onlySome if true check only the given ids and uncheck all others
   */
  checkSome(ids, onlySome = false) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    this.#checkEvent = false;
    if (onlySome) {
      this.#treeDiv.jstree().uncheck_all();
    }
    for (let i = 0; i < ids.length - 1; i++) {
      this.#treeDiv.jstree().check_node(ids[i]);
    }
    this.#checkEvent = true;
    this.#treeDiv.jstree().check_node(ids[ids.length - 1]);
  }

  /**
   * create a new empty collection
   */
  newCollection() {
    let settings = theSettings.effectiveSettings();
    let id = uuid();
    this.#collections[id] = new Collection(
      id,
      _("textCollections_newCollection", { count: this.#newCounter + 1 }),
      [],
      null,
      {
        icon: false,
        color: settings.textCollectionTreeNewCollectionRandomColor
          ? Util.mix_hexes(
              CollectionTree.colors[
                this.#newCounter % CollectionTree.colors.length
              ],
              CollectionTree.colors[
                (this.#newCounter +
                  Math.floor(this.#newCounter / CollectionTree.colors.length)) %
                  CollectionTree.colors.length
              ],
            )
          : settings.textCollectionTreeNewCollectionColor,
      },
    );
    this.#newCounter++;
    this.#treeDiv.jstree().create_node(null, {
      id: id,
      text: this.#collections[id].decoratedName(),
    });
    this.#treeSheet(id);
    if (settings.textCollectionTreeNewCollectionEditor) {
      this.#editProps(id);
    }
  }

  /**
   * create a new search collection
   *
   * @param {Object} search
   */
  newSearchCollection(search) {
    let settings = theSettings.effectiveSettings();
    let id = uuid();
    this.#collections[id] = new Collection(
      id,
      _("textCollections_newSearchCollection", { count: this.#newCounter + 1 }),
      [],
      search,
      {
        icon: false,
        color: settings.textCollectionTreeNewCollectionRandomColor
          ? Util.mix_hexes(
              CollectionTree.colors[
                this.#newCounter % CollectionTree.colors.length
              ],
              CollectionTree.colors[
                (this.#newCounter +
                  Math.floor(this.#newCounter / CollectionTree.colors.length)) %
                  CollectionTree.colors.length
              ],
            )
          : settings.textCollectionTreeNewSearchCollectionColor,
      },
    );
    this.#newCounter++;
    this.#treeDiv.jstree().create_node(null, {
      id: id,
      text: this.#collections[id].decoratedName(),
    });
    this.#treeSheet(id);
    this.#treeDiv.jstree().uncheck_all();
    this.#treeDiv.jstree().check_node(id);
  }

  /**
   * add a collection to the tree
   *
   * @param {Object} collection
   */
  addCollection(collection) {
    this.#collections[collection.id] = collection;
    this.#treeDiv.jstree().create_node(null, {
      id: collection.id,
      text: this.#collections[collection.id].decoratedName(),
    });
    this.#treeSheet(collection.id);
  }

  /**
   * when texts are being deleted, we must take care to possibly update all collections in the tree
   *
   * @param {String[]} textIDs
   */
  deleteTexts(textIDs) {
    if (!(textIDs instanceof Array)) {
      textIDs = [textIDs];
    }
    Object.keys(this.#collections).forEach((collectionID) => {
      textIDs.forEach((id) => {
        if (this.#collections[collectionID].hasItem(id)) {
          this.#collections[collectionID].removeItem(id);
        }
        if (!this.#collections[collectionID].items.length) {
          this.#treeDiv
            .jstree()
            .rename_node(
              collectionID,
              this.#collections[collectionID].decoratedName(),
            );
        }
      });
    });
  }

  /**
   * change name of collection (or just its decoration if name==null)
   *
   * @param {String} id
   * @param {String} name
   */
  updateName(id, name = null) {
    if (name) {
      this.#collections[id].name = name;
    }
    this.#treeDiv
      .jstree()
      .rename_node(id, this.#collections[id].decoratedName());
    this.#treeSheet();
  }

  // private methods

  /**
   * style the tree, including the tree items regarding their individual colors
   *
   * @param {String} id
   */
  #treeSheet(id = null) {
    if (id) {
      $("#textCollectionTreeSheet").append(
        `#TCL .jstree-dim #${id} { background:${this.#collections[id].decoration.color || "unset"} }`,
      );
      $("#textCollectionTreeSheet").append(
        `#TCL .jstree-dim #${id} .jstree-anchor { color:${Util.blackOrWhite(this.#collections[id].decoration.color || "#ffffff")} }`,
      );
    } else {
      let settings = theSettings.effectiveSettings();
      $("#textCollectionTreeSheet").empty();
      $("#textCollectionTreeSheet").append(
        "#TCL .jstree-dim { --jstree-hovered:#80808080 }",
      );
      $("#textCollectionTreeSheet").append(
        `#TCL .jstree-anchor { margin-left:-${
          settings.textCollectionTreeSmall ? 12 : 27
        }px }`,
      );
      Object.keys(this.#collections).forEach((id) => {
        $("#textCollectionTreeSheet").append(
          `#TCL .jstree-dim #${id} { background:${this.#collections[id].decoration.color || "unset"} }`,
        );
        $("#textCollectionTreeSheet").append(
          `#TCL .jstree-dim #${id} .jstree-anchor { color:${Util.blackOrWhite(this.#collections[id].decoration.color || "#ffffff")} }`,
        );
      });
    }
  }

  /**
   * apply search and filter criteria to a collection
   *
   * @param {String} collectionID
   */
  #searchAndFilter(collectionID) {
    this.#collections[collectionID].clearItems();

    let texts = theTextTree.getAll();
    this.#collections[collectionID].search.filters.forEach((filter) => {
      let rTexts = [];
      texts.forEach((text) => {
        if (Filter.applyFilter(filter, theTextTree.getText(text))) {
          rTexts.push(text);
        }
      });
      texts = [...rTexts];
    });
    texts.forEach((textID) => {
      if (
        theTextTree
          .getText(textID)
          .find(
            this.#collections[collectionID].search.text,
            this.#collections[collectionID].search.case,
            this.#collections[collectionID].search.word,
            this.#collections[collectionID].search.regex,
          )
      ) {
        this.#collections[collectionID].addItem(textID);
      }
    });
  }

  /**
   * show texts of a checked collection or whole text tree
   */
  #showTexts() {
    let texts;
    if (theTextCollection) {
      texts = theTextCollection.getChecked();
      theTextCollection.treeDiv.remove();
    } else {
      texts = theTextTree.getChecked();
    }
    if (theTextEditor) {
      theTextEditor.showTextsInEditor([]);
    }
    let checked = this.#treeDiv.jstree().get_checked();
    if (checked.length) {
      // show texts in collection
      theTextTree.tree.css("display", "none");
      if (this.#collections[checked[0]].search) {
        this.#searchAndFilter(checked[0]);
      }
      let displayIDs = [];
      theTextTree.getAll().forEach((textID) => {
        if (this.#collections[checked[0]].items.includes(textID)) {
          displayIDs.push(textID);
        }
      });
      theTextCollection = new TextCollection(
        this.#$displayDiv,
        displayIDs,
        this.#collections[checked[0]].search,
      );
    } else {
      // show whole text tree
      theTextCollection = null;
      if (theTextTree) {
        theTextTree.checkSome(texts, true);
      }
      theTextTree.tree.css("display", "block");
      theTextEditor.setSearch();
    }

    ipcRenderer.invoke("mainProcess_setTextMenu", !checked.length);
  }

  /**
   * define a collection's context menu
   *
   * @param {String} nodeID
   * @returns {Object} context menu definition
   */
  #contextMenu(nodeID) {
    // we don't do a search/filter on opening the CM as this should/would also change the collection which is not what the user might expect -- the collection only changes on (re)activation of the list
    // this.#searchAndFilter(nodeID);

    let settings = theSettings.effectiveSettings();
    let compact = settings.textCollectionCompactContextMenu;
    let menuItems = {};

    // info part
    let infoPre = `<span style="font-style:italic;cursor:default">`;
    let infoPost = `</span>`;
    let items = menuItems;
    if (compact) {
      menuItems.infoMenu = {
        name: _("editorContextMenu_infoMenu"),
        icon: "fas fa-circle-info",
        items: {},
      };
      items = menuItems.infoMenu.items;
    }
    items.name = {
      isHtmlName: true,
      name:
        infoPre + Util.escapeHTML(this.#collections[nodeID].name) + infoPost,
    };
    if (this.#collections[nodeID].search) {
      items.name.icon = "fas fa-magnifying-glass";
    } else if (!compact) {
      items.name.icon = "fas fa-circle-info";
    }
    if (settings.textCollectionTreeContextMenuStats) {
      let chars = 0;
      let words = 0;
      this.#collections[nodeID].items.forEach((textID) => {
        chars += theTextTree.getText(textID).characters;
        words += theTextTree.getText(textID).words;
      });
      items.stats = {
        isHtmlName: true,
        name: `${infoPre}${_(
          "editorContextMenu_texts",
          this.#collections[nodeID].items.length,
          {
            texts: this.#collections[nodeID].items.length,
          },
        )} &ndash; ${_("editorContextMenu_words", words, {
          words: words.toLocaleString(theLanguage),
        })} &ndash; ${_("editorContextMenu_characters", chars, {
          characters: chars.toLocaleString(theLanguage),
        })}${infoPost}`,
      };
    }
    if (settings.textCollectionTreeContextMenuTime == "compactTime") {
      items.time = {
        isHtmlName: true,
        name:
          infoPre +
          this.#collections[nodeID].created.toLocalString(
            settings.dateTimeFormatShort,
          ) +
          " / " +
          this.#collections[nodeID].changed.toLocalString(
            settings.dateTimeFormatShort,
          ) +
          infoPost,
      };
    }
    if (settings.textCollectionTreeContextMenuTime == "fullTime") {
      let collection = this.#collections[nodeID];
      items.created = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_created", {
            created: collection.created.toLocalString(
              settings.dateTimeFormatShort,
            ),
            relative: collection.created.timeToNow(),
          }) +
          infoPost,
      };
      items.changed = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_changed", {
            changed: collection.changed.toLocalString(
              settings.dateTimeFormatShort,
            ),
            relative: collection.changed.timeToNow(),
          }) +
          infoPost,
      };
    }

    // action part
    if (compact) {
      menuItems.actionMenu = {
        name: _("objects_editMenu"),
        icon: "fas fa-i-cursor",
        items: {},
      };
      items = menuItems.actionMenu.items;
    } else {
      menuItems.sepEdit = "x";
    }
    items.editName = {
      name: _("textCollections_contextMenuRename"),
      callback: () => {
        this.#editName(nodeID);
      },
    };
    if (!compact) {
      items.editName.icon = "fas fa-i-cursor";
    }
    items.props = {
      name: _("textCollections_contextMenuProps"),
      callback: () => {
        this.#editProps(nodeID);
      },
    };
    if (this.#collections[nodeID].search) {
      items.recreate = {
        name: _("textCollections_contextMenuNonSearch"),
        callback: () => {
          this.#copyToNonSearch(nodeID);
        },
      };
    }
    items.delete = {
      name: _("textCollections_contextMenuDelete"),
      icon: "fa-regular fa-trash-can",
      callback: () => {
        this.#nodeDelete(nodeID);
      },
    };

    return { items: menuItems };
  }

  /**
   * delete a collection
   *
   * @param {String} id
   */
  #nodeDelete(id) {
    ipcRenderer
      .invoke("mainProcess_yesNoDialog", [
        _("textCollections_deleteTitle"),
        _("textCollections_deleteMessage", {
          name: this.#collections[id].name,
        }),
        false,
      ])
      .then((result) => {
        if (result == 1) {
          if (this.#collections[id].inDB) {
            this.#deletedIDs.push(id);
          }
          delete this.#collections[id];
          this.#treeDiv.jstree().delete_node(id);
          this.#showTexts();
        }
      });
  }

  /**
   * open a window to edit a collection's properties
   *
   * @param {String} id
   */
  #editProps(id) {
    let textPaths = [];
    let statistics = {
      texts: 0,
      textsWithObjects: 0,
      objectCharacters: 0,
      characters: 0,
      nonSpaceCharacters: 0,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      wordCounts: {},
    };

    // calculate the collection's statistics
    theTextTree.getAll().forEach((textID) => {
      if (this.#collections[id].items.includes(textID)) {
        textPaths.push(theTextTree.getPath(textID, true));
        statistics.texts++;
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
      }
    });

    ipcRenderer.invoke("mainProcess_openWindow", [
      "collection",
      theSettings.effectiveSettings().closingType,
      true,
      0,
      0,
      _("windowTitles_collectionWindow"),
      "./collectionWindow/collectionWindow.html",
      "collectionWindow_init",
      null,
      [
        theSettings.effectiveSettings(),
        this.#collections[id].serialize(),
        textPaths,
        statistics,
        Object.entries(theObjectTree.objects)
          .sort((a, b) => a[1].name.localeCompare(b[1].name))
          .map(([id, o]) => ({
            id: id,
            name: o.name,
          })),
        ...theProperties.lists,
      ],
    ]);
  }

  /**
   * edit a collection's name
   *
   * @param {String} id
   */
  #editName(id) {
    let treeNode = this.#treeDiv.jstree().get_node(id);
    this.#treeDiv
      .jstree()
      .edit(
        treeNode,
        this.#collections[id].name,
        (node, status, cancel, text) => {
          this.#collections[id].name = text;
          this.#treeDiv
            .jstree()
            .rename_node(treeNode, this.#collections[id].decoratedName());
          this.#$containerDiv.scrollLeft(0);
        },
      );
    $(".jstree-rename-input").attr({
      style: "padding-left:10px; border:2px dashed black;",
    });
    $(".jstree-rename-input").first()[0].setSelectionRange(0, 0);
  }

  /**
   * make a non search copy of a search collection
   *
   * @param {String} id
   */
  #copyToNonSearch(id) {
    // first update the search
    this.#searchAndFilter(id);
    // then create new
    let newID = uuid();
    this.#collections[newID] = new Collection(
      newID,
      _("textCollections_nonSearchCopy", {
        search: this.#collections[id].search.text,
      }),
      this.#collections[id].items,
      null,
      this.#collections[id].decoration,
    );
    // create new node below original one
    this.#treeDiv.jstree().create_node(
      null,
      {
        id: newID,
        text: this.#collections[newID].decoratedName(),
      },
      this.#treeDiv.jstree().get_node("#").children.indexOf(id) + 1,
    );
  }
}
