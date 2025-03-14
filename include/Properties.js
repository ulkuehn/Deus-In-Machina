/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of Properties class
 */

/**
 * @classdesc Properties of a DIM project
 */
class Properties {
  #title; // project title
  #subtitle; // subtitle
  #author; // author
  #info; // project info
  #dirty; // true if changed
  #categories = {}; // project categories, initialized by global categories

  /**
   * class constructor
   *
   * @param {Object} categories
   * @param {String} title
   * @param {String} subtitle
   * @param {String} author
   * @param {String} info
   */
  constructor(
    categories = {},
    title = "",
    subtitle = "",
    author = "",
    info = "",
  ) {
    this.#dirty = true;
    this.#title = title;
    this.#subtitle = subtitle;
    this.#author = author;
    this.#info = info;
    // make a copy of the global categories and assign unique, project specific ids
    this.#categories = JSON.parse(JSON.stringify(categories));
    Object.keys(this.#categories).forEach((list) => {
      this.#categories[list].forEach((entry) => {
        entry.id = uuid();
      });
    });
  }

  // getters and setters

  get title() {
    return this.#title;
  }

  set title(v) {
    this.#title = v;
    this.#dirty = true;
  }

  get subtitle() {
    return this.#subtitle;
  }

  set subtitle(v) {
    this.#subtitle = v;
    this.#dirty = true;
  }

  get fulltitle() {
    if (this.#subtitle) {
      return this.#title ? `${this.#title}: ${this.#subtitle}` : this.#title;
    } else {
      return this.#title;
    }
  }

  get author() {
    return this.#author;
  }

  set author(v) {
    this.#author = v;
    this.#dirty = true;
  }

  get info() {
    return this.#info;
  }

  set info(v) {
    this.#info = v;
    this.#dirty = true;
  }

  get categories() {
    return this.#categories;
  }

  set categories(v) {
    this.#categories = v;
    if (theTextTree) {
      // unset possibly removed category values in texts
      Object.values(theTextTree.texts).forEach((text) => {
        let ok = text.status == UUID0;
        v.categories_status.forEach((cat) => {
          ok ||= text.status == cat.id;
        });
        !ok && (text.status = UUID0);
        ok = text.type == UUID0;
        v.categories_type.forEach((cat) => {
          ok ||= text.type == cat.id;
        });
        !ok && (text.type = UUID0);
        ok = text.userValue == UUID0;
        v.categories_user.forEach((cat) => {
          ok ||= text.userValue == cat.id;
        });
        !ok && (text.userValue = UUID0);
      });
      theTextTree.decorateTree();
    }
    this.#dirty = true;
  }

  get lists() {
    return [
      this.#categories.categories_status.map((x) => ({
        id: x.id,
        name: x.categories_statusName,
      })),
      this.#categories.categories_type.map((x) => ({
        id: x.id,
        name: x.categories_typeName,
      })),
      this.#categories.categories_user.map((x) => ({
        id: x.id,
        name: x.categories_userName,
      })),
    ];
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }
}
