/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of StyledText class
 */

/**
 * @classdesc StyledTexts are Quill based rich texts that can be styled and connected to StyledObjects
 */
class StyledText {
  #id; // unique id
  #name; // user determined name
  #editable; // text editable or locked
  #decoration; // icon, color etc as object
  #delta; // contents as delta object
  #characters; // length in chars
  #words; // length in words
  #objects; // mapping of object ids to textlength {id: length, ... }
  #created; // creation timestamp
  #changed; // last change timestamp
  #status; // status id (corresponding to setting)
  #type; // type id (corresponding to setting)
  #userValue; // user id (corresponding to setting)
  #dirty; // true if unsaved changes
  #inDB; // true if text is in database/project file

  /**
   * count statistical values of some quill delta
   *
   * @param {Object[]} delta
   * @returns {Number[]}
   */
  static countCharsWordsObjects(delta) {
    let chars = 0;
    let words = 0;
    let objects = {};
    let spaceEnded = true;
    for (let i = 0; i < delta.length; i++) {
      let op = delta[i];
      if ("attributes" in op) {
        Object.keys(op.attributes).forEach((att) => {
          if (att.startsWith("object")) {
            objects[att.substring(6)] = true;
          }
        });
      }
      if ("insert" in op && typeof op.insert == "string") {
        let insert = op.insert;
        // quill editor's delta always ends in "\n", so remove this before counting
        if (i == delta.length - 1 && insert.endsWith("\n")) {
          insert = insert.slice(0, -1);
        }
        let spaceEnds = false;
        let spaceStarts = false;
        chars += insert.length;
        let w = insert.split(/[ \n]+/g);
        if (w.length > 0 && w[0] == "") {
          w.shift();
          spaceStarts = true;
        }
        if (w.length > 1 && w[w.length - 1] == "") {
          w.pop();
          spaceEnds = true;
        }
        words += w.length;
        // account for inserts that do not occur at space breaks
        if (!spaceEnded && !spaceStarts && w.length > 0) {
          words -= 1;
        }
        spaceEnded = spaceEnds;
      }
    }

    return [chars, words, Object.keys(objects)];
  }

  /**
   * class constructor
   *
   * @param {String} id
   * @param {String} name
   * @param {Object[]} delta
   * @param {Number} characters
   * @param {Number} words
   * @param {Object} objects
   * @param {Boolean} editable
   * @param {Object} decoration
   * @param {String} status
   * @param {String} type
   * @param {String} userValue
   * @param {Number} created
   * @param {Number} changed
   * @param {Boolean} dirty
   * @param {Boolean} inDB
   */
  constructor(
    id,
    name = "",
    delta = [],
    characters = 0,
    words = 0,
    objects = {},
    editable = true,
    decoration = { icon: false },
    status = UUID0,
    type = UUID0,
    userValue = UUID0,
    created = new Date().getTime(),
    changed = new Date().getTime(),
    dirty = true,
    inDB = false,
  ) {
    this.#id = id; // unique id, never changes
    this.#name = name;
    this.#editable = editable;
    this.#decoration = decoration;
    this.#status = status;
    this.#type = type;
    this.#userValue = userValue;
    this.#delta = delta;
    this.#created = new Timestamp(created);
    this.#changed = new Timestamp(changed);
    this.#dirty = dirty; // true if changed and unsaved
    this.#inDB = inDB;
    this.#characters = characters;
    this.#words = words;
    this.#objects = objects;
  }

