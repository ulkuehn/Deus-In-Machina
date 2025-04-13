/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of ObjectTree class
 */

/**
 * @classdesc an ObjectTree holds information about (world) obects that text passages can be connected with
 */

class ObjectTree {
  #treeDiv; // jQuery DOM holding the jsTree
  #newCounter; // counter for naming new objects
  #objects; // key is id, value is styledObject
  #deletedIDs; // array of ids of deleted objects since last save
  #checkEvent;
  #dirty;
  #ready;
  #activateSingle;
  #saveSelected;
  #dragTimer;
  #editMode;

  /**
   * class constructor
   *
   * @param {JSON} data
   * @param {Number} counter
   * @param {*} objects
   */
  constructor(data = [], counter = 1, objects = {}) {
    this.#newCounter = counter;
    this.#objects = objects;
    this.#deletedIDs = [];
    this.#dirty = false;
    this.#ready = false;
    this.#checkEvent = true;
    this.#activateSingle = false;
    this.#editMode = false;

    this.#treeDiv = $("<div>");
    $("#OT").empty().append(this.#treeDiv);
    this.setupTree(data, true);

    this.#treeDiv.contextMenu({
      selector: ".jstree-node",
      autoHide: true,
      build: ($trigger, e) => {
        return this.#editMode ? false : this.#contextMenu($trigger[0].id, e);
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

  get objects() {
    return this.#objects;
  }

  set objects(v = {}) {
    this.#objects = Object.assign({}, v);
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
   * switch single activtion mode on/off
   *
   * @param {Boolean} single if true at most one tree item can be checked at any time
   */
  setSingleActivation(single) {
    this.#activateSingle = single;
    if (single) {
      this.#treeDiv.jstree().uncheck_all();
    }
  }

  /**
   * edit object properties
   *
   * @param {String} id
   */
  editProps(id) {
    let settings = theSettings.effectiveSettings();
    ipcRenderer.invoke("mainProcess_openWindow", [
      "object",
      settings.closingType,
      true,
      0,
      0,
      _("windowTitles_objectWindow", { name: this.#objects[id].name }),
      "./objectWindow/objectWindow.html",
      "objectWindow_init",
      null,
      [
        settings,
        this.#objects[id].serialize(),
        this.getParents(id, false)
          .slice(0, -1)
          .map((id) => this.#objects[id].serialize()),
        this.getNonSiblings(id, false),
        this.getPath(id, true),
        this.#orderedObjects(),
        theTextTree.getCheckInfo(),
        this.#objects[id].textReferences(),
        theFormats.formats,
        theFonts.availableFamilies,
        theFiles,
      ],
    ]);
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

    $("#OT").css({
      "--foreground-color": Util.blackOrWhite(
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      "--display-leaf-empty-object":
        settings.objectTreeEmptyIcon == "settingsWindow_never"
          ? "none"
          : "inline",
      "--display-nonleaf-empty-object":
        settings.objectTreeEmptyIcon == "settingsWindow_always"
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
    if (settings.objectTreeWholerow) {
      plugins.push("wholerow");
    }

    this.#treeDiv.jstree({
      core: {
        check_callback: (operation, node, node_parent, node_position, more) => {
          // avoid movements between trees
          if (more && more.dnd && more.is_multi) {
            return false;
          }
          return true;
        },
        dblclick_toggle: false,
        themes: {
          name: "dim",
          variant: settings.objectTreeSmall ? "small" : "large",
          icons: false,
          dots: settings.objectTreeDots,
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

    // on dragging text from editor to object tree select the items to drop on
    this.#treeDiv.off("dragover").on("dragover", (event) => {
      event.originalEvent.dataTransfer.dropEffect = "link";
      let nodeID = $(event.target).closest(".jstree-node").attr("id");
      if (nodeID) {
        if (!this.#saveSelected) {
          this.#saveSelected = this.#treeDiv.jstree().get_selected();
        }
        this.#treeDiv.jstree().deselect_all();
        this.#treeDiv.jstree().select_node(nodeID);
        this.#treeDiv.jstree().open_node(nodeID);
        clearTimeout(this.#dragTimer);
        this.#dragTimer = setTimeout(() => {
          this.#treeDiv.jstree().deselect_all();
          this.#treeDiv.jstree().select_node(this.#saveSelected);
          this.#saveSelected = null;
        }, 250);
      }
      event.preventDefault();
    });

    // on dropping text from editor, format editor selection with the object dropped to
    this.#treeDiv.off("drop").on("drop", (event) => {
      let nodeID = $(event.target).closest(".jstree-node").attr("id");
      if (nodeID) {
        theTextEditor.editors[theTextEditor.selectedEditor].quill.format(
          `object${nodeID}`,
          true,
        );
      }
    });

    if (data && data.length == 0) {
      this.#objects = {};
      this.#newCounter = 1;
      let id = uuid();
      let styleProps = {};
      if (settings.objectTreeNewObjectItalic) {
        styleProps.formats_italic = true;
      }
      if (settings.objectTreeNewObjectUnderline) {
        styleProps.formats_underline = true;
      }
      if (settings.objectTreeNewObjectColor) {
        styleProps.formats_textColor = settings.objectTreeNewObjectColor;
      }
      this.#objects[id] = new StyledObject(
        id,
        _("objects_newObject", { count: this.#newCounter }),
        {},
        { text: styleProps, image: {} },
      );
      // we deliver the initial object undirty, as the unchanged initial tree should not be (auto)saved
      this.#objects[id].undirty();
      this.#newCounter++;

      this.#treeDiv.one("create_node.jstree", () => {
        // wait some before setting the tree undirty to make creating complete
        setTimeout(() => {
          this.undirty();
        }, 250);
      });
      this.#treeDiv.jstree().create_node(null, {
        id: id,
        text: this.#objects[id].decoratedName(),
      });
    }

    // creating nodes makes the tree dirty
    this.#treeDiv.on("create_node.jstree delete_node.jstree", () => {
      this.#dirty = true;
    });

    this.#treeDiv.on(
      "check_node.jstree uncheck_node.jstree check_all.jstree uncheck_all.jstree",
      (event, data) => {
        this.#ready && (this.#dirty = true);
        if (this.#checkEvent) {
          // implement single check
          if (event.type == "check_node" && this.#activateSingle) {
            this.#checkEvent = false;
            this.#treeDiv.jstree().uncheck_all();
            this.#treeDiv.jstree().check_node(data.node.id);
            this.#checkEvent = true;
          }
          // in case of multicheck last checked item is used to override other styles
          this.buildObjectSheet(
            event.type == "check_node" ? data.node.id : undefined,
          );
          theObjectReference = new ObjectReference();
        }
      },
    );

    // move by drag and drop (either single node or - with shift - whole branch)
    this.#treeDiv.on("move_node.jstree", (event, data) => {
      let movingNodes = [data.node.id];
      if (theShiftKey) {
        movingNodes = [data.node.id, ...data.node.children_d];
      }
      // when moving object tree nodes me must get rid of properties from former parents to keep the objects clean
      let propertyNodes = [
        data.node.id,
        data.parent,
        ...this.#treeDiv.jstree().get_node(data.parent).parents,
      ];
      movingNodes.forEach((objectID) => {
        let props = this.#objects[objectID].properties;
        Object.keys(props).forEach((id) => {
          if (!propertyNodes.includes(id)) {
            delete props[id];
          }
        });
        propertyNodes.push(objectID);
      });

      this.#dirty = true;
      if (!theShiftKey) {
        theShiftKey = true; // set this to avoid running into this while we are programatically moving nodes
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
      this.buildObjectSheet();
    });

    // copy by drag and drop (either single node or - with shift - whole branch)
    this.#treeDiv.on("copy_node.jstree", (event, data) => {
      this.#dirty = true;
      let originalNode = this.#treeDiv.jstree().get_node(data.original.id);
      let node = this.#treeDiv.jstree().get_node(data.node.id);
      let newID = uuid();
      this.#treeDiv.jstree().set_id(node, newID);
      this.#objects[newID] = this.#cloneObject(node, originalNode);
      this.#treeDiv
        .jstree()
        .rename_node(node, this.#objects[newID].decoratedName());

      if (theShiftKey) {
        this.#copyChildren(node, originalNode, {
          ...Object.fromEntries(node.parents.map((x) => [x, x])),
          [originalNode.id]: node.id,
        });
      } else {
        node.children.forEach((id) => {
          this.#treeDiv.jstree().delete_node(id);
        });
      }
    });

    this.#treeDiv.on("dblclick.jstree", this.#dblClick.bind(this));

    this.#treeDiv.on("ready.jstree", () => {
      if (this.#objects) {
        Object.keys(this.#objects).forEach((id) => {
          this.#treeDiv
            .jstree()
            .rename_node(id, this.#objects[id].decoratedName());
        });
      }
      if (settings.textTreeDots) {
        this.#treeDiv.jstree().show_dots();
      }
      doUndirty && this.undirty();
      this.#ready = true;
    });

    // color the tree
    let clickedStyle = {};
    if (settings.objectTreeWholerow) {
      if (!settings.objectTreeSelectionBorder) {
        clickedStyle.color = Util.blackOrWhite(
          settings.objectTreeSelectionColor,
        );
      }
    } else {
      if (settings.objectTreeSelectionBorder) {
        clickedStyle.background = "unset";
        clickedStyle["box-shadow"] = `inset 0 0 8px ${
          settings.objectTreeSmall ? 0 : 3
        }px ${settings.objectTreeSelectionColor}`;
        clickedStyle["padding-right"] = "12px";
      } else {
        clickedStyle.background = settings.objectTreeSelectionColor;
        clickedStyle.color = Util.blackOrWhite(
          settings.objectTreeSelectionColor,
        );
      }
    }
    let hoveredStyle = {
      color: Util.blackOrWhite(settings.objectTreeHoverColor),
    };
    if (settings.objectTreeWholerow) {
      hoveredStyle.background = "unset";
    } else {
      hoveredStyle.background = settings.objectTreeHoverColor;
    }

    let clickedStyleRow = {};
    if (settings.objectTreeSelectionBorder) {
      clickedStyleRow.background = "unset";
      clickedStyleRow["box-shadow"] = `inset 0 0 8px ${
        settings.objectTreeSmall ? 0 : 3
      }px ${settings.objectTreeSelectionColor}`;
      clickedStyleRow["padding-right"] = "12px";
    } else {
      clickedStyleRow.background = settings.objectTreeSelectionColor;
      clickedStyleRow.color = Util.blackOrWhite(
        settings.objectTreeSelectionColor,
      );
    }
    let hoveredStyleRow = {
      color: Util.blackOrWhite(settings.objectTreeHoverColor),
      background: settings.objectTreeHoverColor,
    };

    $("#objectTreeSheet").html(
      `#OT .jstree-anchor, #OT .jstree-anchor:link, #OT .jstree-anchor:visited, #OT .jstree-anchor:hover, #OT .jstree-anchor:active { color:${Util.blackOrWhite(
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      )} }
      #OT .jstree-dim .jstree-clicked { ${Object.keys(clickedStyle)
        .map((k) => `${k}:${clickedStyle[k]}`)
        .join("; ")} }
      #OT .jstree-dim .jstree-hovered { ${Object.keys(hoveredStyle)
        .map((k) => `${k}:${hoveredStyle[k]}`)
        .join("; ")} }
      #OT .jstree-dim .jstree-wholerow-clicked { ${Object.keys(clickedStyleRow)
        .map((k) => `${k}:${clickedStyleRow[k]}`)
        .join("; ")} }
      #OT .jstree-dim .jstree-wholerow-hovered { ${Object.keys(hoveredStyleRow)
        .map((k) => `${k}:${hoveredStyleRow[k]}`)
        .join("; ")} }
      `,
    );
  }

  /**
   * change name of object (or just its decoration if name==null)
   *
   * @param {String} id
   * @param {String} name
   */
  updateName(id, name = null) {
    if (name) {
      this.#objects[id].name = name;
      // we need to update theObjectReference if the object is checked
      if (this.#treeDiv.jstree().is_checked(id)) {
        theObjectReference = new ObjectReference();
      }
    }
    this.#treeDiv.jstree().rename_node(id, this.#objects[id].decoratedName());
  }

  /**
   * remove quill format attributes with given ids from all editors in all objects in the tree (called when a format is deleted)
   *
   * @param {String[]} ids
   */
  removeFormatAttributes(ids) {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
    let attrs = {};
    ids.forEach((id) => {
      attrs["format" + id] = null;
    });
    Object.keys(this.#objects).forEach((objectID) => {
      let changed = false;
      Object.keys(this.#objects[objectID].properties).forEach((oID) => {
        Object.keys(this.#objects[objectID].properties[oID]).forEach((pID) => {
          if (
            typeof this.#objects[objectID].properties[oID][pID] == "object" &&
            "ops" in this.#objects[objectID].properties[oID][pID]
          ) {
            let delta = new Delta(
              this.#objects[objectID].properties[oID][pID].ops,
            );
            let newDelta = delta.compose(
              new Delta().retain(delta.length(), attrs),
            );
            // if contents was changed, update and reload to editor
            if (delta.diff(newDelta).ops.length > 0) {
              this.#objects[objectID].properties[oID][pID].ops = newDelta.ops;
              changed = true;
            }
          }
        });
      });
      if (changed) {
        // this does an update on the object, including its timestamp
        this.#objects[objectID].properties = this.#objects[objectID].properties;
      }
    });
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
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
   * get all object ids
   *
   * @returns {String[]}
   */
  objectIDs() {
    return Object.keys(this.#objects);
  }

  /**
   * get object with given id
   *
   * @param {String} id
   * @returns {StyledObject}
   */
  getObject(id) {
    return this.#objects[id];
  }

  /**
   * set object with given id
   *
   * @param {String} id
   * @param {StyledObject} object
   */
  setObject(id, object) {
    this.#objects[id] = object;
  }

  /**
   * clear the list of deleted ids
   */
  clearDeleted() {
    this.#deletedIDs = [];
  }

  /**
   * get all children of a node with given id
   *
   * @param {String} id
   * @param {Boolean} names if true return children by name, else by id
   * @returns {Object} children structure as {id:[{id:[...]},{id:[...]},...]}
   */
  getChildren(id, names = true) {
    let node = this.#treeDiv.jstree().get_node(id);
    let children = [];
    node.children.forEach((child) => {
      children.push(this.getChildren(child, names));
    });
    return { [names ? this.#objects[id].name : id]: children };
  }

  /**
   * get partial branch including all parents and all children of an object (but not siblings)
   *
   * @param {String} id
   * @param {Boolean} names
   * @returns {Object} structure as {id:[{id:[...]},{id:[...]},...]}
   */
  getNonSiblings(id, names = true) {
    let result = this.getChildren(id, names);
    this.getParents(id, names)
      .slice(0, -1)
      .reverse()
      .forEach((pID) => {
        result = { [pID]: [result] };
      });
    return result;
  }

  /**
   * get the list of all parents of a node with given id (including the given id)
   *
   * @param {String} id
   * @param {Boolean} names if true return parents by name, else by id
   * @returns {String[]} flat list of names or ids
   */
  getParents(id, names = true) {
    let node = this.#treeDiv.jstree().get_node(id);
    let parents = [];
    // traverse the hierarchy upwards towards root
    while (node.id != "#") {
      parents.unshift(names ? this.#objects[node.id].name : node.id);
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
          this.#objects[id].name,
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
          this.#objects[id].name,
        )}`
      );
    }
  }

  /**
   * collect property information of an object
   *
   * @param {String} id object id
   * @param {StyledObject} currentObject StyledObject being edited in objectWindow in its current (yet) unsaved state
   * @returns {Object[]} array of properties {type,name,content} html escaped and i18n'd
   */
  propertyInformation(id, currentObject, files) {
    let result = new Scheme(
      theSettings.effectiveSettings(),
      id,
      (id == currentObject.id ? currentObject : this.#objects[id]).properties,
      this.getParents(id, false)
        .slice(0, -1)
        .map((o) => ({
          id: o,
          name: (o == currentObject.id ? currentObject : this.#objects[o]).name,
          scheme: (o == currentObject.id ? currentObject : this.#objects[o])
            .scheme,
        })),
      (id == currentObject.id ? currentObject : this.#objects[id]).scheme,
      [],
      {},
      files,
    ).directProperties(
      Object.fromEntries(
        Object.keys(this.#objects).map((o) => [o, this.#objects[o].name]),
      ),
    );

    // reverse relations -- we are doing this for each object anew which is not very smart
    Object.keys(this.#objects).forEach((oID) => {
      result.push(
        ...new Scheme(
          theSettings.effectiveSettings(),
          oID,
          (oID == currentObject.id
            ? currentObject
            : this.#objects[oID]
          ).properties,
          this.getParents(oID, false)
            .slice(0, -1)
            .map((o) => ({
              id: o,
              name: (o == currentObject.id ? currentObject : this.#objects[o])
                .name,
              scheme: (o == currentObject.id ? currentObject : this.#objects[o])
                .scheme,
            })),
          (oID == currentObject.id ? currentObject : this.#objects[oID]).scheme,
        ).reverseProperties(
          id,
          (oID == currentObject.id ? currentObject : this.#objects[oID]).name,
        ),
      );
    });

    return result;
  }

  reverseRelations(id) {
    let result = [];
    Object.keys(this.#objects).forEach((oID) => {
      result.push(
        ...new Scheme(
          theSettings.effectiveSettings(),
          oID,
          this.#objects[oID].properties,
          this.getParents(oID, false)
            .slice(0, -1)
            .map((o) => ({
              id: o,
              name: this.#objects[o].name,
              scheme: this.#objects[o].scheme,
            })),
          this.#objects[oID].scheme,
        ).reverseProperties(id, oID),
      );
    });
    return result;
  }

  /**
   * add a new object to the tree
   */
  newObject() {
    if (!this.#editMode) {
      this.#editMode = true;
      let tree = this.#treeDiv.jstree();
      let settings = theSettings.effectiveSettings();
      let id = uuid();
      let styleProps = {};
      if (settings.objectTreeNewObjectItalic) {
        styleProps.formats_italic = true;
      }
      if (settings.objectTreeNewObjectUnderline) {
        styleProps.formats_underline = true;
      }
      if (settings.objectTreeNewObjectColor) {
        styleProps.formats_textColor = settings.objectTreeNewObjectColor;
      }
      this.#objects[id] = new StyledObject(
        id,
        _("objects_newObject", { count: this.#newCounter }),
        {},
        { text: styleProps, image: {} },
      );
      this.#newCounter++;
      tree.create_node(this.singleSelected(), {
        id: id,
        text: this.#objects[id].decoratedName(),
      });

      tree.edit(id, this.#objects[id].name, () => {
        this.#editMode = false;
        this.#objects[id].name = tree.get_text(id);
        tree.rename_node(id, this.#objects[id].decoratedName());
        tree.check_node(id);
        tree.deselect_all();
        tree.select_node(id);
      });
    }
  }

  /**
   * transfer a (nested) list ob objects into the tree
   *
   * @param {*} objects
   * @param {DOMNode} node
   * @returns {DOMNode[]} list of created nodes
   */
  transferObjects(objects, node = this.singleSelected()) {
    let startNode = node;
    let nodes = [];
    objects.forEach((entry) => {
      if (entry instanceof Array) {
        nodes.push(...this.transferObjects(entry, node));
      } else {
        let object = entry.object;
        this.#objects[object[0]] = new StyledObject(...object);
        node = this.#treeDiv.jstree().create_node(startNode, {
          id: object[0],
          text: this.#objects[object[0]].decoratedName(),
        });
        nodes.push(node);
      }
    });
    return nodes;
  }

  /**
   * retreive the id of the one single selected object
   *
   * @param {Boolean} mustSee if true object must currently be visible in the tree
   * @returns {String|null} null if no object, or more than one node is selected, or mustSee and currently not visible in tree
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
    // possible improvement: scroll to middle of screen for large trees
    // scrollIntoViewIfNeeded non standard, but perfect here and better than scrollIntoView
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
    $(`#OT #${scrollTo}_anchor`)[0].scrollIntoViewIfNeeded(true);
    $("#OT").scrollLeft(0);
  }

  /**
   * delete single object, moving children one level up
   */
  deleteObject() {
    if (
      this.#treeDiv.jstree().get_selected() != null &&
      this.#treeDiv.jstree().get_selected().length == 1
    ) {
      this.#nodeDelete(this.#treeDiv.jstree().get_selected(true)[0]);
    }
  }

  /**
   * delete whole branch
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
   * retrieve the effective style of an object with given id
   *
   * @param {String} id
   * @returns {Object}
   */
  objectStyle(id) {
    let node = this.#treeDiv.jstree().get_node(id);
    let parents = [];
    // traverse the hierarchy upwards towards root
    while (node && node.id != "#") {
      this.#objects[node.id] && parents.unshift(this.#objects[node.id]);
      node = this.#treeDiv.jstree().get_node(node.parent);
    }
    let effectiveStyle = StylingControls.nullStyle();
    parents.map((p) => effectiveStyle.addStyleProperties(p));
    return effectiveStyle;
  }

  /**
   * (re)build style sheet information to highlight checked objects in the editor pane
   * @TODO should this be a task of TextEditor class?
   *
   * @param {String} checkedId
   * @param {Number} zoom
   * @param {Boolean} objectStyles
   * @param {Number} opacity
   */
  buildObjectSheet(
    checkedId = null,
    zoom = theLayout ? Util.scaledZoom(theLayout.zoomValue) : 100,
    objectStyles = theTextEditor ? theTextEditor.objectStyles : true,
    opacity = theTextEditor ? theTextEditor.opacity : 50,
  ) {
    let settings = theSettings.effectiveSettings();
    let html = "";
    if (objectStyles) {
      theFormats.buildFormatSheet(1.0, zoom);
      // filter out last checked id
      let checked = this.getChecked().filter((id) => id != checkedId);
      // put last checked id as last element in array so its formats dominates the others
      if (checkedId) {
        checked.push(checkedId);
      }
      checked.forEach((id) => {
        html += `.object${id}-true { ${this.objectStyle(id).toCSS(
          "text",
          false,
          zoom,
        )} }\n`;
        html += `.object${id}-true img { ${this.objectStyle(id).toCSS(
          "image",
        )} }\n`;
        if (settings.selectionObjectColor && settings.selectionCheckedObjects) {
          html += `.object${id}-true::selection, .object${id}-true img::selection { background:${settings.selectionObjectColor}; color: ${Util.blackOrWhite(settings.selectionObjectColor)} }\n`;
        }
      });
    } else {
      theFormats.buildFormatSheet(opacity / 100, zoom);
      this.getChecked().forEach((objectID) => {
        html += `.object${objectID}-true { --alpha:1; color:rgba(var(--rgb),var(--alpha)); }\n`;
        html += `span.object${objectID}-true img { opacity:1.0 }\n`;
        if (
          settings.selectionObjectColor &&
          settings.selectionUnstyledObjects &&
          settings.selectionCheckedObjects
        ) {
          html += `.object${objectID}-true::selection, .object${objectID}-true img::selection { background:${settings.selectionObjectColor}; color: ${Util.blackOrWhite(settings.selectionObjectColor)} }\n`;
        }
      });
    }
    if (
      settings.selectionObjectColor &&
      (objectStyles || settings.selectionUnstyledObjects) &&
      !settings.selectionCheckedObjects
    ) {
      html += `span[class^=object]::selection, span[class^=object] img::selection { background:${settings.selectionObjectColor}; color: ${Util.blackOrWhite(settings.selectionObjectColor)} }\n`;
    }
    $("#objectSheet").html(html);
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
        name: this.#objects[id].name,
        checked: this.#treeDiv.jstree().is_checked(id),
      };
    });
  }

  /**
   * get the ids of all checked objects in sequential order
   *
   * @returns {String[]}
   */
  getChecked() {
    return this.#orderNodesDepthFirst(this.#treeDiv.jstree().get_checked());
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
   * get the ids of all objects in sequential order
   * @returns {String[]}
   */
  getObjects() {
    return this.#orderNodesDepthFirst(Object.keys(this.#objects));
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
   * check the nodes with given id(s)
   *
   * @param {String[]} ids
   */
  checkSome(ids) {
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
    // as we inhibited regular check events we have to rebuild explicitely
    this.buildObjectSheet();
    theObjectReference = new ObjectReference();
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
    // as we inhibited regular check events we have to rebuild explicitely
    this.buildObjectSheet();
    theObjectReference = new ObjectReference();
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
    // as we inhibited regular check events we have to rebuild explicitely
    this.buildObjectSheet();
    theObjectReference = new ObjectReference();
    this.#checkEvent = true;
  }

  /**
   * check exactly those objects that are linked to the currently checked texts
   */
  checkCheckedTexts() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    let checked = theTextTree.getChecked();
    if (checked.length > 0) {
      this.#allNodesDepthFirst().forEach((objectID) => {
        let texts = this.#objects[objectID].texts;
        if (Object.keys(texts).length > 0) {
          for (let i = 0; i < checked.length; i++) {
            if (checked[i] in texts) {
              this.#treeDiv.jstree().check_node(objectID);
              break;
            }
          }
        }
      });
    }
    // as we inhibited regular check events we have to rebuild explicitely
    this.buildObjectSheet();
    theObjectReference = new ObjectReference();
    this.#checkEvent = true;
  }

  /**
   * check exactly those objects that are linked to any text
   */
  checkHasTexts() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    this.#allNodesDepthFirst().forEach((objectID) => {
      if (Object.keys(this.#objects[objectID].texts).length > 0) {
        this.#treeDiv.jstree().check_node(objectID);
      }
    });
    // as we inhibited regular check events we have to rebuild explicitely
    this.buildObjectSheet();
    theObjectReference = new ObjectReference();
    this.#checkEvent = true;
  }

  // private methods

  /**
   * double click action: edit object properties
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
      .edit(node, this.#objects[id].name, (nde, status, cancel, txt) => {
        this.#editMode = false;
        this.#objects[id].name = txt;
        this.#treeDiv
          .jstree()
          .rename_node(node, this.#objects[id].decoratedName());
        $("#OT").scrollLeft(0);
        if (this.#treeDiv.jstree().is_checked(id)) {
          theObjectReference = new ObjectReference();
        }
      });
    $(".jstree-rename-input").attr({
      style: "padding-left:10px; border:2px dashed black;",
      spellcheck: false,
    });
    $(".jstree-rename-input").first()[0].setSelectionRange(0, 0);
  }

  /**
   * check properties of other objects if a relation to this object must be removed
   *
   * @param {String} id id of the object to remove
   */
  #removeID(id) {
    Object.values(this.#objects).forEach((object) => {
      Object.keys(object.properties).forEach((oid) => {
        Object.keys(object.properties[oid]).forEach((no) => {
          if (object.properties[oid][no] == id) {
            delete object.properties[oid][no];
          }
        });
        if (!Object.keys(object.properties[oid]).length) {
          delete object.properties[oid];
        }
      });
    });
  }

  /**
   * delete selected node
   *
   * @param {DOMNode} selected
   */
  #nodeDelete(selected) {
    ipcRenderer
      .invoke("mainProcess_yesNoDialog", [
        _("objects_deleteTitle"),
        _("objects_deleteMessage", {
          name: this.#objects[selected.id].name,
        }) +
          (selected.children.length && this.#objects[selected.id].scheme.length
            ? _("objects_deleteWarning")
            : ""),
        false,
      ])
      .then((result) => {
        if (result == 1) {
          if (this.#objects[selected.id].inDB) {
            this.#deletedIDs.push(selected.id);
          }
          theTextTree.removeAttributes([selected.id], false);
          delete this.#objects[selected.id];
          this.#removeID(selected.id);

          let children = [...selected.children];
          children.forEach((c) => {
            let child = this.#treeDiv.jstree().get_node(c);
            this.#treeDiv.jstree().move_node(child, selected, "before");
          });
          this.#treeDiv.jstree().delete_node(selected);
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
          _("objects_deleteBranchTitle"),
          _("objects_deleteBranchMessage", {
            name: this.#objects[node.id].name,
          }),
          false,
        ])
        .then((result) => {
          if (result == 1) {
            let removals = [];
            if (this.#objects[node.id].inDB) {
              this.#deletedIDs.push(node.id);
            }
            delete this.#objects[node.id];
            this.#removeID(node.id);

            removals.push(node.id);
            node.children_d.forEach((id) => {
              if (this.#objects[id].inDB) {
                this.#deletedIDs.push(id);
              }
              delete this.#objects[id];
              this.#removeID(id);
              removals.push(id);
            });
            this.#treeDiv.jstree().delete_node(node);
            theTextTree.removeAttributes(removals, false);
          }
        });
    }
  }

  /**
   * clone an object
   *
   * @param {DOMNode} toNode
   * @param {DOMNode} fromNode
   * @param {Object} parentsMap
   * @returns {StyledObject}
   */
  #cloneObject(
    toNode,
    fromNode,
    parentsMap = Object.fromEntries(toNode.parents.map((x) => [x, x])),
  ) {
    // the set of properties that should be cloned depends on the scheme of the cloned object, thus on its place in the tree
    let toProperties = {};
    Object.keys(this.#objects[fromNode.id].properties).forEach((id) => {
      if (id == fromNode.id) {
        // files are cloned by same id, so different objects may refer to the same file (lying in tmpDir or in the database)
        toProperties[toNode.id] = JSON.parse(
          JSON.stringify(this.#objects[fromNode.id].properties[id]),
        );
      } else if (id in parentsMap) {
        toProperties[parentsMap[id]] = JSON.parse(
          JSON.stringify(this.#objects[fromNode.id].properties[id]),
        );
      }
    });
    return new StyledObject(
      toNode.id,
      _("objects_objectCopy", { name: this.#objects[fromNode.id].name }),
      JSON.parse(JSON.stringify(this.#objects[fromNode.id].decoration)),
      JSON.parse(JSON.stringify(this.#objects[fromNode.id].styleProperties)),
      JSON.parse(JSON.stringify(this.#objects[fromNode.id].scheme)),
      toProperties,
    );
  }

  /**
   * recursively copy a branch
   *
   * @param {DOMNode} node
   * @param {DOmNode} originalNode
   * @param {Object} parentsMap
   */
  #copyChildren(node, originalNode, parentsMap) {
    for (let i = 0; i < node.children.length; i++) {
      let child = this.#treeDiv.jstree().get_node(node.children[i]);
      let originalChild = this.#treeDiv
        .jstree()
        .get_node(originalNode.children[i]);
      let newID = uuid();
      this.#treeDiv.jstree().set_id(child, newID);
      this.#objects[newID] = this.#cloneObject(child, originalChild, {
        ...parentsMap,
        [originalChild.id]: child.id,
      });
      this.#treeDiv
        .jstree()
        .rename_node(child, this.#objects[newID].decoratedName());

      this.#copyChildren(child, originalChild, {
        ...parentsMap,
        [originalChild.id]: child.id,
      });
    }
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

  #orderedObjects(depth = 0, node = null) {
    let ordered = [];
    if (node == null) {
      node = this.#treeDiv.jstree().get_node("#");
    }
    node.children.forEach((childID) => {
      ordered.push({
        id: childID,
        depth: depth,
        name: this.#objects[childID].name,
      });
      ordered.push(
        ...this.#orderedObjects(
          depth + 1,
          this.#treeDiv.jstree().get_node(childID),
        ),
      );
    });
    return ordered;
  }

  /**
   * define a node's context menu
   *
   * @param {String} nodeID
   * @param {Event} event
   * @returns {Object}
   */
  #contextMenu(nodeID, event) {
    let node = this.#treeDiv.jstree().get_node(nodeID);
    let menuItems = {};
    let settings = theSettings.effectiveSettings();
    let compact = settings.objectTreeCompactContextMenu;

    // info part
    let infoPre = `<span style="font-style:italic;cursor:default">`;
    let infoPost = `</span>`;
    let items = menuItems;
    if (compact) {
      menuItems.infoMenu = {
        name: _("objects_infoMenu"),
        icon: "fas fa-circle-info",
        items: {},
      };
      items = menuItems.infoMenu.items;
    }
    items.name = {
      isHtmlName: true,
      name: infoPre + Util.escapeHTML(this.#objects[nodeID].name) + infoPost,
    };
    if (!compact) {
      items.name.icon = "fas fa-circle-info";
    }
    if (settings.objectTreeContextMenuStats) {
      items.stats = {
        isHtmlName: true,
        name:
          infoPre +
          _("objects_connectedTexts", this.#objects[nodeID].textCount, {
            value: this.#objects[nodeID].textCount.toLocaleString(theLanguage),
          }) +
          infoPost,
      };
    }
    if (settings.objectTreeContextMenuTime == "compactTime") {
      items.time = {
        isHtmlName: true,
        name: `${infoPre}${this.#objects[nodeID].created.toLocalString(
          settings.dateTimeFormatShort,
        )} / ${this.#objects[nodeID].changed.toLocalString(
          settings.dateTimeFormatShort,
        )}${infoPost}`,
      };
    }
    if (settings.objectTreeContextMenuTime == "fullTime") {
      let object = this.#objects[nodeID];
      items.created = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_created", {
            created: object.created.toLocalString(settings.dateTimeFormatShort),
            relative: object.created.timeToNow(),
          }) +
          infoPost,
      };
      items.changed = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_changed", {
            changed: object.changed.toLocalString(settings.dateTimeFormatShort),
            relative: object.changed.timeToNow(),
          }) +
          infoPost,
      };
    }

    items.style = {
      name: _("objects_menuStyle"),
      callback: () => {
        let theNode = node;
        let parents = [];
        // traverse the hierarchy upwards towards root
        while (theNode.id != "#") {
          parents.unshift(theNode.id);
          theNode = this.#treeDiv.jstree().get_node(theNode.parent);
        }
        let effectiveStyle = StylingControls.nullStyle();
        parents.map((id) =>
          effectiveStyle.addStyleProperties(this.#objects[id]),
        );

        let $popup = $("<div>").attr({
          id: "stylepopup",
          style: `display:inline-block; background-color:#ffffff; border:double black 4px; padding:20px; position:absolute; left:0; top:0; overflow:hidden; max-height:${Math.round(
            (theWindowBounds.height * 80) / 100,
          )}px; max-width: ${Math.round((theWindowBounds.width * 80) / 100)}px`,
        });
        let textSample = settings.objectsTextSample || _("sampleTexts_medium");
        $popup.html(
          `<span style="display:block; text-align:center">${
            this.#objects[nodeID].name
          }</span><br><p style="${Formats.formatToCSS(
            theFormats.formats[UUID0],
          )}"><span style="${effectiveStyle.toCSS()}">${textSample.replace(
            /\n/g,
            "<br>",
          )}</span></p>`,
        );
        theLayout.setPreview($popup);
        // we must wait some time, so outerWidth gets calc'd correctly
        setTimeout(() => {
          let top = parseInt(
            event.originalEvent.clientY - $popup.outerHeight() / 2,
          );
          if (top + $popup.outerHeight() > $("#OT").outerHeight()) {
            top = $("#OT").outerHeight() - $popup.outerHeight();
          }
          if (top < 0) {
            top = 0;
          }
          let left = parseInt(
            $("#OT").offset().left + 30 - $popup.outerWidth(),
          );
          $popup.offset({
            top: top,
            left: left,
          });
          theLayout.showPreview();
        }, 250);
      },
      icon: "fas fa-highlighter",
    };

    // edit part
    if (compact) {
      menuItems.editMenu = {
        name: _("objects_editMenu"),
        icon: "fas fa-i-cursor",
        items: {},
      };
      items = menuItems.editMenu.items;
    } else {
      menuItems.sepEdit = "x";
    }
    items.edit = {
      name: _("objects_menuEdit"),
      callback: () => {
        this.#editName(nodeID);
      },
    };
    if (!compact) {
      items.edit.icon = "fas fa-i-cursor";
    }
    items.props = {
      name: _("objects_menuProperties"),
      callback: () => {
        this.editProps(nodeID);
      },
    };

    // texts part (check, uncheck)
    if (this.#objects[nodeID].textCount) {
      if (compact) {
        menuItems.textMenu = {
          name: _("objects_textMenu"),
          icon: "fas fa-link",
          items: {},
        };
        items = menuItems.textMenu.items;
      } else {
        menuItems.sepText = "x";
      }
      items.textsPlus = {
        name: _("objects_menuTextsPlus"),
        callback: () => {
          theTextTree.checkSome(Object.keys(this.#objects[nodeID].texts));
        },
      };
      if (!compact) {
        items.textsPlus.icon = "fas fa-link";
      }
      items.textsMinus = {
        name: _("objects_menuTextsMinus"),
        callback: () => {
          theTextTree.uncheckSome(Object.keys(this.#objects[nodeID].texts));
        },
      };
      items.textsSet = {
        name: _("objects_menuTextsSet"),
        callback: () => {
          theTextTree.uncheckAll();
          theTextTree.checkSome(Object.keys(this.#objects[nodeID].texts));
        },
      };
    }

    // insert part
    if (compact) {
      menuItems.insertMenu = {
        name: _("objects_insertMenu"),
        icon: "far fa-file-lines",
        items: {},
      };
      items = menuItems.insertMenu.items;
    } else {
      menuItems.sepInsert = "x";
    }
    items.insertBefore = {
      name: _("objects_menuInsertBefore"),
      callback: () => {
        this.#objectInsert(node, false);
      },
    };
    if (!compact) {
      items.insertBefore.icon = "far fa-file-lines";
    }
    items.insertAfter = {
      name: _("objects_menuInsertAfter"),
      callback: () => {
        this.#objectInsert(node, true);
      },
    };

    // delete part
    if (compact) {
      menuItems.deleteMenu = {
        name: _("objects_deleteMenu"),
        icon: "fa-regular fa-trash-can",
        items: {},
      };
      items = menuItems.deleteMenu.items;
    } else {
      items.sepDelete = "x";
    }
    items.delete = {
      name: _("objects_menuDelete"),
      callback: () => {
        this.#nodeDelete(node);
      },
    };
    if (!compact) {
      items.delete.icon = "fa-regular fa-trash-can";
    }
    if (node.children.length > 0) {
      items.deleteBranch = {
        name: _("objects_menuDeleteBranch"),
        callback: () => {
          this.#branchDelete(node);
        },
      };
    }

    // branch part (expand, collapse, de/activate)
    if (node.children.length > 0) {
      if (compact) {
        menuItems.branchMenu = {
          name: _("objects_branchMenu"),
          icon: "far fa-square-plus",
          items: {},
        };
        items = menuItems.branchMenu.items;
      } else {
        menuItems.sepBranch = "x";
      }
      items.expand = {
        name: _("objects_menuExpand"),
        callback: () => {
          this.#treeDiv.jstree().open_all(nodeID);
        },
      };
      if (!compact) {
        items.expand.icon = "far fa-square-plus";
      }
      items.collapse = {
        name: _("objects_menuCollapse"),
        callback: () => {
          this.#treeDiv.jstree().close_all(nodeID);
        },
      };

      items.activate = {
        name: _("objects_menuActivate"),
        callback: () => {
          this.#checkEvent = false;
          this.#treeDiv.jstree().check_node(nodeID);
          this.#treeDiv.jstree().check_node(node.children_d);
          this.#treeDiv.jstree().open_all(nodeID);
          this.buildObjectSheet();
          theObjectReference = new ObjectReference();
          this.#checkEvent = true;
        },
      };
      items.deactivate = {
        name: _("objects_menuDeactivate"),
        callback: () => {
          this.#checkEvent = false;
          this.#treeDiv.jstree().uncheck_node(nodeID);
          this.#treeDiv.jstree().uncheck_node(node.children_d);
          this.buildObjectSheet();
          theObjectReference = new ObjectReference();
          this.#checkEvent = true;
        },
      };
    }

    return { items: menuItems };
  }

  /**
   * insert a new object relative to a node
   *
   * @param {DOMNode} node
   * @param {Boolean} below if true insert below given node, else above
   */
  #objectInsert(node, below) {
    this.#editMode = true;
    let parentNode = this.#treeDiv.jstree().get_node(node.parent);
    let nodePosition = parentNode.children.indexOf(node.id) + (below ? 1 : 0);
    let tree = this.#treeDiv.jstree();
    let id = uuid();
    this.#objects[id] = new StyledObject(
      id,
      _("objects_newObject", { count: this.#newCounter }),
    );
    this.#newCounter++;
    this.#treeDiv.jstree().create_node(
      parentNode,
      {
        id: id,
        text: this.#objects[id].decoratedName(),
      },
      nodePosition,
    );
    tree.edit(id, this.#objects[id].name, () => {
      this.#editMode = false;
      this.#objects[id].name = tree.get_text(id);
      tree.rename_node(id, this.#objects[id].decoratedName());
      tree.check_node(id);
      tree.deselect_all();
      tree.select_node(id);
    });
  }
}
