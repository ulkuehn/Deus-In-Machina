/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of TextTree class
 */

/**
 * @classdesc a TextTree holds information about texts that can be edited and moved around in the tree
 */
class TextTree {
  #emptyTreeOverlay; // jQuery DOM to show when jsTree is empty
  #treeCMOverlay; // jQuery DOM to show when CM on tree
  #treeDiv; // jQuery DOM holding the jsTree
  #texts; // key is id, value is styledText
  #newCounter; // current count for new texts
  #deletedIDs; // array of ids of deleted objects since last save
  #checkEvent; // flag indicating if checking events should be processed
  #dirty; // tree gets dirty iff new node, del node, move node, rename node
  #ready;
  #editMode; // flag to indicate a node is in edit mode (and thus no context menu should be opened on that node until edit is finished)

  /**
   * class constructor
   *
   * @param {JSON} data
   * @param {Number} counter
   * @param {*} texts
   */
  constructor(data = [], counter = 1, texts = {}) {
    this.#newCounter = counter;
    this.#texts = texts;
    this.#deletedIDs = [];
    this.#checkEvent = true;
    this.#dirty = false;
    this.#ready = false;
    this.#editMode = false;

    this.#emptyTreeOverlay = $("<div>")
      .attr({
        class: "empty-tree",
        style: `display:none`,
      })
      .append(
        $("<span>")
          .attr({ class: "empty-text" })
          .html(_("texts_treeDescription")),
      );
    this.#treeCMOverlay = $("<div>").attr({
      class: "tree-cm",
      style: "display:none",
    });
    this.#treeDiv = $("<div>");
    $("#TT")
      .empty()
      .append(this.#treeDiv, this.#emptyTreeOverlay, this.#treeCMOverlay);
    this.setupTree(data, true);

    // context menu definition
    $.contextMenu({
      selector: "#TT",
      autoHide: true,
      zIndex: 10,
      build: ($trigger, e) => {
        return this.#editMode || theTextCollection
          ? false
          : this.#treeContextMenu();
      },
      events: {
        show: () => this.#treeCMOverlay.css("display", "block"),
        hide: () => this.#treeCMOverlay.css("display", "none"),
      },
    });
    this.#treeDiv.contextMenu({
      selector: ".jstree-node",
      autoHide: true,
      zIndex: 10,
      build: ($trigger, e) => {
        return this.#editMode ? false : this.#itemContextMenu($trigger[0].id);
      },
    });
  }

  // getters and setters

  get newCounter() {
    return this.#newCounter;
  }

  set newCounter(v) {
    this.#newCounter = v;
  }

  get tree() {
    return this.#treeDiv;
  }

  get texts() {
    return this.#texts;
  }

  set texts(v) {
    this.#texts = Object.assign({}, v);
  }

  get deletedIDs() {
    return this.#deletedIDs;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * edit text properties
   *
   * @param {String} id
   */
  editProps(id) {
    let settings = theSettings.effectiveSettings();
    ipcRenderer.invoke("mainProcess_openWindow", [
      "text",
      settings.closingType,
      true,
      0,
      0,
      _("windowTitles_textWindow", { name: this.#texts[id].name }),
      "./textWindow/textWindow.html",
      "textWindow_init",
      null,
      [
        settings,
        theProperties.categories,
        this.#texts[id].serialize(),
        this.getPath(id, true),
        this.getCollections(id),
        theObjectTree.getCheckInfo(),
        this.#texts[id].objectReferences(),
      ],
    ]);
  }

  /**
   * (re)decorate tree nodes (e.g. after category changes)
   */
  decorateTree() {
    if (this.#texts) {
      Object.keys(this.#texts).forEach((id) => {
        this.#treeDiv.jstree().rename_node(id, this.#texts[id].decoratedName());
      });
    }
  }

  /**
   * setup the tree and style it wrt current settings
   *
   * @param {JSON} data items to populate the tree with
   * @param {Boolean} doUndirty
   */
  setupTree(data = null, doUndirty = false) {
    this.#ready = false;
    let settings = theSettings.effectiveSettings();
    $("#TT").css({
      "--foreground-color": Util.blackOrWhite(
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      "--display-leaf-empty-text":
        settings.textTreeEmptyIcon == "settingsWindow_never"
          ? "none"
          : "inline",
      "--display-nonleaf-empty-text":
        settings.textTreeEmptyIcon == "settingsWindow_always"
          ? "inline"
          : "none",
    });

    if ($.jstree.reference(this.#treeDiv)) {
      if (!data) {
        data = this.#treeDiv.jstree().get_json();
      }
      this.#treeDiv.jstree().destroy();
    }
    let plugins = ["dnd", "checkbox"];
    if (settings.textTreeWholerow) {
      plugins.push("wholerow");
    }

    this.#treeDiv.jstree({
      core: {
        check_callback: function (
          operation,
          node,
          node_parent,
          node_position,
          more,
        ) {
          // avoid movements between trees
          if (more && more.dnd && more.is_multi) {
            return false;
          }
          return true;
        },
        dblclick_toggle: false,
        themes: {
          name: "dim",
          variant: settings.textTreeSmall ? "small" : "large",
          icons: false,
          dots: settings.textTreeDots,
        },
        data: data,
      },
      checkbox: {
        whole_node: false,
        three_state: false,
        tie_selection: false,
      },
      plugins: plugins,
    });

    this.#emptyTreeOverlay.css(
      "display",
      !data || !data.length ? "flex" : "none",
    );

    this.#treeDiv.on("create_node.jstree delete_node.jstree", () => {
      if (this.#treeDiv.jstree().get_node("#").children.length)
        this.#emptyTreeOverlay.css("display", "none");
      else this.#emptyTreeOverlay.css("display", "flex");
      this.#dirty = true;
    });

    this.#treeDiv.on(
      "check_node.jstree uncheck_node.jstree check_all.jstree uncheck_all.jstree",
      (event, data) => {
        this.#ready && (this.#dirty = true);
        if (this.#checkEvent) {
          theTextEditor.showTextsInEditor(
            this.#orderNodesDepthFirst(data.selected),
          );
        }
      },
    );

    // move by drag and drop (either single node or - with shift - whole branch)
    this.#treeDiv.on("move_node.jstree", (event, data) => {
      this.#dirty = true;
      if (this.#checkEvent) {
        if (!theShiftKey) {
          theShiftKey = true; // set to avoid running into this while we are programatically moving nodes
          let node = this.#treeDiv.jstree().get_node(data.node.id);
          // reversing the children order enables to insert at the same old_position, as they are pushed in last to first
          // we need a copy of the children array, as move_node changes the node's children
          [...node.children].reverse().forEach((id) => {
            this.#treeDiv
              .jstree()
              .move_node(
                this.#treeDiv.jstree().get_node(id),
                this.#treeDiv.jstree().get_node(data.old_parent),
                data.old_position,
              );
          });
        }
        theTextEditor.showTextsInEditor(this.getChecked());
      }
    });

    // copy by drag and drop (either single node or - with shift - whole branch)
    this.#treeDiv.on("copy_node.jstree", (event, data) => {
      this.#dirty = true;
      this.#checkEvent = false;
      let node = this.#treeDiv.jstree().get_node(data.node.id);
      let originalNode = this.#treeDiv.jstree().get_node(data.original.id);
      let id = uuid();

      this.#treeDiv.jstree().set_id(node, id);
      this.#texts[id] = new StyledText(
        id,
        _("texts_textCopy", { name: this.#texts[originalNode.id].name }),
        this.#texts[originalNode.id].delta,
        this.#texts[originalNode.id].characters,
        this.#texts[originalNode.id].words,
        undefined,
        this.#texts[originalNode.id].editable,
        Object.assign({}, this.#texts[originalNode.id].decoration),
        this.#texts[originalNode.id].status,
        this.#texts[originalNode.id].type,
        this.#texts[originalNode.id].userValue,
      );
      this.#treeDiv.jstree().rename_node(node, this.#texts[id].decoratedName());
      if (this.#treeDiv.jstree().is_checked(data.original.id)) {
        this.#treeDiv.jstree().check_node(data.node.id);
      }

      if (theShiftKey) {
        this.#copyChildren(node, originalNode);
      } else {
        node.children.forEach((id) => {
          this.#treeDiv.jstree().delete_node(id);
        });
      }
      theTextEditor.showTextsInEditor(this.getChecked());
      this.#checkEvent = true;
    });

    this.#treeDiv.on("click.jstree", this.#click.bind(this));
    this.#treeDiv.on("dblclick.jstree", this.#dblClick.bind(this));

    this.#treeDiv.on("ready.jstree", () => {
      theObjectTree.buildObjectSheet();
      theTextEditor = new TextEditor(theLayout.zoomValue);
      theTextEditor.showTextsInEditor(this.getChecked());

      if (this.#texts) {
        Object.keys(this.#texts).forEach((id) => {
          this.#treeDiv
            .jstree()
            .rename_node(id, this.#texts[id].decoratedName());
        });
      }
      if (theSettings.effectiveSettings().textTreeDots) {
        this.#treeDiv.jstree().show_dots();
      }
      doUndirty && this.undirty();
      this.#ready = true;
    });

    // color the tree
    let clickedStyle = {};
    if (settings.textTreeWholerow) {
      if (!settings.textTreeSelectionBorder) {
        clickedStyle.color = Util.blackOrWhite(settings.textTreeSelectionColor);
      }
    } else {
      if (settings.textTreeSelectionBorder) {
        clickedStyle.background = "unset";
        clickedStyle["box-shadow"] = `inset 0 0 8px ${
          settings.textTreeSmall ? 0 : 3
        }px ${settings.textTreeSelectionColor}`;
        clickedStyle["padding-right"] = "12px";
      } else {
        clickedStyle.background = settings.textTreeSelectionColor;
        clickedStyle.color = Util.blackOrWhite(settings.textTreeSelectionColor);
      }
    }
    let hoveredStyle = {
      color: Util.blackOrWhite(settings.textTreeHoverColor),
    };
    if (settings.textTreeWholerow) {
      hoveredStyle.background = "unset";
    } else {
      hoveredStyle.background = settings.textTreeHoverColor;
    }

    let clickedStyleRow = {};
    if (settings.textTreeSelectionBorder) {
      clickedStyleRow.background = "unset";
      clickedStyleRow["box-shadow"] = `inset 0 0 8px ${
        settings.textTreeSmall ? 0 : 3
      }px ${settings.textTreeSelectionColor}`;
      clickedStyleRow["padding-right"] = "12px";
    } else {
      clickedStyleRow.background = settings.textTreeSelectionColor;
      clickedStyleRow.color = Util.blackOrWhite(
        settings.textTreeSelectionColor,
      );
    }
    let hoveredStyleRow = {
      color: Util.blackOrWhite(settings.textTreeHoverColor),
      background: settings.textTreeHoverColor,
    };

    $("#textTreeSheet").html(
      `#TT .jstree-anchor, #TT .jstree-anchor:link, #TT .jstree-anchor:visited, #TT .jstree-anchor:hover, #TT .jstree-anchor:active { color:${Util.blackOrWhite(
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      )} }
          #TT .jstree-dim .jstree-clicked { ${Object.keys(clickedStyle)
            .map((k) => `${k}:${clickedStyle[k]}`)
            .join("; ")} }
          #TT .jstree-dim .jstree-hovered { ${Object.keys(hoveredStyle)
            .map((k) => `${k}:${hoveredStyle[k]}`)
            .join("; ")} }
          #TT .jstree-dim .jstree-wholerow-clicked { ${Object.keys(
            clickedStyleRow,
          )
            .map((k) => `${k}:${clickedStyleRow[k]}`)
            .join("; ")} }
          #TT .jstree-dim .jstree-wholerow-hovered { ${Object.keys(
            hoveredStyleRow,
          )
            .map((k) => `${k}:${hoveredStyleRow[k]}`)
            .join("; ")} }
          `,
    );
  }

  /**
   * change content of text with given id
   *
   * @param {String} id
   * @param {Object[]} delta
   * @param {Number} changed timestamp of change
   * @returns {Promise} using a promise to make sure text is fully updated before possibly using it
   */
  changeText(id, delta, changed) {
    return new Promise((resolve, reject) => {
      // @TODO is this not too much overhead? instead of creating a new StyledText we could just change the existing one
      this.#texts[id] = new StyledText(
        id,
        this.#texts[id].name,
        delta,
        undefined, // updated by calcSimpleStatistics()
        undefined, // updated by calcSimpleStatistics()
        undefined, // updated by calcObjectLength()
        this.#texts[id].editable,
        this.#texts[id].decoration,
        this.#texts[id].status,
        this.#texts[id].type,
        this.#texts[id].userValue,
        this.#texts[id].created.epochSeconds,
        changed,
        true,
        this.#texts[id].inDB,
      );
      this.#texts[id].calcSimpleStatistics();
      this.#texts[id].calcObjectLength();
      // possibly change empty indication
      this.updateName(id);
      resolve("changed");
    });
  }

  /**
   * get a JSON representation of the tree
   *
   * @returns {String}
   */
  toJSON() {
    return JSON.stringify(this.#treeDiv.jstree().get_json());
  }

  /**
   * get the ids of all texts
   *
   * @returns {String[]}
   */
  textIDs() {
    return Object.keys(this.#texts);
  }

  /**
   * get text with given id
   *
   * @param {String} id
   * @returns {StyledText}
   */
  getText(id) {
    return this.#texts[id];
  }

  /**
   * set text with given id
   *
   * @param {String} id
   * @param {StyledText} text
   */
  setText(id, text) {
    this.#texts[id] = text;
  }

  /**
   * clear the list of deleted ids
   */
  clearDeleted() {
    this.#deletedIDs = [];
  }

  /**
   * get the names of all text collections the text with given id is a member of
   *
   * @param {String} id
   * @returns {String[]}
   */
  getCollections(id) {
    let collections = [];
    if (theTextCollectionTree) {
      theTextCollectionTree.regularCollections.forEach((collection) => {
        if (collection.hasItem(id)) {
          collections.push(collection.name);
        }
      });
    }
    return collections;
  }

  /**
   * get a text's level in the tree (level 1 meaning top level texts)
   *
   * @param {String} id
   * @returns {Number}
   */
  getLevel(id) {
    let level = 0;
    let node = this.#treeDiv.jstree().get_node(id);
    // traverse the hierarchy upwards towards root
    while (node.id != "#" && node.parent) {
      level++;
      node = this.#treeDiv.jstree().get_node(node.parent);
    }
    return level;
  }

  /**
   * get the list of all parents of a node with given id
   *
   * @param {String} id
   * @returns {String[]}
   */
  getParents(id) {
    let node = this.#treeDiv.jstree().get_node(id);
    let parents = [];
    // traverse the hierarchy upwards towards root
    while (node.id != "#" && node.parent) {
      parents.unshift(this.#texts[node.id].name);
      node = this.#treeDiv.jstree().get_node(node.parent);
    }
    return parents;
  }

  /**
   * get a html string that shows the hierarchy upward form a node with given id
   *
   * @param {String} id
   * @param {Boolean} leafFirst if true lowest element is leftmose, highest is rightmost
   * @returns {String}
   */
  getPath(id, leafFirst = false) {
    if (leafFirst) {
      let path = "";
      this.getParents(id)
        .slice(0, -1)
        .reverse()
        .forEach((p) => {
          path += `${Util.escapeHTML(
            p,
          )} <i class="fa-solid fa-arrow-left-long"></i> `;
        });
      return (
        `${Util.escapeHTML(
          this.#texts[id].name,
        )} <span style="opacity:0.5"><i class="fa-solid fa-arrow-left-long"></i> ` +
        path +
        "</span>"
      );
    } else {
      let path = `<span style="opacity:0.5">`;
      this.getParents(id)
        .slice(0, -1)
        .forEach((p) => {
          path += `<i class="fa-solid fa-arrow-right-long"></i> ${Util.escapeHTML(
            p,
          )} `;
        });
      return (
        path +
        `<i class="fa-solid fa-arrow-right-long"></i></span> ${Util.escapeHTML(
          this.#texts[id].name,
        )}`
      );
    }
  }

  /**
   * change name of text (or just its decoration if name==null)
   *
   * @param {String} id
   * @param {String} name
   */
  updateName(id, name = null) {
    if (name) {
      this.#texts[id].name = name;
      if (this.#treeDiv.jstree().is_checked(id)) {
        theObjectReference = new ObjectReference();
      }
    }
    this.#treeDiv.jstree().rename_node(id, this.#texts[id].decoratedName());
  }

  /**
   * remove quill attributes with given ids from all texts in the tree
   * @TODO possible improvement: to speed things up move this processing to a) when a text is loaded in the editor, b) project saving
   *
   * @param {String[]} ids
   * @param {Boolean} format if true remove "format" attributes, else "object" attributes
   */
  removeAttributes(ids, format) {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
    let attrs = {};
    ids.forEach((id) => {
      attrs[`${format ? "format" : "object"}${id}`] = null;
    });
    Object.keys(this.#texts).forEach((textID) => {
      let delta = new Delta(this.#texts[textID].delta);
      let newDelta = delta.compose(new Delta().retain(delta.length(), attrs));
      // if contents was changed, update and reload to editor
      if (delta.diff(newDelta).ops.length > 0) {
        this.changeText(textID, newDelta.ops, new Timestamp().epochSeconds);
        theTextEditor.reloadText(textID);
      }
    });
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
  }

  /**
   * retreive the id of the one single selected text
   *
   * @param {Boolean} mustSee if true object must currently be visible in the tree
   * @returns {String|null} null if no text, or more than one node is selected, or mustSee and currently not visible in tree
   */
  singleSelected(mustSee = true) {
    if (this.#treeDiv.jstree().get_selected().length == 1) {
      if (mustSee) {
        let node = this.#treeDiv.jstree().get_selected(true)[0];
        node = this.#treeDiv.jstree().get_node(node.parent);
        while (node.id != "#") {
          if (!this.#treeDiv.jstree().is_open(node)) {
            return null;
          }
          node = this.#treeDiv.jstree().get_node(node.parent);
        }
      }
      return this.#treeDiv.jstree().get_selected()[0];
    }
    return null;
  }

  /**
   * transfer a (nested) list of texts into the tree
   *
   * @param {*} texts
   * @param {*} node
   * @returns {DOMNode[]} flat list of created nodes
   */
  transferTexts(texts, node = this.singleSelected()) {
    let startNode = node;
    let nodes = [];
    texts.forEach((entry) => {
      if (entry instanceof Array) {
        nodes.push(...this.transferTexts(entry, node));
      } else {
        let text = entry.text;
        this.#texts[text[0]] = new StyledText(...text);
        node = this.#treeDiv.jstree().create_node(startNode, {
          id: text[0],
          text: this.#texts[text[0]].decoratedName(),
        });
        nodes.push(node);
      }
    });
    return nodes;
  }

  /**
   * add a text with content to the tree
   *
   * @param {String} text
   * @param {String} name
   */
  addText(text, name) {
    let id = uuid();
    this.#texts[id] = new StyledText(id, name, [{ insert: text }]);
    this.#texts[id].calcSimpleStatistics();
    this.#treeDiv.jstree().create_node(this.singleSelected(), {
      id: id,
      text: this.#texts[id].decoratedName(),
    });
    this.checkSome(id, true);
    this.selectSome(id, true);
  }

  /**
   * add a new empty text to the tree
   */
  newText() {
    if (!this.#editMode) {
      this.#editMode = true;
      let tree = this.#treeDiv.jstree();
      let id = uuid();
      this.#texts[id] = new StyledText(
        id,
        _("texts_newText", { count: this.#newCounter }),
      );
      this.#newCounter++;

      tree.create_node(this.singleSelected(), {
        id: id,
        text: this.#texts[id].decoratedName(),
      });

      tree.edit(id, this.#texts[id].name, (n, s, c) => {
        this.#editMode = false;
        this.#texts[id].name = tree.get_text(id);
        tree.rename_node(id, this.#texts[id].decoratedName());
        tree.check_node(id);
        tree.deselect_all();
        tree.select_node(id);
        setTimeout(() => theTextEditor.blinkText(id), 250);
      });
    }
  }

  /**
   * delete (single) selected text
   */
  deleteText() {
    if (
      this.#treeDiv.jstree().get_selected() != null &&
      this.#treeDiv.jstree().get_selected().length == 1
    ) {
      this.#nodeDelete(this.#treeDiv.jstree().get_selected(true)[0]);
    }
  }

  /**
   * delete (single) selected branch
   */
  deleteBranch() {
    if (
      this.#treeDiv.jstree().get_selected() != null &&
      this.#treeDiv.jstree().get_selected().length == 1
    ) {
      this.#branchDelete(this.#treeDiv.jstree().get_selected(true)[0]);
    }
  }

  /**
   * returns true if id is in tree and is checked
   *
   * @param {String} id
   * @returns {Boolean}
   */
  isChecked(id) {
    return this.#treeDiv.jstree().is_checked(id);
  }

  /**
   * get ids of all nodes in sequential order with checked info
   *
   * @returns {Object[]} array of {id:{String}, name:{String}, check:{Boolean}}
   */
  getCheckInfo() {
    return this.#allNodesDepthFirst().map((id) => {
      return {
        id: id,
        name: this.#texts[id].name,
        checked: this.#treeDiv.jstree().is_checked(id),
      };
    });
  }

  /**
   * get the ids of all checked texts in sequential order
   *
   * @returns {String[]}
   */
  getChecked() {
    return this.#orderNodesDepthFirst(this.#treeDiv.jstree().get_checked());
  }

  /**
   * get the ids of all selected texts in sequential order
   *
   * @returns {String[]}
   */
  getSelected() {
    return this.#orderNodesDepthFirst(this.#treeDiv.jstree().get_selected());
  }

  /**
   * return the ids of all nodes in sequential order
   *
   * @returns {String[]}
   */
  getAll() {
    return this.#allNodesDepthFirst();
  }

  /**
   * check and open all tree nodes
   */
  checkAll() {
    this.#treeDiv.jstree().check_all();
    this.#treeDiv.jstree().open_all();
  }

  /**
   * uncheck all tree nodes
   */
  uncheckAll() {
    this.#treeDiv.jstree().uncheck_all();
  }

  /**
   * select nodes with given ids
   *
   * @param {String|String[]} ids
   * @param {Boolean} onlySome if true select only the specified ids and unselect all others
   */
  selectSome(ids, onlySome = false) {
    if (onlySome) {
      this.#treeDiv.jstree().deselect_all();
    }
    this.#treeDiv.jstree().select_node(ids);
    let scrollTo = ids;
    if (ids instanceof Array) {
      scrollTo = ids[0];
    }
    // scrollIntoViewIfNeeded non standard, but perfect here and better than scrollIntoView
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
    $(`#TT #${scrollTo}_anchor`)[0].scrollIntoViewIfNeeded(true);
    $("#TT").scrollLeft(0);
  }

  /**
   * check the nodes with given id(s)
   *
   * @param {String[]} ids
   * @param {Boolean} onlySome if true check exactly given ids, uncheck all others
   */
  checkSome(ids, onlySome = false) {
    this.#checkEvent = false;
    if (onlySome) {
      this.#treeDiv.jstree().uncheck_all();
    }
    this.#checkEvent = true;
    this.#treeDiv.jstree().check_node(ids);
  }

  /**
   * uncheck the nodes with given id(s)
   *
   * @param {String[]} ids
   */
  uncheckSome(ids) {
    this.#treeDiv.jstree().uncheck_node(ids);
  }

  /**
   * check all nodes in selected branches
   */
  checkBranch() {
    this.#checkEvent = false;
    this.#treeDiv
      .jstree()
      .get_selected(true)
      .forEach((node) => {
        this.#treeDiv.jstree().check_node(node);
        this.#treeDiv.jstree().check_node(node.children_d);
        this.#treeDiv.jstree().open_all(node);
      });
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * uncheck all nodes in selected branches
   */
  uncheckBranch() {
    this.#checkEvent = false;
    this.#treeDiv
      .jstree()
      .get_selected(true)
      .forEach((node) => {
        this.#treeDiv.jstree().uncheck_node(node);
        this.#treeDiv.jstree().uncheck_node(node.children_d);
      });
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * invert the current checking state
   */
  invertCheck() {
    this.#checkEvent = false;
    let checked = this.#treeDiv.jstree().get_checked(true);
    this.#treeDiv.jstree().check_all();
    checked.forEach((node) => {
      this.#treeDiv.jstree().uncheck_node(node);
    });
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * check all texts that are connected with the currently checked objects
   */
  checkCheckedObjects() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    let checked = theObjectTree.getChecked();
    if (checked.length > 0) {
      this.#allNodesDepthFirst().forEach((textID) => {
        let objects = this.#texts[textID].objects;
        if (Object.keys(objects).length > 0) {
          for (let i = 0; i < checked.length; i++) {
            if (checked[i] in objects) {
              this.#treeDiv.jstree().check_node(textID);
              break;
            }
          }
        }
      });
    }
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * check all texts that are connected with any object
   */
  checkHasObjects() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    this.#allNodesDepthFirst().forEach((textID) => {
      if (Object.keys(this.#texts[textID].objects).length > 0) {
        this.#treeDiv.jstree().check_node(textID);
      }
    });
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * check if there are items and branches in the tree
   */
  #treeHasItems() {
    let items = false;
    let branches = false;
    if (this.#treeDiv && this.#treeDiv.jstree()) {
      let root = this.#treeDiv.jstree().get_node("#");
      if (root)
        for (let i = 0; i < root.children.length; i++) {
          items = true;
          if (this.#treeDiv.jstree().get_node(root.children[i]).children.length)
            branches = true;
        }
    }
    return [items, branches];
  }

  /**
   * open all tree branches recursively
   */
  expandAll() {
    this.#treeDiv.jstree().open_all();
  }

  /**
   * close all tree branches recursively
   */
  collapseAll() {
    this.#treeDiv.jstree().close_all();
  }

  /**
   * open selected tree branches recursively
   */
  expandBranch() {
    this.#treeDiv
      .jstree()
      .get_selected(true)
      .forEach((node) => {
        this.#treeDiv.jstree().open_all(node);
      });
  }

  /**
   * close selected tree branches recursively
   */
  collapseBranch() {
    this.#treeDiv
      .jstree()
      .get_selected(true)
      .forEach((node) => {
        this.#treeDiv.jstree().close_all(node);
      });
  }

  /**
   * split a text
   *
   * @param {String} editorID
   * @param {Object[]} delta1
   * @param {Object[]} delta2
   */
  splitText(editorID, delta1, delta2) {
    let node = this.#treeDiv.jstree().get_node(editorID);
    if (node) {
      let parentNode = this.#treeDiv.jstree().get_node(node.parent);
      let nodePosition = parentNode.children.indexOf(editorID);
      let id = uuid();
      this.#texts[id] = new StyledText(
        id,
        this.#texts[editorID].name,
        delta1,
        undefined,
        undefined,
        undefined,
        this.#texts[editorID].editable,
        this.#texts[editorID].decoration,
        this.#texts[editorID].status,
        this.#texts[editorID].type,
        this.#texts[editorID].userValue,
      );
      this.#texts[id].calcSimpleStatistics();
      this.#texts[id].calcObjectLength();

      this.#texts[editorID].delta = delta2;
      this.#texts[editorID].calcSimpleStatistics();
      this.#texts[editorID].calcObjectLength();
      this.#texts[editorID].name += " '";
      this.#treeDiv
        .jstree()
        .rename_node(
          this.#treeDiv.jstree().get_node(editorID),
          this.#texts[editorID].decoratedName(),
        );
      theTextEditor.reloadText(editorID);
      this.#treeDiv.jstree().create_node(
        parentNode,
        {
          id: id,
          text: this.#texts[id].decoratedName(),
        },
        nodePosition,
      );
      this.#treeDiv.jstree().deselect_all();
      this.#treeDiv.jstree().select_node(editorID);
      this.#treeDiv.jstree().select_node(id);
      this.#treeDiv.jstree().check_node(id);
      theTextEditor.showTextsInEditor(this.getChecked());
    }
  }

  /**
   * merge selected texts into one
   *
   * @param {Boolean} newline if true insert newline between text chunks
   */
  mergeTexts(newline = false) {
    let texts = this.getSelected();
    if (texts.length > 1) {
      let delta = new Delta(this.#texts[texts[texts.length - 1]].delta);
      for (let i = texts.length - 2; i >= 0; i--) {
        delta = delta.compose(
          newline
            ? new Delta(this.#texts[texts[i]].delta).insert("\n")
            : new Delta(this.#texts[texts[i]].delta),
        );
      }
      this.#texts[texts[0]].delta = delta.ops;
      this.#texts[texts[0]].name = texts
        .map((text) => this.#texts[text].name)
        .join(" + ");
      this.#treeDiv
        .jstree()
        .rename_node(
          this.#treeDiv.jstree().get_node(texts[0]),
          this.#texts[texts[0]].decoratedName(),
        );
      theTextEditor.reloadText(texts[0]);

      this.#checkEvent = false;
      for (let i = 1; i < texts.length; i++) {
        if (this.#texts[texts[i]].inDB) {
          this.#deletedIDs.push(texts[i]);
        }
        delete this.#texts[texts[i]];
        let selected = this.#treeDiv.jstree().get_node(texts[i]);
        selected.children.forEach((c) => {
          let child = this.#treeDiv.jstree().get_node(c);
          this.#treeDiv.jstree().move_node(child, selected, "before");
        });
        this.#treeDiv.jstree().delete_node(selected);
      }
      theTextCollectionTree.deleteTexts(texts.splice(1));
      theTextEditor.showTextsInEditor(this.getChecked());
      this.#checkEvent = true;
    }
  }

  // private methods

  /**
   * get ids of given node plus all its decendants
   *
   * @param {String[]} ids list of node ids (as from select_node event)
   * @param {DOMNode} node if null start from tree top
   * @returns {String[]} ordered list according to sequential order (depth first)
   */
  #orderNodesDepthFirst(ids, node = null) {
    let ordered = [];
    if (node == null) {
      node = this.#treeDiv.jstree().get_node("#");
    }
    node.children.forEach((childID) => {
      if (ids.includes(childID)) {
        ordered.push(childID);
      }
      ordered.push(
        ...this.#orderNodesDepthFirst(
          ids,
          this.#treeDiv.jstree().get_node(childID),
        ),
      );
    });
    return ordered;
  }

  /**
   * get ids of all nodes
   *
   * @param {String} parentID
   * @returns {String[]} list of node ids in sequential order (depth first)
   */
  #allNodesDepthFirst(parentID = "#") {
    let ordered = [];
    let parentNode = this.#treeDiv.jstree().get_node(parentID);
    parentNode.children.forEach((childID) => {
      ordered.push(childID, ...this.#allNodesDepthFirst(childID));
    });
    return ordered;
  }

  /**
   * recursively copy a branch
   *
   * @param {DOMNode} node
   * @param {DOmNode} originalNode
   */
  #copyChildren(node, originalNode) {
    for (let i = 0; i < node.children.length; i++) {
      let child = this.#treeDiv.jstree().get_node(node.children[i]);
      let originalChild = this.#treeDiv
        .jstree()
        .get_node(originalNode.children[i]);
      let id = uuid();

      this.#treeDiv.jstree().set_id(child, id);
      this.#texts[id] = new StyledText(
        child.id,
        _("texts_textCopy", { name: this.#texts[originalChild.id].name }),
        this.#texts[originalChild.id].delta,
        this.#texts[originalChild.id].characters,
        this.#texts[originalChild.id].words,
        undefined,
        this.#texts[originalChild.id].editable,
        this.#texts[originalChild.id].decoration,
        this.#texts[originalChild.id].status,
        this.#texts[originalChild.id].type,
        this.#texts[originalChild.id].userValue,
      );
      this.#treeDiv
        .jstree()
        .rename_node(child, this.#texts[id].decoratedName());
      if (this.#treeDiv.jstree().is_checked(originalNode.children[i])) {
        this.#treeDiv.jstree().check_node(node.children[i]);
      }
      this.#copyChildren(child, originalChild);
    }
  }

  /**
   * delete selected node
   *
   * @param {DOMNode} selected
   */
  #nodeDelete(node) {
    ipcRenderer
      .invoke("mainProcess_yesNoDialog", [
        _("texts_deleteTitle"),
        _("texts_deleteMessage", { name: this.#texts[node.id].name }),
        false,
      ])
      .then((result) => {
        if (result == 1) {
          this.#checkEvent = false;
          if (this.#texts[node.id].inDB) {
            this.#deletedIDs.push(node.id);
          }
          if (this.#texts[node.id].objects)
            Object.keys(this.#texts[node.id].objects).forEach((objectID) => {
              delete theObjectTree.getObject(objectID).texts[node.id]
              theObjectTree.updateName(objectID,null)
            });
          delete this.#texts[node.id];

          let children = [...node.children];
          children.forEach((c) => {
            let child = this.#treeDiv.jstree().get_node(c);
            this.#treeDiv.jstree().move_node(child, node, "before");
          });
          this.#treeDiv.jstree().delete_node(node);
          theTextCollectionTree.deleteTexts(node.id);
          theTextEditor.showTextsInEditor(this.getChecked());
          this.#checkEvent = true;
        }
      });
  }

  /**
   * delete branch
   *
   * @param {DOMNode} node
   */
  #branchDelete(node) {
    if (node.children.length == 0) {
      this.#nodeDelete(node);
    } else {
      ipcRenderer
        .invoke("mainProcess_yesNoDialog", [
          _("texts_deleteBranchTitle"),
          _("texts_deleteBranchMessage", { name: this.#texts[node.id].name }),
          false,
        ])
        .then((result) => {
          if (result == 1) {
            this.#checkEvent = false;
            if (this.#texts[node.id].inDB) {
              this.#deletedIDs.push(node.id);
            }
            delete this.#texts[node.id];
            node.children_d.forEach((id) => {
              if (this.#texts[id].inDB) {
                this.#deletedIDs.push(id);
              }
              delete this.#texts[id];
            });
            theTextCollectionTree.deleteTexts([node.id, ...node.children_d]);
            this.#treeDiv.jstree().delete_node(node);
            theTextEditor.showTextsInEditor(this.getChecked());
            this.#checkEvent = true;
          }
        });
    }
  }

  /**
   * process a click on the tree
   *
   * @param {Event} event
   */
  #click(event) {
    // only scroll and blink if this is not a checkbox click and text is already checked
    if (
      event.target.nodeName != "I" &&
      !event.ctrlKey &&
      this.#treeDiv.jstree().is_selected(event.target) &&
      this.#treeDiv.jstree().is_checked(event.target)
    ) {
      theTextEditor.blinkText(this.#treeDiv.jstree().get_node(event.target).id);
    }
  }

  /**
   * double click action: edit text properties
   *
   * @param {*} event
   */
  #dblClick(event) {
    if (!this.#editMode)
      this.editProps(this.#treeDiv.jstree().get_node(event.target).id);
  }

  /**
   * inline edit name of a tree node
   *
   * @param {String} id
   */
  #editName(id) {
    this.#editMode = true;
    let node = this.#treeDiv.jstree().get_node(id);
    this.#treeDiv
      .jstree()
      .edit(node, this.#texts[id].name, (nde, status, cancel, txt) => {
        this.#editMode = false;
        this.#texts[id].name = txt;
        this.#treeDiv.jstree().set_text(node, this.#texts[id].decoratedName());
        // possibly reflect name change in status bar
        if (theTextEditor.selectedEditor) {
          theTextEditor.setStatusBar(theTextEditor.selectedEditor);
        }
        // possibly reflect name change in object reference
        if (this.#treeDiv.jstree().is_checked(id)) {
          theObjectReference = new ObjectReference();
        }
        $("#TT").scrollLeft(0);
      });
    $(".jstree-rename-input").attr({
      style: "padding-left:10px; border:2px dashed black;",
      spellcheck: false,
    });
    $(".jstree-rename-input").first()[0].setSelectionRange(0, 0);
  }

  #treeContextMenu() {
    let items = {
      new: {
        name: _("textMenu_newText"),
        icon: "fa-regular fa-star-of-life",
        callback: () => this.newText(),
      },
    };
    let [hasItems, hasBranches] = this.#treeHasItems();
    if (hasBranches) {
      items.sep1 = "x";
      items.expand = {
        name: _("textMenu_expandAll"),
        icon: "fa-regular fa-square-plus",
        callback: () => this.expandAll(),
      };
      items.collapse = {
        name: _("textMenu_collapseAll"),
        callback: () => this.collapseAll(),
      };
    }
    if (hasItems) {
      items.sep2 = "x";
      items.check = {
        name: _("textMenu_checkAll"),
        icon: "fa-regular fa-check-double",
        callback: () => this.checkAll(),
      };
      items.uncheck = {
        name: _("textMenu_uncheckAll"),
        callback: () => this.uncheckAll(),
      };
      items.sep3 = "x";
      items.search = {
        name: _("textMenu_search"),
        icon: "fa-regular fa-magnifying-glass",
        callback: () => {
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
        },
      };
    }
    return { items: items };
  }

  /**
   * define a node's context menu
   *
   * @param {String} nodeID
   * @returns {Object}
   */
  #itemContextMenu(nodeID) {
    let node = this.#treeDiv.jstree().get_node(nodeID);
    let menuItems = {};
    let settings = theSettings.effectiveSettings();
    let compact = settings.textTreeCompactContextMenu;

    // info part
    let infoPre = `<span style="font-style:italic;cursor:default">`;
    let infoPost = `</span>`;
    let items = menuItems;
    if (compact) {
      menuItems.infoMenu = {
        name: _("texts_contextMenuInfoMenu"),
        icon: "fas fa-circle-info",
        items: {},
      };
      items = menuItems.infoMenu.items;
    }
    items.name = {
      isHtmlName: true,
      name: infoPre + Util.escapeHTML(this.#texts[node.id].name) + infoPost,
    };
    if (!compact) {
      items.name.icon = "fas fa-circle-info";
    }
    if (settings.textTreeContextMenuStats) {
      items.stats = {
        isHtmlName: true,
        name: `${infoPre}${_(
          "editorContextMenu_words",
          this.#texts[node.id].words,
          {
            words: this.#texts[node.id].words.toLocaleString(theLanguage),
          },
        )} &ndash; ${_(
          "editorContextMenu_characters",
          this.#texts[node.id].characters,
          {
            characters:
              this.#texts[node.id].characters.toLocaleString(theLanguage),
          },
        )} &ndash; ${_(
          "editorContextMenu_objects",
          this.#texts[node.id].objectCount,
          {
            objects:
              this.#texts[node.id].objectCount.toLocaleString(theLanguage),
          },
        )}${infoPost}`,
      };
      if (
        settings.textTreeContextMenuBranchStats &&
        this.#treeDiv.jstree().is_parent(nodeID)
      ) {
        let chars = this.#texts[node.id].characters;
        let words = this.#texts[node.id].words;
        let objs = this.#texts[node.id].objects;
        this.#allNodesDepthFirst(nodeID).forEach((id) => {
          chars += this.#texts[id].characters;
          words += this.#texts[id].words;
          Object.assign(objs, this.#texts[id].objects);
        });
        items.branchStats = {
          isHtmlName: true,
          name: `${infoPre}${_("editorContextMenu_words", words, {
            words: words.toLocaleString(theLanguage),
          })} &ndash; ${_("editorContextMenu_characters", chars, {
            characters: chars.toLocaleString(theLanguage),
          })} &ndash; ${_(
            "editorContextMenu_objects",
            Object.keys(objs).length,
            {
              objects: Object.keys(objs).length.toLocaleString(theLanguage),
            },
          )}${infoPost}`,
        };
      }
    }

    if (settings.textTreeContextMenuTime == "compactTime") {
      items.time = {
        isHtmlName: true,
        name:
          infoPre +
          this.#texts[node.id].created.toLocalString(
            settings.dateTimeFormatShort,
          ) +
          " / " +
          this.#texts[node.id].changed.toLocalString(
            settings.dateTimeFormatShort,
          ) +
          infoPost,
      };
    }
    if (settings.textTreeContextMenuTime == "fullTime") {
      let text = this.#texts[node.id];
      items.created = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_created", {
            created: text.created.toLocalString(settings.dateTimeFormatShort),
            relative: text.created.timeToNow(),
          }) +
          infoPost,
      };
      items.changed = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_changed", {
            changed: text.changed.toLocalString(settings.dateTimeFormatShort),
            relative: text.changed.timeToNow(),
          }) +
          infoPost,
      };
    }

    // edit meta data part
    if (compact) {
      menuItems.editMenu = {
        name: _("texts_contextMenuEditMenu"),
        icon: "fas fa-i-cursor",
        items: {},
      };
      items = menuItems.editMenu.items;
    } else {
      items.sepEdit = "x";
    }
    items.editName = {
      name: _("texts_contextMenuRename"),
      callback: () => {
        this.#editName(nodeID);
      },
    };
    if (!compact) {
      items.editName.icon = "fas fa-i-cursor";
    }
    items.deriveName = {
      name: _("texts_contextMenuDeriveName"),
      callback: () => {
        // use at most one para
        let name = this.#texts[node.id].text.split("\n")[0];
        // use at most number of words of resp. setting value
        name =
          name
            .split(/\s+/)
            .filter((x) => x.length)
            .slice(0, settings.textTreeNameWords)
            .join(" ") + settings.textTreeAppendName;
        this.#texts[node.id].name = name;
        this.#treeDiv
          .jstree()
          .rename_node(node, this.#texts[node.id].decoratedName());
      },
    };
    items.props = {
      name: _("texts_contextMenuProps"),
      callback: () => {
        this.editProps(nodeID);
      },
    };
    items.lock = {
      name: this.#texts[node.id].editable
        ? _("texts_contextMenuLock")
        : _("texts_contextMenuUnlock"),
      icon: this.#texts[node.id].editable ? "fas fa-lock" : "fas fa-lock-open",
      callback: () => {
        this.#texts[node.id].editable = !this.#texts[node.id].editable;
        theTextEditor.setEditable(node.id);
        this.#treeDiv
          .jstree()
          .rename_node(node, this.#texts[node.id].decoratedName());
      },
    };
    let collections = theTextCollectionTree.regularCollections;
    if (collections && collections.length) {
      let addItems = {};
      let removeItems = {
        _: {
          name: _("texts_contextMenuRemoveAllCollections"),
          icon: "fas fa-triangle-exclamation",
          callback: () => {
            ipcRenderer
              .invoke("mainProcess_yesNoDialog", [
                _("texts_clearCollectionsTitle"),
                _("texts_clearCollectionsMessage", {
                  name: this.#texts[node.id].name,
                }),
                false,
              ])
              .then((result) => {
                if (result == 1) {
                  theTextCollectionTree.regularCollections.forEach(
                    (collection) => {
                      collection.removeItem(node.id);
                      theTextCollectionTree.updateName(collection.id);
                    },
                  );
                }
              });
          },
        },
      };
      collections.forEach((collection) => {
        if (collection.hasItem(node.id)) {
          removeItems[collection.id] = {
            name: collection.name,
            callback: () => {
              collection.removeItem(node.id);
              theTextCollectionTree.updateName(collection.id);
            },
          };
        } else {
          addItems[collection.id] = {
            name: collection.name,
            callback: () => {
              collection.addItem(node.id);
              theTextCollectionTree.updateName(collection.id);
            },
          };
        }
      });
      if (Object.keys(addItems).length) {
        items.addCollections = {
          name: _("texts_contextMenuAddCollection"),
          icon: "fas fa-list",
          items: addItems,
        };
      }
      if (Object.keys(removeItems).length <= 2) {
        delete removeItems._;
      }
      if (Object.keys(removeItems).length) {
        items.removeCollections = {
          name: _("texts_contextMenuRemoveCollection"),
          items: removeItems,
        };
      }
    }

    // edit and scroll part
    if (this.#treeDiv.jstree().is_checked(node)) {
      if (compact) {
        menuItems.scrollMenu = {
          name: _("texts_contextMenuScrollMenu"),
          icon: "fas fa-arrow-right-to-bracket",
          items: {},
        };
        items = menuItems.scrollMenu.items;
      } else {
        items.sepScroll = "x";
      }
      if (this.#texts[node.id].editable) {
        items.focus = {
          name: _("texts_contextMenuFocusEditor"),
          callback: () => {
            ipcRenderer.invoke("mainProcess_distractionFreeMode", [
              settings,
              theLayout.zoomValue,
              [
                {
                  id: node.id,
                  created: this.#texts[node.id].created.epochSeconds,
                  changed: this.#texts[node.id].changed.epochSeconds,
                  name: this.#texts[node.id].name,
                  editable: true,
                  delta: this.#texts[node.id].delta,
                },
              ],
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
          },
        };
        if (!compact) {
          items.focus.icon = "fas fa-arrow-up-right-from-square";
        }
      }
      items.scrollStart = {
        name: _("texts_contextMenuScrollBegin"),
        callback: () => {
          theTextEditor.showText(node.id, true);
        },
      };
      if (!compact) {
        items.scrollStart.icon = "fas fa-arrow-right-to-bracket";
      }
      items.scrollEnd = {
        name: _("texts_contextMenuScrollEnd"),
        callback: () => {
          theTextEditor.showText(node.id, false);
        },
      };
      if (this.#texts[node.id].editable) {
        items.selectText = {
          name: _("texts_contextMenuSelectAll"),
          callback: () => {
            theTextEditor.selectText(node.id);
          },
        };
      }
    }

    // objects part
    if (this.#texts[node.id].objectCount) {
      if (compact) {
        menuItems.objectMenu = {
          name: _("texts_contextMenuObjectMenu"),
          icon: "fas fa-link",
          items: {},
        };
        items = menuItems.objectMenu.items;
      } else {
        items.sepObjects = "x";
      }
      items.objectsPlus = {
        name: _("texts_contextMenuActivateObjects"),
        callback: () => {
          theObjectTree.checkSome(Object.keys(this.#texts[node.id].objects));
        },
      };
      if (!compact) {
        items.objectsPlus.icon = "fas fa-link";
      }
      items.objectsMinus = {
        name: _("texts_contextMenuDeactivateObjects"),
        callback: () => {
          theObjectTree.uncheckSome(Object.keys(this.#texts[node.id].objects));
        },
      };
      items.objectsSet = {
        name: _("texts_contextMenuActivateTextObjects"),
        callback: () => {
          theObjectTree.uncheckAll();
          theObjectTree.checkSome(Object.keys(this.#texts[node.id].objects));
        },
      };
    }

    // insert part
    if (compact) {
      menuItems.insertMenu = {
        name: _("texts_contextMenuInsertMenu"),
        icon: "fa-regular fa-file-lines",
        items: {},
      };
      items = menuItems.insertMenu.items;
    } else {
      items.sepInsert = "x";
    }
    items.insertBefore = {
      name: _("texts_contextMenuInsertBefore"),
      callback: () => {
        this.#textInsert(node, false);
      },
    };
    if (!compact) {
      items.insertBefore.icon = "fa-regular fa-file-lines";
    }
    items.insertAfter = {
      name: _("texts_contextMenuInsertAfter"),
      callback: () => {
        this.#textInsert(node, true);
      },
    };

    // delete part
    if (compact) {
      menuItems.deleteMenu = {
        name: _("texts_contextMenuDeleteMenu"),
        icon: "fa-regular fa-trash-can",
        items: {},
      };
      items = menuItems.deleteMenu.items;
    } else {
      items.sepDelete = "x";
    }
    items.delete = {
      name: _("texts_contextMenuDeleteText"),
      callback: () => {
        this.#nodeDelete(node);
      },
    };
    if (!compact) {
      items.delete.icon = "fa-regular fa-trash-can";
    }
    if (node.children.length > 0) {
      items.deleteBranch = {
        name: _("texts_contextMenuDeleteBranch"),
        callback: () => {
          this.#branchDelete(node);
        },
      };
    }

    // branch part (expand, collapse, de/activate)
    if (node.children.length > 0) {
      if (compact) {
        menuItems.branchMenu = {
          name: _("texts_contextMenuBranchMenu"),
          icon: "fa-regular fa-square-plus",
          items: {},
        };
        items = menuItems.branchMenu.items;
      } else {
        items.sepBranch = "x";
      }
      items.expand = {
        name: _("texts_contextMenuExpandBranch"),
        callback: () => {
          this.#treeDiv.jstree().open_all(node);
        },
      };
      if (!compact) {
        items.expand.icon = "fa-regular fa-square-plus";
      }
      items.collapse = {
        name: _("texts_contextMenuCollapseBranch"),
        callback: () => {
          this.#treeDiv.jstree().close_all(node);
        },
      };
      items.activate = {
        name: _("texts_contextMenuActivateBranch"),
        callback: () => {
          this.#checkEvent = false;
          this.#treeDiv.jstree().check_node(node);
          this.#treeDiv.jstree().check_node(node.children_d);
          this.#treeDiv.jstree().open_all(node);
          theTextEditor.showTextsInEditor(this.getChecked());
          this.#checkEvent = true;
        },
      };
      // activate non empty texts (only if at least one non empty texts is in branch)
      let nonEmpty = false;
      [node.id, ...node.children_d].map(
        (id) => this.#texts[id].characters && (nonEmpty = true),
      );
      if (nonEmpty)
        items.activateNonEmpty = {
          name: _("texts_contextMenuActivateBranchNonEmpty"),
          callback: () => {
            this.#checkEvent = false;
            [node.id, ...node.children_d].forEach((id) => {
              if (this.#texts[id].characters)
                this.#treeDiv.jstree().check_node(id);
              else this.#treeDiv.jstree().uncheck_node(id);
            });
            this.#treeDiv.jstree().open_all(node);
            theTextEditor.showTextsInEditor(this.getChecked());
            this.#checkEvent = true;
          },
        };
      items.deactivate = {
        name: _("texts_contextMenuDeactivateBranch"),
        callback: () => {
          this.#checkEvent = false;
          this.#treeDiv.jstree().uncheck_node(node);
          this.#treeDiv.jstree().uncheck_node(node.children_d);
          theTextEditor.showTextsInEditor(this.getChecked());
          this.#checkEvent = true;
        },
      };
    }

    return { items: menuItems };
  }

  /**
   * insert a new text relative to a node
   *
   * @param {DOMNode} node
   * @param {Boolean} below if true insert below given node, else above
   */
  #textInsert(node, below) {
    this.#editMode = true;
    let tree = this.#treeDiv.jstree();
    let parentNode = tree.get_node(node.parent);
    let nodePosition = parentNode.children.indexOf(node.id) + (below ? 1 : 0);
    let id = uuid();
    this.#texts[id] = new StyledText(
      id,
      _("texts_newText", { count: this.#newCounter }),
    );
    this.#newCounter += 1;
    tree.create_node(
      parentNode,
      {
        id: id,
        text: this.#texts[id].decoratedName(),
      },
      nodePosition,
    );
    tree.edit(id, this.#texts[id].name, (node, status, cancelled) => {
      this.#editMode = false;
      this.#texts[id].name = tree.get_text(id);
      tree.rename_node(id, this.#texts[id].decoratedName());
      tree.check_node(id);
      tree.deselect_all();
      tree.select_node(id);
      setTimeout(() => theTextEditor.blinkText(id), 250);
    });
  }
}
