/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of SchemeMap class
 */

/**
 * @classdesc map editor for object properties
 */
class SchemeMap {
  /**
   * create a Leaflet icon
   *
   * @param {String} color
   * @param {Boolean} highlight if true icon is highlighted by flipping
   */
  static leafletIcon(color, highlight) {
    return Leaflet.divIcon({
      html: `<span class="fa-stack fa-2x ${
        highlight ? "fa-flip" : ""
      }" style="width:36px"><i class="fa-solid fa-location-pin fa-stack-2x"></i><i class="fa-solid fa-location-pin fa-stack-1x" style="color:${color}"></i></span>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -27],
    });
  }

  /**
   * create a Leaflet marker
   *
   * @param {Object} settings
   * @param {jQuery} $div
   * @param {*} map
   * @param {Number} markerNum
   * @param {*} latLng
   * @param {String} color
   * @param {Boolean} schemeMapMarkerConfirmDelete
   * @param {String} info
   * @returns
   */
  static newMarker(
    settings,
    $div,
    map,
    markerNum,
    latLng,
    color,
    schemeMapMarkerConfirmDelete,
    info,
  ) {
    let marker = Leaflet.marker([latLng.lat, latLng.lng], {
      draggable: true,
      icon: SchemeMap.leafletIcon(color, false),
    }).addTo(map);
    marker.num = markerNum;
    if (info) {
      marker.bindPopup(Leaflet.popup().setContent(info));
    }
    $div
      .children()
      .last()
      .before(
        $("<div>")
          .attr({ num: markerNum, style: "grid-column:1" })
          .html(
            `<i class="fa-solid fa-map-location-dot" id="go_${markerNum}" title="${_(
              "schemeMap_showLocation",
            )}" style="cursor:pointer; opacity:${
              map.getBounds().contains(latLng) ? 1.0 : 0.4
            }"></i>`,
          ),
        $("<div>").attr({ num: markerNum, style: "grid-column:2" }).html(`
             <span id="lat_${markerNum}">${Leaflet.Util.formatNum(
               latLng.lat,
             ).toFixed(6)}</span>`),
        $("<div>").attr({ num: markerNum, style: "grid-column:3" }).html(`
        <span id="lng_${markerNum}">${Leaflet.Util.formatNum(
          Leaflet.latLng(latLng).wrap().lng,
        ).toFixed(6)}</span>`),
        $("<div>")
          .attr({ num: markerNum, style: "grid-column:4;" })
          .html(
            `<input type="text" class="form-control form-control-sm" spellcheck="false" id="text_${markerNum}" style="width:100%" value="${info}">`,
          ),
        $("<div>")
          .attr({ num: markerNum, style: "grid-column:5;" })
          .html(`<input class="colorPicker" id="color_${markerNum}">`),
      );
    let $sp = $div.find(`div[num=${markerNum}] #color_${markerNum}`);
    $sp.spectrum({
      type: "color",
      showPalette: settings.palette != noPalette,
      palette: systemPalettes[settings.palette],
      showInput: true,
      preferredFormat: "hex",
      showInitial: true,
      allowEmpty: false,
      showAlpha: false,
      clickoutFiresChange: false,
      cancelText: _("colorpicker_cancel"),
      chooseText: _("colorpicker_choose"),
      clearText: _("colorpicker_empty"),
      noColorSelectedText: _("colorpicker_nocolor"),
      containerClassName: "dim",
    });
    $sp.spectrum("set", color);

    // (un)highlight map marker on icon hover
    $div.find(`div[num=${markerNum}] #go_${markerNum}`).on("mouseover", () => {
      marker.setIcon(
        SchemeMap.leafletIcon(
          $div.find(`div[num=${markerNum}] #color_${markerNum}`).val(),
          true,
        ),
      );
      marker.setZIndexOffset(1000);
    });
    $div.find(`div[num=${markerNum}] #go_${markerNum}`).on("mouseout", () => {
      marker.setIcon(
        SchemeMap.leafletIcon(
          $div.find(`div[num=${markerNum}] #color_${markerNum}`).val(),
          false,
        ),
      );
      marker.setZIndexOffset(100);
    });

    // (un)highlight marker line on marker hover
    marker.on("mouseover", () => {
      $div.find(`div[num=${markerNum}] #go_${markerNum}`).addClass("fa-flip");
    });
    marker.on("mouseout", () => {
      $div
        .find(`div[num=${markerNum}] #go_${markerNum}`)
        .removeClass("fa-flip");
    });

    // zoom map to location on icon click
    $div.find(`div[num=${markerNum}] #go_${markerNum}`).click(() => {
      map.setView(marker.getLatLng(), 15);
    });

    // change marker text
    $div.find(`div[num=${markerNum}] #text_${markerNum}`).change(() => {
      let info = $div.find(`div[num=${markerNum}] #text_${markerNum}`).val();
      marker.unbindPopup();
      if (info) {
        marker.bindPopup(Leaflet.popup().setContent(info));
      }
    });

    // change marker color
    $div.find(`div[num=${markerNum}] #color_${markerNum}`).change(() => {
      marker.setIcon(
        SchemeMap.leafletIcon(
          $div.find(`div[num=${markerNum}] #color_${markerNum}`).val(),
          false,
        ),
      );
    });

    // move marker
    marker.on("move", (e) => {
      $div
        .find(`div[num=${markerNum}] #lat_${markerNum}`)
        .html(Leaflet.Util.formatNum(e.latlng.lat).toFixed(6));
      $div
        .find(`div[num=${markerNum}] #lng_${markerNum}`)
        .html(Leaflet.Util.formatNum(e.latlng.wrap().lng).toFixed(6));
    });

    // remove marker
    marker.on("contextmenu", (e) => {
      if (schemeMapMarkerConfirmDelete) {
        ipcRenderer
          .invoke("mainProcess_yesNoDialog", [
            _("schemeMap_deleteTitle"),
            _("schemeMap_deleteMessage"),
            false,
          ])
          .then((result) => {
            if (result == 1) {
              marker.remove();
              $div.find(`div[num=${markerNum}]`).remove();
            }
          });
      } else {
        marker.remove();
        $div.find(`div[num=${markerNum}]`).remove();
      }
    });

    return marker;
  }

  #center;
  #zoom;
  #marker;

  /**
   * class constructor
   *
   * @param {Object} settings effective settings
   * @param {jQuery} $mapDiv container for the map
   * @param {jQuery} $locationsDiv container for locations list
   * @param {Object} mapContents content to initialize the map with
   * @param {*} buttonHTML
   */
  constructor(settings, $mapDiv, $locationsDiv, mapContents, buttonHTML) {
    this.#center = mapContents
      ? mapContents.center
      : settings.schemeMapBounds.center;
    this.#zoom = mapContents ? mapContents.zoom : settings.schemeMapBounds.zoom;
    this.#marker = mapContents ? mapContents.marker : [];

    let $locationsGrid = $("<div>").attr({
      style:
        "display:grid; column-gap:10px; row-gap:5px; grid-template-columns: 30px 100px 100px auto 50px",
    });
    $locationsGrid.append(
      $("<div>")
        .attr({ style: "grid-column:1" })
        .html(
          `<span class="fa fa-stack" style="margin-left:-10px; margin-top:-5px; cursor:pointer" id="view-all" title="${_(
            "schemeMap_showAll",
          )}"><i class="fa-solid fa-stack-1x fa-up-right-and-down-left-from-center"><i class="fa-solid fa-stack-1x fa-up-right-and-down-left-from-center fa-rotate-90"></i></span>`,
        ),
      $("<div>").attr({ style: "grid-column:2" }).html(`
               ${_("schemeMap_latitude")}`),
      $("<div>").attr({ style: "grid-column:3" }).html(`
               ${_("schemeMap_longitude")}`),
      $("<div>").attr({ style: "grid-column:4" }).html(`
               ${_("schemeMap_description")}`),
      $("<div>").attr({ style: "grid-column:5" }).html(`
               ${_("schemeMap_color")}`),
      $("<div>").attr({ style: "grid-column:1/span 5" }).html(buttonHTML),
    );
    $locationsDiv.append($locationsGrid);

    // new map; attribution to layer map only, not leaflet (credited elsewhere)
    let osm = Leaflet.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      },
    );
    let otm = Leaflet.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 15,
        attribution: "© OpenStreetMap © OpenTopoMap (CC-BY-SA)",
      },
    );
    let layers = {
      OpenStreetMap: osm,
      OpenTopoMap: otm,
    };
    this.map = Leaflet.map($mapDiv.attr("id"), {
      attributionControl: false,
      layers: [osm],
      preferCanvas: true,
    });
    Leaflet.control.attribution({ prefix: false }).addTo(this.map);
    Leaflet.control.layers(layers).addTo(this.map);

    // zoom only by double click and +/-
    this.map.touchZoom.disable();
    this.map.scrollWheelZoom.disable();

    this.map.setView(this.#center, this.#zoom);
    let markerNum = 0;
    this.#marker.forEach((marker) => {
      SchemeMap.newMarker(
        settings,
        $locationsGrid,
        this.map,
        markerNum++,
        marker.latLng,
        marker.color,
        settings.schemeMapMarkerConfirmDelete,
        marker.info,
      );
    });

    // view all markers button
    $locationsGrid.find("#view-all").click(() => {
      let minLat = 99;
      let maxLat = -99;
      let minLng = 99999;
      let maxLng = -99999;
      this.map.eachLayer((layer) => {
        if (layer instanceof Leaflet.Marker) {
          if (layer.getLatLng().lat < minLat) {
            minLat = layer.getLatLng().lat;
          }
          if (layer.getLatLng().lat > maxLat) {
            maxLat = layer.getLatLng().lat;
          }
          if (layer.getLatLng().lng < minLng) {
            minLng = layer.getLatLng().lng;
          }
          if (layer.getLatLng().lng > maxLng) {
            maxLng = layer.getLatLng().lng;
          }
        }
      });
      this.map.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        { padding: [20, 20] },
      );
      this.#zoom = this.map.getZoom();
      this.#center = this.map.getCenter();
    });

    // create a new marker on the map
    this.map.on("contextmenu", (e) => {
      SchemeMap.newMarker(
        settings,
        $locationsGrid,
        this.map,
        ++markerNum,
        e.latlng,
        settings.schemeMapMarkerColor,
        settings.schemeMapMarkerConfirmDelete,
        "",
      );
    });

    // move map
    this.map.on("move", (e) => {
      this.map.eachLayer((layer) => {
        if (layer instanceof Leaflet.Marker) {
          $locationsGrid
            .find(`div[num=${layer.num}] #go_${layer.num}`)
            .css(
              "opacity",
              this.map.getBounds().contains(layer.getLatLng()) ? 1.0 : 0.4,
            );
        }
      });
    });
  }

  /**
   * @returns current state as map zoom value, map center and list of markers
   */
  mapState() {
    let markerList = [];
    this.map.eachLayer((layer) => {
      if (layer instanceof Leaflet.Marker) {
        let marker = {};
        marker.latLng = Leaflet.latLng(
          Leaflet.Util.formatNum(layer.getLatLng().lat),
          Leaflet.Util.formatNum(layer.getLatLng().lng),
        );
        marker.info = layer.getPopup() ? layer.getPopup().getContent() : "";
        marker.color = layer.getIcon().options.html.match(/#[0-9a-f]+/)[0];
        markerList.push(marker);
      }
    });

    this.#zoom = this.map.getZoom();
    this.#center = this.map.getCenter();
    this.#marker = markerList;
    return {
      zoom: this.#zoom,
      center: this.#center,
      marker: this.#marker,
    };
  }
}
