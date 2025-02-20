/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Categories class
 */

/**
 * @classdesc Categories are lists of properties than can be assigned to texts
 */
class Categories {
  /**
   * color schemes used as suggestions
   * @static
   */
  static colors = [
    { name: "colors_traffic", colors: ["#B81D13", "#EFB700", "#008450"] },
    {
      name: "colors_trafficInverse",
      colors: ["#008450", "#EFB700", "#B81D13"],
    },
    {
      name: "colors_olympic",
      colors: ["#0078D0", "#FFB114", "#000000", "#00A651", "#F0282D"],
    },
    {
      name: "colors_rainbow",
      colors: ["#ee0000", "#fe8a00", "#ffd800", "#00fe21", "#b100fe"],
    },
    {
      name: "colors_grey5",
      colors: ["#f8f9fa", "#dee2e6", "#b4bcc2", "#7b8a8b", "#212529"],
    },
    {
      name: "colors_grey5Inverse",
      colors: ["#212529", "#7b8a8b", "#b4bcc2", "#dee2e6", "#f8f9fa"],
    },
    { name: "colors_random2", random: 2 },
    { name: "colors_random3", random: 3 },
    { name: "colors_random5", random: 5 },
    { name: "colors_random10", random: 10 },
  ];

  /**
   * definition of text category list such as text status
   * @static
   */
  static categories = [
    {
      name: "categories_status", // i18n string to provide a category name
      info: "categories_statusInfo", // i18n string to provide some extra info
      icon: '<i class="fa-solid fa-flag-checkered fa-fw"></i>', // category decoration
      noValue: "categories_noStatus", // i18n string for null value
      properties: [
        {
          name: "categories_statusColor",
          type: "color",
          default: "#000000",
        },
        {
          name: "categories_statusName",
          type: "text",
          default: "",
          i18n: true,
        },
        {
          name: "categories_statusText",
          type: "textarea",
          default: "",
          i18n: true,
        },
      ],
      default: [
        {
          categories_statusColor: "#ef476f",
          categories_statusName: "categories_5states_idea1",
          categories_statusText: "categories_5states_idea2",
        },
        {
          categories_statusColor: "#ffd166",
          categories_statusName: "categories_5states_publish1",
          categories_statusText: "categories_5states_publish2",
        },
      ],
      examples: [
        {
          name: "categories_2states",
          properties: [
            {
              categories_statusColor: "#ffd428",
              categories_statusName: "categories_2states_started1",
              categories_statusText: "",
            },
            {
              categories_statusColor: "#3465a4",
              categories_statusName: "categories_2states_ended1",
              categories_statusText: "",
            },
          ],
        },
        {
          name: "categories_5states",
          properties: [
            {
              categories_statusColor: "#ef476f",
              categories_statusName: "categories_5states_idea1",
              categories_statusText: "categories_5states_idea2",
            },
            {
              categories_statusColor: "#ffd166",
              categories_statusName: "categories_5states_draft1",
              categories_statusText: "categories_5states_draft2",
            },
            {
              categories_statusColor: "#06d6a0",
              categories_statusName: "categories_5states_revise1",
              categories_statusText: "categories_5states_revise2",
            },
            {
              categories_statusColor: "#118ab2",
              categories_statusName: "categories_5states_edit1",
              categories_statusText: "categories_5states_edit2",
            },
            {
              categories_statusColor: "#073b4c",
              categories_statusName: "categories_5states_publish1",
              categories_statusText: "categories_5states_publish2",
            },
          ],
        },
      ],
    },
    {
      name: "categories_type",
      info: "categories_typeInfo",
      icon: '<i class="fa-solid fa-font fa-fw"></i>',
      noValue: "categories_noType",
      properties: [
        {
          name: "categories_typeColor",
          type: "color",
          default: "#000000",
        },
        {
          name: "categories_typeName",
          type: "text",
          default: "",
          i18n: true,
        },
        {
          name: "categories_typeText",
          type: "textarea",
          default: "",
          i18n: true,
        },
      ],
      default: [],
      examples: [
        {
          name: "categories_2types",
          properties: [
            {
              categories_typeColor: "#d16666",
              categories_typeName: "categories_typeSceneName",
              categories_typeText: "categories_typeSceneText",
            },
            {
              categories_typeColor: "#2c4251",
              categories_typeName: "categories_typeChapterName",
              categories_typeText: "categories_typeChapterText",
            },
          ],
        },
        {
          name: "categories_3types",
          properties: [
            {
              categories_typeColor: "#d16666",
              categories_typeName: "categories_typeSceneName",
              categories_typeText: "categories_typeSceneText",
            },
            {
              categories_typeColor: "#2c4251",
              categories_typeName: "categories_typeChapterName",
              categories_typeText: "categories_typeChapterText",
            },
            {
              categories_typeColor: "#c1c1c1",
              categories_typeName: "categories_typeSectionName",
              categories_typeText: "categories_typeSectionText",
            },
          ],
        },
      ],
    },
    {
      name: "categories_user",
      info: "categories_userInfo",
      icon: '<i class="fa-solid fa-user-edit fa-fw"></i>',
      noValue: "categories_noUser",
      properties: [
        {
          name: "categories_userColor",
          type: "color",
          default: "#000000",
        },
        {
          name: "categories_userName",
          type: "text",
          default: "",
        },
        {
          name: "categories_userText",
          type: "textarea",
          default: "",
        },
      ],
      default: [],
      examples: [
        {
          name: "categories_3Act",
          properties: [
            {
              categories_userColor: "#ffff00",
              categories_userName: "categories_3Act_exposition1",
              categories_userText: "categories_3Act_exposition2",
            },
            {
              categories_userColor: "#e0e000",
              categories_userName: "categories_3Act_inciting1",
              categories_userText: "categories_3Act_inciting2",
            },
            {
              categories_userColor: "#c0c000",
              categories_userName: "categories_3Act_pointone1",
              categories_userText: "categories_3Act_pointone2",
            },
            {
              categories_userColor: "#00ff00",
              categories_userName: "categories_3Act_rising1",
              categories_userText: "categories_3Act_rising2",
            },
            {
              categories_userColor: "#00e000",
              categories_userName: "categories_3Act_midpoint1",
              categories_userText: "categories_3Act_midpoint2",
            },
            {
              categories_userColor: "#00c000",
              categories_userName: "categories_3Act_pointtwo1",
              categories_userText: "categories_3Act_pointtwo2",
            },
            {
              categories_userColor: "#0000ff",
              categories_userName: "categories_3Act_preclimax1",
              categories_userText: "categories_3Act_preclimax2",
            },
            {
              categories_userColor: "#0000e0",
              categories_userName: "categories_3Act_climax1",
              categories_userText: "categories_3Act_climax2",
            },
            {
              categories_userColor: "#0000c0",
              categories_userName: "categories_3Act_denouement1",
              categories_userText: "categories_3Act_denouement2",
            },
          ],
        },
        {
          name: "categories_herosJourney",
          properties: [
            {
              categories_userColor: "#311090",
              categories_userName: "categories_HJDepartureA1",
              categories_userText: "categories_HJDepartureA2",
            },
            {
              categories_userColor: "#9ffdac",
              categories_userName: "categories_HJDepartureB1",
              categories_userText: "categories_HJDepartureB2",
            },
            {
              categories_userColor: "#0b7f9a",
              categories_userName: "categories_HJDepartureC1",
              categories_userText: "categories_HJDepartureC2",
            },
            {
              categories_userColor: "#16c81f",
              categories_userName: "categories_HJDepartureD1",
              categories_userText: "categories_HJDepartureD2",
            },
            {
              categories_userColor: "#2cd8f7",
              categories_userName: "categories_HJDepartureE1",
              categories_userText: "categories_HJDepartureE2",
            },
            {
              categories_userColor: "#800620",
              categories_userName: "categories_HJInitiationA1",
              categories_userText: "categories_HJInitiationA2",
            },
            {
              categories_userColor: "#b5116d",
              categories_userName: "categories_HJInitiationB1",
              categories_userText: "categories_HJInitiationB2",
            },
            {
              categories_userColor: "#b474b4",
              categories_userName: "categories_HJInitiationC1",
              categories_userText: "categories_HJInitiationC2",
            },
            {
              categories_userColor: "#f4a7ee",
              categories_userName: "categories_HJInitiationD1",
              categories_userText: "categories_HJInitiationD2",
            },
            {
              categories_userColor: "#7d6e07",
              categories_userName: "categories_HJReturnA1",
              categories_userText: "categories_HJReturnA2",
            },
            {
              categories_userColor: "#ceb50c",
              categories_userName: "categories_HJReturnB1",
              categories_userText: "categories_HJReturnB2",
            },
            {
              categories_userColor: "#f6cc7c",
              categories_userName: "categories_HJReturnC1",
              categories_userText: "categories_HJReturnC2",
            },
          ],
        },
      ],
    },
  ];

