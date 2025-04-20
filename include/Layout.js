/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of Layout class
 */

/* The overall layout:
+-------------------------------------------------------------------+
|             |                                      |              |
|  Text       |  Text                                |  Object      |
|  Tree       |  Editor                              |  Tree        |
|  (TT)       |  (TE)                                |  (OT)        |
|             |                                      |              |
|             <                                      <              |
|             >                                      >              |
|             |---------------------------^v---------|              |
|-------^v----|                                      |              |
|  Text       |  Object                              |              |
|  Collection |  References                          |              |
|  List       |  (OR)                                |              |
|  (TCL)      |                                      |              |
+-------------------------------------------------------------------+

The individual areas contain the following:

Text Tree (TT): A tree structure to organize a larger project into text chunks that can be inspected and edited individually or in combination in the TE.

Text Collection List (TCL): A list (flat tree) to organize several text collection as subsets of the texts in TT

Text Editor (TE): A content-editable div in which text chunks can be edited and text passages marked, ie. assigned objects from the OT to, where such marking leads to applying the styles attached to the respective objects to the text passages 

Object References (OR): An area where marked text passages are visible according to the selection in the OT

Object Tree (OT): A tree structure where arbitrary objects (e.g. places, characters) can be defined, ordered and assigned styles to
*/

/**
 * @classdesc the Layout class divides the main window into several areas for different purposes
 */
