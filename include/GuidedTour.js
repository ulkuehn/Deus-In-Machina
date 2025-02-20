/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of GuidedTour class
 */

/**
 * @classdesc functions to guide novel users through basic ui elements
 */
class GuidedTour {
  /**
   * maximum pixel width of explanatory divs
   */
  static maxWidth = 750;

  /**
   * list of all areas to cover in tour
   */
  static #areas = [
    { id: "SplitGutter", name: "SplitGutter1", where: "right" },
    { id: "SplitGutter", name: "SplitGutter2", where: "right" },
    { id: "SplitGutter", name: "SplitGutter3", where: "right" },
    { id: "TT", name: "TT1", where: "right" },
    { id: "TT", name: "TT2", where: "right" },
    { id: "TCL", name: "TCL1", where: "right" },
    { id: "TCL", name: "TCL2", where: "right" },
    { id: "OT", name: "OT1", where: "left" },
    { id: "OT", name: "OT2", where: "left" },
    { id: "OT", name: "OT3", where: "left" },
    { id: "TEE", name: "TEE1", where: "bottom" },
    { id: "TEE", name: "TEE2", where: "bottom" },
    { id: "TEE", name: "TEE3", where: "bottom" },
    { id: "MB", name: "MB", where: "bottom" },
    { id: "SB", name: "SB", where: "top" },
    { id: "OR", name: "OR", where: "top" },
  ];

  #transparentOverlay;
  #overlays;
  #explainDiv;
  #escHandler;
  #onTour = false;

  /**
   * class constructor
   */
  constructor() {
    // show all panels as all of them are being explained
    theLayout.viewAll();

    // transparent overlay covering everything
    this.#transparentOverlay = $("<div>").attr({
      class: "tour-glass",
      style: `width:${$("body").innerWidth()}px; height:${$("body").innerHeight()}px`,
    });
    $("body").append(this.#transparentOverlay);

    // individual area overlays
    $(".gutter-horizontal").first().attr("id", "SplitGutter");
    this.#overlays = {};
    GuidedTour.#areas.forEach((area) => {
      if (!this.#overlays[area.id]) {
        this.#overlays[area.id] = $("<div>").attr({
          class: "tour-overlay",
          style: `left:${$(`#${area.id}`).offset().left}px; top:${$(`#${area.id}`).offset().top}px; width:${$(`#${area.id}`).innerWidth()}px; height:${$(`#${area.id}`).innerHeight()}px`,
        });
      }
      $("body").append(this.#overlays[area.id]);
    });

    // pressing escape ends tour
    this.#escHandler = this.closeOnEscape.bind(this);
    window.addEventListener("keydown", this.#escHandler, true);

    // start tour
    this.#explainDiv = $("<div>").attr({
      class: "tour-info",
    });
    this.#explainDiv.append(
      $("<p>").html(_("tour_All", { programName: theProgramLongName })),
    );
    let $start = $("<div>")
      .attr({
        style: "margin-top:15px",
      })
      .html(
        `<button type="button" class="btn btn-sm btn-warning" onclick=""> ${_(
          "tour_start",
        )}</button>`,
      );
    $start.on("click", () => {
      // move around
      this.explain([...GuidedTour.#areas]);
    });
    this.#explainDiv.append($start);
    $("body").append(this.#explainDiv);
    this.#explainDiv.css(
      "left",
      `${($("body").innerWidth() - this.#explainDiv.innerWidth()) / 2}px`,
    );
    this.#explainDiv.css(
      "top",
      `${($("body").innerHeight() - this.#explainDiv.innerHeight()) / 2}px`,
    );
    setTimeout(() => (this.#onTour = true), 500);
  }

  /**
   * pressing escape exits from tour
   *
   * @param {*} event
   */
  closeOnEscape(event) {
    if (event.key == "Escape") {
      window.removeEventListener("keydown", this.#escHandler, true);
      this.abort();
    }
  }

  /**
   * abort / end tour and restore everything
   */
  abort() {
    // as aborting is also triggered by window resizing and removing the app's menu does a window resize take care to not abort too early but only when user resizes window deliberately
    if (!this.#onTour) return;
    if (this.#explainDiv) this.#explainDiv.remove();
    Object.keys(this.#overlays).forEach((area) => {
      this.#overlays[area].remove();
    });
    this.#transparentOverlay.remove();
    let settings = theSettings.effectiveSettings();
    // restore app menu that was shut down to inhibit user interference while in tour
    ipcRenderer.invoke("mainProcess_setAppMenu", [
      settings.language,
      settings.projectsListLength,
      settings.exportsListLength,
      settings.dateTimeFormatShort,
      theLayout.displayLeft,
      theLayout.displayRight,
      theLayout.displayBottom,
    ]);
    theGuidedTour = null;
  }

  /**
   * explain first area in given list and move to next area on user action
   *
   * @param {Object[]} areas
   */
  explain(areas) {
    if (this.#explainDiv) this.#explainDiv.remove();
    let area = areas.shift();
    if (!area) {
      this.abort();
      return;
    }
    this.#overlays[area.id].addClass("tour-highlight");
    this.#explainDiv = $("<div>").attr({
      class: `tour-info tour-info-${area.where}`,
      style:
        area.where == "left" || area.where == "right"
          ? `max-height:${this.#overlays[area.id].innerHeight() - 20}px; max-width:${Math.min(
              GuidedTour.maxWidth,
              $("body").innerWidth() -
                this.#overlays[area.id].innerWidth() -
                20,
            )}px;`
          : `max-height:${$("body").innerHeight() - 20}px; max-width:${Math.min(
              GuidedTour.maxWidth,
              $("body").innerWidth() -
                this.#overlays[area.id].offset().left -
                10,
            )}px;`,
    });
    this.#explainDiv.append($("<p>").html(_(`tour_${area.name}`)));
    let $continue = $("<div>")
      .attr({
        style: "margin-top:15px",
      })
      .html(
        `<button type="button" class="btn btn-sm btn-warning" onclick=""> ${_(
          areas.length ? "tour_continue" : "tour_end",
        )}</button>`,
      );
    $continue.on("click", () => {
      this.#explainDiv.remove();
      this.#overlays[area.id].removeClass("tour-highlight");
      this.explain(areas);
    });
    this.#explainDiv.append($continue);
    $("body").append(this.#explainDiv);

    switch (area.where) {
      case "left":
        this.#explainDiv.css(
          "left",
          this.#overlays[area.id].offset().left -
            this.#explainDiv.innerWidth() -
            10,
        );
        this.#explainDiv.css(
          "top",
          this.#overlays[area.id].offset().top +
            (this.#overlays[area.id].innerHeight() -
              this.#explainDiv.innerHeight()) /
              2,
        );
        break;
      case "right":
        this.#explainDiv.css(
          "left",
          this.#overlays[area.id].offset().left +
            this.#overlays[area.id].innerWidth() +
            10,
        );
        this.#explainDiv.css(
          "top",
          this.#overlays[area.id].offset().top +
            (this.#overlays[area.id].innerHeight() -
              this.#explainDiv.innerHeight()) /
              2,
        );
        break;
      case "top":
        this.#explainDiv.css(
          "top",
          this.#overlays[area.id].offset().top -
            this.#explainDiv.innerHeight() -
            5,
        );
        this.#explainDiv.css(
          "left",
          this.#overlays[area.id].offset().left +
            (this.#overlays[area.id].innerWidth() -
              this.#explainDiv.innerWidth()) /
              2,
        );
        break;
      case "bottom":
        this.#explainDiv.css(
          "top",
          Math.min(
            this.#overlays[area.id].offset().top +
              this.#overlays[area.id].innerHeight() +
              5,
            $("body").innerHeight() - this.#explainDiv.innerHeight(),
          ),
        );
        this.#explainDiv.css(
          "left",
          this.#overlays[area.id].offset().left +
            (this.#overlays[area.id].innerWidth() -
              this.#explainDiv.innerWidth()) /
              2,
        );
        break;
    }
  }
}
