/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of web page import window
 */

/**
 * i18n related stuff
 */
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

let theSettings;
let theLeftURLs;
let theRightURLs;

/**
 * initialize window
 * this window actually never gets closed, just hidden to keep browsing history
 * and avoid reloading web pages on reopening / redisplaying
 *
 * @param {Object} settings effective settings
 */
window.api.onInit((settings) => {
  theLanguage = settings.language;
  theSettings = settings;
  theLeftURLs = [];
  theRightURLs = [];

  // create content
  let $grid = $("<div>").attr({
    style:
      "margin:10px; display:grid; row-gap:10px; column-gap:10px; grid-template-columns: max-content max-content max-content max-content 150px max-content auto max-content",
  });

  // back and forward buttons
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1",
      })
      .html(
        `<button type="button" class="btn btn-light btn-sm" onclick="backwards()" id="backwards" disabled title="${_(
          "importFromURLWindow_back",
          { url: theLeftURLs[theLeftURLs.length - 2] },
        )}"><i class="fa-solid fa-arrow-left"></i></button>`,
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1",
      })
      .html(
        `<button type="button" class="btn btn-light btn-sm" onclick="forward()" id="forward" disabled title="${_(
          "importFromURLWindow_forward",
          { url: theRightURLs[0] },
        )}"><i class="fa-solid fa-arrow-right"></i></button>`,
      ),
  );

  // stop and reload buttons
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:3/span 1",
      })
      .html(
        `<button type="button" class="btn btn-light btn-sm" onclick="window.api.stop()" id="stop" disabled title="${_(
          "importFromURLWindow_stop",
        )}"><i class="fa-solid fa-x"></i></button>`,
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:4/span 1",
      })
      .html(
        `<button type="button" class="btn btn-light btn-sm" onclick="loadURL()" id="reload" disabled title="${_(
          "importFromURLWindow_reload",
        )}"><i class="fa-solid fa-arrows-rotate"></i></button>`,
      ),
  );

  // zoom
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:5/span 1; align-self:center",
      })
      .html(
        `<input type="range" title="${_("importFromURLWindow_zoom")}" class="${Util.blackOrWhite(
          theSettings.importfromurlBackgroundColor ||
            theSettings.generalBackgroundColor,
          "range-light",
          "range-dark",
        )} form-range" style="padding-top:5px" min="0" max="160" id="zoom" value="80" disabled onchange="zoom(this.value)">`,
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:6/span 1; align-self:center",
      })
      .html(
        `<span id="zoomValue" onclick="$('#zoom').val(80); $('#zoom').trigger('change')">100%</span>`,
      ),
  );

  // url input and import
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:7/span 1; align-self:center",
      })
      .html(
        `<input type="text" class="form-control form-control-sm" spellcheck="false" id="url" style="width:100%" onkeypress="urlKeypress(event)">`,
      ),
  );
  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:8/span 1;",
      })
      .html(
        `<button type="button" class="btn btn-primary" onclick="window.api.import()" id="import" disabled>${_(
          "importFromURLWindow_import",
        )}</button>`,
      ),
  );

  // browser content
  $grid.append(
    $("<div>").attr({
      style:
        "grid-column:1/span 3; border:2px solid grey; background:linear-gradient(red, transparent),linear-gradient(to top left, lime, transparent),linear-gradient(to top right, blue, transparent); background-blend-mode:screen; position:absolute; top:60px; bottom:10px; width:calc(100% - 20px); left:10px",
      id: "browserview",
    }),
  );
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.importfromurlBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.importfromurlBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        theSettings.importfromurlBackgroundColor ||
          theSettings.generalBackgroundColor,
      ),
      "--background-color":
        theSettings.importfromurlBackgroundColor ||
        theSettings.generalBackgroundColor,
    })
    .append($grid);

  // change window size
  $(window).on("resize", () => window.api.move(browserViewPos()));

  window.api.new(browserViewPos());
});

/**
 * URL has changed, change controls and wait for page to load
 *
 * @param {String} url
 */
window.api.onChangeURL((url) => {
  $("#browserview").css("background", "#ffffff");
  $("#url").val(url);
  if (!theLeftURLs.length || theLeftURLs[theLeftURLs.length - 1] != url) {
    theLeftURLs.push(url);
  }
  $("#backwards").attr(
    "title",
    _("importFromURLWindow_back", {
      url: theLeftURLs.length >= 2 ? theLeftURLs[theLeftURLs.length - 2] : "",
    }),
  );
  $("#forward").attr(
    "title",
    _("importFromURLWindow_forward", {
      url: theRightURLs.length ? theRightURLs[0] : "",
    }),
  );
  $("#backwards").attr("disabled", theLeftURLs.length <= 1);
  $("#forward").attr("disabled", !theRightURLs.length);
  $("#import").attr("disabled", true);
  $("#zoom").attr("disabled", true);
  $("#zoomValue").attr("title", "");
});

/**
 * page ist ready and can be imported
 */
window.api.onReadyToImport(() => {
  $("#import").attr("disabled", false);
  $("#zoom").attr("disabled", false);
  $("#zoomValue").attr("title", _("importFromURLWindow_zoom100"));
  $("#stop").attr("disabled", true);
  $("#reload").attr("disabled", false);
});

/**
 * key press in address bar
 *
 * @param {*} event
 */
function urlKeypress(event) {
  if (event.key == "Enter") {
    loadURL();
  }
}

/**
 * get current position of browser view element
 *
 * @returns {Number[]]} left, top, width, height in pixel
 */
function browserViewPos() {
  let bw = parseInt($("#browserview").css("border-width"));
  return [
    $("#browserview").position().left + bw,
    $("#browserview").position().top + bw,
    $("#browserview").width(),
    $("#browserview").height(),
  ];
}

/**
 * open page, either url as given in address field or search if not an web address
 */
function loadURL() {
  let url = null;
  if ($("#url").val() != "") {
    try {
      url = new URL($("#url").val());
    } catch (err) {
      try {
        url = new URL(`https://${$("#url").val()}`);
      } catch (err) {
        url = null;
      }
    }
    if (!url || !url.hostname.includes(".")) {
      try {
        url = new URL(
          theSettings.importSearch.replace("$", escape($("#url").val())),
        );
      } catch (err) {
        url = null;
      }
    }
    if (url && url.hostname.includes(".") && url.protocol.startsWith("http")) {
      $("#url").val(url.href);
      window.api.open(url.href);
      $("#stop").attr("disabled", false);
      $("#reload").attr("disabled", true);
    }
  }
}

/**
 * history back
 */
function backwards() {
  if (theLeftURLs.length > 1) {
    theRightURLs.unshift(theLeftURLs.pop());
    let back = theLeftURLs.pop();
    $("#url").val(back);
    loadURL();
  }
}

/**
 * history forward
 */
function forward() {
  if (theRightURLs.length) {
    let fwd = theRightURLs.shift();
    $("#url").val(fwd);
    loadURL();
  }
}

/**
 * zoom web page content
 *
 * @param {Number} zoom raw zoom slider value
 */
function zoom(zoom) {
  zoom = Util.scaledZoom(zoom);
  $("#zoomValue").html(`${zoom}%`);
  window.api.zoom(zoom);
}