class Layout {
  /**
   * definition of window areas -- horizontal areas left to right, vertical areas in second level top to bottom
   * @static
   */
  static #areas = [
    {
      id: "TT_TCL",
      areas: [
        {
          id: "TT",
          class: "dim-split",
          style: "overflow-x:hidden; position:relative",
          size: 60,
        },
        {
          id: "TCL",
          class: "dim-split",
          style: "overflow-x:hidden; position:relative",
          size: 40,
        },
      ],
      size: 15,
      minsize: 100,
    },
    {
      id: "TE_OR",
      areas: [
        { id: "TE", class: "dim-split", size: 70 },
        { id: "OR", class: "dim-split", size: 30 },
      ],
      size: 70,
      minsize: 800,
    },
    {
      id: "OT",
      class: "dim-split",
      style: "overflow-x:hidden",
      size: 15,
      minsize: 100,
    },
  ];

  /**
   * names of areas relevant for different collapsings
   * @static
   */
  static #leftCollapse = "TT_TCL";
  static #rightCollapse = "OT";
  static #bottomCollapse = "OR";
  static #horizontalUncollapse = "TE_OR";
  static #verticalUncollapse = "TE";

  #horizontalSplit;
  #verticalSplits = {};
  #origValues = {};
  #horizontalSizes;
  #verticalSizes;
  #zoomValue = Util.neutralZoomValue;
  #overlayLeft;
  #displayLeft = true;
  #overlayRight;
  #displayRight = true;
  #overlayBottom;
  #displayBottom = true;
  #stylePreviewDiv;

  /**
   * class constructor
   */
  constructor() {
    let $content = $("<div>").attr({ class: "dim-content" });
    Layout.#areas.forEach((hArea) => {
      let $area = $("<div>")
        .attr({ id: hArea.id, class: hArea.class, style: hArea.style })
        .css("position", "relative");
      if (hArea.areas) {
        hArea.areas.forEach((vArea) => {
          $area.append(
            $("<div>").attr({
              id: vArea.id,
              class: vArea.class,
              style: vArea.style,
            }),
          );
        });
      }
      $content.append($area);
    });

    $("body").empty();
    $("body").css("overflow", "hidden").append($content);

    // clicking on anything but "TE" unsets the editor's status bar
    Layout.#areas.forEach((hArea) => {
      if (hArea.id != "TE_OR" && hArea.id != "TE") {
        $(`#${hArea.id}`).on("click", () => {
          if (theTextEditor) {
            theTextEditor.unsetStatusBar();
          }
        });
      }
      if (hArea.areas) {
        hArea.areas.forEach((vArea) => {
          if (vArea.id != "TE_OR" && vArea.id != "TE") {
            $(`#${vArea.id}`).on("click", () => {
              if (theTextEditor) {
                theTextEditor.unsetStatusBar();
              }
            });
          }
        });
      }
    });

    // left (un)collapsing
    this.#overlayLeft = $("<div>").attr({
      style: `position:absolute; top:0px; left:0px; width:3px; height:100%; z-index:10; display:none;`,
    });
    this.#overlayLeft.on("mouseover", () => {
      this.#overlayLeft.css("width", "20px");
    });
    this.#overlayLeft.on("mouseout", () => {
      this.#overlayLeft.css("width", "3px");
    });
    this.#overlayLeft.on("dblclick", () => {
      this.toggleLeft();
    });
    $("body").append(this.#overlayLeft);

    // right (un)collapsing
    this.#overlayRight = $("<div>").attr({
      style: `position:absolute; top:0px; right:0px; width:3px; height:100%; z-index:10; display:none;`,
    });
    this.#overlayRight.on("mouseover", () => {
      this.#overlayRight.css("width", "20px");
    });
    this.#overlayRight.on("mouseout", () => {
      this.#overlayRight.css("width", "3px");
    });
    this.#overlayRight.on("dblclick", () => {
      this.toggleRight();
    });
    $("body").append(this.#overlayRight);

    // bottom (un)collapsing
    this.#overlayBottom = $("<div>").attr({
      style: `position:absolute; bottom:0px; left:0px; height:3px; width:100%; z-index:10; display:none;`,
    });
    this.#overlayBottom.on("mouseover", () => {
      this.#overlayBottom.css("height", "20px");
    });
    this.#overlayBottom.on("mouseout", () => {
      this.#overlayBottom.css("height", "3px");
    });
    this.#overlayBottom.on("dblclick", () => {
      this.toggleBottom();
    });
    $("body").append(this.#overlayBottom);

    // div to preview styledObject styles
    this.#stylePreviewDiv = $("<div>").attr({
      style:
        "position:absolute; top:0; left:0; width:100%;height:100%; background-color:#0000; cursor:pointer; z-index:-10",
    });
    this.#stylePreviewDiv.on("click", () => {
      this.clearPreview();
    });
    $("body").append(this.#stylePreviewDiv);

    this.reset(false);
    this.setup(theSettings.effectiveSettings());
  }

  // getter and setters

  get zoomValue() {
    return this.#zoomValue;
  }

  set zoomValue(zoom) {
    this.#zoomValue = zoom;
  }

  get displayLeft() {
    return this.#displayLeft;
  }

  set displayLeft(doDisplay) {
    this.#displayLeft = doDisplay;
  }

  get displayRight() {
    return this.#displayRight;
  }

  set displayRight(doDisplay) {
    this.#displayRight = doDisplay;
  }

  get displayBottom() {
    return this.#displayBottom;
  }

  set displayBottom(doDisplay) {
    this.#displayBottom = doDisplay;
  }

  get horizontalSizes() {
    return Object.assign({}, this.#horizontalSizes);
  }

  set horizontalSizes(sizes) {
    this.#horizontalSizes = Object.assign({}, sizes);
  }

  get verticalSizes() {
    return Object.assign({}, this.#verticalSizes);
  }

  set verticalSizes(sizes) {
    this.#verticalSizes = Object.assign({}, sizes);
  }

  isDirty() {
    if (
      this.#origValues["zoom"] != this.#zoomValue ||
      this.#origValues["left"] != this.#displayLeft ||
      this.#origValues["right"] != this.#displayRight ||
      this.#origValues["bottom"] != this.#displayBottom ||
      this.#origValues["horizontal"] != JSON.stringify(this.#horizontalSizes) ||
      this.#origValues["vertical"] != JSON.stringify(this.#verticalSizes)
    ) {
      return true;
    }
    return false;
  }

  undirty() {
    this.#origValues["zoom"] = this.#zoomValue;
    this.#origValues["left"] = this.#displayLeft;
    this.#origValues["right"] = this.#displayRight;
    this.#origValues["bottom"] = this.#displayBottom;
    this.#origValues["horizontal"] = JSON.stringify(this.#horizontalSizes);
    this.#origValues["vertical"] = JSON.stringify(this.#verticalSizes);
  }

  /**
   * reset values and optionally layout
   *
   * @param {Boolean} doLayout
   */
  reset(doLayout) {
    this.#zoomValue = Util.neutralZoomValue;
    this.#horizontalSizes = {};
    Layout.#areas.forEach((hArea) => {
      this.#horizontalSizes[hArea.id] = hArea.size;
    });
    this.#verticalSizes = {};
    Layout.#areas.forEach((hArea) => {
      if (hArea.areas) {
        let vSize = {};
        hArea.areas.forEach((vArea) => {
          vSize[vArea.id] = vArea.size;
        });
        this.#verticalSizes[hArea.id] = vSize;
      }
    });
    this.#displayLeft = true;
    this.#displayRight = true;
    this.#displayBottom = true;

    if (doLayout) {
      this.layout(theSettings.effectiveSettings());
    }
  }

  /**
   * setup the layout
   *
   * @param {Object} settings
   */
  setup(settings) {
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    });
    $("#TT").css({
      "--foreground-color": Util.blackOrWhite(
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.TTBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("#TCL").css({
      "--foreground-color": Util.blackOrWhite(
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.TCLBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("#TEE").css({
      "--foreground-color": "#000000",
      "--background-color":
        settings.TEBackgroundColor || settings.generalBackgroundColor,
    });
    $("#TE").css({
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.TEBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.TEBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("#OR").css({
      "--foreground-color": Util.blackOrWhite(
        settings.ORBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.ORBackgroundColor || settings.generalBackgroundColor,
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.ORBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.ORBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("#OT").css({
      "--foreground-color": Util.blackOrWhite(
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.OTBackgroundColor || settings.generalBackgroundColor,
      ),
    });

    this.#overlayLeft.css(
      "background",
      `linear-gradient(to right, ${settings.gutterColor} 10%, rgba(0,0,0,0))`,
    );
    this.#overlayRight.css(
      "background",
      `linear-gradient(to left, ${settings.gutterColor} 10%, rgba(0,0,0,0))`,
    );
    this.#overlayBottom.css(
      "background",
      `linear-gradient(to top, ${settings.gutterColor} 10%, rgba(0,0,0,0))`,
    );

    this.layout(settings);
  }

  /**
   * layout the layout according to display values, horizontal and vertical sizes; also set the application menu
   *
   * @param {Object} settings
   */
  layout(settings) {
    if (this.#horizontalSplit) {
      this.#horizontalSplit.destroy();
    }
    Object.values(this.#verticalSplits).forEach((split) => split.destroy());
    this.#verticalSplits = {};

    // horizontal split
    let hAreas = Layout.#areas.map((x) => x.id);
    let minSizes = Layout.#areas.map((x) => x.minsize);
    let size = 0;
    if (this.#displayLeft) {
      size += this.#horizontalSizes[Layout.#leftCollapse];
    } else {
      hAreas.shift();
      minSizes.shift();
    }
    if (this.#displayRight) {
      size += this.#horizontalSizes[Layout.#rightCollapse];
    } else {
      hAreas.pop();
      minSizes.pop();
    }
    let hSizes = hAreas.map((x) =>
      x == Layout.#horizontalUncollapse ? 100 - size : this.#horizontalSizes[x],
    );

    this.#horizontalSplit = Split(
      hAreas.map((x) => `#${x}`),
      {
        direction: "horizontal",
        gutterSize: parseInt(settings.gutterSize),
        gutterStyle: () => {
          return {
            "width": settings.gutterSize,
            "background-color": settings.gutterColor,
          };
        },
        elementStyle: (dimension, elementSize, gutterSize, index) => {
          if (elementSize == 100) {
            return { width: "100%" };
          } else {
            return {
              width: `calc(${elementSize}% - ${gutterSize}px)`,
            };
          }
        },
        sizes: hSizes,
        snapOffset: 0,
        minSize: minSizes,
        // expandToMin: true, -- do not use this option
        onDragEnd: (sizes) => {
          if (this.#displayLeft) {
            this.#horizontalSizes[Layout.#leftCollapse] = sizes[0];
            sizes.shift();
          }
          this.#horizontalSizes[Layout.#horizontalUncollapse] = sizes[0];
          if (this.#displayRight) {
            this.#horizontalSizes[Layout.#rightCollapse] = sizes[1];
          }
        },
      },
    );

    // veetical splits
    let vAreas = Layout.#areas[1].areas.map((x) => x.id);
    size = 0;
    if (this.#displayBottom) {
      size +=
        this.#verticalSizes[Layout.#horizontalUncollapse][
          Layout.#bottomCollapse
        ];
    } else {
      vAreas.pop();
    }
    let vSizes = vAreas.map((x) =>
      x == Layout.#bottomCollapse
        ? this.#verticalSizes[Layout.#horizontalUncollapse][
            Layout.#bottomCollapse
          ]
        : 100 - size,
    );

    this.#verticalSplits[Layout.#horizontalUncollapse] = Split(
      vAreas.map((x) => `#${x}`),
      {
        direction: "vertical",
        gutterSize: parseInt(settings.gutterSize),
        gutterStyle: () => {
          return {
            "height": parseInt(settings.gutterSize),
            "background-color": settings.gutterColor,
          };
        },
        elementStyle: (dimension, elementSize, gutterSize, index) => {
          if (elementSize == 100) {
            return { height: "100%" };
          } else {
            return {
              height: `calc(${elementSize}% - ${gutterSize}px)`,
            };
          }
        },
        snapOffset: 0,
        minSize: 100,
        sizes: vSizes,
        onDragEnd: (sizes) => {
          this.#verticalSizes[Layout.#horizontalUncollapse][
            Layout.#verticalUncollapse
          ] = sizes[0];
          if (this.#displayBottom) {
            this.#verticalSizes[Layout.#horizontalUncollapse][
              Layout.#bottomCollapse
            ] = sizes[1];
          }
        },
      },
    );

    Layout.#areas.forEach((hArea) => {
      if (hArea.areas) {
        if (
          (hArea.id == Layout.#leftCollapse && this.#displayLeft) ||
          (hArea.id == Layout.#rightCollapse && this.#displayRight)
        ) {
          this.#verticalSplits[hArea.id] = Split(
            hArea.areas.map((x) => `#${x.id}`),
            {
              direction: "vertical",
              gutterSize: parseInt(settings.gutterSize),
              gutterStyle: () => {
                return {
                  "height": parseInt(settings.gutterSize),
                  "background-color": settings.gutterColor,
                };
              },
              elementStyle: (dimension, elementSize, gutterSize, index) => {
                if (elementSize == 100) {
                  return { height: "100%" };
                } else {
                  return {
                    height: `calc(${elementSize}% - ${gutterSize}px)`,
                  };
                }
              },
              snapOffset: 0,
              minSize: 100,
              sizes: hArea.areas.map(
                (x) => this.#verticalSizes[hArea.id][x.id],
              ),
              onDragEnd: (sizes) => {
                for (let i = 0; i < hArea.areas.length; i++) {
                  this.#verticalSizes[hArea.id][hArea.areas[i].id] = sizes[i];
                }
              },
            },
          );
        }
      }
    });

    $(`#${Layout.#leftCollapse}`).css(
      "display",
      this.#displayLeft ? "revert" : "none",
    );
    this.#overlayLeft.css("display", this.#displayLeft ? "none" : "block");
    $(`#${Layout.#leftCollapse} + .gutter`)
      .first()
      .on("dblclick", () => {
        this.toggleLeft();
      });

    $(`#${Layout.#rightCollapse}`).css(
      "display",
      this.#displayRight ? "revert" : "none",
    );
    this.#overlayRight.css("display", this.#displayRight ? "none" : "block");
    $(`#${Layout.#horizontalUncollapse} + .gutter`)
      .first()
      .on("dblclick", () => {
        this.toggleRight();
      });

    $(`#${Layout.#bottomCollapse}`).css(
      "display",
      this.#displayBottom ? "revert" : "none",
    );
    this.#overlayBottom.css("display", this.#displayBottom ? "none" : "block");
    $(`#${Layout.#verticalUncollapse} + .gutter`)
      .first()
      .on("dblclick", () => {
        this.toggleBottom();
      });

    ipcRenderer.invoke("mainProcess_setAppMenu", [
      settings.language,
      settings.projectsListLength,
      settings.exportsListLength,
      settings.dateTimeFormatShort,
      this.#displayLeft,
      this.#displayRight,
      this.#displayBottom,
    ]);
  }

  /**
   * (un)display the left panel
   *
   * @param {Boolean} setUnset if true show panel, else unshow; if undefined invert
   */
  toggleLeft(setUnset) {
    if (setUnset != undefined) {
      this.#displayLeft = !Boolean(setUnset);
    }
    this.#displayLeft = !this.#displayLeft;
    this.layout(theSettings.effectiveSettings());
  }

  /**
   * (un)display the right panel
   *
   * @param {Boolean} setUnset if true show panel, else unshow; if undefined invert
   */
  toggleRight(setUnset) {
    if (setUnset != undefined) {
      this.#displayRight = !Boolean(setUnset);
    }
    this.#displayRight = !this.#displayRight;
    this.layout(theSettings.effectiveSettings());
  }

  /**
   * (un)display the bottom panel
   *
   * @param {Boolean} setUnset if true show panel, else unshow; if undefined invert
   */
  toggleBottom(setUnset) {
    if (setUnset != undefined) {
      this.#displayBottom = !Boolean(setUnset);
    }
    this.#displayBottom = !this.#displayBottom;
    this.layout(theSettings.effectiveSettings());
  }

  /**
   * show all panels
   */
  viewAll() {
    this.#displayLeft = true;
    this.#displayRight = true;
    this.#displayBottom = true;
    this.layout(theSettings.effectiveSettings());
  }

  /**
   * hide all panels (show only central panel, i.e. editor)
   */
  viewEditor() {
    this.#displayLeft = false;
    this.#displayRight = false;
    this.#displayBottom = false;
    this.layout(theSettings.effectiveSettings());
  }

  /**
   * hide style preview
   */
  clearPreview() {
    this.#stylePreviewDiv.empty();
    this.#stylePreviewDiv.css("z-index", -10);
  }

  /**
   * fill style preview
   *
   * @param {JQuery} div
   */
  setPreview(div) {
    this.#stylePreviewDiv.empty();
    this.#stylePreviewDiv.append(div);
  }

  /**
   * show style preview
   */
  showPreview() {
    this.#stylePreviewDiv.css("z-index", 10);
  }
}
