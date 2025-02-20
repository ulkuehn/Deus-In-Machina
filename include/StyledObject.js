/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of StyledObject class
 */

/**
 * @classdesc StyledObjects are world or story related items that can be connected to text sections and highlighted by specific styles within those texts
 */
class StyledObject {
  #id; // unique id, never changes
  #name;
  #decoration; // icon, color etc as object
  #styleProperties; // all style properties, grouped by area such as {text: {}, image: {}}
  #scheme; // property scheme as list of objects {id,name,type,params}
  #properties; // properties of the object according to scheme as object of objects
  #texts; // mapping of textIDs to number of characters that are tagged with this object
  #created; // creation timestamp
  #changed; // timestamp of last change
  #dirty; // true if changed and not saved
  #inDB; // true if part of the projects database; false if new object not yet in DB

  /**
   * class constructor
   *
   * @param {String} id
   * @param {String} name
   * @param {Object} decoration
   * @param {Object} styleProperties
   * @param {*} scheme
   * @param {Object} properties
   * @param {Object} texts
   * @param {Number} created
   * @param {Number} changed
   * @param {Boolean} dirty
   * @param {Boolean} inDB
   */
  constructor(
    id,
    name = "",
    decoration = { icon: false },
    styleProperties = { text: {}, image: {} },
    scheme = [],
    properties = {},
    texts = {},
    created = new Date().getTime(),
    changed = new Date().getTime(),
    dirty = true,
    inDB = false,
  ) {
    this.#id = id;
    this.#name = name;
    this.#decoration = decoration;
    this.#styleProperties = styleProperties;
    this.#scheme = scheme;
    this.#properties = properties;
    this.#texts = texts;
    this.#created = new Timestamp(created);
    this.#changed = new Timestamp(changed);
    this.#dirty = dirty;
    this.#inDB = inDB;
    // define attribute blot for quill integration
    let parchment = new Parchment.Attributor.Class(
      `object${id}`,
      `object${id}`,
      {
        scope: Parchment.Scope.INLINE,
      },
    );
    parchment.add = (node, value) => {
      let $node = $(node);
      $node.addClass(`object${id}-${value}`);
      $node.attr("onclick", `statusBarObjects(true,this.className)`);
      $node.attr("onmouseover", `statusBarObjects(false,this.className)`);
      return true;
    };
    Parchment.register(parchment);
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
      this.#decoration,
      JSON.parse(JSON.stringify(this.#styleProperties)),
      [...this.#scheme],
      JSON.parse(JSON.stringify(this.#properties)),
      JSON.parse(JSON.stringify(this.#texts)),
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

  get texts() {
    return this.#texts;
  }

  set texts(value = {}) {
    this.#texts = Object.assign({}, value);
  }

  get textCount() {
    return Object.keys(this.#texts).length;
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

  get name() {
    return this.#name;
  }

  set name(value) {
    this.#name = value;
    this.#update();
  }

  get decoration() {
    return this.#decoration;
  }

  set decoration(value = {}) {
    this.#decoration = Object.assign({}, value);
    this.#update();
  }

  get styleProperties() {
    return this.#styleProperties;
  }

  set styleProperties(value) {
    this.#styleProperties = value;
    this.#update();
  }

  get scheme() {
    return this.#scheme;
  }

  set scheme(value) {
    this.#scheme = value;
    this.#update();
  }

  get properties() {
    return this.#properties;
  }

  set properties(value) {
    this.#properties = value;
    this.#update();
  }

  /**
   * object was changed
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
   * @param {String} key
   * @param {String} value
   */
  setDecorationValue(key, value) {
    this.#decoration[key] = value;
    this.#update();
  }

  /**
   * get a specific style property
   *
   * @param {String} area
   * @param {String} key
   * @returns {String}
   */
  getStyleProperty(area, key) {
    return this.#styleProperties[area][key] ?? null;
  }

  /**
   * set a specific style property
   *
   * @param {String} area
   * @param {String} key
   * @param {String} value
   */
  setStyleProperty(area, key, value) {
    if (value == null) delete this.#styleProperties[area][key];
    else this.#styleProperties[area][key] = value;
    this.#update();
  }

  /**
   *
   * @param {String} area
   * @param {String} key
   */
  clearStyleProperty(area, key) {
    delete this.#styleProperties[area][key];
    this.#update();
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * set a length value of a text that is connected to this StyledObject
   *
   * @param {String} textID
   * @param {Number} length if 0, delete text entry (object no longer connected to this text)
   * @returns {Boolean} true if length was changed
   */
  setTextLength(textID, length) {
    if ((!length && !(textID in this.#texts)) || this.#texts[textID] == length)
      return false;
    if (!length) {
      delete this.#texts[textID];
    } else {
      this.#texts[textID] = length;
    }
    this.#dirty = true;
    return true;
  }

  /**
   * verbatim references for all texts this object is connected with
   *
   * @returns {Object[]} [{object:id, references:[{text:id, citations:[{pos:pos,len:len,parts:[text:string,html:boolean]},...]}, ...]}, ...]
   */
  textReferences(
    handleImages = theSettings.effectiveSettings().imageReference,
  ) {
    return ObjectReference.citations(
      Object.keys(this.#texts).map((textID) => ({
        id: textID,
        delta: theTextTree.getText(textID).delta,
      })),
      [this.#id],
      handleImages,
    );
  }

  /**
   * return name with all decoration applied as HTML
   *
   * @returns {String}
   */
  decoratedName() {
    let result = "";
    // empty (no texts attached)
    if (this.textCount == 0) {
      result += `<i class="fa-solid fa-link-slash" style="opacity:0.5; margin-right:8px;" title="${_(
        "objects_empty",
      )}"></i>`;
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
          theSettings.effectiveSettings().objectTreeSmall
            ? "line-height:1.2em;"
            : ""
        } width:1em; margin-right:8px;">${
          TreeDecoration.stackProps[this.#decoration.stack].background
            ? i1 + i2
            : i2 + i1
        }</span>`;
      }
    }

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
   * get a css representation of the object's style (as text or as object)
   *
   * @param {String} area area to do the css for (such as text, image)
   * @param {Boolean} asObject if true return object, else string
   * @param {Number} zoom scaling factor in percent
   * @returns {String|Object}
   */
  toCSS(area = "text", asObject = false, zoom = 100) {
    let style = {};
    Object.keys(this.#styleProperties[area]).forEach((key) => {
      if (this.#styleProperties[area][key] != null) {
        for (let i = 0; i < StylingControls.controls[area].length; i++) {
          if (StylingControls.controls[area][i].name == key) {
            if (StylingControls.controls[area][i].type == "multi") {
              let result = "";
              for (
                let j = 0;
                j < StylingControls.controls[area][i].controls.length;
                j++
              ) {
                let ctrl = StylingControls.controls[area][i].controls[j];
                result += " ";
                if (
                  "unit" in ctrl &&
                  ["pt", "px", "pc", "cm", "mm"].includes(ctrl.unit)
                ) {
                  result +=
                    Math.round(
                      (zoom / 10) * this.#styleProperties[area][key][j],
                    ) /
                      10 +
                    ctrl.unit;
                } else if (
                  ctrl.type == "emptycolor" &&
                  this.#styleProperties[area][key][j] == ""
                ) {
                  result += "unset";
                } else {
                  result += this.#styleProperties[area][key][j];
                }
              }
              style[StylingControls.controls[area][i].css["prop"]] = result;
              // StylingControls.controls[area][i].controls.reduce(
              //   (result, ctrl, index) => {
              //     console.log("toCSS", result, ctrl, index);
              //     return (
              //       result +
              //       " " +
              //       ("unit" in ctrl &&
              //       ["pt", "px", "pc", "cm", "mm"].includes(ctrl.unit)
              //         ? Math.round(
              //             (zoom / 10) * this.#styleProperties[area][key][index],
              //           ) / 10
              //         : this.#styleProperties[area][key][index]) +
              //       ("unit" in ctrl ? ctrl.unit : "")
              //     );
              //   },
              //   "",
              // );
            }

            if (StylingControls.controls[area][i].type == "check") {
              if (
                style[StylingControls.controls[area][i].css["prop"]] == null
              ) {
                style[StylingControls.controls[area][i].css["prop"]] = {};
              }
              style[StylingControls.controls[area][i].css["prop"]][
                StylingControls.controls[area][i].css["value"]
              ] = this.#styleProperties[area][key];
            }

            if (
              StylingControls.controls[area][i].type == "select" ||
              StylingControls.controls[area][i].type == "font"
            ) {
              style[StylingControls.controls[area][i].css.prop] =
                this.#styleProperties[area][key];
            }

            if (
              StylingControls.controls[area][i].type == "color" ||
              StylingControls.controls[area][i].type == "emptycolor"
            ) {
              style[StylingControls.controls[area][i].css.prop] = this
                .#styleProperties[area][key]
                ? this.#styleProperties[area][key]
                : "unset";
            }

            if (StylingControls.controls[area][i].type == "range") {
              style[StylingControls.controls[area][i].css.prop] =
                (["pt", "px", "pc", "cm", "mm"].includes(
                  StylingControls.controls[area][i].unit,
                )
                  ? Math.round((zoom / 10) * this.#styleProperties[area][key]) /
                    10
                  : this.#styleProperties[area][key]) +
                StylingControls.controls[area][i].unit;
            }
          }
        }
      }
    });

    let css = asObject ? {} : "";
    Object.keys(style).forEach((key) => {
      if (style[key] != null) {
        if (style[key].constructor == Object) {
          let css2 = "";
          Object.keys(style[key]).forEach((key2) => {
            if (style[key][key2]) {
              css2 += key2 + " ";
            }
          });
          if (css2 != "") {
            if (asObject) {
              css[key] = css2;
            } else {
              css += `${key}:${css2}; `;
            }
          }
        } else {
          if (asObject) {
            css[key] = style[key];
          } else {
            css += `${key}:${style[key]}; `;
          }
        }
      }
    });

    return css;
  }

  /**
   * collect all fonts and colors that are used in the object's styles
   *
   * @returns {Object}
   */
  fontsAndColors() {
    let fonts = {};
    let colors = {};
    Object.keys(StylingControls.controls).forEach((area) => {
      StylingControls.controls[area].forEach((control) => {
        if (
          control.type == "font" &&
          this.#styleProperties[area][control.name]
        ) {
          fonts[this.#styleProperties[area][control.name]] = true;
        }
        if (
          control.type == "color" &&
          this.#styleProperties[area][control.name]
        ) {
          colors[this.#styleProperties[area][control.name]] = true;
        }
        if (
          control.type == "multi" &&
          this.#styleProperties[area][control.name]
        ) {
          for (let i = 0; i < control.controls.length; i++) {
            if (
              control.controls[i].type == "font" &&
              this.#styleProperties[area][control.name][i + 1]
            ) {
              fonts[this.#styleProperties[area][control.name][i + 1]] = true;
            }
            if (
              control.controls[i].type == "color" &&
              this.#styleProperties[area][control.name][i + 1]
            ) {
              colors[this.#styleProperties[area][control.name][i + 1]] = true;
            }
          }
        }
      });
    });

    return { fonts: Object.keys(fonts), colors: Object.keys(colors) };
  }

  /**
   * add the style properties of another styledObject (mix the props of both objects)
   *
   * @param {StyledObject} styledObject
   * @returns {StyledObject}
   */
  addStyleProperties(styledObject) {
    Object.keys(this.#styleProperties).forEach((area) => {
      Object.keys(this.#styleProperties[area]).forEach((key) => {
        if (styledObject.getStyleProperty(area, key) != null) {
          this.#styleProperties[area][key] = styledObject.getStyleProperty(
            area,
            key,
          );
        }
      });
      Object.keys(styledObject.styleProperties[area]).forEach((key) => {
        if (styledObject.getStyleProperty(area, key) != null) {
          this.#styleProperties[area][key] = styledObject.getStyleProperty(
            area,
            key,
          );
        }
      });
    });

    return this;
  }

  /**
   * search a string/regex within different parts of the object
   *
   * @param {String} searchFor
   * @param {Boolean} doCase
   * @param {Boolean} doWord
   * @param {Boolean} doRegex
   * @param {Boolean} searchObjectNames
   * @param {Boolean} searchPropertyNames
   * @param {Boolean} searchValues
   * @param {Boolean} searchTexts
   * @returns {Object[]}
   */
  find(
    searchFor,
    doCase = false,
    doWord = false,
    doRegex = false,
    searchObjectNames = true,
    searchPropertyNames = true,
    searchValues = true,
    searchTexts = true,
  ) {
    let rex = RegExp(
      `${doWord ? "(^|\\P{L})(" : ""}${
        doRegex
          ? Util.escapeRegExpSearch(searchFor)
          : Util.escapeRegExp(searchFor)
      }${doWord ? ")($|\\P{L})" : ""}`,
      `udg${doCase ? "" : "i"}`,
    );
    let handleImages = theSettings.effectiveSettings().imageReference;
    let result = [];

    // search in object names
    if (searchObjectNames) {
      let r = rex.exec(this.#name);
      if (r) {
        result.push({
          type: "searchObjectNames",
          info: "",
          value: [
            Util.escapeHTML(this.#name.substring(0, r.indices[0][0])),
            Util.escapeHTML(
              this.#name.substring(r.indices[0][0], r.indices[0][1]),
            ),
            Util.escapeHTML(this.#name.substring(r.indices[0][1])),
          ],
        });
      }
    }

    // search in property/scheme names
    if (searchPropertyNames) {
      this.#scheme.forEach((scheme) => {
        rex.lastIndex = -1;
        let r = rex.exec(scheme.name);
        if (r) {
          result.push({
            type: "searchPropertyNames",
            info: scheme.type,
            value: [
              Util.escapeHTML(scheme.name.substring(0, r.indices[0][0])),
              Util.escapeHTML(
                scheme.name.substring(r.indices[0][0], r.indices[0][1]),
              ),
              Util.escapeHTML(scheme.name.substring(r.indices[0][1])),
            ],
          });
        }
      });
    }

    // search in property values (limited to text lines, editor content and map marker names)
    if (searchValues) {
      theObjectTree.getParents(this.#id, false).forEach((oid) => {
        if (this.#properties[oid]) {
          let scheme = theObjectTree.getObject(oid).scheme;
          for (let [k, v] of Object.entries(this.#properties[oid])) {
            scheme.forEach((schemeEntry) => {
              if (schemeEntry.id == k) {
                let r = null;
                let parts = [];
                let index = 0;
                switch (schemeEntry.type) {
                  case "schemeTypes_text":
                    parts.push({ text: v, html: false });
                    rex.lastIndex = -1;
                    r = rex.exec(value);
                    break;
                  case "schemeTypes_editor":
                    v.ops.forEach((op) => {
                      if (typeof op.insert == "string") {
                        parts.push({ text: op.insert, html: false });
                      } else {
                        if ("image" in op.insert) {
                          let content = "";
                          switch (handleImages) {
                            // full size image as displayed in the editor
                            case "imageReferenceFull":
                              content = `<img src="${op.insert.image}" style="width:${op.attributes.width}; height:${op.attributes.height}; ${Object.keys(DIMImage.styles.shadow[op.attributes.shadow]).reduce((a, x) => a + `${x}:${DIMImage.styles.shadow[op.attributes.shadow][x]};`, "")} ${Object.keys(DIMImage.styles.alignment[op.attributes.alignment]).reduce((a, x) => a + `${x}:${DIMImage.styles.alignment[op.attributes.alignment][x]};`, "")}">`;
                            // thumbnail max 50px high, max 250px wide
                            case "imageReferenceThumb":
                              let width = parseInt(op.attributes.origwidth);
                              let height = parseInt(op.attributes.origheight);
                              let factor = Math.min(50 / height, 250 / width);
                              if (factor > 1) factor = 1;
                              width = Math.floor(width * factor);
                              height = Math.floor(height * factor);
                              content = `<img src="${op.insert.image}" style="width:${width}px; height:${height}px; ">`;
                              break;
                            // image meta data as text
                            case "imageReferenceText":
                              content = _("image_reference", {
                                title: op.attributes.title
                                  ? ` "${Util.escapeHTML(op.attributes.title)}"`
                                  : "",
                                width: op.attributes.width,
                                height: op.attributes.height,
                              });
                              break;
                            // just an icon
                            case "imageReferenceIcon":
                              content = `<i class='fas fa-panorama'></i>`;
                              break;
                            case "imageReferenceIconLarge":
                              content = `<i class='fas fa-panorama fa-2x'></i>`;
                              break;
                            // nothing
                            case "imageReferenceEmpty":
                              break;
                          }
                          parts.push({ text: content, html: true });
                        }
                      }
                    });
                    for (let part of parts) {
                      if (!part.html) {
                        rex.lastIndex = -1;
                        if ((r = rex.exec(part.text))) break;
                      }
                      index++;
                    }
                    break;
                  case "schemeTypes_map":
                    for (let i = 0; i < v.marker.length && !r; i++) {
                      parts = [{ text: v.marker[i].info, html: false }];
                      rex.lastIndex = -1;
                      r = rex.exec(v.marker[i].info);
                    }
                    break;
                }
                if (r) {
                  result.push({
                    type: "searchValues",
                    info: schemeEntry.type,
                    name: Util.escapeHTML(schemeEntry.name),
                    value: [
                      parts
                        .slice(0, index)
                        .map((part) =>
                          part.html ? part.text : Util.escapeHTML(part.text),
                        )
                        .join("") +
                        Util.escapeHTML(
                          parts[index].text.substring(0, r.indices[0][0]),
                        ),
                      Util.escapeHTML(
                        parts[index].text.substring(
                          r.indices[0][0],
                          r.indices[0][1],
                        ),
                      ),
                      Util.escapeHTML(
                        parts[index].text.substring(r.indices[0][1]),
                      ) +
                        parts
                          .slice(index + 1)
                          .map((part) =>
                            part.html ? part.text : Util.escapeHTML(part.text),
                          )
                          .join(""),
                    ],
                  });
                  // result.push({
                  //   type: "searchValues",
                  //   info: schemeEntry.type,
                  //   name: Util.escapeHTML(schemeEntry.name),
                  //   value: [
                  //     Util.escapeHTML(value.substring(0, r.indices[0][0])),
                  //     Util.escapeHTML(
                  //       value.substring(r.indices[0][0], r.indices[0][1]),
                  //     ),
                  //     Util.escapeHTML(value.substring(r.indices[0][1])),
                  //   ],
                  // });
                }
              }
            });
          }
        }
      });
    }

    // search in text citations
    if (searchTexts) {
      let refs = this.textReferences();
      if (refs.length) {
        refs[0].references.forEach((reference) => {
          reference.citations.forEach((citation) => {
            let r = null;
            let index = 0;
            for (let part of citation.parts) {
              if (!part.html) {
                rex.lastIndex = -1;
                if ((r = rex.exec(part.text))) break;
              }
              index++;
            }
            if (r) {
              result.push({
                type: "searchTexts",
                info: "text",
                name: Util.escapeHTML(theTextTree.getText(reference.text).name),
                value: [
                  citation.parts
                    .slice(0, index)
                    .map((part) =>
                      part.html ? part.text : Util.escapeHTML(part.text),
                    )
                    .join("") +
                    Util.escapeHTML(
                      citation.parts[index].text.substring(0, r.indices[0][0]),
                    ),
                  Util.escapeHTML(
                    citation.parts[index].text.substring(
                      r.indices[0][0],
                      r.indices[0][1],
                    ),
                  ),
                  Util.escapeHTML(
                    citation.parts[index].text.substring(r.indices[0][1]),
                  ) +
                    citation.parts
                      .slice(index + 1)
                      .map((part) =>
                        part.html ? part.text : Util.escapeHTML(part.text),
                      )
                      .join(""),
                ],
              });
            }
          });
        });
      }
    }

    return result;
  }
}
