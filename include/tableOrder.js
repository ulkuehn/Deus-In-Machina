/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file extend datatables ordering
 */

$.extend($.fn.dataTableExt.oSort, {
  // length order first, then locale alphabetical order
  "stringbylen-asc": function (a, b) {
    return a.length < b.length
      ? -1
      : a.length > b.length
        ? 1
        : a.localeCompare(b, theLanguage);
  },
  "stringbylen-desc": function (a, b) {
    return a.length < b.length
      ? 1
      : a.length > b.length
        ? -1
        : a.localeCompare(b, theLanguage);
  },

  // locale alphabetical order
  "stringbylocale-asc": function (a, b) {
    return a.localeCompare(b, theLanguage);
  },
  "stringbylocale-desc": function (a, b) {
    return b.localeCompare(a, theLanguage);
  },
});