  /**
   * deconstructor
   *
   * @returns {Object[]} array of values/parameters that can be fed into an IPC message
   */
  serialize() {
    return [
      this.#id,
      this.#name,
      [...this.#delta],
      this.#characters,
      this.#words,
      this.#objects,
      this.#editable,
      this.#decoration,
      this.#status,
      this.#type,
      this.#userValue,
      this.#created.epochSeconds,
      this.#changed.epochSeconds,
      this.#dirty,
      this.#inDB,
    ];
  }

  // getters and setters

  get id() {
    return this.#id;
  }

  get created() {
    return this.#created;
  }

  get changed() {
    return this.#changed;
  }

  get inDB() {
    return this.#inDB;
  }

  set inDB(v) {
    this.#inDB = v;
  }

  get objects() {
    return Object.assign({}, this.#objects);
  }

  set objects(value) {
    this.#objects = Object.assign({}, value);
  }

  get objectCount() {
    return Object.keys(this.#objects).length;
  }

  get characters() {
    return this.#characters;
  }

  get words() {
    return this.#words;
  }

  get name() {
    return this.#name;
  }

  set name(value = "") {
    if (value != "" && value != this.#name) {
      this.#name = value;
      this.#update();
    }
  }

  get editable() {
    return this.#editable;
  }

  set editable(value = true) {
    if (value != this.#editable) {
      this.#editable = value;
      this.#update();
    }
  }

  get decoration() {
    return this.#decoration;
  }

  set decoration(value = {}) {
    this.#decoration = Object.assign({}, value);
    this.#update();
  }

  get status() {
    return this.#status;
  }

  set status(value = 0) {
    if (value != this.#status) {
      this.#status = value;
      this.#update();
    }
  }

  get type() {
    return this.#type;
  }

  set type(value = 0) {
    if (value != this.#type) {
      this.#type = value;
      this.#update();
    }
  }

  get userValue() {
    return this.#userValue;
  }

  set userValue(value = 0) {
    if (value != this.#userValue) {
      this.#userValue = value;
      this.#update();
    }
  }

  get delta() {
    return [...this.#delta];
  }

  set delta(value) {
    this.#delta = value;
    this.calcSimpleStatistics();
    this.calcObjectLength();
    this.#update();
  }

  get text() {
    let text = "";
    this.#delta.forEach((op) => {
      if ("insert" in op) {
        text += op.insert;
      }
    });
    return text;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * text was changed
   * @private
   */
  #update() {
    this.#changed = new Timestamp();
    this.#dirty = true;
  }

  /**
   * get a specific decoration value
   *
   * @param {String} key
   * @returns {String}
   */
  getDecorationValue(key) {
    return this.#decoration[key] ?? "";
  }

  /**
   * set a specific decoration value
   *
   * @param {String} key
   * @param {String} value
   */
  setDecorationValue(key, value) {
    this.#decoration[key] = value;
    this.#update();
  }

  /**
   * return name with all decoration applied as HTML
   *
   * @returns {String}
   */
  decoratedName() {
    let result = "";
    let settings = theSettings.effectiveSettings();
    // empty
    if (this.#characters == 0) {
      result += `<i class="fa-solid fa-text-slash" style="opacity:0.5; margin-right:4px;" title="${_(
        "texts_emptyText",
      )}"></i>`;
    }
    // locked
    if (settings.textTreeLockedIcon && !this.#editable) {
      result += `<i class="fa-solid fa-lock" style="opacity:0.5; margin-right:4px;" title="${_(
        "texts_lockedText",
      )}"></i>`;
    }
    // status
    if (settings.textTreeShowStatus) {
      let status = UUID0;
      let color = "";
      let title = "";
      for (
        let i = 0;
        i < theProperties.categories.categories_status.length;
        i++
      ) {
        if (theProperties.categories.categories_status[i].id == this.#status) {
          status = this.#status;
          color =
            theProperties.categories.categories_status[i]
              .categories_statusColor;
          title = Util.escapeHTML(
            theProperties.categories.categories_status[i].categories_statusName,
          );
          break;
        }
      }
      if (status != UUID0) {
        result += `<i style="color:${color}; margin-right:4px;" class="fa-solid fa-${
          settings.textTreeShowStatusForm
        }" title="${_("texts_status", { text: title })}"></i> `;
      } else if (settings.textTreeShowNoStatus) {
        result += `<i style="color:#808080; margin-right:4px" class="fa-regular fa-${
          settings.textTreeShowStatusForm
        }" title="${_("texts_status", {
          text: _("categories_noStatus"),
        })}"></i> `;
      }
    }
    // type
    if (settings.textTreeShowType) {
      let type = UUID0;
      let color = "";
      let title = "";
      for (
        let i = 0;
        i < theProperties.categories.categories_type.length;
        i++
      ) {
        if (theProperties.categories.categories_type[i].id == this.#type) {
          type = this.#type;
          color =
            theProperties.categories.categories_type[i].categories_typeColor;
          title = Util.escapeHTML(
            theProperties.categories.categories_type[i].categories_typeName,
          );
          break;
        }
      }
      if (type != UUID0) {
        result += `<i style="color:${color}; margin-right:4px" class="fa-solid fa-${
          settings.textTreeShowTypeForm
        }" title="${_("texts_type", { text: title })}"></i> `;
      } else if (settings.textTreeShowNoType) {
        result += `<i style="color:#808080; margin-right:4px" class="fa-regular fa-${
          settings.textTreeShowTypeForm
        }" title="${_("texts_type", { text: _("categories_noType") })}"></i> `;
      }
    }
    // user
    if (settings.textTreeShowUser) {
      let user = UUID0;
      let color = "";
      let title = "";
      for (
        let i = 0;
        i < theProperties.categories.categories_user.length;
        i++
      ) {
        if (theProperties.categories.categories_user[i].id == this.#userValue) {
          user = this.#userValue;
          color =
            theProperties.categories.categories_user[i].categories_userColor;
          title = Util.escapeHTML(
            theProperties.categories.categories_user[i].categories_userName,
          );
          break;
        }
      }
      if (user != UUID0) {
        result += `<i style="color:${color}; margin-right:4px" class="fa-solid fa-${
          settings.textTreeShowUserForm
        }" title="${_("texts_user", { text: title })}"></i> `;
      } else if (settings.textTreeShowNoUser) {
        result += `<i style="color:#808080; margin-right:4px" class="fa-regular fa-${
          settings.textTreeShowUserForm
        }" title="${_("texts_user", { text: _("categories_noUser") })}"></i> `;
      }
    }
    // add some extra space to the right
    if (result) {
      result += `<span style="margin-right:4px"></span>`;
    }
    // icon
    if (this.#decoration.icon) {
      if (
        this.#decoration.stack == undefined ||
        this.#decoration.stack == TreeDecoration.noStack
      ) {
        result += `<i class="fa-solid fa-${this.#decoration.iconName}" style="color:${this.#decoration.iconColor}; margin-right:8px;"></i>`;
      } else {
        let i1 = `<i class="${
          TreeDecoration.stackProps[this.#decoration.stack].class
        } fa-stack-1x" style="color:${this.#decoration.stackColor}"></i>`;
        let i2 = `<i class="fa-solid fa-${this.#decoration.iconName} fa-stack-1x" style="color:${this.#decoration.iconColor}"></i>`;
        result += `<span class="fa-stack" style="vertical-align:top; ${
          settings.textTreeSmall ? "line-height:1.2em;" : ""
        } width:1em; margin-right:8px;">${
          TreeDecoration.stackProps[this.#decoration.stack].background
            ? i1 + i2
            : i2 + i1
        }</span>`;
      }
    }
    // name
    let name = Util.escapeHTML(this.#name);
    for (let [mod, tags] of Object.entries(TreeDecoration.modTags)) {
      if (this.#decoration[mod]) {
        name = `${tags[0]}${name}${tags[1]}`;
      }
    }
    result += name;

    return `<span style="margin-left:4px" title="${Util.escapeHTML(
      this.#name,
    )}">${result}</span>`;
  }

  /**
   * search a string/regex within the text
   *
   * @param {String} searchFor
   * @param {Boolean} doCase
   * @param {Boolean} doWord
   * @param {Boolean} doRegex
   * @returns {Boolean} true if string/regex was found
   */
  find(searchFor, doCase = false, doWord = false, doRegex = false) {
    let rex = RegExp(
      `${doWord ? "(^|\\P{L})(" : ""}${
        doRegex
          ? Util.escapeRegExpSearch(searchFor)
          : Util.escapeRegExp(searchFor)
      }${doWord ? ")\\P{L}" : ""}`,
      `udg${doCase ? "" : "i"}`,
    );

    let textlet = "";
    for (let op of this.#delta) {
      if (typeof op.insert == "string") {
        textlet += op.insert;
      } else {
        if (Boolean(rex.exec(textlet))) {
          return true;
        }
        textlet = "";
        rex.lastIndex = 0;
      }
    }

    return Boolean(rex.exec(textlet));
  }

  /**
   * count just characters and words
   *
   * @returns {Number[]}
   */
  calcSimpleStatistics() {
    let chars = 0;
    let words = 0;
    let spaceEnded = true;
    for (let i = 0; i < this.#delta.length; i++) {
      let op = this.#delta[i];
      if ("insert" in op && typeof op.insert == "string") {
        let insert = op.insert;
        // deltas from quill always end in "\n", so remove this before counting
        if (i == this.#delta.length - 1 && insert.endsWith("\n")) {
          insert = insert.slice(0, -1);
        }
        let spaceEnds = false;
        let spaceStarts = false;
        chars += insert.length;
        let w = insert.split(/[ \n]+/g);
        if (w.length > 0 && w[0] == "") {
          w.shift();
          spaceStarts = true;
        }
        if (w.length > 1 && w[w.length - 1] == "") {
          w.pop();
          spaceEnds = true;
        }
        words += w.length;
        // account for inserts that do not occur at space breaks
        if (!spaceEnded && !spaceStarts && w.length > 0) {
          words -= 1;
        }
        spaceEnded = spaceEnds;
      }
    }
    this.#characters = chars;
    this.#words = words;

    return [chars, words];
  }

  /**
   * do a full statistics count
   *
   * @returns {Object}
   */
  calcStatistics() {
    let statistics = {
      characters: 0,
      nonSpaceCharacters: 0,
      words: 0,
      wordCounts: {},
      sentences: 0,
      paragraphs: 0,
    };
    let text = "";
    this.#delta.forEach((op) => {
      if ("insert" in op && typeof op.insert == "string") {
        text += op.insert;
      }
    });
    if (text.endsWith("\n")) {
      text = text.slice(0, -1);
    }
    text.split(/(\n+)/).forEach((paragraph) => {
      if (paragraph != "") {
        if (paragraph.match(/^\n+$/)) {
          statistics.characters += paragraph.length;
        } else {
          statistics.paragraphs += 1;
          paragraph.split(/([.?!]+)(?=\s+\p{Lu})/u).forEach((sentence) => {
            if (sentence != "") {
              if (sentence.match(/^[.?!]+$/)) {
                statistics.characters += sentence.length;
              } else {
                statistics.sentences += 1;
                sentence.split(/( +)/).forEach((word) => {
                  if (word != "") {
                    if (word.match(/^ +$/)) {
                      statistics.characters += word.length;
                    } else {
                      statistics.words += 1;
                      statistics.nonSpaceCharacters += word.length;
                      statistics.characters += word.length;
                      word = word.toLowerCase();
                      let bareWord = word
                        .replace(/^\P{L}+/u, "")
                        .replace(/\P{L}+$/u, "");
                      if (bareWord == "") {
                        bareWord = word
                          .replace(/^\P{N}+/u, "")
                          .replace(/\P{N}+$/u, "");
                      }
                      if (bareWord != "") {
                        if (!(bareWord in statistics.wordCounts)) {
                          statistics.wordCounts[bareWord] = 0;
                        }
                        statistics.wordCounts[bareWord] += 1;
                      }
                    }
                  }
                });
              }
            }
          });
        }
      }
    });

    return statistics;
  }

  /**
   * calculate lenghts of text connected to objects and adjust text lengths in objects accordingly
   *
   * @returns
   */
  calcObjectLength() {
    let objects = {};
    this.#delta.forEach((op) => {
      if ("insert" in op && "attributes" in op) {
        Object.keys(op.attributes).forEach((attr) => {
          if (attr.startsWith("object") && op.attributes[attr]) {
            let objectID = attr.slice(6);
            if (!(objectID in objects)) {
              objects[objectID] = 0;
            }
            objects[objectID] +=
              typeof op.insert == "string" ? op.insert.length : 1;
          }
        });
      }
    });
    this.#objects = objects;
    // apply object text lengths for this text to objects in objectTree
    if (theObjectTree) {
      theObjectTree.objectIDs().forEach((objectID) => {
        if (
          theObjectTree
            .getObject(objectID)
            .setTextLength(this.#id, objects[objectID] ?? 0)
        )
          theObjectTree.tree
            .jstree()
            .rename_node(
              objectID,
              theObjectTree.getObject(objectID).decoratedName(),
            );
      });
    }

    return objects;
  }

  /**
   * verbatim references for all objects this text is connected with
   *
   * @returns {Object[]} [{object:id, references:[{text:id, citations:[{pos:pos,len:len,content:string,html:boolean},...]}, ...]}, ...]
   */
  objectReferences() {
    return ObjectReference.citations(
      [
        {
          id: this.#id,
          delta: this.#delta,
        },
      ],
      Object.keys(this.#objects),
      theSettings.effectiveSettings().imageReference,
    );
  }
}
