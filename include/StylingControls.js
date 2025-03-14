/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of StylingControls class
 */

/**
 * @classdesc StylingControls provides static data and functions for styled objects in relation to styling texts
 */
class StylingControls {
  /**
   * define the controls available to text style objects -- names must match correspondent settings in Formats
   * @static
   */
  static controls = {
    text: [
      {
        group: "formats_colors",
        name: "formats_textColor",
        css: { prop: "color" },
        type: "color",
        default: "#000000",
      },
      {
        name: "formats_backgroundColor",
        css: { prop: "background-color" },
        type: "emptycolor",
        default: "",
      },
      {
        group: "formats_fonts",
        name: "formats_fontFamily",
        css: { prop: "font-family" },
        type: "font",
        default: "",
        values: [],
      },
      {
        name: "formats_fontSize",
        css: { prop: "font-size" },
        type: "range",
        default: 20,
        min: 5,
        max: 100,
        step: 1,
        unit: "pt",
        unitI18n: "units_point",
      },
      {
        name: "formats_lineHeight",
        css: { prop: "line-height" },
        type: "range",
        default: 1,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: "",
        unitI18n: "",
      },
      {
        name: "formats_boldness",
        css: { prop: "font-weight" },
        type: "range",
        default: 400,
        min: 100,
        max: 900,
        step: 100,
        unit: "",
        unitI18n: "",
      },
      {
        name: "formats_italic",
        css: { prop: "font-style", value: "italic" },
        type: "check",
        default: false,
      },
      {
        name: "formats_letterSpacing",
        css: { prop: "letter-spacing" },
        type: "range",
        default: 0,
        min: -0.2,
        max: 2,
        step: 0.01,
        unit: "em",
        unitI18n: "units_em",
      },
      {
        name: "formats_wordSpacing",
        css: { prop: "word-spacing" },
        type: "range",
        default: 0,
        min: -1,
        max: 3,
        step: 0.1,
        unit: "em",
        unitI18n: "units_em",
      },
      {
        name: "format_capsStyle",
        css: { prop: "font-variant-caps" },
        type: "select",
        default: "normal",
        values: ["normal", "small-caps", "all-small-caps"],
      },
      {
        name: "formats_transform",
        css: { prop: "text-transform" },
        type: "select",
        default: "none",
        values: ["none", "uppercase", "lowercase", "capitalize"],
      },

      {
        group: "formats_strikes",
        name: "formats_underline",
        css: {
          prop: "text-decoration-line",
          value: "underline",
          multi: true,
        },
        type: "check",
        default: false,
      },
      {
        name: "formats_overline",
        css: {
          prop: "text-decoration-line",
          value: "overline",
          multi: true,
        },
        type: "check",
        default: false,
      },
      {
        name: "formats_strike",
        css: {
          prop: "text-decoration-line",
          value: "line-through",
          multi: true,
        },
        type: "check",
        default: false,
      },
      {
        name: "formats_linetype",
        css: { prop: "text-decoration-style" },
        type: "select",
        default: "solid",
        values: ["solid", "double", "dotted", "dashed", "wavy"],
      },
      {
        name: "formats_lineColor",
        css: { prop: "text-decoration-color" },
        type: "color",
        default: "#000000",
      },
      {
        name: "formats_lineThickness",
        css: { prop: "text-decoration-thickness" },
        type: "range",
        default: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
        unitI18n: "units_pixel",
      },
      {
        group: "formats_borders",
        name: "formats_border",
        css: { prop: "border" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_borderColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_borderStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_borderWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_borderLeft",
        css: { prop: "border-left" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_borderLeftColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_borderLeftStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_borderLeftWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_borderRight",
        css: { prop: "border-right" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_borderRightColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_borderRightStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_borderRightWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_borderTop",
        css: { prop: "border-top" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_borderTopColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_borderTopStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_borderTopWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_borderBottom",
        css: { prop: "border-bottom" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_borderBottomColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_borderBottomStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_borderBottomWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_outline",
        css: { prop: "outline" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_outlineColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_outlineStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_outlineWidth",
            type: "range",
            default: 2,
            min: 1,
            max: 20,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
      {
        name: "formats_shadow",
        css: { prop: "text-shadow" },
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_shadowX",
            type: "range",
            default: 0,
            min: 0,
            max: 50,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
          {
            name: "formats_shadowY",
            type: "range",
            default: 0,
            min: 0,
            max: 50,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
          {
            name: "formats_shadowRadius",
            type: "range",
            default: 2,
            min: 1,
            max: 50,
            step: 1,
            unit: "px",
            unitI18n: "units_pixel",
          },
          {
            name: "formats_shadowColor",
            type: "emptycolor",
            default: "",
          },
        ],
      },
    ],
    image: [
      {
        group: "formats_image",
        name: "formats_imageBorder",
        css: { prop: "outline" }, // use outline here rather than border as outline takes up no space and thus does not change the image's size
        type: "multi",
        default: false,
        controls: [
          {
            name: "formats_imageBorderColor",
            type: "emptycolor",
            default: "",
          },
          {
            name: "formats_imageBorderStyle",
            type: "select",
            default: "solid",
            values: ["solid", "dotted", "dashed", "double"],
          },
          {
            name: "formats_imageBorderWidth",
            type: "range",
            min: 1,
            max: 10,
            default: 2,
            unit: "px",
            unitI18n: "units_pixel",
          },
        ],
      },
    ],
  };

  /**
   * returns a default Style
   *
   * @returns {StyledObject} having all styles set to their default value
   */
  static defaultStyle() {
    let dStyle = new StyledObject();
    Object.keys(StylingControls.controls).forEach((area) => {
      StylingControls.controls[area].forEach((control) => {
        if (control.type == "multi") {
          dStyle.setStyleProperty(area, control.name, [
            control.default,
            ...control.controls.map((ctrl) => {
              return ctrl.default;
            }),
          ]);
        } else {
          dStyle.setStyleProperty(area, control.name, control.default);
        }
      });
    });
    return dStyle;
  }

  /**
   * returns a null Style
   *
   * @returns {StyledObject} having all styles set to null
   */
  static nullStyle() {
    let nStyle = new StyledObject();
    Object.keys(StylingControls.controls).forEach((area) => {
      StylingControls.controls[area].forEach((control) => {
        nStyle.setStyleProperty(area, control.name, null);
      });
    });
    return nStyle;
  }

  /**
   * transform text related style properties to best fitting RTF
   *
   * @param {Object} properties text related style properties
   * @param {Number} standardFontSize
   * @param {String[]} fontTable table of fonts for RTF file we can use for indexing fonts
   * @param {String[]} colorTable table of colors for RTF file
   * @returns {String}
   */
  static controls2RTF(properties, standardFontSize, fontTable, colorTable) {
    let fontSize = properties.formats_fontSize
      ? properties.formats_fontSize
      : standardFontSize;
    let rtf = "\\ltrch";

    if (properties.formats_fontFamily) {
      let fontIndex = fontTable.indexOf(properties.formats_fontFamily);
      if (fontIndex >= 0) {
        rtf += `\\f${fontIndex}`;
      }
    }

    if (properties.formats_fontSize) {
      rtf += `\\fs${Math.round(properties.formats_fontSize * 2)}`;
    }

    if (properties.formats_textColor) {
      let colorIndex = colorTable.indexOf(properties.formats_textColor);
      if (colorIndex >= 0) {
        rtf += `\\cf${colorIndex}`;
      }
    }

    if (properties.formats_backgroundColor) {
      let colorIndex = colorTable.indexOf(properties.formats_backgroundColor);
      if (colorIndex >= 0) {
        rtf += `\\chcbpat${colorIndex}`;
      }
    }

    // lineHeight not supported for characters
    // if (controls.lineHeight) {
    //     rtf += `\\sl${Math.round(-fontSize * controls.lineHeight * 20)}`;
    //   }

    // formats_boldness only supported as on/off
    if (properties.formats_boldness && properties.formats_boldness >= 700) {
      rtf += `\\b1`;
    }

    if (properties.formats_italic) {
      rtf += `\\i1`;
    }

    if (properties.formats_letterSpacing) {
      rtf += `\\expnd${Math.round(
        fontSize * properties.formats_letterSpacing * 4,
      )}\\expndtw${Math.round(fontSize * properties.formats_letterSpacing * 20)}`;
    }

    // word spacing not supported in rtf

    if (properties.format_capsStyle == "all-small-caps") {
      rtf += `\\caps1`;
    }
    if (properties.format_capsStyle == "small-caps") {
      rtf += `\\scaps1`;
    }

    // transform not supported in rtf

    if (properties.formats_underline) {
      switch (properties.formats_linetype) {
        case "double":
          rtf += `\\uldb1`;
          break;
        case "dotted":
          rtf += `\\uld1`;
          break;
        case "dashed":
          rtf += `\\uldash1`;
          break;
        case "wavy":
          rtf += `\\ulwave1`;
          break;
        default:
          rtf += `\\ul1`;
          break;
      }
    }

    // overline not supported in rtf

    // strike only continuous or double in rtf
    if (properties.formats_strike) {
      switch (properties.formats_linetype) {
        case "double":
          rtf += `\\strikedl`;
          break;
        default:
          rtf += `\\strike1`;
          break;
      }
    }

    // line color and strength not supported in rtf
    if (properties.formats_border && properties.formats_border[0]) {
      let colorIndex = colorTable.indexOf(properties.formats_border[1]);
      if (colorIndex >= 0) {
        rtf += `\\chbrdr\\brdrcf${colorIndex}\\brdrw${properties.formats_border[3] * 10}`;
        switch (properties.formats_border[2]) {
          case "solid":
            rtf += `\\brdrs`;
            break;
          case "dotted":
            rtf += `\\brdrdot`;
            break;
          case "dashed":
            rtf += `\\brdrdash`;
            break;
          case "double":
            rtf += `\\brdrdb`;
            break;
        }
      }
    }

    // border left, right, top, bottom not supported by rtf
    // outline not supported by rtf
    // shadow not supported by rtf

    return rtf;
  }
}
