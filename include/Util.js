/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Util class
 */

/**
 * @classdesc Util provides various (static) utility methods needed all over
 */
class Util {
  static deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
      return true;
    }
    if (
      obj1 == null ||
      typeof obj1 !== "object" ||
      obj2 == null ||
      typeof obj2 !== "object"
    ) {
      return false;
    }

    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (let key of keys1) {
      if (!keys2.includes(key) || !Util.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    return true;
  }

  // editor related methods

  /**
   * linear value that is mapped to neutral zoom (100%)
   */
  static neutralZoomValue = 80;

  /**
   * zooming unlinearity: scale a linear value from a zoom control 0..160 to a real zoom value of 20..500
   *
   * @param {Number} linearValue Zoom input value in [0,160]
   * @returns {Number} Zoom output value (magnification percent) in [20,500]
   */
  static scaledZoom(linearValue) {
    if (linearValue <= Util.neutralZoomValue) {
      return Math.round(
        20 + (Util.neutralZoomValue * linearValue) / Util.neutralZoomValue,
      );
    } else {
      return Math.round(
        100 +
          (400 * (linearValue - Util.neutralZoomValue)) / Util.neutralZoomValue,
      );
    }
  }

  // tabs related methods

  /**
   * initialize tabs
   */
  static initTabs() {
    $(window).on("resize", function (e) {
      Util.#scrollTabIntoView($("a.active").attr("href"), 0);
    });

    $(".nav-pills a").each(function () {
      $(this).on("click", (event) => {
        event.preventDefault();
        new bootstrap.Tab(this).show();
      });
      this.addEventListener("show.bs.tab", (event) => {
        Util.#scrollTabIntoView($(event.target).attr("href"));
      });
    });
  }

  /**
   * add a tab
   * @static
   *
   * @param {jQuery} $tabs container for tabs
   * @param {jQuery} $content container for tabs content
   * @param {Boolean} selected
   * @param {String} id
   * @param {String} name
   * @param {String} content html content of tab
   */
  static addTab($tabs, $content, selected, id, name, content) {
    $tabs.append(
      $("<a>")
        .attr({
          class: `nav-item nav-link${selected ? " active" : ""}`,
          href: `#${id}`,
        })
        .html(name),
    );
    $content.append(
      $("<div>")
        .attr({
          class: `tab-pane fade${selected ? " show active" : ""}`,
          id: id,
        })
        .append(content),
    );
  }

  /**
   * scroll tab to middle of screen
   *
   * @param {String} id
   * @param {Number} animateTime
   */
  static #scrollTabIntoView(id, animateTime = 250) {
    let left = 0;
    let pos = 0;
    let total = 0;
    let found = false;
    $(".nav a").each(function () {
      if ($(this).attr("href") == id) {
        found = true;
      }
      if (!found) {
        pos += $(this).outerWidth(true);
      }
      total += $(this).outerWidth(true);
    });
    if (total > $(window).outerWidth()) {
      let leftRight =
        ($(window).outerWidth() - $(`.nav a[href='${id}']`).outerWidth(true)) /
        2;
      left = pos > leftRight ? pos - leftRight : 0;
      if (left > total - $(window).outerWidth()) {
        left = total - $(window).outerWidth();
      }
    }

    if (animateTime) {
      $(".nav").animate({ left: `-${left}px` }, animateTime);
    } else {
      $(".nav").css("left", `-${left}px`);
    }
  }

  // various escaping methods

  /**
   * escape string for html
   *
   * @param {string} string The string to escape
   * @return {string} escaped string
   */
  static escapeHTML(string) {
    if (typeof string != "string") {
      return string;
    }
    return string
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  /**
   * unescape html string
   *
   * @param {string} string The string to unescape
   * @return {string} unescaped string
   */
  static unescapeHTML(string) {
    if (typeof string != "string") {
      return string;
    }
    return string
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  }

  /**
   * escape string for regexp
   *
   * @param {string} string The string to escape
   * @return {string} escaped string
   */
  static escapeRegExp(string) {
    if (typeof string != "string") {
      return string;
    }
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * escape regexp for search (including non-greedy quantifiers)
   *
   * @param {string} string The string to escape
   * @return {string} escaped string
   */
  static escapeRegExpSearch(string) {
    if (typeof string != "string") {
      return string;
    }
    return string.replace(/[*+}]/g, "$&?");
  }

  // formatting methods

  /**
   * Returns a byte size in i18n human readable form (kB, MB, GB etc)
   *
   * @param {number} bytes The bytes to format
   * @param {number} decimals Number of decimals to display
   * @return {string} Formatted byte size
   */
  static formatBytes(bytes, decimals = 1) {
    if (!+bytes) return `0 ${_("units_byte")}`;
    if (decimals < 0) decimals = 0;

    const oneK = 1024;
    const sizes = [
      "units_byte",
      "units_kilobyte",
      "units_megabyte",
      "units_gigabyte",
      "units_terrabyte",
      "PiB",
      "EiB",
      "ZiB",
      "YiB",
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(oneK));

    return `${parseFloat((bytes / Math.pow(oneK, i)).toFixed(decimals))} ${_(sizes[i])}`;
  }

  /**
   * Convert number of days to a i18n weeks, days breakdown
   *
   * @param {Number} days Number of Days to convert
   * @returns {String} Years, Weeks, Days breakdown of input
   */
  static daysToHuman(days) {
    let weeks = Math.floor(days / 7);
    let years = Math.floor(weeks / 52);
    weeks = weeks % 52;
    days = days % 7;
    let s = _("time_ywdHuman");
    if (years) {
      s += _("time_yearsHuman", years, { years: years });
    }
    if (years || weeks) {
      s += _("time_weeksHuman", weeks, { weeks: weeks });
    }
    return s + _("time_daysHuman", days, { days: days });
  }

  // color calculations

  /**
   * convert 3 or 6 digit hex color code to decimal r, g, b values
   * @see https://www.w3docs.com/snippets/javascript/how-to-convert-rgb-to-hex-and-vice-versa.html
   *
   * @param {string} hex 3 or 6 digit hex (#rgb or #rrggbb)
   * @return {Array} red, green and blue color values in decimal
   */
  static hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  /**
   * Converts an RGB color value to HSL. Conversion formula
   * @see http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * @param {Number} r The red color value
   * @param {Number} g The green color value
   * @param {Number} b The blue color value
   * @return {Array} The HSL representation
   */
  static #rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h;
    let s;
    let l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h /= 6;
    }

    return [h, s, l];
  }

  /**
   * Converts an HSL color value to RGB. Conversion formula
   * @see http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param {Number} h The hue
   * @param {Number} s The saturation
   * @param {Number} l The lightness
   * @return {Array} The RGB representation
   */
  static #hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = Util.#hue2rgb(p, q, h + 1 / 3);
      g = Util.#hue2rgb(p, q, h);
      b = Util.#hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.ceil(r * 255), Math.ceil(g * 255), Math.ceil(b * 255)];
  }

  /**
   * hue to rgb
   *
   * @param {Number} p
   * @param {Number} q
   * @param {Number} t
   * @returns {Number}
   */
  static #hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  /**
   * convert from hsv color space to rgb
   *
   * @param {Number} h
   * @param {Number} s
   * @param {Number} v
   * @returns {String} rgb color in hex
   */
  static #hsv2rgb(h, s, v) {
    let f = (n, k = (n + h / 60) % 6) =>
      v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    let r = Math.floor(f(5) * 255).toString(16);
    if (r.length == 1) r = "0" + r;
    let g = Math.floor(f(3) * 255).toString(16);
    if (g.length == 1) g = "0" + g;
    let b = Math.floor(f(1) * 255).toString(16);
    if (b.length == 1) b = "0" + b;
    return `#${r}${g}${b}`;
  }

  /**
   * return contrast color depending on brightness of input color
   *
   * @param {string} hex 3 or 6 digit hex (#rgb or #rrggbb)
   * @param {string} brightColor hex color value
   * @param {string} darkColor hex color value
   * @return {string} hex color value
   */
  static blackOrWhite(hex, brightColor = "#ffffff", darkColor = "#000000") {
    let [r, g, b] = Util.hexToRgb(hex);
    let y =
      0.2126 * Math.pow(r / 255, 2.2) +
      0.7151 * Math.pow(g / 255, 2.2) +
      0.0721 * Math.pow(b / 255, 2.2);
    return y <= 0.18 ? brightColor : darkColor;
  }

  /**
   * return a lighter or darker version of an input color
   *
   * @param {string} color 3 or 6 digit hex (#rgb or #rrggbb)
   * @param {Number} step grade of darkening or lightening [-5,5]
   * @return {string} hex color value
   */
  static lighterOrDarker(color, step) {
    let [H, S, L] = Util.#rgbToHsl(...Util.hexToRgb(color));
    if (step < -5) {
      step = -5;
    }
    if (step > 5) {
      step = 5;
    }
    if (step < 0) {
      L += (L * step) / 5;
    }
    if (step > 0) {
      let x = 1 - L;
      let p = (x * step) / 5;
      L += p;
    }

    let [R, G, B] = Util.#hslToRgb(H, S, L);
    let RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
    let GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
    let BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

    return "#" + RR + GG + BB;
  }

  /**
   * depending on the setting value return value for scrollbar background color
   *
   * @param {String} setting
   * @param {String} color
   * @returns {String}
   */
  static scrollbarBack(setting, color) {
    return setting == "sb_system" ? "auto" : color;
  }

  /**
   * depending on the setting value return value for scrollbar foreground color
   *
   * @param {String} setting
   * @param {String} color
   * @returns {String}
   */
  static scrollbarFore(setting, color) {
    return setting == "sb_system"
      ? ""
      : setting == "sb_soft"
        ? Util.lighterOrDarker(color, Util.blackOrWhite(color, 2, -2))
        : Util.blackOrWhite(color);
  }

  // rgb color mixing, see https://stackoverflow.com/questions/14819058/mixing-two-colors-naturally-in-javascript

  static #hex2dec(hex) {
    return hex
      .replace("#", "")
      .match(/.{2}/g)
      .map((n) => parseInt(n, 16));
  }

  static #rgb2hex(r, g, b) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    r = Math.min(r, 255);
    g = Math.min(g, 255);
    b = Math.min(b, 255);
    return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
  }

  static #rgb2cmyk(r, g, b) {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    let k = Math.min(c, m, y);
    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);
    return [c, m, y, k];
  }

  static #cmyk2rgb(c, m, y, k) {
    let r = c * (1 - k) + k;
    let g = m * (1 - k) + k;
    let b = y * (1 - k) + k;
    r = (1 - r) * 255 + 0.5;
    g = (1 - g) * 255 + 0.5;
    b = (1 - b) * 255 + 0.5;
    return [r, g, b];
  }

  static #mix_cmyks(...cmyks) {
    let c =
      cmyks.map((cmyk) => cmyk[0]).reduce((a, b) => a + b, 0) / cmyks.length;
    let m =
      cmyks.map((cmyk) => cmyk[1]).reduce((a, b) => a + b, 0) / cmyks.length;
    let y =
      cmyks.map((cmyk) => cmyk[2]).reduce((a, b) => a + b, 0) / cmyks.length;
    let k =
      cmyks.map((cmyk) => cmyk[3]).reduce((a, b) => a + b, 0) / cmyks.length;
    return [c, m, y, k];
  }

  static mix_hexes(...hexes) {
    let rgbs = hexes.map((hex) => Util.#hex2dec(hex));
    let cmyks = rgbs.map((rgb) => Util.#rgb2cmyk(...rgb));
    let mixture_cmyk = Util.#mix_cmyks(...cmyks);
    let mixture_rgb = Util.#cmyk2rgb(...mixture_cmyk);
    let mixture_hex = Util.#rgb2hex(...mixture_rgb);
    return mixture_hex;
  }

  // randomizing methods

  /**
   * Returns a Random integer within a Range
   *
   * @param {Number} min lower bound (inclusive)
   * @param {Number} max upper bound (inclusive)
   * @returns {Number} Random integer
   */
  static randomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Returns a Random integer within a Range
   *
   * @param {Number} min lower bound (inclusive)
   * @param {Number} max upper bound (exclusive)
   * @returns {Number} Random integer
   */
  static randomIntExclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Returns a random Real within a Range
   *
   * @param {Number} min lower bound (inclusive)
   * @param {Number} max upper bound (inclusive)
   * @param {Numer} step Fraction the Ramdom Numbers are apart
   * @returns {Number} Random Real
   */
  static randomInclusive(min, max, step) {
    if (step == 0 || max - min < step) {
      return min;
    }
    let count = Math.floor((max - min) / step) + 1;
    return min + Math.floor(Math.random() * count) * step;
  }

  /**
   * Returns a list of colors in hex, equally hue-spaced
   *
   * @param {Number} num how many colors to return
   * @returns {String[]} list of andom colors in hex (#aabbcc)
   */
  static randomColors(num = 3) {
    let hue = Util.randomIntInclusive(0, 359);
    let cols = [hue];
    for (let i = 1; i < num; i++) {
      hue += 360 / num;
      hue %= 360;
      cols.push(Math.round(hue));
    }
    return cols.map((x) => Util.#hsv2rgb(x, 1, 1));
  }
}