/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of symbols window
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/symbolsWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

/**
 * list of unicodes grouped in pages of similar contents
 * elements are either single unicode values or ranges [from, to] or null inidcating a line break
 */
const codePages = [
  {
    id: "latinext",
    name: "\u00C6",
    elements: [
      // A
      ["00C0", "00C6"],
      "0100",
      "0102",
      "0104",
      "01CD",
      "0200",
      "0202",
      "0226",
      // a
      ["00E0", "00E5"],
      "0101",
      "0103",
      "0105",
      "01Ce",
      "0201",
      "0203",
      "0227",
      null,
      // B
      "0181",
      "0182",
      "1E02",
      // b
      "0180",
      "0183",
      "1E03",
      null,
      // C
      "c7",
      "106",
      "108",
      "10a",
      "10c",
      "187",
      "23b",
      // c
      "e7",
      "107",
      "109",
      "10b",
      "10d",
      "188",
      "23c",
      null,
      // D
      "010E",
      "0110",
      "0189",
      "018a",
      "1c4",
      "1c5",
      // d
      "010f",
      "0111",
      "018B",
      "018c",
      "1c6",
      "221",
      null,
      // E
      ["c8", "cb"],
      "112",
      "114",
      "116",
      "118",
      "11a",
      "204",
      "206",
      "228",
      "246",
      // e
      ["e8", "eb"],
      "113",
      "115",
      "117",
      "119",
      "11b",
      "205",
      "207",
      "229",
      "247",
      null,
      // F
      "1E1E",
      // f
      "1E1f",
      null,
      // G
      "011C",
      "011e",
      "0120",
      "0122",
      "01E4",
      "01E6",
      "01F4",
      // g
      "011d",
      "011f",
      "0121",
      "0123",
      "01E5",
      "01E7",
      "01F5",
      null,
      // H
      "0124",
      "0126",
      "021E",
      // h
      "0125",
      "0127",
      "021f",
      null,
      // I
      "cc",
      "ce",
      "128",
      "12a",
      "12c",
      "12e",
      "130",
      "132",
      "01CF",
      "208",
      "20a",
      // i
      "cd",
      "cf",
      ["ec", "ef"],
      "129",
      "12b",
      "12d",
      "12f",
      "131",
      "133",
      "01d0",
      "209",
      "20b",
      null,
      // J
      "0134",
      "0248",
      // j
      "0135",
      "01F0",
      "0249",
      null,
      // K
      "0136",
      "0198",
      "01E8",
      // k
      "0137",
      "0199",
      "01E9",
      null,
      // L
      "139",
      "13b",
      "13d",
      "13f",
      "141",
      "01C7",
      "01C8",
      "023D",
      // l
      "13a",
      "13c",
      "13e",
      "140",
      "142",
      "01C9",
      null,
      // M
      "1e40",
      // m
      "1e41",
      null,
      // N
      "d1",
      "143",
      "145",
      "147",
      "1ca",
      "1cb",
      // n
      "f1",
      "144",
      "146",
      "148",
      "1cc",
      null,
      // O
      ["d2", "d6"],
      "d8",
      "14c",
      "14e",
      "150",
      "152",
      "1d1",
      "20c",
      "20e",
      // o
      ["f2", "f6"],
      "f8",
      "14d",
      "14f",
      "151",
      "153",
      "1d2",
      "20d",
      "20f",
      null,
      // P
      "1e56",
      // p
      "1e57",
      null,
      // Q
      // q
      // R
      "154",
      "156",
      "158",
      "210",
      "212",
      "24c",
      // r
      "155",
      "157",
      "159",
      "211",
      "213",
      "24d",
      null,
      // S
      "15a",
      "15c",
      "15e",
      "160",
      "218",
      "1e60",
      // s
      "15b",
      "15d",
      "15f",
      "161",
      "219",
      "1e61",
      "df",
      "23f",
      null,
      // T
      "162",
      "164",
      "166",
      "21a",
      "1e6a",
      // t
      "163",
      "165",
      "167",
      "21b",
      "1e6b",
      null,
      // U
      ["d9", "dc"],
      "168",
      "16a",
      "16c",
      "16e",
      "170",
      "172",
      "1d3",
      "1d5",
      "1d7",
      "1d9",
      "1db",
      "214",
      "216",
      // u
      ["f9", "fc"],
      "169",
      "16b",
      "16d",
      "16f",
      "171",
      "173",
      "1d4",
      "1d6",
      "1d8",
      "1da",
      "1dc",
      "215",
      "217",
      null,
      // V
      // v
      // W
      "174",
      "1e80",
      "1e82",
      "1e84",
      // w
      "175",
      "1e81",
      "1e83",
      "1e85",
      null,
      // X
      // x
      // Y
      "dd",
      "178",
      "176",
      "232",
      "24e",
      "1ef2",
      // y
      "fd",
      "ff",
      "177",
      "233",
      "24f",
      "1ef3",
      null,
      // Z
      "179",
      "17b",
      "17d",
      "224",
      // z
      "17a",
      "17c",
      "17e",
      "225",
    ],
  },
  {
    id: "symbols",
    name: "\u00bf",
    elements: [
      // punct
      "a1",
      "bf",
      "203c",
      "203d",
      ["2047", "2049"],
      ["2024", "2027"],
      "2022",
      "25CF",
      null,
      // quotes
      ["2018", "201E"],
      "ab",
      "bb",
      "2039",
      "203a",
      null,
      // dashes
      "2010",
      ["2012", "2014"],
      null,
      // misc
      "a9",
      "ae",
      "2122",
      "b6",
      "2030",
      "2031",
      "2103",
      "2109",
    ],
  },
  {
    id: "currency",
    name: "\u20ac",
    elements: [
      "24",
      ["A2", "A5"],
      "192",
      "58F",
      "60B",
      "9F2",
      "9F3",
      "AF1",
      "BF9",
      "E3F",
      "17DB",
      "2133",
      "5143",
      "5186",
      "5706",
      "5713",
      // "FDFC",
      ["20a0", "20bf"],
    ],
  },
  {
    id: "emoji",
    name: String.fromCodePoint(parseInt("1f600", 16)),
    elements: [
      // faces
      ["1f600", "1f636"],
      ["1f641", "1f644"],
      ["1F910", "1F917"],
      ["1F920", "1F925"],
      ["1F927", "1F92f"],
      "1F970",
      "1F971",
      ["1F973", "1F976"],
      null,
      // symbols
      ["1F7E0", "1F7Eb"],
      ["1F493", "1F49d"],
      "1F5A4",
      "1F4A9",
    ],
  },
  {
    id: "arrows",
    name: String.fromCodePoint(parseInt("1f875", 16)),
    elements: [
      // 8 directions, different weights
      ["1F850", "1F857"],
      null,
      ["1F860", "1F867"],
      null,
      ["1F868", "1F86f"],
      null,
      ["1F870", "1F877"],
      null,
      ["1F878", "1F87f"],
      null,
      null,
      ["2190", "21ff"],
      ["27F0", "27Ff"],
      ["2900", "297f"],
    ],
  },
  {
    id: "superscript",
    name: "x\u2070",
    elements: [
      // super
      "2070",
      "b9",
      "b2",
      "b3",
      ["2074", "207f"],
      "2071",
      null,
      // sub
      ["2080", "208e"],
      ["2090", "209c"],
    ],
  },
  {
    id: "enclosed",
    name: "\u2460",
    elements: [
      // number circled
      ["2460", "2473"],
      null,
      // number negative circled
      ["278A", "2793"],
      ["24Eb", "24F4"],
      null,
      // number number paren
      ["2474", "2487"],
      null,
      // ordinal
      ["2488", "249b"],
      null,
      null,
      // letter caps circled
      ["24B6", "24Cf"],
      null,
      // letter small circled
      ["24D0", "24e9"],
      null,
      // letter paren
      ["249c", "24B5"],
    ],
  },
  {
    id: "numforms",
    name: "\u00bd",
    elements: [
      // fracs 1 by x
      "bd",
      "2153",
      "bc",
      "2155",
      "2159",
      "2150",
      "215B",
      "2151",
      "2152",
      null,
      // other fracs
      "2154",
      ["2156", "2158"],
      "215A",
      ["215c", "215e"],
      null,
      null,
      // romans caps
      ["2160", "216F"],
      null,
      // romans small
      ["2170", "217f"],
    ],
  },
];

