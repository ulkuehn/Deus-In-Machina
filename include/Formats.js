/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Formats class
 */

/**
 * @classdesc Formats are combinations of styles that can be attached to paragraphs
 */
class Formats {
  /**
   * definition of available styles; names must match correspondent settings in StylingControls
   * @static
   */
  static settings = [
    {
      type: "text",
      name: "formats_name",
      default: "",
      mandatory: true,
    },
    {
      type: "font",
      name: "formats_fontFamily",
      values: [],
      default: "'sansSerif'",
      css: "font-family",
      preview: true,
    },
    {
      type: "range",
      name: "formats_fontSize",
      default: "12",
      min: 4,
      max: 200,
      step: 1,
      unit: "pt",
      unitI18n: "units_point",
      css: "font-size",
      preview: true,
    },
    {
      type: "color",
      name: "formats_textColor",
      default: "#000000",
      css: "color",
      preview: true,
    },
    {
      type: "emptycolor",
      name: "formats_backgroundColor",
      default: "",
      css: "background-color",
      preview: true,
    },
    {
      type: "select",
      name: "formats_textAlign",
      default: "left",
      i18nValues: [
        "formats_textAlignLeft",
        "formats_textAlignCenter",
        "formats_textAlignRight",
        "formats_textAlignJustify",
      ],
      css: "text-align",
      values: ["left", "center", "right", "justify"],
    },
    {
      type: "range",
      name: "formats_lineHeight",
      default: "1.5",
      min: 0.5,
      max: 5,
      step: 0.1,
      unit: "",
      unitI18n: "",
      css: "line-height",
    },
    {
      type: "range",
      name: "formats_topIndent",
      default: "0",
      min: 0,
      max: 10,
      step: 0.5,
      unit: "em",
      unitI18n: "units_em",
      css: "margin-top",
    },
    {
      type: "range",
      name: "formats_bottomIndent",
      default: "0",
      min: 0,
      max: 10,
      step: 0.5,
      unit: "em",
      unitI18n: "units_em",
      css: "margin-bottom",
    },
    {
      type: "range",
      name: "formats_leftIndent",
      default: "0",
      min: 0,
      max: 25,
      step: 1,
      unit: "em",
      unitI18n: "units_em",
      css: "margin-left",
    },
    {
      type: "range",
      name: "formats_rightIndent",
      default: "0",
      min: 0,
      max: 25,
      step: 1,
      unit: "em",
      unitI18n: "units_em",
      css: "margin-right",
    },
    {
      type: "range",
      name: "formats_letterSpacing",
      default: "0",
      min: 0,
      max: 2,
      step: 0.1,
      unit: "em",
      unitI18n: "units_em",
      css: "letter-spacing",
    },
    {
      type: "range",
      name: "formats_wordSpacing",
      css: "word-spacing",
      default: "0",
      min: -1,
      max: 3,
      step: 0.1,
      unit: "em",
      unitI18n: "units_em",
    },
    {
      type: "select",
      name: "formats_listPosition",
      default: "block",
      i18nValues: [
        "formats_listPositionNone",
        "formats_listPositionInside",
        "formats_listPositionOutside",
      ],
      values: [
        "block",
        "list-item; list-style-position:inside",
        "list-item; list-style-position:outside",
      ],
      css: "display",
    },
    {
      type: "select",
      name: "formats_listStyle",
      default: "disc",
      i18nValues: [
        "formats_listStyleDisc",
        "formats_listStyleSquare",
        "formats_listStyleHyphen",
        "formats_listStyleDash",
        "formats_listStyleLongDash",
        "formats_listStyleAsterisk",
        "formats_listStyleDiamond",
        "formats_listStyleCheck",
      ],
      values: [
        "disc",
        "square",
        "'-\\a0'",
        "'\\2013\\a0'",
        "'\\2014\\a0'",
        "'\\2605\\a0'",
        "'\\25C6\\a0'",
        "'\\2714\\a0'",
      ],
      css: "list-style-type",
    },
  ];

  #formats; // {id1:format1, id2:format2, ...} where format_i = {setting1:value1, setting2:value2, ...}
  #dirty; // true if formats changed and needs saving

