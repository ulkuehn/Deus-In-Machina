/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file Configuration for Quill
 */

class QuillConfig {
  /**
   * configuration to override/invalidate standard keyboard mappings
   * @static
   * @todo invalidate ctrl+x; simply overriding "cut" doesn't help
   * @todo implement formatting functions in secondary editors (scheme, export)
   */
  static config = {
    modules: {
      keyboard: {
        bindings: {
          bold: {
            key: "b",
            shortKey: true,
            handler: function () {
              typeof theTextEditor !== "undefined"
                ? theTextEditor.bold()
                : typeof bold == "function"
                  ? bold()
                  : null;
            },
          },
          italic: {
            key: "i",
            shortKey: true,
            handler: function () {
              typeof theTextEditor !== "undefined"
                ? theTextEditor.italic()
                : typeof italic == "function"
                  ? italic()
                  : null;
            },
          },
          underline: {
            key: "u",
            shortKey: true,
            handler: function () {
              typeof theTextEditor !== "undefined"
                ? theTextEditor.underline()
                : typeof underline == "function"
                  ? underline()
                  : null;
            },
          },
          strike: {
            key: "s",
            shortKey: true,
            handler: function () {
              typeof theTextEditor !== "undefined"
                ? theTextEditor.strike()
                : typeof strike == "function"
                  ? strike()
                  : null;
            },
          },
          tab: { key: 9, handler: function () {} },
          // cut: { key: "x", ctrlKey: true, handler: function () {} },
        },
      },
    },
  };
}
