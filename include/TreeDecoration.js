/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of TreeDecoration class
 */
class TreeDecoration {
  /**
   * names of font awesome icon used for tree decoration
   * @static
   */
  static treeItemIcons = [
    // writing + editing
    "book",
    "book-open",
    "book-atlas",
    "book-skull",
    "box-archive",
    "envelope",
    "eraser",
    "pen",
    "pencil",
    "quote-left",
    "quote-right",
    "thumbtack",
    "brush",
    "paintbrush",
    "paperclip",
    "paint-roller",
    "scissors",
    "square-check",
    "trash",
    "trash-can",
    null,
    // time
    "bell",
    "calendar",
    "calendar-check",
    "calendar-minus",
    "calendar-plus",
    "calendar-xmark",
    "clock",
    "stopwatch",
    null,
    // emoji, hands
    "face-smile",
    "face-grin",
    "face-laugh",
    "face-meh",
    "face-frown",
    "face-angry",
    "hand",
    "thumbs-down",
    "thumbs-up",
    null,
    // animals, nature
    "bug",
    "cat",
    "cow",
    "crow",
    "dog",
    "dove",
    "dragon",
    "fish",
    "frog",
    "hippo",
    "horse",
    "mosquito",
    "paw",
    "spider",
    "leaf",
    "seedling",
    null,
    // food, drinks
    "apple-whole",
    "lemon",
    "egg",
    "martini-glass",
    "mug-hot",
    "mug-saucer",
    "wine-glass",
    null,
    // alphabet, digits
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    null,
    // construction
    "bucket",
    "compass-drafting",
    "hammer",
    "person-digging",
    "screwdriver-wrench",
    "wrench",
    null,
    // arrows
    "arrow-down",
    "arrow-up",
    "arrow-left",
    "arrow-right",
    "circle-down",
    "circle-up",
    "circle-left",
    "circle-right",
    "angles-down",
    "angles-up",
    "angles-left",
    "angles-right",
    "recycle",
    "repeat",
    "rotate",
    "retweet",
    "arrow-rotate-left",
    "arrow-rotate-right",
    null,
    // building, landscape
    "house",
    "industry",
    "igloo",
    "landmark",
    "campground",
    "signs-post",
    "map",
    "mountain-sun",
    null,

    // misc
    "globe",
    "moon",
    "car",
    "bicycle",
    "gift",
    "futbol",
    "shoe-prints",
    "medal",
    "music",
    "award",
    "masks-theater",
    "anchor",
    "bed",
    "bolt-lightning",
    "bomb",
    "camera",
    "chess-bishop",
    "chess-king",
    "chess-knight",
    "chess-queen",
    "chess-pawn",
    "chess-rook",
    "cloud",
    "cloud-bolt",
    "cloud-rain",
    "cloud-moon",
    "cloud-sun",
    "compass",
  ];

  /**
   * constant for a non-overlayed icon
   */
  static noStack = "decoration_noOverlay";

  /**
   * list of icon overlay values
   * @static
   */
  static stackIcons = [
    "decoration_noOverlay",
    "decoration_overlayCircle",
    "decoration_overlayCircleSolid",
    "decoration_overlaySquare",
    "decoration_overlaySquareSolid",
    "decoration_overlayBan",
    "decoration_overlayQuestion",
    "decoration_overlayExclamation",
    "decoration_overlayPlus",
    "decoration_overlayDown",
    "decoration_overlayUp",
  ];

  /**
   * icon overlay properties
   * @static
   */
  static stackProps = {
    decoration_overlayCircle: {
      class: "fa-regular fa-circle",
      background: true,
    },
    decoration_overlayCircleSolid: {
      class: "fa-solid fa-circle",
      background: true,
    },
    decoration_overlaySquare: {
      class: "fa-regular fa-square-full",
      background: true,
    },
    decoration_overlaySquareSolid: {
      class: "fa-solid fa-square-full",
      background: true,
    },
    decoration_overlayBan: { class: "fa-solid fa-ban", background: false },
    decoration_overlayQuestion: {
      class: "fa-solid fa-question",
      background: false,
    },
    decoration_overlayExclamation: {
      class: "fa-solid fa-exclamation",
      background: false,
    },
    decoration_overlayPlus: { class: "fa-solid fa-plus", background: false },
    decoration_overlayDown: { class: "fa-solid fa-slash", background: false },
    decoration_overlayUp: {
      class: "fa-solid fa-slash fa-flip-horizontal",
      background: false,
    },
  };

  /**
   * opening and closing html tags for name display variants
   * @static
   */
  static modTags = {
    decoration_bold: ["<b>", "</b>"],
    decoration_italic: ["<i>", "</i>"],
    decoration_underline: ["<u>", "</u>"],
    decoration_score: ["<s>", "</s>"],
    decoration_wide: ["<span style='letter-spacing:0.5em'>", "</span>"],
    decoration_capitals: ["<span style='text-transform:uppercase'>", "</span>"],
  };
}
