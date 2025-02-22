/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Placeholder class
 */

/**
 * @classdesc Placeholders are Parchment blots that are used in ExportEditors to insert variable content (such as the project title or all exported texts)
 */
class Placeholder extends Parchment.Embed {
  /**
   * called upon blot creation
   * @static
   *
   * @param {String} type name of the placeholder type
   * @returns {DOMNode}
   */
  static create(type) {
    // theSettings is a global var that is available in exportEditor window, which is the only place where Placeholder class is used
    let m = theSettings.exportPlaceholderStuffing.match(/^(\S*)\s.+\s(\S*)$/);
    let isBlock = Boolean(Exporter.placeholders[type].block);
    let node = super.create(); // this is a div
    $(node).attr({
      type: type,
      class: "export-placeholder",
      contenteditable: false,
    });
    if (isBlock) {
      // block placeholders use a span within the div node
      let $span = $("<span>");
      $span.append(
        (m ? m[1] : "") + _(`placeholders_${type}`) + (m ? m[2] : ""),
      );
      $span.attr("class", "placeholder-block");
      // span.setAttribute("class", "placeholder-block");
      if (
        theSettings.exportPlaceholderBorderColor ||
        theSettings.exportPlaceholderBackgroundColor
      )
        // span.setAttribute(
        $span.attr(
          "style",
          (theSettings.exportPlaceholderBackgroundColor
            ? `color:${Util.blackOrWhite(theSettings.exportPlaceholderBackgroundColor)};`
            : "") +
            (theSettings.exportPlaceholderBorderColor
              ? `border:2px solid ${theSettings.exportPlaceholderBorderColor};`
              : "") +
            (theSettings.exportPlaceholderBackgroundColor
              ? `background-color:${theSettings.exportPlaceholderBackgroundColor}`
              : ""),
        );
      $(node).append($span);
    } else {
      if (
        theSettings.exportPlaceholderBorderColor ||
        theSettings.exportPlaceholderBackgroundColor
      )
        $(node).attr(
          "style",
          (theSettings.exportPlaceholderBackgroundColor
            ? `color:${Util.blackOrWhite(theSettings.exportPlaceholderBackgroundColor)};`
            : "") +
            (theSettings.exportPlaceholderBorderColor
              ? `border:2px solid ${theSettings.exportPlaceholderBorderColor};`
              : "") +
            (theSettings.exportPlaceholderBackgroundColor
              ? `background-color:${theSettings.exportPlaceholderBackgroundColor}`
              : ""),
        );
      $(node).append(
        // document.createTextNode(
        (m ? m[1] : "") + _(`placeholders_${type}`) + (m ? m[2] : ""),
        // ),
      );
    }
    return node;
  }

  /**
   * get the blots type
   * @static
   *
   * @param {DOMNode} domNode
   * @returns {String}
   */
  static value(domNode) {
    return domNode.getAttribute("type");
  }
}

Placeholder.blotName = "placeholder";
Placeholder.tagName = "div";

Parchment.register(Placeholder);
