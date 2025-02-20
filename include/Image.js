/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file Extension for Quill to enable Image insertion and handling
 */

class DIMImage extends Parchment.Embed {
  /**
   * List of attributes an image can have
   * @static
   */
  static attributes = [
    "origwidth", // width in pixels of the image as inserted into the editor
    "origheight", // height ...
    "title", // image title
    "width", // width in pixels of the image to use for display in the editor
    "height", // height ...
    "alignment", // alignment (left, right, ...) to use for display in the editor
    "shadow", // boolean: if to display a shadow around the image in the editor
  ];

  /**
   * List of alignments an image can habe in the editor
   * @static
   */
  static alignments = [
    "image_alignmentBottom", // vertical in line: bottom of text line
    "image_alignmentMiddle", // ... center of text line
    "image_alignmentTop", // ... top of text line
    "image_alignmentLeft", // horizontal as line: left
    "image_alignmentCenter", // ... center
    "image_alignmentRight", // ... right
  ];

  /**
   * standard alignment: vertical in line, center of text line
   * @static
   */
  static alignmentDefault = "image_alignmentMiddle";

  /**
   * sample image to show the effect of image alignment setting
   * @static
   */
  static sampleImage =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAcCAYAAAAAwr0iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIxSURBVEhLvddNqExhHMfxweXGRe7q3vKSlxXl5VLSVaKUlfKSshZlqWRHWdhY3IXY2IludyPZqLtQIkpEkRTCUnl/CSHG93vmeaYx95yZO+ac86vPnHmeOXPm/8zzzHPPrYRswC18RbUEo1iMyhSswnVMx2P8QpEZwDJ8wrAdF2FV+22UlGPwM2/a+IYHPik5T1GdysNM/LAnp/RgOeYkrew888EC8sw2ODLX0mecRds4F3dqT7vKQnwIXFcv4LXPIS1X4Ou5FXAIXutI0qpNxUt8TFoTkxSQ5xTMDsfv4fgHPzEL0+zISl7fwHx4LfeRk7gU2ueRltynwOyB14uuYQHSUkgBMVuxGr1JKz1dr4G54ZiWq3Bza7u//E8B83AKz7HWjm7TyRRswhPEOfY3vwZZcf531Z5OSEdrwFGPIG40B7AZvvcNlqI56+A+4DkX7GjKpAsYwg14XvOqjkW46w3aEbIbsdj4QXfRj5i2BbjIjiJe6CDiZtOYHfAa9+GqPw7Pf4X1MPZ5zntstIO0LGAF4gmO2r9urXIYnvsuHH3PIjTGm4/f8PV9SC3AOyRvTOKo3df7MJmchtc6A9dMWpbgITzvbTjWC3AOL4f2baxEp9kJb+1aZQbG4efUC3gN58dRn0DWCPKMg64XIL+aLXaUlH/WwD2UMerGJAXErdjVmXXjUHjcrfyHpNWWWkQeoerPbi/G7CEuDO9iio4bmgP215BkO+J2W4YvYLOqDP4FeGra9taL0QoAAAAASUVORK5CYII=";

  /**
   * pixel adjustment for radio elements in image alignment setting
   * @static
   */
  static adjust = {
    image_alignmentBottom: 45,
    image_alignmentMiddle: 35,
    image_alignmentTop: 30,
    image_alignmentLeft: 30,
    image_alignmentCenter: 30,
    image_alignmentRight: 30,
  };

  /**
   * collection of CSS to display alignments and image shadow
   * @static
   */
  static styles = {
    shadow: {
      false: { "box-shadow": null },
      true: {
        "box-shadow":
          "0px -1px 10px rgba(0,0,0,0.5), 0px 1px 10px rgba(0,0,0,0.7)",
      },
    },
    alignment: {
      image_alignmentBottom: {
        "display": "inline",
        "margin": "5px 5px 0px 5px",
        "vertical-align": "baseline",
      },
      image_alignmentMiddle: {
        "display": "inline",
        "margin": "5px",
        "vertical-align": "middle",
      },
      image_alignmentTop: {
        "display": "inline",
        "margin": "0px 5px 5px 5px",
        "vertical-align": "text-top",
      },
      image_alignmentLeft: {
        "display": "block",
        "margin": "5px 0px 5px 0px",
        "vertical-align": null,
      },
      image_alignmentCenter: {
        "display": "block",
        "margin": "5px auto 5px auto",
        "vertical-align": null,
      },
      image_alignmentRight: {
        "display": "block",
        "margin": "5px 0px 5px auto",
        "vertical-align": null,
      },
    },
  };

  /**
   * Override Parchment.Embed "create" function
   *
   * @param {*} input data url, possibly followed by max pixel sizes separated by blanks
   * @returns DOM Node
   * @static
   */
  static create(input) {
    // process input
    let [data, maxWidth, maxHeight] = (input + " 0 0").split(" ");
    maxWidth = parseInt(maxWidth);
    maxHeight = parseInt(maxHeight);
    // create and set DOM Node
    let node = super.create(data);
    node.setAttribute("src", data);
    node.onload = () => {
      let width = node.width;
      let height = node.height;
      let ratio = height / width;
      maxWidth && node.setAttribute("origwidth", `${width}px`);
      maxHeight && node.setAttribute("origheight", `${height}px`);
      if (maxWidth && width > maxWidth) {
        width = maxWidth;
        height = Math.round(ratio * width);
      }
      if (maxHeight && height > maxHeight) {
        height = maxHeight;
        width = Math.round(height / ratio);
      }
      node.setAttribute("width", `${width}px`);
      node.setAttribute("height", `${height}px`);
    };

    return node;
  }

  /**
   * Override Parchment.Embed "formats" function
   * @param {Node} domNode
   * @returns format values represented by domNode
   * @static
   */
  static formats(domNode) {
    return DIMImage.attributes.reduce(function (formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  /**
   * Return value represented by this blot
   * @param {Node} domNode
   * @returns src value of domNode
   * @static
   */
  static value(domNode) {
    return domNode.getAttribute("src");
  }

  /**
   * Apply format to Image blot
   * @param {String} name
   * @param {*} value
   */
  format(name, value) {
    if (DIMImage.attributes.indexOf(name) > -1) {
      if (value != null) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
      if (name in DIMImage.styles) {
        for (let [p, v] of Object.entries(DIMImage.styles[name][value])) {
          this.domNode.style[p] = v;
        }
      }
    } else {
      super.format(name, value);
    }
  }
}

DIMImage.blotName = "image";
DIMImage.tagName = "IMG";

Parchment.register(DIMImage);