  /**
   * class constructor
   *
   * @param {Object} formats
   * @param {Boolean} dirty
   */
  constructor(formats = Formats.#default(), dirty = true) {
    this.#formats = formats;
    this.#dirty = dirty;
    // set default name, in i18n
    if (this.#formats[UUID0].formats_name == "") {
      this.#formats[UUID0].formats_name = _("formats_standard");
    }
    // css part
    this.buildFormatSheet();
    // quill part
    Object.keys(this.#formats).forEach((id) => {
      let parchment = new Parchment.Attributor.Class(
        `format${id}`,
        `format${id}`,
        {
          scope: Parchment.Scope.BLOCK,
        },
      );
      Parchment.register(parchment);
    });

    if (theTextEditor) {
      theTextEditor.updateFormats(this.#formats);
    }
  }

  get formats() {
    return this.#formats;
  }

  get standardFormat() {
    return this.#formats[UUID0];
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * returns a full spec of a format with given id based on standard format settings
   *
   * @param {String} formatID
   * @returns {Object}
   */
  effectiveFormat(formatID) {
    let effective = Object.assign({}, this.#formats[UUID0]);
    if (formatID in this.#formats) {
      Object.assign(effective, this.#formats[formatID]);
    }
    return effective;
  }

  /**
   * fill style sheet with css rules to display formats
   *
   * @param {Number} alpha opacity value 0..1
   * @param {Number} zoom percentage for scaling
   */
  buildFormatSheet(alpha = 1.0, zoom = 100) {
    let settings = theSettings.effectiveSettings();
    $("#formatSheet").empty();
    if (!settings.firstLineIndentFormats) {
      // indent first line of all paragraphs, no matter of their format
      $("#formatSheet").append(
        `.ql-editor p + p { text-indent: var(--first-line-indent) }`,
      );
      $("#formatSheet").append(
        `.ql-editor p:has(> br) + p { text-indent: 0cm }`,
      );
    } else {
      // indent first line of paragraphs, standard format, consecutive
      $("#formatSheet").append(
        `.ql-editor p:not([class]) + p:not([class]) { text-indent: var(--first-line-indent) }`,
      );
      $("#formatSheet").append(
        `.ql-editor p:not([class]):has(> br) + p:not([class]) { text-indent: 0cm }`,
      );
    }
    for (let [formatID, format] of Object.entries(this.#formats)) {
      $("#formatSheet").append(
        `.edi ${Formats.toCSS(formatID, format, alpha, zoom)}`,
      );
      if (settings.firstLineIndentFormats) {
        // indent first line of paragraphs, specific format, consecutive
        $("#formatSheet").append(
          `.ql-editor p.format${formatID}-true + p.format${formatID}-true { text-indent: var(--first-line-indent) }`,
        );
        $("#formatSheet").append(
          `.ql-editor p.format${formatID}-true:has(> br) + p.format${formatID}-true { text-indent: 0cm }`,
        );
      }
      if (settings.previewFormats) {
        $("#formatSheet").append(
          `${
            formatID == UUID0
              ? `#formatSelector option { `
              : `#formatSelector .format${formatID} {`
          } ${Formats.toPreviewCSS(format)}}\n`,
        );
      }
    }
    // zoom is non standard - https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
    // but still best way to scale (transform:scale is not suitable)
    // $("#formatSheet").append(`.edi img { filter:invert(${.5-alpha/2}); zoom:${zoom}% }`);
    $("#formatSheet").append(`.edi img { opacity:${alpha}; zoom:${zoom}% }`);
    // $("#formatSheet").append(`.edi img { filter:opacity(${alpha}) }`);
  }

  /**
   * build css to style text showing the given format (this is used in select lists)
   * @static
   *
   * @param {Object} format
   * @returns {String}
   */
  static toPreviewCSS(format) {
    let css = "";
    Formats.settings.forEach((setting) => {
      if (setting.css && setting.preview && setting.name in format) {
        let value = format[setting.name];
        css += `${setting.css}: ${value}${
          "unit" in setting ? setting.unit : ""
        }; `;
      }
    });

    return css;
  }

  /**
   * build css reflecting a format
   * @static
   *
   * @param {String} id format id
   * @param {Object} format
   * @param {Number} alpha opacity value 0..1
   * @param {Number} zoom percentage for scaling
   * @param {String} selector
   * @param {Boolean} html
   * @returns {String}
   */
  static toCSS(
    id,
    format,
    alpha = 1.0,
    zoom = 100,
    selector = "",
    html = false,
  ) {
    let css = `${selector} ${id == UUID0 ? `p { ` : `p.format${id}-true { `}`;
    Formats.settings.forEach((setting) => {
      if (
        "css" in setting &&
        setting.name in format &&
        !(
          setting.name == "formats_listPosition" &&
          format[setting.name] == "formats_listNone"
        )
      ) {
        let value = format[setting.name];
        // if exporting to html, font names like "serif" must be used w/o quotes
        if (html && setting.type == "font") {
          let bare = value.substring(1, value.length - 1);
          if (bare in Fonts.cssFamilies) {
            value += `, ${Fonts.cssFamilies[bare]}`;
          }
        }
        if (setting.name == "formats_textColor") {
          let [r, g, b] = Util.hexToRgb(format[setting.name]);
          css += `--alpha:${alpha}; --rgb:${r},${g},${b}; `;
          value = "rgba(var(--rgb),var(--alpha))";
        }
        css += `${setting.css}:${
          "unit" in setting &&
          ["pt", "px", "pc", "cm", "mm"].includes(setting.unit)
            ? Math.round((zoom / 10) * value) / 10
            : value
        }${"unit" in setting ? setting.unit : ""}; `;
      }
    });
    css += " }\n";

    return css;
  }

  /**
   * build a format object made of standard format only
   * @static
   * @private
   *
   * @returns {Object}
   */
  static #default() {
    let format = {};
    let result = {};
    Formats.settings.forEach((setting) => {
      format[setting.name] = setting.default;
    });
    result[UUID0] = format;

    return result;
  }

  /**
   * build docx style from format info
   * @static
   *
   * @param {Object} format
   * @returns {Object}
   */
  static formatToDocx(format) {
    let style = {
      run: {},
      paragraph: { spacing: {}, indent: {} },
    };

    // paragraph level
    if (format.formats_textAlign)
      switch (format.formats_textAlign) {
        case "left":
          style.paragraph.alignment = docx.AlignmentType.LEFT;
          break;
        case "center":
          style.paragraph.alignment = docx.AlignmentType.CENTER;
          break;
        case "right":
          style.paragraph.alignment = docx.AlignmentType.RIGHT;
          break;
      }
    if (format.formats_topIndent) {
      style.paragraph.spacing.before = Math.round(
        format.formats_fontSize * format.formats_topIndent * 15,
      );
    }
    if (format.formats_bottomIndent) {
      style.paragraph.spacing.after = Math.round(
        format.formats_fontSize * format.formats_bottomIndent * 15,
      );
    }
    if (format.formats_lineHeight) {
      style.paragraph.spacing.line = Math.round(
        format.formats_fontSize * format.formats_lineHeight * 20,
      );
      style.paragraph.spacing.lineRule = docx.LineRuleType.AT_LEAST;
    }
    if (format.formats_leftIndent) {
      style.paragraph.indent.left = Math.round(
        format.formats_fontSize * format.formats_leftIndent * 15,
      );
    }
    if (format.formats_rightIndent) {
      style.paragraph.indent.right = Math.round(
        format.formats_fontSize * format.formats_rightIndent * 15,
      );
    }
    if (format.formats_backgroundColor)
      style.paragraph.shading = {
        type: docx.ShadingType.SOLID,
        color: format.formats_backgroundColor.substring(1),
      };

    // text level
    if (format.formats_fontFamily) {
      let fontName = format.formats_fontFamily;
      let m = fontName.match(/['"](.*)['"]/);
      if (m) {
        fontName = m[1];
      }
      if (Fonts.docxFamilies[fontName]) {
        fontName = Fonts.docxFamilies[fontName];
      }
      style.run.font = {
        name: fontName,
      };
    }
    if (format.formats_fontSize)
      style.run.size = Math.round(format.formats_fontSize * 2);
    if (format.formats_textColor)
      style.run.color = format.formats_textColor.substring(1);

    return style;
  }

  /**
   * build css from format info
   * @static
   *
   * @param {Object} format
   * @returns {String}
   */
  static formatToCSS(format) {
    let css = "";
    Formats.settings.forEach((setting) => {
      if (
        "css" in setting &&
        setting.name in format &&
        !(
          setting.name == "formats_listPosition" &&
          format[setting.name] == "formats_listNone"
        )
      ) {
        if (format[setting.name]) {
          css += `${setting.css}:${format[setting.name]}${
            "unit" in setting ? setting.unit : ""
          }; `;
        }
      }
    });

    return css;
  }

  /**
   * return font and color info of a format
   * @static
   *
   * @param {Object} format
   * @returns {String[]}
   */
  static fontAndColors(format) {
    return [
      format.formats_fontFamily,
      format.formats_textColor,
      format.formats_backgroundColor,
    ];
  }

  /**
   * returns a rtf representaion of a format, taking font, color and style tables into account
   * @static
   *
   * @param {Object} format
   * @param {String[]} fontTable
   * @param {String[]} colorTable
   * @param {String} styleID
   * @returns {String}
   */
  static formatToRTF(format, fontTable, colorTable, styleID) {
    let rtf = "";
    if (styleID != undefined) {
      rtf += `\\s${styleID}`;
    }

    if (format.formats_fontFamily) {
      let fontIndex = fontTable.indexOf(format.formats_fontFamily);
      if (fontIndex >= 0) {
        rtf += `\\f${fontIndex}`;
      }
    }

    if (format.formats_fontSize) {
      rtf += `\\fs${Math.round(format.formats_fontSize * 2)}`;
    }

    if (format.formats_textColor) {
      let colorIndex = colorTable.indexOf(format.formats_textColor);
      if (colorIndex >= 0) {
        rtf += `\\cf${colorIndex}`;
      }
    }

    if (format.formats_backgroundColor) {
      let colorIndex = colorTable.indexOf(format.formats_backgroundColor);
      if (colorIndex >= 0) {
        rtf += `\\cbpat${colorIndex}`;
      }
    }

    if (format.formats_textAlign) {
      rtf += `\\q${format.formats_textAlign.substring(0, 1)}`;
    }

    // 1 pt = 20 twips
    if (format.formats_lineHeight) {
      rtf += `\\sl${Math.round(format.formats_fontSize * format.formats_lineHeight * 20)}`;
    }

    // factor 15 results from conversion from em to twips:
    // 1 pt = 1/72 in, 1 twip = 1/1440 in = 1/20 pt; 1 em ~ 3/4 * font size in pt
    // thus 1 em = 3/4 * 1440/72 = 15 twips
    if (format.formats_topIndent) {
      rtf += `\\sb${Math.round(format.formats_fontSize * format.formats_topIndent * 15)}`;
    }

    if (format.formats_bottomIndent) {
      rtf += `\\sa${Math.round(format.formats_fontSize * format.formats_bottomIndent * 15)}`;
    }

    if (format.formats_leftIndent) {
      rtf += `\\li${Math.round(format.formats_fontSize * format.formats_leftIndent * 15)}`;
    }

    if (format.formats_rightIndent) {
      rtf += `\\ri${Math.round(format.formats_fontSize * format.formats_rightIndent * 15)}`;
    }

    if (format.formats_textIndent) {
      rtf += `\\fi${Math.round(format.formats_fontSize * format.formats_textIndent * 15)}`;
    }

    if (format.formats_letterSpacing) {
      rtf += `\\expnd${Math.round(
        format.formats_fontSize * format.formats_letterSpacing * 4,
      )}\\expndtw${Math.round(
        format.formats_fontSize * format.formats_letterSpacing * 15,
      )}`;
    }

    // word spacing not supported in rtf
    console.log("formatToRTF", format, rtf);
    return rtf;
  }
}
