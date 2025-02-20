class Filter {
  /**
   * filter definition
   *
   * @static
   */
  static filters = [
    {
      group: "filter_sizes",
      filters: [
        {
          name: "filter_minCharacters",
          negate: "filter_maxCharacters",
          type: "number",
          default: 1,
          min: 1,
          func: function (negate, value, text) {
            let t = text.characters >= value;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_minWords",
          negate: "filter_maxWords",
          type: "number",
          default: 1,
          min: 1,
          func: function (negate, value, text) {
            let t = text.words >= value;
            return negate ? !t : t;
          },
        },
      ],
    },
    {
      group: "filter_objects",
      filters: [
        {
          name: "filter_minObjects",
          negate: "filter_maxObjects",
          type: "number",
          default: 1,
          min: 1,
          func: function (negate, value, text) {
            let t = text.objectCount >= value;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_hasObject",
          negate: "filter_hasntObject",
          type: "object",
          func: function (negate, value, text) {
            let t =
              value == UUID0
                ? Boolean(text.objectCount)
                : value in text.objects;
            return negate ? !t : t;
          },
        },
      ],
    },
    {
      group: "filter_tree",
      filters: [
        {
          name: "filter_isLevel",
          negate: "filter_isntLevel",
          type: "number",
          default: 1,
          min: 1,
          func: function (negate, value, text) {
            let t = theTextTree.getLevel(text.id) == value;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_minLevel",
          negate: "filter_maxLevel",
          type: "number",
          default: 1,
          min: 1,
          func: function (negate, value, text) {
            let t = theTextTree.getLevel(text.id) >= value;
            return negate ? !t : t;
          },
        },
      ],
    },
    {
      group: "filter_name",
      filters: [
        {
          name: "filter_nameIncludes",
          negate: "filter_nameExcludes",
          type: "text",
          default: "",
          func: function (negate, value, text) {
            let t = text.name.toLowerCase().includes(value.toLowerCase());
            return negate ? !t : t;
          },
        },
        {
          name: "filter_nameStarts",
          negate: "filter_nameStartsNot",
          type: "text",
          default: "",
          func: function (negate, value, text) {
            let t = text.name.toLowerCase().startsWith(value.toLowerCase());
            return negate ? !t : t;
          },
        },
        {
          name: "filter_nameEnds",
          negate: "filter_nameEndsNot",
          type: "text",
          default: "",
          func: function (negate, value, text) {
            let t = text.name.toLowerCase().endsWith(value.toLowerCase());
            return negate ? !t : t;
          },
        },
      ],
    },
    {
      group: "filter_properties",
      filters: [
        {
          name: "filter_locked",
          negate: "filter_unlocked",
          type: null,
          func: function (negate, value, text) {
            let t = !text.editable;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_textstatus",
          negate: "filter_notStatus",
          type: "textstatus",
          func: function (negate, value, text) {
            let t =
              value == UUID0 ? text.status != value : text.status == value;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_texttype",
          negate: "filter_notType",
          type: "texttype",
          func: function (negate, value, text) {
            let t = value == UUID0 ? text.type != value : text.type == value;
            return negate ? !t : t;
          },
        },
        {
          name: "filter_textuser",
          negate: "filter_notUser",
          type: "textuser",
          func: function (negate, value, text) {
            let t = value == UUID0 ? text.user != value : text.user == value;
            return negate ? !t : t;
          },
        },
      ],
    },
    {
      group: "filter_time",
      filters: [
        {
          name: "filter_minCreated",
          negate: "filter_maxCreated",
          type: "time",
          default: 0, // this is transposed to current time on filter creation
          func: function (negate, value, text) {
            return negate
              ? Math.floor(text.created.epochSeconds / 60000) * 60000 <= value
              : Math.floor(text.created.epochSeconds / 60000) * 60000 >= value;
          },
        },
        {
          name: "filter_minChanged",
          negate: "filter_maxChanged",
          type: "time",
          default: 0, // this is transposed to current time on filter creation
          func: function (negate, value, text) {
            return negate
              ? Math.floor(text.changed.epochSeconds / 60000) * 60000 <= value
              : Math.floor(text.changed.epochSeconds / 60000) * 60000 >= value;
          },
        },
      ],
    },
  ];

  /**
   * test a filter
   *
   * @static
   * @param {Object} theFilter
   * @param {String} text
   * @returns {Boolean} true if the given text fulfills the filter criteria
   */
  static applyFilter(theFilter, text) {
    let r = true;
    Filter.filters.forEach((filterGroup) => {
      filterGroup.filters.forEach((filter) => {
        if (filter.name == theFilter.type && filter.func) {
          r = filter.func(theFilter.negate, theFilter.value, text);
        }
      });
    });
    return r;
  }

  #theFilters; // filter slots
  #$filterGrid; // filter grid jquery
  #validator; // validate funtion
  #objectList;
  #statusList;
  #typeList;
  #userList;

  /**
   * class constructor
   *
   * @param {jQuery} $div necessary
   * @param {*} validateFunction necessary
   * @param {Object[]} filters necessary
   */
  constructor(
    $div,
    validateFunction,
    filters,
    objectList,
    statusList,
    typeList,
    userList,
  ) {
    this.#theFilters = filters;
    this.#validator = validateFunction;
    this.#objectList = objectList;
    this.#statusList = statusList;
    this.#typeList = typeList;
    this.#userList = userList;
    this.#$filterGrid = $("<div>").attr({
      id: "filterGrid",
      style:
        "margin-top:30px; padding-bottom:10px; display:grid; row-gap:20px; column-gap:10px; grid-template-columns: 50px max-content max-content 25px",
    });
    $div.append(this.#$filterGrid);
    this.#showFilters();
  }

  // getters and setters

  get asis() {
    return this.#theFilters;
  }

  get filters() {
    console.log("getting filters");
    let i = 0;
    this.#theFilters.forEach((theFilter) => {
      theFilter.negate = $(`#negate_${i}`).prop("checked");
      theFilter.value = null;
      Filter.filters.forEach((filterGroup) => {
        filterGroup.filters.forEach((filter) => {
          if (theFilter.type == filter.name) {
            switch (filter.type) {
              case "number":
              case "text":
              case "textstatus":
              case "texttype":
              case "textuser":
              case "object":
                theFilter.value = $(`#value_${i}`).val();
                break;
              case "time":
                theFilter.value = parseInt(
                  moment($(`#value_${i}`).val(), _("filter_timeFormat")).format(
                    "x",
                  ),
                );
                break;
            }
          }
        });
      });
      i++;
    });
    return this.#theFilters;
  }

  // private methods

  /**
   * add a filter slot
   */
  #addFilter() {
    this.#theFilters.push({
      type: Filter.filters[0].filters[0].name,
      value: Filter.filters[0].filters[0].default,
      negate: false,
    });
    this.#showFilters();
  }

  /**
   * delete a filter slot
   *
   * @param {Number} i slot number
   */
  #deleteFilter(i) {
    this.#theFilters.splice(i, 1);
    this.#showFilters();
  }

  /**
   * display the filter grid with all ui elements and the current filter slots
   */
  #showFilters() {
    this.#$filterGrid.empty();
    this.#$filterGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 5; justify-self:stretch;",
          class: "section-header",
        })
        .html(_("filter_filter")),
    );
    // add filter
    let $button = $("<button>")
      .attr({
        class: "btn btn-success btn-sm",
        title: `${_("addFilter")}`,
      })
      .html(`<i class="fas fa-plus"></i>`);
    $button.on("click", () => this.#addFilter());
    this.#$filterGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; place-self:center center",
        })
        .append($button),
    );
    // filter type
    this.#$filterGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; place-self: center start",
        })
        .html(_("filter_type")),
    );
    // filter parameter
    this.#$filterGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 1; place-self: center start",
        })
        .html(_("filter_value")),
    );
    // filter negation
    this.#$filterGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:4/span 1; place-self: center center",
        })
        .html(
          `<i class="fa-solid fa-not-equal" title="${_("filter_negate")}"></i>`,
        ),
    );

    for (let i = 0; i < this.#theFilters.length; i++) {
      // delete button
      let $deleteButton = $("<button>")
        .attr({
          class: "btn btn-outline-danger btn-sm",
          title: `${_("deleteFilter")}`,
        })
        .html(`<i class="fas fa-trash"></i>`);
      $deleteButton.on("click", () => this.#deleteFilter(i));
      this.#$filterGrid.append(
        $("<div>")
          .attr({
            style:
              "grid-column:1/span 1; justify-self:center; align-self:center",
          })
          .append($deleteButton),
      );

      // filter type
      let html = `<select class="form-select form-select-sm" id="filter_${i}">`;
      Filter.filters.forEach((filterGroup) => {
        html += `<optgroup label="${_(filterGroup.group)}">`;
        filterGroup.filters.forEach((filter) => {
          html += `<option value="${filter.name}"${
            this.#theFilters[i].type == filter.name ? " selected" : ""
          }>${this.#theFilters[i].negate ? _(filter.negate) : _(filter.name)}</option>`;
        });
        html += "</optgroup>";
      });
      html += "</select>";
      this.#$filterGrid.append(
        $("<div>")
          .attr({
            style: "grid-column:2/span 1;",
          })
          .html(html),
      );
      $(`#filter_${i}`).on("change", () => {
        this.#theFilters[i].type = $(`#filter_${i}`).val();
        Filter.filters.forEach((filterGroup) => {
          filterGroup.filters.forEach((filter) => {
            if (filter.name == $(`#filter_${i}`).val()) {
              this.#theFilters[i].value = filter.default;
            }
          });
        });
        this.#showFilters();
      });
      // filter value
      Filter.filters.forEach((filterGroup) => {
        filterGroup.filters.forEach((filter) => {
          if (this.#theFilters[i].type == filter.name) {
            let $render = this.#renderFilter(i);
            if ($render) {
              this.#$filterGrid.append(
                $("<div>")
                  .attr({
                    style: "grid-column:3/span 1;",
                  })
                  .append($render),
              );
              if (this.#validator) {
                $render.on("input", this.#validator);
              }
            }
          }
        });
      });
      // negate filter
      this.#$filterGrid.append(
        $("<div>")
          .attr({
            style:
              "grid-column:4/span 1; justify-self:center; align-self:center",
          })
          .append(
            $("<input>").attr({
              type: "checkbox",
              class: "form-check-input",
              id: `negate_${i}`,
              checked: this.#theFilters[i].negate,
            }),
          ),
      );
      $(`#negate_${i}`).on("change", () => {
        this.#theFilters[i].negate = $(`#negate_${i}`).prop("checked");
        this.#showFilters();
      });
    }
    if (this.#validator) {
      this.#validator();
    }
  }

  /**
   * render a filter slot
   *
   * @param {Number} filterNo
   * @returns {JQuery} rendered filter
   */
  #renderFilter(filterNo) {
    let $render;

    Filter.filters.forEach((filterGroup) => {
      filterGroup.filters.forEach((filter) => {
        if (this.#theFilters[filterNo].type == filter.name && filter.type) {
          switch (filter.type) {
            case "number":
              $render = $("<input>").attr({
                type: "number",
                class: "form-control form-control-sm",
                id: `value_${filterNo}`,
                title: "",
                value: this.#theFilters[filterNo].value,
                min: filter.min ?? null,
              });
              break;
            case "text":
              $render = $("<input>").attr({
                type: "text",
                class: "form-control form-control-sm",
                id: `value_${filterNo}`,
                title: "",
                required: true,
                value: this.#theFilters[filterNo].value,
              });
              break;
            case "time":
              $render = $("<input>").attr({
                type: "text",
                class: "form-control form-control-sm",
                id: `value_${filterNo}`,
                title: "",
                required: true,
                value: moment(
                  this.#theFilters[filterNo].value || Date.now(),
                  "x",
                ).format(_("filter_timeFormat")),
              });
              $render.daterangepicker({
                singleDatePicker: true,
                timePicker: true,
                timePicker24Hour: true,
                timePickerSeconds: false,
                showDropdowns: true,
                showISOWeekNumbers: true,
                linkedCalendars: false,
                // drops: "auto", // auto dropping broken?
                locale: {
                  format: _("filter_timeFormat"),
                  applyLabel: _("filter_timeApply"),
                  cancelLabel: _("filter_timeCancel"),
                  weekLabel: _("filter_timeWeek"),
                  firstDay: parseInt(_("filter_firstDayOfWeek")),
                  daysOfWeek: [
                    _("time_sundayShort"),
                    _("time_mondayShort"),
                    _("time_tuesdayShort"),
                    _("time_wednesdayShort"),
                    _("time_thursdayShort"),
                    _("time_fridayShort"),
                    _("time_saturdayShort"),
                  ],
                  monthNames: [
                    _("time_januaryLong"),
                    _("time_februaryLong"),
                    _("time_marchLong"),
                    _("time_aprilLong"),
                    _("time_mayLong"),
                    _("time_juneLong"),
                    _("time_julyLong"),
                    _("time_augustLong"),
                    _("time_septemberLong"),
                    _("time_octoberLong"),
                    _("time_novemberLong"),
                    _("time_decemberLong"),
                  ],
                },
              });
              break;
            case "object":
              $render = $("<select>").attr({
                class: "form-select form-select-sm",
                id: `value_${filterNo}`,
              });
              $render.append(
                $("<option>")
                  .attr({
                    value: UUID0,
                    style: "text-align:center; font-style:italic",
                  })
                  .prop("selected", this.#theFilters[filterNo].value == UUID0)
                  .text(_("filter_anyObject")),
              );
              this.#objectList.forEach((object) => {
                $render.append(
                  $("<option>")
                    .attr("value", object.id)
                    .prop(
                      "selected",
                      this.#theFilters[filterNo].value == object.id,
                    )
                    .text(object.name),
                );
              });
              break;
            case "textstatus":
              $render = $("<select>").attr({
                class: "form-select form-select-sm",
                id: `value_${filterNo}`,
              });
              $render.append(
                $("<option>")
                  .attr({
                    value: UUID0,
                    style: "text-align:center; font-style:italic",
                  })
                  .prop("selected", this.#theFilters[filterNo].value == UUID0)
                  .text(_("filter_hasValue")),
              );
              this.#statusList.forEach((status) => {
                $render.append(
                  $("<option>")
                    .attr("value", status.id)
                    .prop(
                      "selected",
                      this.#theFilters[filterNo].value == status.id,
                    )
                    .text(status.name),
                );
              });
              break;
            case "texttype":
              $render = $("<select>").attr({
                class: "form-select form-select-sm",
                id: `value_${filterNo}`,
              });
              $render.append(
                $("<option>")
                  .attr({
                    value: UUID0,
                    style: "text-align:center; font-style:italic",
                  })
                  .prop("selected", this.#theFilters[filterNo].value == UUID0)
                  .text(_("filter_hasValue")),
              );
              this.#typeList.forEach((type) => {
                $render.append(
                  $("<option>")
                    .attr("value", type.id)
                    .prop(
                      "selected",
                      this.#theFilters[filterNo].value == type.id,
                    )
                    .text(type.name),
                );
              });
              break;
            case "textuser":
              $render = $("<select>").attr({
                class: "form-select form-select-sm",
                id: `value_${filterNo}`,
              });
              $render.append(
                $("<option>")
                  .attr({ "value": UUID0, style: "text-align:center; font-style:italic" })
                  .prop("selected", this.#theFilters[filterNo].value == UUID0)
                  .text(_("filter_hasValue")),
              );
              this.#userList.forEach((user) => {
                $render.append(
                  $("<option>")
                    .attr("value", user.id)
                    .prop(
                      "selected",
                      this.#theFilters[filterNo].value == user.id,
                    )
                    .text(user.name),
                );
              });
              break;
          }
        }
      });
    });
    return $render;
  }
}