let $popup;

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 */
ipcRenderer.on("symbolsWindow_init", (event, [settings]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "symbolsWindow_init",
    { settings },
  ]);
  theLanguage = settings.language;

  // create content
  let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
  let $content = $("<div>").attr({ class: "tab-content" });
  // symbol popup div
  $popup = $("<div>").attr({
    style:
      "background-color:#ffffff; color:#000000; border:double black 4px; padding:10px 20px; position:absolute; overflow:hidden; z-index:10; display:none; font-size:50pt; line-height:1;",
  });

  let checked = true;
  codePages.forEach((page) => {
    Util.addTab($tabs, $content, checked, page.id, page.name, codePage(page));
    checked = false;
  });
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.symbolsBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.symbolsBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        settings.symbolsBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.symbolsBackgroundColor || settings.generalBackgroundColor,
    })
    .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
    .append($content)
    .append($popup);

  Util.initTabs();
});

/**
 * build one page of code symbols
 *
 * @param {Object} page id, name, elements
 * @returns {String} html string
 */
function codePage(page) {
  let html = "";
  page.elements.forEach((element) => {
    if (!element) {
      html += "<br>";
    } else {
      if (!Array.isArray(element)) {
        element = [element, element];
      }
      for (
        let code = parseInt(element[0], 16);
        code <= parseInt(element[1], 16);
        code++
      ) {
        let hexCode = code.toString(16);
        html += `<input type="button" class="btn-check" id="${hexCode}" onclick="ipcRenderer.invoke('mainProcess_insertSymbol','${hexCode}')"><label onmouseover="symbolPopup(this,'${hexCode}')" onmouseout="popdown()" class="btn btn-outline-secondary btn-sm" for="${hexCode}">${String.fromCodePoint(
          code,
        )}</label></input>`;
      }
    }
  });

  return $("<div>").html(html);
}

/**
 * show symbol popup (enlarged symbol)
 *
 * @param {*} ele
 * @param {*} code
 */
function symbolPopup(ele, code) {
  $popup.css("display", "inline-block");
  $popup.html(String.fromCodePoint(parseInt(code, 16)));
  $popup.offset({
    top: $(ele).offset().top + $(ele).height() - $popup.height() - 15,
    left:
      $(ele).offset().left < window.innerWidth / 2
        ? $(ele).offset().left + $(ele).width() + 22
        : $(ele).offset().left - $popup.width() - 52,
  });
}

/**
 * hode symbol popup
 */
function popdown() {
  $popup.css("display", "none");
}
