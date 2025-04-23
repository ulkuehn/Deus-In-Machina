/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of Scheme class
 */

/**
 * @classdesc data and functions for object schemes (infos given to an object)
 */
class Scheme {
  /**
   * show file in explorer
   *
   * @param {String} path
   */
  static showFile(path) {
    ipcRenderer.invoke("mainProcess_openFileInExplorer", decodeURI(path));
  }

  /**
   * list of available information types
   * @static
   */
  static #types = [
    "schemeTypes_header", // named separator
    "schemeTypes_relation", // connection to another object
    "schemeTypes_checkbox", // checkbox
    "schemeTypes_range", // numerical slider
    "schemeTypes_select", // dropdown
    "schemeTypes_radio", // radio
    "schemeTypes_color", // color picker
    "schemeTypes_text", // single text line
    "schemeTypes_editor", // richt text editor
    "schemeTypes_date", // calendar (single date)
    "schemeTypes_dateRange", // calendar (date range)
    "schemeTypes_map", // geographical map
    "schemeTypes_file", // file attachment
  ];

  /**
   * list of parameters per type
   * @static
   *
   * info: i18n key to user description of parameter
   * default: default value
   * setting: key to settings object if param is configurable in settings
   * style: css for displaying the param
   */
  static params = {
    schemeTypes_relation: [
      {
        info: "Scheme_relationReverse",
        type: "text",
        default: "",
      },
    ],
    schemeTypes_editor: [
      {
        info: "Scheme_editorHeight",
        setting: "schemeEditorHeight",
        type: "number",
        style: "width:80px; text-align:right",
      },
    ],
    schemeTypes_range: [
      {
        info: "Scheme_rangeMin",
        type: "number",
        default: "0",
        style: "width:80px; text-align:right",
      },
      {
        info: "Scheme_rangeMax",
        type: "number",
        default: "100",
        style: "width:80px; text-align:right",
      },
      {
        info: "Scheme_rangeStep",
        type: "number",
        default: "1",
        style: "width:80px; text-align:right",
      },
      {
        info: "Scheme_rangeUnit",
        type: "text",
        default: "",
        style: "width:150px",
      },
    ],
    schemeTypes_select: [
      {
        info: "Scheme_select",
        type: "text",
        default: "Scheme_selectDefault",
        style: "width:100%; min-width:250px",
      },
    ],
    schemeTypes_radio: [
      {
        info: "Scheme_radio",
        type: "text",
        default: "Scheme_radioDefault",
        style: "width:100%; min-width:250px",
      },
    ],
    schemeTypes_date: [
      {
        info: "Scheme_dateMinYear",
        type: "number",
        default: new Date().getFullYear() - 10,
        style: "width:80px; text-align:right",
      },
      {
        info: "Scheme_dateMaxYear",
        type: "number",
        default: new Date().getFullYear() + 10,
        style: "width:80px; text-align:right",
      },
    ],
    schemeTypes_dateRange: [
      {
        info: "Scheme_dateMinYear",
        type: "number",
        default: new Date().getFullYear() - 10,
        style: "width:80px; text-align:right",
      },
      {
        info: "Scheme_dateMaxYear",
        type: "number",
        default: new Date().getFullYear() + 10,
        style: "width:80px; text-align:right",
      },
    ],
    schemeTypes_map: [
      {
        info: "Scheme_mapHeight",
        type: "number",
        setting: "schemeMapHeight",
        style: "width:80px; text-align:right",
      },
    ],
  };

  #objectID; // id of the styledObject this scheme is connected to
  #properties; // properties of the scheme items of this styledObject
  #parentSchemes; // ancestor schemes
  #scheme; // scheme object
  #formats;
  #files;
  #items; // mapping from ids to complex objects (leaflet map or quill editor)
  #settings; // effective settings
  #fonts; // used fonts

  /**
   * class constructor
   *
   * @param {Object} settings effective settings
   * @param {String} objectID
   * @param {String} schemeDiv
   * @param {Oject} properties
   * @param {Object[]} parentSchemes scheme definitions of all parent objects
   * @param {Object[]} scheme scheme definition of the current object
   * @param {String[]} fonts
   * @param {Object} formats
   * @param {Object} files
   */
  constructor(
    settings,
    objectID,
    properties,
    parentSchemes,
    scheme,
    fonts,
    formats,
    files,
  ) {
    this.#settings = settings;
    this.#objectID = objectID;
    this.#properties = properties ?? {};
    this.#parentSchemes = parentSchemes;
    this.#scheme = scheme ?? [];
    this.#fonts = fonts;
    this.#formats = formats;
    this.#files = files;
    this.#items = {};
  }

  // getters and setters

  get properties() {
    return this.#properties;
  }

  get items() {
    return this.#scheme;
  }

  /**
   * collect the properties of the object represented by this scheme
   *
   * @param {Object} objectNames mapping of object ids to object names
   * @returns {Object[]}
   */
  directProperties(objectNames) {
    let settings = theSettings.effectiveSettings();
    let result = [];
    [
      ...this.#parentSchemes,
      { id: this.#objectID, scheme: this.#scheme },
    ].forEach((idScheme) => {
      idScheme.scheme.forEach((item) => {
        let content = "";
        if (item.type == "schemeTypes_header") {
          content = Util.escapeHTML(item.name);
        } else if (
          idScheme.id in this.#properties &&
          item.id in this.#properties[idScheme.id]
        ) {
          let value = this.#properties[idScheme.id][item.id];
          switch (item.type) {
            case "schemeTypes_relation":
              content = Util.escapeHTML(objectNames[value]);
              break;
            case "schemeTypes_checkbox":
              content = value
                ? `<i class="fa-regular fa-square-check"></i>`
                : `<i class="fa-regular fa-square"></i>`;
              break;
            case "schemeTypes_text":
            case "schemeTypes_select":
            case "schemeTypes_radio":
              content = Util.escapeHTML(value);
              break;
            case "schemeTypes_range":
              content =
                value +
                (item.params[3] ? " " + Util.escapeHTML(item.params[3]) : "");
              break;
            case "schemeTypes_date":
              content = moment(value[0], "x").format(_("Scheme_dateFormat"));
              break;
            case "schemeTypes_dateRange":
              content = `${moment(value[0], "x").format(_("Scheme_dateFormat"))}${_("Scheme_dateRangeSeparator")}${moment(value[1], "x").format(_("Scheme_dateFormat"))} (${Util.daysToHuman(
                moment(value[1], "x").diff(moment(value[0], "x"), "days"),
              )})`;
              break;
            case "schemeTypes_color":
              for (let c = 255; c >= 0; c -= 55) {
                let h = ("0" + c.toString(16)).slice(-2);
                content += `<div style="display:inline-block; vertical-align:top; margin-right:20px; height:40px; width:40px; border:#${h}${h}${h} solid 10px; background-color:${value}"></div>`;
              }
              break;
            case "schemeTypes_editor":
              // the class="ql-editor" attribute is a bit of a hack to streamline styling with editor
              content = `<div class="ql-editor" style="max-height:${item.params[0]}px; border:1px solid black; overflow:auto; padding:5px; user-select:text">${Exporter.delta2HTML(value.ops)}</div>`;
              break;
            case "schemeTypes_map":
              content = `${_("Scheme_locationMap")} ${_(
                "Scheme_locationLatLong",
                {
                  lat: value.center.lat.toFixed(3),
                  lng: value.center.lng.toFixed(3),
                },
              )}`;
              value.marker.forEach((marker) => {
                content += `<br><span class="fa-stack fa-sm" style="width:24px;"><i class="fa-solid fa-location-pin fa-stack-2x" style="color:black"></i><i class="fa-solid fa-location-pin fa-stack-1x" style="color:${marker.color}"></i></span> ${Util.escapeHTML(marker.info)} (${_(
                  "Scheme_locationLatLong",
                  {
                    lat: marker.latLng.lat.toFixed(3),
                    lng: marker.latLng.lng.toFixed(3),
                  },
                )}) &mdash; <a style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','https://www.openstreetmap.org/?mlat=${marker.latLng.lat}&mlon=${marker.latLng.lng}&zoom=${value.zoom}');">${_("Scheme_locationOSM")}</a> &mdash; <a style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','https://www.google.com/maps?ll=${marker.latLng.lat},${marker.latLng.lng}&z=${value.zoom}&t=m&q=${marker.latLng.lat},${marker.latLng.lng}');">${_("Scheme_locationGMaps")}</a> &mdash; <a style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','https://bing.com/maps/default.aspx?cp=${value.center.lat}~${value.center.lng}&style=r&lvl=${value.zoom}&sp=Point.${marker.latLng.lat}_${marker.latLng.lng}_${Util.escapeHTML(marker.info)}');">${_("Scheme_locationBing")}</a>`;
              });
              break;
            case "schemeTypes_file":
              content =
                `<div style="display:grid; grid-template-columns:max-content max-content; column-gap:15px">` +
                `<div style="grid-column:1; grid-row:1/span 3"><button class="btn btn-outline-secondary btn-sm" title="${_("Scheme_loadFile")}" onclick="ipcRenderer.invoke('mainProcess_loadFile', ['${value.id}','${this.#files[value.id].extension}'])"><i class="fa-solid fa-eye"></i></button></div>` +
                `<div style="grid-column:2; justify-self:end">${_(
                  "Scheme_fileName",
                )}:</div>` +
                `<div style="grid-column:3"><i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer; margin-right:10px" title="${_(
                  "Scheme_showFile",
                )}" onclick="Scheme.showFile('${encodeURI(
                  value.filePath,
                )}')"></i>${Util.escapeHTML(value.filePath)}</div>` +
                `<div style="grid-column:2; justify-self:end">${_("Scheme_fileSize")}:</div>` +
                `<div style="grid-column:3">${Util.formatBytes(this.#files[value.id].size)}</div>` +
                `<div style="grid-column:2; justify-self:end">${_("Scheme_fileTime")}:</div>` +
                `<div style="grid-column:3">${new Timestamp(
                  value.fileModtime,
                ).toLocalString(settings.dateTimeFormatLong)}</div></div>`;
              break;
          }
        }
        result.push({
          type: item.type == "schemeTypes_header" ? "" : item.type,
          name:
            item.name || item.type == "schemeTypes_header"
              ? Util.escapeHTML(item.name)
              : _(item.type),
          content: content,
        });
      });
    });
    return result;
  }

  /**
   * collect the reverse object relations of an object with given id
   *
   * @param {String} id id of the object to look for object relations of
   * @param {String} name name of this scheme's object
   * @returns {Object[]}
   */
  reverseProperties(id, name) {
    let result = [];
    [
      ...this.#parentSchemes,
      { id: this.#objectID, scheme: this.#scheme },
    ].forEach((idScheme) => {
      idScheme.scheme.forEach((item) => {
        if (item.type == "schemeTypes_relation" && item.params[0]) {
          let value =
            idScheme.id in this.#properties
              ? this.#properties[idScheme.id][item.id]
              : null;
          if (value != null && value == id)
            result.push({
              type: "schemeTypes_irelation",
              name: Util.escapeHTML(item.params[0]), // reverse relation name
              content: Util.escapeHTML(name),
            });
        }
      });
    });
    return result;
  }

  /**
   * fill the properties grid according to the parent's and own schemes using respective property values
   *
   * @param {*} objects
   */
  fillProperties(objects, $propertiesGrid, buttonHTML) {
    $propertiesGrid.empty();
    let firstEditor = true;
    $("#formatSheet").empty();

    [
      ...this.#parentSchemes,
      { id: this.#objectID, scheme: this.#scheme },
    ].forEach((idScheme) => {
      idScheme.scheme.forEach((item) => {
        if (item.type == "schemeTypes_header") {
          $propertiesGrid.append(
            $("<div>")
              .attr({
                style: "grid-column:1/span 4; justify-self:stretch",
                class: "section-header",
              })
              .html(Util.escapeHTML(item.name)),
          );
        } else {
          let value = null;
          if (
            idScheme.id in this.#properties &&
            item.id in this.#properties[idScheme.id]
          ) {
            value = this.#properties[idScheme.id][item.id];
          }

          // user info
          let info = item.name ? Util.escapeHTML(item.name) : _(item.type);
          if (item.type == "schemeTypes_relation" && item.params[0]) {
            info += ` <i class="fa-solid fa-arrow-right-arrow-left" title='${_("Scheme_reverseInfo", { relation: item.params[0] })}'></i>`;
          }
          $propertiesGrid.append(
            $("<div>")
              .attr({
                style: `grid-column:1/span 1; justify-self:end; align-self:start`,
              })
              .html(`<label for="active_${idScheme.id}_${item.id}">${info}</label>`),
          );
          // activation switch
          $propertiesGrid.append(
            $("<div>")
              .attr({
                style: `grid-column:2/span 1; justify-self:end; align-self:start`,
              })
              .html(
                `<div class="form-check form-switch"><input class="form-check-input" ${value != null ? "checked" : ""} id="active_${idScheme.id}_${item.id}" type="checkbox"></div>`,
              ),
          );
          $(`#active_${idScheme.id}_${item.id}`).on("click", () => {
            this.saveProperties($propertiesGrid);
            if (!(idScheme.id in this.#properties)) {
              this.#properties[idScheme.id] = {};
            }
            if ($(`#active_${idScheme.id}_${item.id}`).prop("checked")) {
              // switching on - set default values
              switch (item.type) {
                case "schemeTypes_relation":
                  this.#properties[idScheme.id][item.id] = this.#objectID;
                  break;
                case "schemeTypes_checkbox":
                  this.#properties[idScheme.id][item.id] = false;
                  break;
                case "schemeTypes_text":
                  this.#properties[idScheme.id][item.id] = "";
                  break;
                case "schemeTypes_range":
                  this.#properties[idScheme.id][item.id] = item.params[0];
                  break;
                case "schemeTypes_select":
                case "schemeTypes_radio":
                  this.#properties[idScheme.id][item.id] =
                    item.params[0].split("#")[0];
                  break;
                case "schemeTypes_dateRange":
                case "schemeTypes_date":
                  this.#properties[idScheme.id][item.id] = "";
                  break;
                case "schemeTypes_color":
                  this.#properties[idScheme.id][item.id] = "#000000";
                  break;
                case "schemeTypes_editor":
                  this.#properties[idScheme.id][item.id] = { ops: [] };
                  break;
                case "schemeTypes_map":
                  this.#properties[idScheme.id][item.id] = {
                    center: this.#settings.schemeMapBounds.center,
                    marker: [],
                    zoom: this.#settings.schemeMapBounds.zoom,
                  };
                  break;
                case "schemeTypes_file":
                  this.#properties[idScheme.id][item.id] = {};
                  break;
              }
              this.fillProperties(objects, $propertiesGrid, buttonHTML);
              $(`#active_${idScheme.id}_${item.id}`)[0].scrollIntoView({
                block: "center",
                inline: "nearest",
              });
            } else {
              // switching off - set null value
              this.#properties[idScheme.id][item.id] = null;
              this.fillProperties(objects, $propertiesGrid, buttonHTML);
            }
          });
          // content
          if (value != null) {
            switch (item.type) {
              case "schemeTypes_relation":
                this.#relationControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                  objects,
                );
                break;
              case "schemeTypes_checkbox":
                this.#checkboxControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                );
                break;
              case "schemeTypes_text":
                this.#textControl($propertiesGrid, idScheme.id, item.id, value);
                break;
              case "schemeTypes_range":
                this.#rangeControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                  item.params,
                );
                break;
              case "schemeTypes_select":
                this.#selectControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                  item.params[0].split("#"),
                );
                break;
              case "schemeTypes_radio":
                this.#radioControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                  item.params[0].split("#"),
                );
                break;
              case "schemeTypes_dateRange":
              case "schemeTypes_date":
                this.#calenderControl(
                  $propertiesGrid,
                  item.type == "schemeTypes_dateRange",
                  idScheme.id,
                  item.id,
                  value,
                  item.params[0],
                  item.params[1],
                );
                break;
              case "schemeTypes_color":
                this.#colorControl(
                  $propertiesGrid,
                  idScheme.id,
                  item.id,
                  value,
                );
                break;
              case "schemeTypes_editor":
                {
                  let height = this.#settings.schemeEditorHeight;
                  if (item.params[0].match(/^[0-9]+$/)) {
                    height = item.params[0];
                  }
                  this.#editorControl(
                    $propertiesGrid,
                    idScheme.id,
                    item.id,
                    value == "" ? [] : value,
                    `${height}px`,
                    this.#formats,
                    firstEditor,
                  );
                  firstEditor = false;
                  $(`#detach_${idScheme.id}_${item.id}`).on("click", () => {
                    this.saveProperties($propertiesGrid);
                    ipcRenderer.invoke("mainProcess_openWindow", [
                      "schemeEditor",
                      this.#settings.closingType,
                      true,
                      90,
                      90,
                      item.name ? item.name : _(item.type),
                      "./schemeEditorWindow/schemeEditorWindow.html",
                      "schemeEditorWindow_init",
                      null,
                      [
                        this.#settings,
                        idScheme.id,
                        item.id,
                        this.#properties[idScheme.id][item.id],
                        this.#formats,
                        this.#fonts,
                      ],
                    ]);
                  });
                }
                break;
              case "schemeTypes_map":
                {
                  $propertiesGrid.append(
                    $("<div>")
                      .attr({
                        style:
                          "grid-column:3/span 2; justify-self:end; margin-bottom:-5px",
                      })
                      .html(
                        `<button class="btn btn-sm simple-btn btn-outline-secondary" style="cursor:pointer" title="${_("Scheme_detach")}" id="detach_${idScheme.id}_${item.id}"><i class="fa-solid fa-arrow-up-right-from-square"></i>`,
                      ),
                  );

                  let height = this.#settings.schemeLocationHeight;
                  if (item.params[0].match(/^[0-9]+$/)) {
                    height = item.params[0];
                  }
                  this.#mapControl(
                    $propertiesGrid,
                    idScheme.id,
                    item.id,
                    value,
                    height,
                  );
                  $(`#detach_${idScheme.id}_${item.id}`).on("click", () => {
                    this.saveProperties($propertiesGrid);
                    ipcRenderer.invoke("mainProcess_openWindow", [
                      "schemeMap",
                      this.#settings.closingType,
                      true,
                      90,
                      90,
                      item.name ? item.name : _(item.type),
                      "./schemeMapWindow/schemeMapWindow.html",
                      "schemeMapWindow_init",
                      null,
                      [
                        this.#settings,
                        idScheme.id,
                        item.id,
                        this.#properties[idScheme.id][item.id],
                      ],
                    ]);
                  });
                }
                break;
              case "schemeTypes_file":
                this.#fileControl($propertiesGrid, idScheme.id, item.id, value);
                break;
            }
          }
        }
      });
    });

    // buttons
    if (this.#settings.closingType != "settingsWindow_closeByX") {
      $propertiesGrid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 4; justify-self:end; margin-top:40px",
          })
          .html(buttonHTML),
      );
    }
  }

  /**
   * render a object relation
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {Boolean} value
   * @param {Object[]} objects
   */
  #relationControl($propertiesGrid, id, item, value, objects) {
    let html = `<div class="input-group" style="display:inline-flex; width:fit-content"><input type="checkbox" class="btn-check" id="propertySort_${id}_${item}" ${theSettings.relationSortAlpha ? "checked" : ""}><label class="btn btn-sm simple-btn btn-outline-secondary" for="propertySort_${id}_${item}" title="${_("Scheme_sortAlpha")}"><i class="fa-solid fa-arrow-down-a-z"></i></label> <select class="form-select form-select-sm" style="width:fit-content" id="property_${id}_${item}" data-type="relation" onclick="openSelect(this,'${id}','${item}')" onblur="closeSelect(this,'${id}','${item}')">`;
    let i = 0;
    objects.forEach((object) => {
      html += `<option value="${object.id}" ${value == object.id ? "selected" : ""} ${this.#objectID == object.id ? "disabled" : ""} data-order="${i}" data-depth="${object.depth}" data-name="${object.name}">${Util.escapeHTML(
        this.#objectID == object.id && $("#objectName").val()
          ? $("#objectName").val()
          : object.name,
      )}</option>`;
      i++;
    });
    html += `</select></div>`;
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 1;",
        })
        .html(html),
    );
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:4/span 1; justify-self:end",
        })
        .html(
          `<button class="btn btn-sm simple-btn btn-outline-secondary" style="cursor:pointer" title="${_("Scheme_showObject")}" onclick="showObject('${id}','${item}')"><i class="fa-solid fa-eye"></i></button>`,
        ),
    );
    this.#sortOptions(id, item);
    $(`#propertySort_${id}_${item}`).on("click", () => {
      this.#sortOptions(id, item);
    });
  }

  /**
   * render a checkbox
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {Boolean} value
   */
  #checkboxControl($propertiesGrid, id, item, value) {
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .html(
          `<input class="form-check-input" type="checkbox" id="property_${id}_${item}" data-type="checkbox" ${
            value ? " checked" : ""
          }>`,
        ),
    );
  }

  /**
   * render a file input
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {*} value
   */
  #fileControl($propertiesGrid, id, item, value) {
    let $openButton = $(
      `<button class="btn btn-outline-secondary btn-sm" title="${_(
        "Scheme_openFile",
      )}"><i class="fa-solid fa-folder-open"></i></button>`,
    );
    $openButton.on("click", this.#openSchemeFile.bind(this, id, item));

    let $loadButton = $(
      `<button class="btn btn-outline-secondary btn-sm" id="filebutton_${id}_${item}" data-type="file" ${
        value ? "" : "disabled"
      } title="${_("Scheme_loadFile")}" data-time="${
        value.fileModtime || ""
      }" data-id="${value.id ?? ""}" data-path="${
        value && value.filePath ? Util.escapeHTML(value.filePath) : ""
      }" ><i class="fa-solid fa-eye"></i></button>`,
    );
    $loadButton.on("click", this.#loadSchemeFile.bind(this, id, item));

    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .append(
          $(
            `<div style="display:grid; column-gap:10px; grid-template-columns:max-content max-content max-content" id="property_${id}_${item}" type="file">`,
          ).append(
            $(`<div style="grid-column:1; grid-row:1/span 3"></div>`).append(
              $openButton,
            ),
            $(`<div style="grid-column:2; grid-row:1/span 3">`).append(
              $loadButton,
            ),
            `<div style="grid-column:3; justify-self:end">${_(
              "Scheme_fileName",
            )}:</div><div style="grid-column:4;" id="filename_${id}_${item}">${
              value && value.filePath
                ? `<i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer; margin-right:10px" title="${_(
                    "Scheme_showFile",
                  )}" onclick="Scheme.showFile('${encodeURI(
                    value.filePath,
                  )}')"></i>${Util.escapeHTML(value.filePath)}`
                : "---"
            }</div>`,
            `<div style="grid-column:3; justify-self:end">${_(
              "Scheme_fileSize",
            )}:</div><div style="grid-column:4" id="filesize_${id}_${item}">${
              value && value.id && value.id in this.#files
                ? Util.formatBytes(this.#files[value.id].size)
                : "---"
            }</div>`,
            `<div style="grid-column:3; justify-self:end">${_(
              "Scheme_fileTime",
            )}:</div><div style="grid-column:4" id="filetime_${id}_${item}">${
              value && value.fileModtime
                ? new Timestamp(value.fileModtime).toLocalString(
                    theSettings.dateTimeFormatLong,
                  )
                : "---"
            }</div>`,
          ),
        ),
    );
  }

  /**
   * open a new file
   * @private
   *
   * @param {String} id
   * @param {String} item
   */
  #openSchemeFile(id, item) {
    ipcRenderer.invoke("mainProcess_openFile", this.#files).then((result) => {
      if (!(result.fileID in this.#files)) {
        // file identifying values (extension, size, hash) are stored in the global table
        this.#files[result.fileID] = {
          extension: result.fileExt,
          size: result.fileSize,
          hash: result.fileHash,
        };
      }
      $(`#filename_${id}_${item}`).html(
        `<i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer; margin-right:10px" title="${_(
          "Scheme_showFile",
        )}" onclick="Scheme.showFile('${encodeURI(
          result.filePath,
        )}')"></i> ${Util.escapeHTML(result.filePath)}`,
      );
      $(`#filesize_${id}_${item}`).html(Util.formatBytes(result.fileSize));
      $(`#filetime_${id}_${item}`).html(
        new Timestamp(result.fileModtime).toLocalString(
          theSettings.dateTimeFormatLong,
        ),
      );
      $(`#filebutton_${id}_${item}`).prop("disabled", false);
      $(`#filebutton_${id}_${item}`).attr("data-id", result.fileID);
      // path and timestamp are not identifying and are kept with the object
      $(`#filebutton_${id}_${item}`).attr(
        "data-path",
        Util.escapeHTML(result.filePath),
      );
      $(`#filebutton_${id}_${item}`).attr("data-time", result.fileModtime);
    });
  }

  /**
   * show a file content
   * @private
   *
   * @param {String} id
   * @param {String} item
   */
  #loadSchemeFile(id, item) {
    ipcRenderer.invoke("mainProcess_loadFile", [
      $(`#filebutton_${id}_${item}`).attr("data-id"),
      this.#files[$(`#filebutton_${id}_${item}`).attr("data-id")].extension,
    ]);
  }

  /**
   * render a text line
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {String} value
   */
  #textControl($propertiesGrid, id, item, value) {
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .html(
          `<input type="text" class="form-control form-control-sm" spellcheck="false" id="property_${id}_${item}" data-type="text" value="${Util.escapeHTML(
            value,
          )}" style="width:100%">`,
        ),
    );
  }

  //
  /**
   * render a range slider
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {Number} value
   * @param {Array} params
   */
  #rangeControl($propertiesGrid, id, item, value, params) {
    let min = params[0].match(/^[0-9]+$/)
      ? params[0]
      : Scheme.params.schemeRange[0].default;
    let max = params[1].match(/^[0-9]+$/)
      ? params[1]
      : Scheme.params.schemeRange[1].default;
    let step = params[2].match(/^[0-9]+$/)
      ? params[2]
      : Scheme.params.schemeRange[2].default;
    let unit = params[3];
    if (value == "") {
      value = min;
    } else {
      value = +value;
      if (value < min) {
        value = min;
      }
      if (value > max) {
        value = max;
      }
    }
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 1;",
        })
        .html(
          `<input type="range" class="range-dark form-range" min="${min}" max="${max}" step="${step}" id="property_${id}_${item}" data-type="range" value="${value}" onchange="$('#range_${id}_${item}').html(this.value)">`,
        ),
    );
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:4/span 1; overflow-x:hidden;",
        })
        .html(
          `<span id="range_${id}_${item}">${value}</span>` +
            (unit == undefined ? "" : `&nbsp;${Util.escapeHTML(unit)}`),
        ),
    );
  }

  /**
   * render a select box
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {String} value
   * @param {String[]} options
   */
  #selectControl($propertiesGrid, id, item, value, options) {
    let html = `<select class="form-select form-select-sm" style="width:fit-content" id="property_${id}_${item}" data-type="select">`;
    options.forEach((option) => {
      html += `<option ${value == option ? "selected" : ""}>${Util.escapeHTML(
        option,
      )}</option>`;
    });
    html += `</select>`;
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .html(html),
    );
  }

  /**
   * render a radio select
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {String} value
   * @param {String[]} options
   */
  #radioControl($propertiesGrid, id, item, value, options) {
    let html = "";
    options.forEach((radio) => {
      html += `<div class="form-check${
        options.length <= 2 ? " form-check-inline" : ""
      }"><input class="form-check-input" type="radio" name="property_${id}_${item}" value="${Util.escapeHTML(
        radio,
      )}" ${
        radio == value ? "checked" : ""
      }><label class="form-check-label">${Util.escapeHTML(radio)}</label></div>`;
    });
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .html(html),
    );
  }

  /**
   * render a calender (single date or range)
   * @private
   *
   * @param {Boolean} isRange
   * @param {String} id
   * @param {String} item
   * @param {String} value
   * @param {String[]} params
   */
  #calenderControl(
    $propertiesGrid,
    isRange,
    id,
    item,
    value,
    minYear,
    maxYear,
  ) {
    let startDate;
    let endDate;
    if (value != "") {
      startDate = new Date(value[0]); //, "X").format(_("Scheme_dateFormat"));
      endDate = new Date(value[1]); //, "X").format(_("Scheme_dateFormat"));
    } else {
      let year = new Date().getFullYear();
      if (maxYear < year || minYear > year) {
        startDate = new Date(minYear, 0);
      } else {
        startDate = new Date();
      }
      endDate = startDate;
    }

    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .html(
          `<input type="text" class="form-control form-control-sm" style="text-align:center; width:fit-content${
            isRange ? "; display:inline;" : ""
          }" id="property_${id}_${item}" data-type="${isRange ? "dateRange" : "date"}"></input>` +
            (isRange
              ? `<span style="margin-left:10px"; id="days_${id}_${item}"></span>`
              : ""),
        ),
    );
    $(`#property_${id}_${item}`).daterangepicker({
      singleDatePicker: !isRange,
      minYear: minYear,
      maxYear: maxYear,
      minDate: _("Scheme_dateMin", {
        year: minYear,
      }),
      maxDate: _("Scheme_dateMax", {
        year: maxYear,
      }),
      startDate: startDate,
      endDate: endDate,
      showDropdowns: true,
      showISOWeekNumbers: true,
      linkedCalendars: false,
      // drops: "auto", // auto dropping broken?
      locale: {
        format: _("Scheme_dateFormat"),
        separator: _("Scheme_dateRangeSeparator"),
        applyLabel: _("Scheme_dateApply"),
        cancelLabel: _("Scheme_dateCancel"),
        weekLabel: _("Scheme_dateWeek"),
        firstDay: parseInt(_("Scheme_dateFirstWeekday")),
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
    if (isRange) {
      $(`#days_${id}_${item}`).html(
        Util.daysToHuman(
          moment(
            $(`#property_${id}_${item}`).data("daterangepicker").endDate,
          ).diff(
            moment(
              $(`#property_${id}_${item}`).data("daterangepicker").startDate,
            ),
            "days",
          ),
        ),
      );
      $(`#property_${id}_${item}`).on(
        "apply.daterangepicker",
        {
          days: $(`#days_${id}_${item}`),
        },
        (ev, picker) => {
          $(ev.data.days).html(
            Util.daysToHuman(
              moment(picker.endDate).diff(moment(picker.startDate), "days"),
            ),
          );
        },
      );
    }
  }

  /**
   * render a color selector
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {String} value
   */
  #colorControl($propertiesGrid, id, item, value) {
    let $flex = $("<div>").attr({ style: "display:flex" });
    $flex.append(
      $("<div>").html(
        `<input class="colorPicker" id="property_${id}_${item}" data-type="color" onchange="$('[id^=colorBox_${id}_${item}]').css('background-color',$(this).val())"></input>`,
      ),
    );
    let html = "";
    for (let c = 255; c >= 0; c -= 55) {
      let h = ("0" + c.toString(16)).slice(-2);
      html += `<div style="display:inline-block; vertical-align:top; margin-left:20px; height:40px; width:40px; border:#${h}${h}${h} solid 10px; background-color:${
        value != "" ? value : "#000"
      }" id="colorBox_${id}_${item}_${h}"></div>`;
    }
    $flex.append($("<div>").attr({ style: "align-self:center" }).html(html));
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .append($flex),
    );
    $(`#property_${id}_${item}`).spectrum({
      type: "color",
      showPalette: this.#settings.palette != noPalette,
      palette: systemPalettes[this.#settings.palette],
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
    $(`#property_${id}_${item}`).spectrum("set", value != "" ? value : "#000");
  }

  /**
   * render an editor
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {*} contents editor contents
   * @param {Number} height
   * @param {Object[]} formats
   * @param {Boolean} first true if it is the first editor in a scheme
   */
  #editorControl($propertiesGrid, id, item, contents, height, formats, first) {
    let $div = $("<div>").attr({
      style: `grid-column:3/span 2;`,
    });
    $propertiesGrid.append($div);
    this.#items[`property_${id}_${item}`] = new SchemeEditor(
      "object",
      $div,
      `_${id}_${item}`,
      contents,
      height,
      this.#settings,
      formats,
      Util.blackOrWhite(
        this.#settings.objectBackgroundColor ||
          this.#settings.generalBackgroundColor,
        "btn-outline-light",
        "btn-outline-dark",
      ),
      false,
      first,
    );
  }

  /**
   * render a map
   * @private
   *
   * @param {String} id
   * @param {String} item
   * @param {*} contents
   * @param {Number} height
   */
  #mapControl($propertiesGrid, id, item, contents, height) {
    let $mapDiv = $("<div>").attr({
      "id": `property_${id}_${item}`,
      "style": `height:${height}px`,
      "data-type": "map",
    });
    let $locationsDiv = $("<div>").attr({
      id: `locations_${id}_${item}`,
      style: "padding:5px",
    });
    $propertiesGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 2;",
        })
        .append($mapDiv, $locationsDiv),
    );

    this.#items[`property_${id}_${item}`] = new SchemeMap(
      this.#settings,
      $mapDiv,
      $locationsDiv,
      contents,
      "",
    );
  }

  /**
   * update an existing leaflet map (containers must be in DOM tree)
   * @todo instead of new SchemeMap better update existing object?
   *
   * @param {String} id
   * @param {String} item
   * @param {*} value
   */
  updateMap(id, item, value) {
    $(`#locations_${id}_${item}`).empty();
    this.#items[`property_${id}_${item}`].map.remove();
    this.#items[`property_${id}_${item}`] = new SchemeMap(
      this.#settings,
      $(`#property_${id}_${item}`),
      $(`#locations_${id}_${item}`),
      value,
      "",
    );
  }

  /**
   * update an existing editor
   *
   * @param {String} id
   * @param {String} item
   * @param {Object[]} value Delta ops
   */
  updateEditor(id, item, value) {
    this.#items[`property_${id}_${item}`].contents = value;
  }

  /**
   * change image in an editor
   *
   * @param {*} args
   */
  setImage(args) {
    this.#items[`property${args[0]}`].setImage(...args.splice(1));
  }

  /**
   * collect all property values
   *
   * @returns {Object} property id -> value
   */
  saveProperties($propertiesGrid) {
    let that = this;
    this.#properties = {};
    $propertiesGrid.find("[id^=property_]").each(function () {
      // id is uuid prepended with a "_", so we need to stuff "_" back in after splitting :-(
      let [, , id, no] = $(this).attr("id").split("_");
      id = "_" + id;
      if (!(id in that.#properties)) {
        that.#properties[id] = {};
      }
      switch ($(this).data("type")) {
        case "file":
          if (!$(`#filebutton_${id}_${no}`).prop("disabled")) {
            that.#properties[id][no] = {
              id: $(`#filebutton_${id}_${no}`).attr("data-id"),
              filePath: Util.unescapeHTML(
                $(`#filebutton_${id}_${no}`).attr("data-path"),
              ),
              fileModtime: $(`#filebutton_${id}_${no}`).attr("data-time"),
            };
          }
          break;
        case "date":
          let d = parseInt(
            moment($(this).val(), _("Scheme_dateFormat")).format("x"),
          );
          that.#properties[id][no] = [d, d];
          break;
        case "dateRange":
          that.#properties[id][no] = $(this)
            .val()
            .split(_("Scheme_dateRangeSeparator"))
            .map((d) =>
              parseInt(moment(d, _("Scheme_dateFormat")).format("x")),
            );
          break;
        case "checkbox":
          that.#properties[id][no] = $(this).prop("checked");
          break;
        case "editor":
          that.#properties[id][no] = that.#items[$(this).attr("id")].contents;
          break;
        case "map":
          that.#properties[id][no] = that.#items[$(this).attr("id")].mapState();
          break;
        default:
          that.#properties[id][no] = $(this).val();
      }
    });
    // radios
    $propertiesGrid.find("input[name^='property_']:checked").each(function () {
      // id is uuid prepended with a "_", so we need to stuff "_" back in after splitting :-(
      let [, , id, no] = $(this).attr("name").split("_");
      id = "_" + id;
      if (!(id in that.#properties)) {
        that.#properties[id] = {};
      }
      that.#properties[id][no] = $(this).val();
    });

    return this.#properties;
  }

  /**
   * fill the scheme grid according to the current scheme values
   */
  fillScheme($schemeGrid, buttonHTML) {
    $schemeGrid.empty();
    // add item button
    let $button = $("<button>")
      .attr({
        class: "btn btn-success btn-sm",
        title: `${_("Scheme_addItem")}`,
      })
      .html(`<i class="fas fa-plus"></i>`);
    $button.click(this.addItem.bind(this, $schemeGrid, buttonHTML));
    $schemeGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; justify-self:center",
        })
        .append($button),
    );
    // name field header
    $schemeGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1; align-self:center",
        })
        .html(_("Scheme_name")),
    );
    // type field header
    $schemeGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:3/span 1; align-self:center",
        })
        .html(_("Scheme_type")),
    );
    // params field header
    $schemeGrid.append(
      $("<div>")
        .attr({
          style: "grid-column:4/span 2; align-self:center",
        })
        .html(_("Scheme_parameters")),
    );

    // display parent scheme items (non editable)
    if (this.#settings.objectsShowParentScheme) {
      this.#parentSchemes.forEach((parentScheme) => {
        parentScheme.scheme.forEach((scheme) => {
          // object field
          $schemeGrid.append(
            $("<div>")
              .attr({
                style:
                  "grid-column:1/span 1; justify-self:center; margin-top:3px",
              })
              .html(parentScheme.name),
          );
          // name field
          $schemeGrid.append(
            $("<div>")
              .attr({
                style: "grid-column:2/span 1;",
              })
              .html(
                `<input type="text" class="form-control form-control-sm" spellcheck="false" value="${Util.escapeHTML(
                  scheme.name,
                )}" disabled style="width:100%">`,
              ),
          );
          // type field
          let $select = $("<select>").attr({
            class: "form-select form-select-sm",
            disabled: true,
          });
          Scheme.#types.forEach((type) => {
            $select.append(
              $("<option>")
                .attr({
                  value: type,
                  selected: scheme.type == type,
                })
                .html(_(type)),
            );
          });
          $schemeGrid.append(
            $("<div>")
              .attr({
                style: "grid-column:3/span 1;",
              })
              .append($select),
          );
          // param field(s)
          if (scheme.type in Scheme.params) {
            let i = 0;
            Scheme.params[scheme.type].forEach((param) => {
              $schemeGrid.append(
                $("<div>")
                  .attr({
                    style: "grid-column:4/span 1; place-self:center end",
                  })
                  .html(_(param.info)),
              );
              $schemeGrid.append(
                $("<div>")
                  .attr({
                    style: "grid-column:5/span 1;",
                  })
                  .html(
                    `<input type="${param.type}" class="form-control form-control-sm" spellcheck="false" disabled style="${
                      param.style
                    }" value="${Util.escapeHTML(scheme.params[i])}">`,
                  ),
              );
              i += 1;
            });
          }
        });
      });
    }

    // active scheme items (editable)
    for (let itemNo = 0; itemNo < this.#scheme.length; itemNo++) {
      let $grid = $("<div>").attr({
        style: "grid-column:1/span 1; justify-self:center",
      });
      // delete button
      let $deleteButton = $("<button>")
        .attr({
          class: "btn btn-outline-danger btn-sm",
          title: `${_("Scheme_removeItem")}`,
        })
        .html(`<i class="fas fa-trash"></i>`);
      $grid.append($deleteButton);
      $deleteButton.click(
        this.deleteItem.bind(this, itemNo, $schemeGrid, buttonHTML),
      );
      // up button
      if (itemNo > 0) {
        let $upButton = $("<button>")
          .attr({
            type: "button",
            class: "btn btn-secondary btn-sm",
            title: `${_("Scheme_moveItemUp")}`,
          })
          .html(`<i class="fa-solid fa-arrow-up"></i>`);
        $grid.append($upButton);
        $upButton.click(
          this.moveItem.bind(this, itemNo, true, $schemeGrid, buttonHTML),
        );
      }
      // down button
      if (itemNo < this.#scheme.length - 1) {
        let $downButton = $("<button>")
          .attr({
            type: "button",
            class: "btn btn-secondary btn-sm",
            title: `${_("Scheme_moveItemDown")}`,
          })
          .html(`<i class="fa-solid fa-arrow-down"></i>`);
        $grid.append($downButton);
        $downButton.click(
          this.moveItem.bind(this, itemNo, false, $schemeGrid, buttonHTML),
        );
      }
      $schemeGrid.append($grid);
      // name field
      $schemeGrid.append(
        $("<div>")
          .attr({
            style: "grid-column:2/span 1;",
          })
          .html(
            `<input type="text" class="form-control form-control-sm" spellcheck="false" value="${Util.escapeHTML(
              this.#scheme[itemNo].name,
            )}" id="schemeName_${
              this.#scheme[itemNo].id
            }_${itemNo}" style="width:100%">`,
          ),
      );
      // type field
      let $select = $("<select>").attr({
        class: "form-select form-select-sm",
        id: `schemeType_${this.#scheme[itemNo].id}_${itemNo}`,
      });
      Scheme.#types.forEach((type) => {
        $select.append(
          $("<option>")
            .attr({
              value: type,
              selected: this.#scheme[itemNo].type == type,
            })
            .html(_(type)),
        );
      });
      $schemeGrid.append(
        $("<div>")
          .attr({
            style: "grid-column:3/span 1;",
          })
          .append($select),
      );
      // param field(s)
      let type = $(`#schemeType_${this.#scheme[itemNo].id}_${itemNo}`).val();
      if (type in Scheme.params) {
        let i = 0;
        Scheme.params[type].forEach((param) => {
          $schemeGrid.append(
            $("<div>")
              .attr({
                style: "grid-column:4/span 1; place-self:center end",
              })
              .html(_(param.info)),
          );
          $schemeGrid.append(
            $("<div>")
              .attr({
                style: "grid-column:5/span 1",
              })
              .html(
                `<input type="${param.type}" class="form-control form-control-sm" spellcheck="false" style="${
                  param.style
                }" id="schemeParam_${
                  this.#scheme[itemNo].id
                }_${itemNo}_${i}" value="${Util.escapeHTML(
                  this.#scheme[itemNo].params[i],
                )}">`,
              ),
          );
          i += 1;
        });
      }

      // bind type select change
      $select.on(
        "change",
        this.changeType.bind(this, itemNo, $schemeGrid, buttonHTML),
      );
    }

    // buttons
    if (this.#settings.closingType != "settingsWindow_closeByX") {
      $schemeGrid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 5; justify-self:end;",
          })
          .html(buttonHTML),
      );
    }
  }

  /**
   * collect and save scheme items from web form
   *
   * @returns {Object}
   */
  saveItems($schemeGrid) {
    let scheme = this.#scheme;
    $schemeGrid.find("[id^=scheme]").each(function () {
      let [name, id, no, i] = $(this).attr("id").split("_");
      name = name.slice(6).toLowerCase();
      if (!scheme[no]) {
        scheme[no] = { id: id };
      }
      if (name == "param") {
        if (i != undefined) {
          if (!("params" in scheme[no])) {
            scheme[no].params = [];
          }
          scheme[no].params[i] = $(this).val().trim();
        }
      } else {
        scheme[no][name] = $(this).val().trim();
      }
    });
    this.#scheme = scheme;
    return this.#scheme;
  }

  /**
   * add a scheme item to the end of the item list
   */
  addItem($schemeGrid, buttonHTML) {
    this.saveItems($schemeGrid);
    let maxID = 0;
    this.#scheme.forEach((item) => {
      if (maxID < item.id) {
        maxID = item.id;
      }
    });
    this.#scheme.push({
      id: parseInt(maxID) + 1,
      name: "",
    });
    this.fillScheme($schemeGrid, buttonHTML);
  }

  //
  /**
   * delete an item from the item list
   *
   * @param {Number} itemNo
   */
  deleteItem(itemNo, $schemeGrid, buttonHTML) {
    this.saveItems($schemeGrid);
    this.#scheme.splice(itemNo, 1);
    this.fillScheme($schemeGrid, buttonHTML);
  }

  /**
   * move scheme item one position up or down
   *
   * @param {Number} itemNo
   * @param {Boolean} up true if moving up
   */
  moveItem(itemNo, up, $schemeGrid, buttonHTML) {
    this.saveItems($schemeGrid);
    let item = this.#scheme.splice(itemNo, 1);
    this.#scheme.splice(itemNo - (up ? 1 : -1), 0, item[0]);
    this.fillScheme($schemeGrid, buttonHTML);
  }

  /**
   * change scheme item type
   *
   * @param {Number} item
   */
  changeType(item, $schemeGrid, buttonHTML) {
    let type = $(`#schemeType_${this.#scheme[item].id}_${item}`).val();
    this.#scheme[item].type = type;
    this.#scheme[item].name = $(
      `#schemeName_${this.#scheme[item].id}_${item}`,
    ).val();
    let params = [];
    if (type in Scheme.params) {
      Scheme.params[type].forEach((param) => {
        params.push(
          "default" in param
            ? _(param.default)
            : "setting" in param
              ? this.#settings[param.setting]
              : "",
        );
      });
    }
    this.#scheme[item].params = params;
    // when changing scheme type reset old content as it doesn't fit the new type anyways
    if (!(this.#objectID in this.#properties)) {
      this.#properties[this.#objectID] = {};
    }
    this.#properties[this.#objectID][this.#scheme[item].id] = null;
    this.fillScheme($schemeGrid, buttonHTML);
  }

  /**
   * sort the options of a relation select (either alphabetically or tree order)
   *
   * @param {String} id
   * @param {String} item
   */
  #sortOptions(id, item) {
    let options = $(`#property_${id}_${item}`).children();
    $(`#property_${id}_${item}`).empty();
    if ($(`#propertySort_${id}_${item}`).prop("checked")) {
      $(`#property_${id}_${item}`).append(
        options.sort((a, b) =>
          Intl.Collator().compare($(a).data("name"), $(b).data("name")),
        ),
      );
    } else {
      $(`#property_${id}_${item}`).append(
        options.sort((a, b) => $(a).data("order") - $(b).data("order")),
      );
    }
  }
}

/**
 * when opening the select dropdown of a relation property possibly decorate option items
 *
 * @param {*} select
 * @param {*} id
 * @param {*} item
 */
function openSelect(select, id, item) {
  if (!$(`#propertySort_${id}_${item}`).prop("checked")) {
    $(select)
      .children()
      .each((index, element) => {
        $(element).html(
          `${$(element).data("depth") ? "\u2500" + "\u2500".repeat(($(element).data("depth") - 1) * 2) + " " : ""}${$(element).data("name")}`,
        );
      });
  }
  $(select).attr("onclick", `closeSelect(this,'${id}','${item}')`);
}

/**
 * when closing the select dropdown of a relation property possibly undecorate option items
 *
 * @param {*} select
 * @param {*} id
 * @param {*} item
 */
function closeSelect(select, id, item) {
  if (!$(`#propertySort_${id}_${item}`).prop("checked")) {
    $(select)
      .children()
      .each((index, element) => {
        $(element).html($(element).data("name"));
      });
  }
  $(select).attr("onclick", `openSelect(this,'${id}','${item}')`);
}
