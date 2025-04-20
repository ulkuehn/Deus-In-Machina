/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of TextCollection class
 */

/**
 * @classdesc A TextCollection is a special flat tree to represent StyledTexts outside of their position and hierarchy in a TextTree
 */
class TextCollection {
  #treeDiv; // div to hold the jstree
  #ids; // list of textIDs in the collection
  #checkEvent;

  /**
   * class constructor
   *
   * @param {jQuery} $containerDiv
   * @param {String[]} ids
   * @param {Object} search not null if TextCollection is built from a global text search
   */
  constructor($containerDiv, ids, search) {
    this.#checkEvent = true;
    this.#ids = ids;

    this.#treeDiv = $("<div>");
    $containerDiv.append(this.#treeDiv);
    this.setupTree();
    theTextEditor.setSearch(search);

    // context menu definition
    this.#treeDiv.contextMenu({
      selector: ".jstree-node",
      autoHide: true,
      zIndex: 10,
      build: ($trigger, e) => {
        return this.#contextMenu($trigger[0].id);
      },
    });
  }

  // getter and setters

  get treeDiv() {
    return this.#treeDiv;
  }

  /**
   * (re)initialize the tree
   */
  setupTree() {
    let settings = theSettings.effectiveSettings();
    if ($.jstree.reference(this.#treeDiv)) {
      this.#treeDiv.jstree().destroy();
    }
    // actually "dnd" is not needed and any node movement is inhibited, but including dnd plugin adds same look and feel as with all other trees
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
          return (
            operation == "create_node" ||
            operation == "rename_node" ||
            operation == "edit"
          );
        },
        dblclick_toggle: false,
        themes: {
          name: "dim",
          variant: settings.textTreeSmall ? "small" : "large",
          icons: false,
          dots: false,
        },
      },
      checkbox: {
        whole_node: false,
        three_state: false,
        tie_selection: false,
      },
      plugins: plugins,
    });

    this.#ids.forEach((id) => {
      this.#treeDiv.jstree().create_node(null, {
        id: id,
        text: theTextTree.getText(id).decoratedName(),
      });
    });

    this.#treeDiv.on(
      "check_node.jstree uncheck_node.jstree check_all.jstree uncheck_all.jstree",
      (event, data) => {
        if (this.#checkEvent) {
          theTextEditor.showTextsInEditor(
            // jstree get_checked is not properly ordered, so rely on this.#ids
            this.#ids.filter((id) => this.#treeDiv.jstree().is_checked(id)),
          );
        }
      },
    );

    this.#treeDiv.on("dblclick.jstree", this.#dblClick.bind(this));

    this.#treeDiv.on("ready.jstree", () => {
      if (settings.textCollectionTreeAutoActivate) {
        this.#treeDiv.jstree().check_all();
      } else {
        this.checkSome(this.#ids.filter((x) => theTextTree.isChecked(x)));
      }
    });
  }

  /**
   * function bound to double click -- edit text properties as in full TextTree
   * @private
   *
   * @param {Event} event
   */
  #dblClick(event) {
    theTextTree.editProps(this.#treeDiv.jstree().get_node(event.target).id);
  }

  /**
   * context menu definition for a StyledText in a collection
   * @private
   *
   * @param {String} nodeID
   * @returns {Object}
   */
  #contextMenu(nodeID) {
    let settings = theSettings.effectiveSettings();
    let node = this.#treeDiv.jstree().get_node(nodeID);
    let menuItems = {};

    // info part
    let infoPre = `<span style="font-style:italic;cursor:default">`;
    let infoPost = `</span>`;
    let items = menuItems;
    if (settings.textTreeCompactContextMenu) {
      menuItems.infoMenu = {
        name: _("texts_contextMenuInfoMenu"),
        icon: "fas fa-circle-info",
        items: {},
      };
      items = menuItems.infoMenu.items;
    }
    items.name = {
      isHtmlName: true,
      name:
        infoPre + Util.escapeHTML(theTextTree.getText(node.id).name) + infoPost,
    };
    if (!settings.textTreeCompactContextMenu) {
      items.name.icon = "fas fa-circle-info";
    }
    if (settings.textTreeContextMenuStats) {
      items.stats = {
        isHtmlName: true,
        name: `${infoPre}${_(
          "editorContextMenu_words",
          theTextTree.getText(node.id).words,
          {
            words: theTextTree
              .getText(node.id)
              .words.toLocaleString(theLanguage),
          },
        )} &ndash; ${_(
          "editorContextMenu_characters",
          theTextTree.getText(node.id).characters,
          {
            characters: theTextTree
              .getText(node.id)
              .characters.toLocaleString(theLanguage),
          },
        )} &ndash; ${_(
          "editorContextMenu_objects",
          theTextTree.getText(node.id).objectCount,
          {
            objects: theTextTree
              .getText(node.id)
              .objectCount.toLocaleString(theLanguage),
          },
        )}${infoPost}`,
      };
    }

    if (settings.textTreeContextMenuTime == "compactTime") {
      let text = theTextTree.getText(node.id);
      items.time = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_timestamps", {
            created: text.created.toLocalString(settings.dateTimeFormatShort),
            changed: text.changed.toLocalString(settings.dateTimeFormatShort),
          }) +
          infoPost,
      };
    }
    if (settings.textTreeContextMenuTime == "fullTime") {
      let text = theTextTree.getText(node.id);
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
    if (settings.textTreeCompactContextMenu) {
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
    if (!settings.textTreeCompactContextMenu) {
      items.editName.icon = "fas fa-i-cursor";
    }
    items.deriveName = {
      name: _("texts_contextMenuDeriveName"),
      callback: () => {
        // use at most one para
        let name = theTextTree.getText(node.id).text.split("\n")[0];
        // use at most number of words of resp. setting value
        name =
          name
            .split(/\s+/)
            .filter((x) => x.length)
            .slice(0, settings.textTreeNameWords)
            .join(" ") + settings.textTreeAppendName;
        theTextTree.getText(node.id).name = name;
        this.#treeDiv
          .jstree()
          .rename_node(node, theTextTree.getText(node.id).decoratedName());
        theTextTree.updateName(node.id, name);
      },
    };
    items.props = {
      name: _("texts_contextMenuProps"),
      callback: () => {
        this.editProps(nodeID);
      },
    };
    items.lock = {
      name: theTextTree.getText(node.id).editable
        ? _("texts_contextMenuLock")
        : _("texts_contextMenuUnlock"),
      callback: () => {
        theTextTree.getText(node.id).editable = !theTextTree.getText(node.id)
          .editable;
        theTextTree.updateName(node.id);
        theTextEditor.setEditable(node.id);
        this.#treeDiv
          .jstree()
          .rename_node(node, theTextTree.getText(node.id).decoratedName());
      },
    };

    return { items: menuItems };
  }

  checkAll() {
    this.#treeDiv.jstree().check_all();
  }

  uncheckAll() {
    this.#treeDiv.jstree().uncheck_all();
  }

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
   * check exactly those StyledTexts that are connected to any of the checked StyledObjects
   */
  checkCheckedObjects() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    let checked = theObjectTree.getChecked();
    if (checked.length > 0) {
      this.#ids.forEach((textID) => {
        let objects = theTextTree.getText(textID).objects;
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
   * check all StyledTexts that are connected to any StyledObject
   */
  checkHasObjects() {
    this.#checkEvent = false;
    this.#treeDiv.jstree().uncheck_all();
    this.#ids.forEach((textID) => {
      if (Object.keys(theTextTree.getText(textID).objects).length > 0) {
        this.#treeDiv.jstree().check_node(textID);
      }
    });
    theTextEditor.showTextsInEditor(this.getChecked());
    this.#checkEvent = true;
  }

  /**
   * return the ids of all nodes
   *
   * @returns {String[]}
   */
  getAll() {
    return $.jstree.reference(this.#treeDiv)
      ? this.#treeDiv.jstree().get_node("#").children
      : [];
  }

  /**
   * return the ids of all checked nodes
   *
   * @returns {String[]}
   */
  getChecked() {
    return $.jstree.reference(this.#treeDiv)
      ? this.#treeDiv.jstree().get_checked()
      : [];
  }

  /**
   * inline edit the name of a StyledText
   * @private
   *
   * @param {String} id
   */
  #editName(id) {
    let node = this.#treeDiv.jstree().get_node(id);
    this.#treeDiv
      .jstree()
      .edit(node, theTextTree.getText(id).name, (nde, status, cancel, txt) => {
        theTextTree.updateName(id, txt);
        this.updateNode(id);
        this.#treeDiv
          .jstree()
          .set_text(node, theTextTree.getText(id).decoratedName());
        $("#TT").scrollLeft(0);
      });
    $(".jstree-rename-input").attr({
      style: "padding-left:10px; border:2px dashed black;",
      spellcheck: false,
    });
    $(".jstree-rename-input").first()[0].setSelectionRange(0, 0);
  }

  /**
   * update the display name of a StyledText in the TextCollection tree
   *
   * @param {String} id
   */
  updateNode(id) {
    this.#treeDiv
      .jstree()
      .rename_node(id, theTextTree.getText(id).decoratedName());
  }

  /**
   * retreive the id of the one single selected text
   *
   * @param {Boolean} mustSee
   * @returns {String} null if no text, more than one is selected or mustSee and node is currently not visible in tree
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
   * select one or more nodes, either exactly or on top of those already selected
   *
   * @param {String|String[]} ids
   * @param {Boolean} onlySome if true exactly the given ids are selected
   */
  selectSome(ids, onlySome = false) {
    if (onlySome) {
      this.#treeDiv.jstree().deselect_all();
    }
    this.#treeDiv.jstree().select_node(ids);
    let scrollTo = Array.isArray(ids) ? ids[0] : ids;
    // scrollIntoViewIfNeeded non standard, but perfect here and better than scrollIntoView
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
    $(`#TT #${scrollTo}_anchor`)[0].scrollIntoViewIfNeeded(true);
    $("#TT").scrollLeft(0);
  }

  /**
   * check specific nodes; generate just one check event
   *
   * @param {String|String[]} ids
   * @param {Boolean} onlySome if true exactly the given ids are checked
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
   * open a StyledText for showing details and editing its properties
   *
   * @param {String} id
   */
  editProps(id) {
    let collections = [];
    theTextCollectionTree.regularCollections.forEach((collection) => {
      if (collection.hasItem(id)) {
        collections.push(collection.name);
      }
    });

    ipcRenderer.invoke("mainProcess_openWindow", [
      "text",
      theSettings.effectiveSettings().closingType,
      true,
      0,
      0,
      _("windowTitles_textWindow", { name: theTextTree.getText(id).name }),
      "./textWindow/textWindow.html",
      "textWindow_init",
      null,
      [
        theSettings.effectiveSettings(),
        theProperties.categories,
        theTextTree.getText(id).serialize(),
        theTextTree.getPath(id, true),
        collections,
        theObjectTree.getCheckInfo(),
        theTextTree.getText(id).objectReferences(),
      ],
    ]);
  }
}
