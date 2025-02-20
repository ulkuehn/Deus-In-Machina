/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Collection class
 */

/**
 * @classdesc Collections are sets of texts that can be singled out from the text tree
 */
class Collection {
  #id; // unique id
  #name; // user facing name
  #decoration; // icon, color etc as object
  #items; // Set of ids in the collection -- if empty the collection is the standard full tree
  #dirty; // true if unsaved changes
  #inDB; // true if collection is in database
  #created; // creation timestamp
  #changed; // last change timestamp
  #search; // search criteria or null if non-search collection

  /**
   * class constructor
   *
   * @param {String} id necessary
   * @param {String} name necessary
   * @param {Array} items
   * @param {Object} search
   * @param {Object} decoration
   * @param {Number} created
   * @param {Number} changed
   * @param {Boolean} dirty
   * @param {Boolean} inDB
   */
  constructor(
    id,
    name,
    items = [],
    search = null,
    decoration = { icon: false },
    created = new Date().getTime(),
    changed = new Date().getTime(),
    dirty = true,
    inDB = false,
  ) {
    this.#id = id;
    this.#name = name;
    this.#decoration = decoration;
    this.#items = new Set(items);
    this.#search = search;
    this.#inDB = inDB;
    this.#dirty = dirty;
    this.#created = new Timestamp(created);
    this.#changed = new Timestamp(changed);
  }

  /**
   * deconstructor
   *
   * @returns {Array}
   */
  serialize() {
    return [
      this.#id,
      this.#name,
      this.#items.keys().toArray(),
      this.#search,
      this.#decoration,
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

  get name() {
    return this.#name;
  }

  set name(value) {
    if (value != "" && value != this.#name) {
      this.#name = value;
      this.#update();
    }
  }

  get created() {
    return this.#created;
  }

  get changed() {
    return this.#changed;
  }

  get decoration() {
    return Object.assign({}, this.#decoration);
  }

  set decoration(value = {}) {
    this.#decoration = Object.assign({}, value);
    this.#update();
  }

  get inDB() {
    return this.#inDB;
  }

  set inDB(value) {
    this.#inDB = Boolean(value);
  }

  get items() {
    return this.#items.keys().toArray();
  }

  set items(items = []) {
    this.#items = new Set(items);
    this.#update();
  }

  get search() {
    return this.#search;
    // return Object.assign({}, this.#search);
  }

  set search(value) {
    this.#search = JSON.parse(JSON.stringify(value));
    this.#update();
  }

  getDecorationValue(key) {
    return this.#decoration[key] == undefined ? "" : this.#decoration[key];
  }

  setDecorationValue(key, value) {
    this.#decoration[key] = value;
    this.#update();
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * return name with icons etc as html string
   *
   * @returns {String}
   */
  decoratedName() {
    let result = "";
    let settings = theSettings.effectiveSettings();

    // search and/or filter
    if (this.#search) {
      // pure filter
      if (!this.#search.text) {
        result += `<i class="fa-solid fa-filter" style="margin-right:5px;" title="${(_("textCollections_withFilter", this.#search.filters.length, { filters: this.#search.filters.length }))}"></i>`;
      } else {
        result +=
          this.#search.filters && this.#search.filters.length
            ? `<span title='${_(
                "textCollections_searchFilter",
                this.#search.filters.length,
                {
                  filters: this.#search.filters.length,
                  text: this.#search.text,
                },
              )}'><i class="fa-solid fa-filter" style="margin-right:-2px;"></i><i class="fa-solid fa-magnifying-glass fa-flip-horizontal" style="margin-right:5px;"></i></span>`
            : `<i class="fa-solid fa-magnifying-glass" style="margin-right:5px;" title='${_(
                "textCollections_withSearch",
                {
                  text: this.#search.text,
                },
              )}'></i>`;
        if (settings.textCollectionTreeShowSearchProperties) {
          result += `<span style="margin-right:5px">`;
          result += this.#search.case
            ? `<i class="fa-solid fa-check fa-xs fa-fw" title="${_(
                "search_withCase",
              )}"></i>`
            : `<i class="fa-solid fa-minus fa-xs fa-fw" title="${_(
                "search_withoutCase",
              )}"></i>`;
          result += this.#search.word
            ? `<i class="fa-solid fa-check fa-xs fa-fw" title="${_(
                "search_wholeWord",
              )}"></i>`
            : `<i class="fa-solid fa-minus fa-xs fa-fw" title="${_(
                "search_ignoreWord",
              )}"></i>`;
          result += this.#search.regex
            ? `<i class="fa-solid fa-check fa-xs fa-fw" title="${_(
                "search_withRegex",
              )}"></i>`
            : `<i class="fa-solid fa-minus fa-xs fa-fw" title="${_(
                "search_withoutRegex",
              )}"></i>`;
          result += "</span>";
        }
      }
    } else {
      // empty
      if (settings.textCollectionTreeEmptyIcon && !this.#items.size) {
        result += `<span class="fa fa-stack" style="opacity:0.5; margin-right:4px; vertical-align:top; width:20px;${
          settings.textCollectionTreeSmall ? " line-height:1.3em" : ""
        }" title="${_(
          "textCollections_empty",
        )}"><i class="fa-solid fa-list fa-stack-1x"></i><i class="fa-solid fa-slash fa-stack-1x"></i></span>`;
      }
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
          settings.textCollectionTreeSmall ? "line-height:1.2em;" : ""
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

  addItem(item) {
    if (!this.#items.has(item)) {
      this.#items.add(item);
      this.#update();
    }
  }
  removeItem(item) {
    if (this.#items.has(item)) {
      this.#items.delete(item);
      this.#update();
    }
  }

  clearItems() {
    this.#items.clear();
  }

  hasItem(item) {
    return this.#items.has(item);
  }

  // private methods

  /**
   * update the object
   */
  #update() {
    this.#changed = new Timestamp();
    this.#dirty = true;
  }
}