  /**
   * returns all settings defaults as object
   *
   * @param {String} language
   * @returns {Object}
   */
  static defaultCategories() {
    let def = {};
    Categories.categories.forEach((category) => {
      let i18nKeys = [];
      category.properties.forEach((p) => {
        if (p.i18n) {
          i18nKeys.push(p.name);
        }
      });
      if ("default" in category) {
        def[category.name] = [];
        category.default.forEach((item) => {
          let newItem = {};
          Object.keys(item).forEach((key) => {
            if (i18nKeys.includes(key)) {
              newItem[key] = _(item[key]);
            } else {
              newItem[key] = item[key];
            }
          });
          def[category.name].push(newItem);
        });
      }
    });
    return def;
  }

  /**
   * retrieve category definition by name
   *
   * @param {String} name
   * @returns {Object}
   */
  static categoryByName(name) {
    for (let i = 0; i < Categories.categories.length; i++) {
      if (Categories.categories[i].name == name) {
        return Categories.categories[i];
      }
    }
  }

  #$div;
  #lists;
  #palette;

  /**
   * class constructor
   *
   * @param {JQuery} $div
   * @param {Object} lists
   * @param {String} palette
   */
  constructor($div, lists, palette) {
    this.#$div = $div;
    this.#lists = lists;
    this.#palette = palette;

    Categories.categories.forEach((list) => {
      let $examples;
      let $palettes;
      if (list.examples) {
        if (list.examples.length) {
          $examples = $(`<div class="dropdown" style="margin-right:5px">`);
          let $button = $(
            `<button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" style="margin:0">`,
          ).html(_("categories_example"));
          let $ul = $(`<ul class="dropdown-menu">`);
          list.examples.forEach((example) => {
            let $example = $(
              `<li><a class="dropdown-item">${_(example.name)}</a></li>`,
            );
            $example.on("click", () => this.#setList(list, example));
            $ul.append($example);
          });
          $examples.append($button.append($ul));
        }
        $palettes = $(`<div class="dropdown">`);
        let $button = $(
          `<button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" style="margin:0">`,
        );
        let $ul = $(`<ul class="dropdown-menu">`);
        Categories.colors.forEach((color) => {
          let $color = $(
            `<li><a class="dropdown-item">${_(color.name)}</a></li>`,
          );
          $color.on("click", () => this.#colorList(list, color));
          $ul.append($color);
        });
        $palettes.append(
          $button.append($(`<i class="fa-solid fa-palette"></i>`), $ul),
        );
      }
      this.#$div.append(
        $("<div>").css("height", "15px"),
        $("<div>")
          .attr({
            style: "display:flex; justify-content:space-between",
            class: "section-header",
          })
          .append($("<div>").html(`${_(list.name)} ${_(list.info)}`))
          .append(
            $("<div>").css("display", "flex").append($examples, $palettes),
          ),
      );
      this.#$div.append(
        $("<div>").attr({
          id: `${list.name}`,
          style:
            "margin:10px; display:grid; gap:10px 20px; grid-template-columns:max-content max-content 0.4fr",
        }),
      );
    });
  }

