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
   */
  static config = {
    modules: {
      keyboard: {
        bindings: {
          bold: { key: "b", ctrlKey: true, handler: function () {} },
          italic: { key: "i", ctrlKey: true, handler: function () {} },
          underline: { key: "u", ctrlKey: true, handler: function () {} },
          tab: { key: 9, handler: function () {} },
          // cut: { key: "x", ctrlKey: true, handler: function () {} },
        },
      },
    },
  };
}
