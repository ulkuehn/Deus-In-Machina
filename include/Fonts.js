/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Fonts class
 */

class Fonts {
  /**
   * specs of generic fonts
   * @static
   */
  static standardFamilies = [
    {
      class: "sansSerif",
      name: "Liberation Sans",
      source: "https://github.com/liberationfonts",
    },
    {
      class: "serif",
      name: "Liberation Serif",
      source: "https://github.com/liberationfonts",
    },
    {
      class: "monospace",
      name: "Liberation Mono",
      source: "https://github.com/liberationfonts",
    },
    {
      class: "cursive",
      name: "Cartoonist Hand",
      source: "http://www.shyfonts.com/",
    },
    {
      class: "fantasy",
      name: "Grenze",
      source: "https://www.omnibus-type.com/fonts/grenze/",
    },
  ];

  /**
   * specs of font used for user interface
   * @static
   */
  static uiFamily = {
    class: "ui",
    name: "Fira Sans",
    source: "https://github.com/bBoxType/FiraSans",
  };

  /**
   * generic families as known in CSS
   * @static
   */
  static cssFamilies = {
    sansSerif: "sans-serif",
    serif: "serif",
    monospace: "monospace",
    cursive: "cursive",
    fantasy: "fantasy",
  };

  /**
   * generic families as known in RTF
   * @static
   */
  static rtfFamilies = {
    sansSerif: "fswiss",
    serif: "froman",
    monospace: "fmodern",
    cursive: "fscript",
    fantasy: "fdecor",
  };

  #availableFamilies; // all font families found on system

  /**
   * class constructor
   *
   * @param {String[]} availableFamilies
   */
  constructor(availableFamilies = []) {
    this.#availableFamilies = availableFamilies;
  }

  // getters and setters

  get availableFamilies() {
    return this.#availableFamilies;
  }

  /**
   * load all fonts provided in fonts dir
   * 
   * @param {String} baseDir necessary
   * @param {Boolean} uiOnly
   * @returns {Promise} resolves when all fonts are loaded
   */
  loadStandardFonts(baseDir, uiOnly = false) {
    let fontDir = nodePath.join(__dirname, baseDir, "fonts/standard");
    let promises = [];
    fs.readdirSync(fontDir).forEach((style) => {
      fs.readdirSync(nodePath.join(fontDir, style)).forEach((family) => {
        if (!uiOnly || family == "ui") {
          let fontFile = fs.readdirSync(
            nodePath.join(fontDir, style, family),
          )[0];
          let font = new FontFace(
            family,
            `url("${nodePath.join(fontDir, style, family, fontFile).replaceAll("\\", "/")}")`,
            {
              style:
                style == "italic" || style == "bolditalic"
                  ? "italic"
                  : "normal",
              weight:
                style == "bold" || style == "bolditalic" ? "bold" : "normal",
            },
          );
          promises.push(
            new Promise((resolve) => {
              font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                resolve();
              });
            }),
          );
        }
      });
    });
    return Promise.allSettled(promises);
  }

  /**
   * retreive locally available fonts
   * 
   * @returns {Promise} resolves to a list of available fonts on the system
   */
  getAvailableFamilies() {
    return new Promise((resolve) => {
      let families = {};
      window.queryLocalFonts().then((availableFonts) => {
        availableFonts.forEach((font) => {
          families[font.family] = true;
        });
        this.#availableFamilies = Object.keys(families);
        resolve(Object.keys(families));
      });
    });
  }
}