  // getters and setters

  get div() {
    return this.#$div;
  }

  get lists() {
    // before returning the lists all form values need to be copied in
    Categories.categories.forEach((list) => {
      this.#saveItems(list);
    });
    return this.#lists;
  }

  /**
   * populate form using provided category values
   *
   * @param {Object} lists
   */
  populate(lists) {
    if (lists) {
      this.#lists = lists;
    }
    Categories.categories.forEach((list) => {
      this.#fillList(list);
    });
  }

  /**
   * show a list's current values
   *
   * @param {Object} list
   */
  #fillList(list) {
    let palette = this.#palette;
    let entries = this.#lists[list.name];
    let id = `#${list.name}`;
    let $addButton = $(
      `<button type="button" class="btn btn-success btn-sm" title="${_(
        "categories_addEntry",
      )}"><i class="fas fa-plus"></i></button>`,
    );
    $addButton.on("click", () => this.#addListItem(list));
    let $clearButton = $(
      `<button type="button" class="btn btn-outline-danger btn-sm" onclick="clearList('${
        list.name
      }')" title="${_(
        "categories_clearList",
      )}"><i class="fas fa-trash"></i></button>`,
    );
    $clearButton.on("click", () => this.#clearList(list));
    $(id).empty();
    $(id).append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; place-self:center center",
        })
        .append($addButton, $clearButton),
    );
    for (let i = 0; i < list.properties.length; i++) {
      $(id).append(
        $("<div>")
          .attr({
            style: `grid-column:${i + 2}/span 1; place-self:center start`,
          })
          .html(_(list.properties[i].name)),
      );
    }

    for (let entryNo = 0; entryNo < entries.length; entryNo++) {
      let html = "";
      let $upButton;
      let $downButton;
      if (entryNo > 0) {
        $upButton = $(
          ` <button type="button" class="btn btn-secondary btn-sm" title="${_(
            "categories_moveEntryUp",
          )}"><i class="fa-solid fa-arrow-up"></i></button>`,
        );
        $upButton.on("click", () => this.#moveItem(list, entryNo, true));
      }
      if (entryNo < entries.length - 1) {
        $downButton = $(
          ` <button type="button" class="btn btn-secondary btn-sm" title="${_(
            "categories_moveEntryDown",
          )}"><i class="fa-solid fa-arrow-down"></i></button>`,
        );
        $downButton.on("click", () => this.#moveItem(list, entryNo, false));
      }
      let $deleteButton = $(
        `<button type="button" class="btn btn-outline-danger btn-sm" title="${_(
          "categories_deleteEntry",
        )}"><i class="fas fa-trash"></i></button>`,
      );
      $deleteButton.on("click", () => this.#deleteItem(list, entryNo));
      $(id).append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 1; place-self:start center",
          })
          .append($upButton, $downButton, $deleteButton, $(html)),
      );
      for (let i = 0; i < list.properties.length; i++) {
        let html = "";
        if (list.properties[i].type == "text") {
          html = `<input type="text" class="form-control form-control-sm" spellcheck="false" value="${Util.escapeHTML(
            entries[entryNo][list.properties[i].name],
          )}" id="${list.properties[i].name}-${entryNo}" style="width:100%">`;
        }
        if (list.properties[i].type == "textarea") {
          html = `<textarea spellcheck="false" class="form-control form-control-sm" id="${
            list.properties[i].name
          }-${entryNo}" style="height:1px; width:100%">${Util.escapeHTML(
            entries[entryNo][list.properties[i].name],
          )}</textarea>`;
        }
        if (list.properties[i].type == "color") {
          html = `<input class="colorPicker" value="${
            entries[entryNo][list.properties[i].name]
          }" id="${list.properties[i].name}-${entryNo}"></input>`;
        }
        $(id).append(
          $("<div>")
            .attr({
              style: `grid-column:${i + 2}/span 1; place-self:start stretch`,
            })
            .html(html),
        );
      }
    }
    // adjust textareas heights
    setTimeout(
      () =>
        $(id)
          .find("textarea")
          .each(function (i, ele) {
            ele.style.height = `${ele.scrollHeight + 2}px`;
          }),
      250,
    );
    // set all color pickers
    $(id)
      .find(".colorPicker")
      .each(function (i, ele) {
        $(ele).spectrum({
          type: "color",
          showPalette: palette != noPalette,
          palette: systemPalettes[palette],
          showInput: true,
          preferredFormat: "hex",
          showInitial: true,
          allowEmpty: false,
          showAlpha: false,
          clickoutFiresChange: false,
          cancelText: _("colorpicker_cancel"),
          chooseText: _("colorpicker_choose"),
          clearText: _("colorpicker_empty"),
          noColorSelectedText: _("colorpicker_nocolor"),
          containerClassName: "dim",
        });
      });
  }

  /**
   * update list from form values
   *
   * @param {Object} list
   */
  #saveItems(list) {
    let entries = this.#lists[list.name];
    $(`#${list.name}`)
      .find("[id]")
      .each(function () {
        let [name, no] = $(this).attr("id").split("-");
        if (!entries[no]) {
          entries[no] = {};
        }
        entries[no][name] = $(this).val();
      });
  }

  /**
   * add an item to a list
   *
   * @param {Object} list
   */
  #addListItem(list) {
    this.#saveItems(list);
    let o = { id: uuid() };
    list.properties.forEach((property) => {
      o[property.name] = property.default;
    });
    this.#lists[list.name].push(o);
    this.#fillList(list);
  }

  /**
   * delete all items in a list
   *
   * @param {Object} list
   */
  #clearList(list) {
    this.#lists[list.name] = [];
    this.#fillList(list);
  }

  /**
   * change position of a list item
   *
   * @param {Object} list
   * @param {Number} entryNo
   * @param {Boolean} up move up or down
   */
  #moveItem(list, entryNo, up) {
    this.#saveItems(list);
    let entries = this.#lists[list.name];
    let entry = entries.splice(entryNo, 1);
    entries.splice(entryNo - (up ? 1 : -1), 0, entry[0]);
    this.#fillList(list);
  }

  /**
   * delete a list item
   *
   * @param {Object} list
   * @param {Number} entryNo
   */
  #deleteItem(list, entryNo) {
    this.#saveItems(list);
    this.#lists[list.name].splice(entryNo, 1);
    this.#fillList(list);
  }

  /**
   * fill a categories list with values provided by an example
   *
   * @param {Object} list
   * @param {Object} example
   */
  #setList(list, example) {
    this.#lists[list.name] = [];
    for (let i = 0; i < example.properties.length; i++) {
      this.#lists[list.name][i] = { id: uuid() };
      Object.entries(example.properties[i]).forEach(([k, v]) => {
        this.#lists[list.name][i][k] = _(v);
      });
    }
    this.#fillList(list);
  }

  /**
   * fill the color fields of a list, leaving all other parameters unchanged
   *
   * @param {Object} list
   * @param {Object} color
   */
  #colorList(list, color) {
    this.#saveItems(list);
    let cols = color.colors ?? Util.randomColors(color.random);
    for (let i = 0; i < cols.length; i++) {
      if (!this.#lists[list.name][i]) {
        this.#lists[list.name][i] = {};
      }
      list.properties.forEach((prop) => {
        if (prop.type == "color") {
          this.#lists[list.name][i][prop.name] = cols[i];
        }
        if (!this.#lists[list.name][i][prop.name]) {
          this.#lists[list.name][i][prop.name] = "";
        }
      });
    }
    this.#fillList(list);
  }
}
