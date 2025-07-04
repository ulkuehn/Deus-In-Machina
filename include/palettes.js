/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file definition of palettes for color picker
 */

/**
 * do not use a palette
 */
const noPalette = "noPalette";

/**
 * collection of palettes that can be used in the color picker
 */
const systemPalettes = {
  materialUI: [
    // Red palette
    [
      "#ffebee",
      "#ffcdd2",
      "#ef9a9a",
      "#e57373",
      "#ef5350",
      "#f44336",
      "#e53935",
      "#d32f2f",
      "#c62828",
      "#b71c1c",
      "#ff8a80",
      "#ff5252",
      "#ff1744",
      "#d50000",
    ],
    // Pink palette
    [
      "#fce4ec",
      "#f8bbd0",
      "#f48fb1",
      "#f06292",
      "#ec407a",
      "#e91e63",
      "#d81b60",
      "#c2185b",
      "#ad1457",
      "#880e4f",
      "#ff80ab",
      "#ff4081",
      "#f50057",
      "#c51162",
    ],
    // Purple palette
    [
      "#f3e5f5",
      "#e1bee7",
      "#ce93d8",
      "#ba68c8",
      "#ab47bc",
      "#9c27b0",
      "#8e24aa",
      "#7b1fa2",
      "#6a1b9a",
      "#4a148c",
      "#ea80fc",
      "#e040fb",
      "#d500f9",
      "#aa00ff",
    ],
    // Deep Purple palette
    [
      "#ede7f6",
      "#d1c4e9",
      "#b39ddb",
      "#9575cd",
      "#7e57c2",
      "#673ab7",
      "#5e35b1",
      "#512da8",
      "#4527a0",
      "#311b92",
      "#b388ff",
      "#7c4dff",
      "#651fff",
      "#6200ea",
    ],
    // Indigo palette
    [
      "#e8eaf6",
      "#c5cae9",
      "#9fa8da",
      "#7986cb",
      "#5c6bc0",
      "#3f51b5",
      "#3949ab",
      "#303f9f",
      "#283593",
      "#1a237e",
      "#8c9eff",
      "#536dfe",
      "#3d5afe",
      "#304ffe",
    ],
    // Blue palette
    [
      "#e3f2fd",
      "#bbdefb",
      "#90caf9",
      "#64b5f6",
      "#42a5f5",
      "#2196f3",
      "#1e88e5",
      "#1976d2",
      "#1565c0",
      "#0d47a1",
      "#82b1ff",
      "#448aff",
      "#2979ff",
      "#2962ff",
    ],
    // Light Blue palette
    [
      "#e1f5fe",
      "#b3e5fc",
      "#81d4fa",
      "#4fc3f7",
      "#29b6f6",
      "#03a9f4",
      "#039be5",
      "#0288d1",
      "#0277bd",
      "#01579b",
      "#80d8ff",
      "#40c4ff",
      "#00b0ff",
      "#0091ea",
    ],
    // Cyan palette
    [
      "#e0f7fa",
      "#b2ebf2",
      "#80deea",
      "#4dd0e1",
      "#26c6da",
      "#00bcd4",
      "#00acc1",
      "#0097a7",
      "#00838f",
      "#006064",
      "#84ffff",
      "#18ffff",
      "#00e5ff",
      "#00b8d4",
    ],
    // Teal palette
    [
      "#e0f2f1",
      "#b2dfdb",
      "#80cbc4",
      "#4db6ac",
      "#26a69a",
      "#009688",
      "#00897b",
      "#00796b",
      "#00695c",
      "#004d40",
      "#a7ffeb",
      "#64ffda",
      "#1de9b6",
      "#00bfa5",
    ],
    // Green palette
    [
      "#e8f5e9",
      "#c8e6c9",
      "#a5d6a7",
      "#81c784",
      "#66bb6a",
      "#4caf50",
      "#43a047",
      "#388e3c",
      "#2e7d32",
      "#1b5e20",
      "#b9f6ca",
      "#69f0ae",
      "#00e676",
      "#00c853",
    ],
    // Light Green palette
    [
      "#f1f8e9",
      "#dcedc8",
      "#c5e1a5",
      "#aed581",
      "#9ccc65",
      "#8bc34a",
      "#7cb342",
      "#689f38",
      "#558b2f",
      "#33691e",
      "#ccff90",
      "#b2ff59",
      "#76ff03",
      "#64dd17",
    ],
    // Lime palette
    [
      "#f9fbe7",
      "#f0f4c3",
      "#e6ee9c",
      "#dce775",
      "#d4e157",
      "#cddc39",
      "#c0ca33",
      "#afb42b",
      "#9e9d24",
      "#827717",
      "#f4ff81",
      "#eeff41",
      "#c6ff00",
      "#aeea00",
    ],
    // Yellow palette
    [
      "#fffde7",
      "#fff9c4",
      "#fff59d",
      "#fff176",
      "#ffee58",
      "#ffeb3b",
      "#fdd835",
      "#fbc02d",
      "#f9a825",
      "#f57f17",
      "#ffff8d",
      "#ffff00",
      "#ffea00",
      "#ffd600",
    ],
    // Amber palette
    [
      "#fff8e1",
      "#ffecb3",
      "#ffe082",
      "#ffd54f",
      "#ffca28",
      "#ffc107",
      "#ffb300",
      "#ffa000",
      "#ff8f00",
      "#ff6f00",
      "#ffe57f",
      "#ffd740",
      "#ffc400",
      "#ffab00",
    ],
    // Orange palette
    [
      "#fff3e0",
      "#ffe0b2",
      "#ffcc80",
      "#ffb74d",
      "#ffa726",
      "#ff9800",
      "#fb8c00",
      "#f57c00",
      "#ef6c00",
      "#e65100",
      "#ffd180",
      "#ffab40",
      "#ff9100",
      "#ff6d00",
    ],
    // Deep Orange palette
    [
      "#fbe9e7",
      "#ffccbc",
      "#ffab91",
      "#ff8a65",
      "#ff7043",
      "#ff5722",
      "#f4511e",
      "#e64a19",
      "#d84315",
      "#bf360c",
      "#ff9e80",
      "#ff6e40",
      "#ff3d00",
      "#dd2c00",
    ],
    // Brown palette
    [
      "#efebe9",
      "#d7ccc8",
      "#bcaaa4",
      "#a1887f",
      "#8d6e63",
      "#795548",
      "#6d4c41",
      "#5d4037",
      "#4e342e",
      "#3e2723",
    ],
    // Grey palette
    [
      "#fafafa",
      "#f5f5f5",
      "#eeeeee",
      "#e0e0e0",
      "#bdbdbd",
      "#9e9e9e",
      "#757575",
      "#616161",
      "#424242",
      "#212121",
      ,
    ],
    // Blue Grey palette
    [
      "#ffffff",
      "#e7f1f6",
      "#d2e8f3",
      "#c1d3dc",
      "#b0bec5",
      "#90a4ae",
      "#78909c",
      "#607d8b",
      "#546e7a",
      "#455a64",
      "#37474f",
      "#263238",
      "#151d21",
      "#000000",
    ],
  ],
  libreOfficeStandard: [
    // Gray palette from black to white
    [
      "#000000",
      "#111111",
      "#1c1c1c",
      "#333333",
      "#666666",
      "#808080",
      "#999999",
      "#b2b2b2",
      "#cccccc",
      "#dddddd",
      "#eeeeee",
      "#ffffff",
    ],
    // Base hues
    [
      "#ffff00",
      "#ffbf00",
      "#ff8000",
      "#ff4000",
      "#ff0000",
      "#bf0041",
      "#800080",
      "#55308d",
      "#2a6099",
      "#158466",
      "#00a933",
      "#81d41a",
    ],
    // +191 brightness, 75% tint
    [
      "#ffffd7",
      "#fff5ce",
      "#ffdbb6",
      "#ffd8ce",
      "#ffd7d7",
      "#f7d1d5",
      "#e0c2cd",
      "#dedce6",
      "#dee6ef",
      "#dee7e5",
      "#dde8cb",
      "#f6f9d4",
    ],
    // +153 brightness, 60% tint
    [
      "#ffffa6",
      "#ffe994",
      "#ffb66c",
      "#ffaa95",
      "#ffa6a6",
      "#ec9ba4",
      "#bf819e",
      "#b7b3ca",
      "#b4c7dc",
      "#b3cac7",
      "#afd095",
      "#e8f2a1",
    ],
    // +115 brightness, 45% tint
    [
      "#ffff6d",
      "#ffde59",
      "#ff972f",
      "#ff7b59",
      "#ff6d6d",
      "#e16173",
      "#a1467e",
      "#8e86ae",
      "#729fcf",
      "#81aca6",
      "#77bc65",
      "#d4ea6b",
    ],
    // +77 brightness, 30% tint
    [
      "#ffff38",
      "#ffd428",
      "#ff860d",
      "#ff5429",
      "#ff3838",
      "#d62e4e",
      "#8d1d75",
      "#6b5e9b",
      "#5983b0",
      "#50938a",
      "#3faf46",
      "#bbe33d",
    ],
    // -51 brightness, 20% shade
    [
      "#e6e905",
      "#e8a202",
      "#ea7500",
      "#ed4c05",
      "#f10d0c",
      "#a7074b",
      "#780373",
      "#5b277d",
      "#3465a4",
      "#168253",
      "#069a2e",
      "#5eb91e",
    ],
    // -102 brightness, 40% shade
    [
      "#acb20c",
      "#b47804",
      "#b85c00",
      "#be480a",
      "#c9211e",
      "#861141",
      "#650953",
      "#55215b",
      "#355269",
      "#1e6a39",
      "#127622",
      "#468a1a",
    ],
    // -153 brightness, 60% shade
    [
      "#706e0c",
      "#784b04",
      "#7b3d00",
      "#813709",
      "#8d281e",
      "#611729",
      "#4e102d",
      "#481d32",
      "#383d3c",
      "#28471f",
      "#224b12",
      "#395511",
    ],
    // -204 brightness, 80% shade
    [
      "#443205",
      "#472702",
      "#492300",
      "#4b2204",
      "#50200c",
      "#41190d",
      "#3b160e",
      "#3a1a0f",
      "#362413",
      "#302709",
      "#2e2706",
      "#342a06",
    ],
  ],
  spectrumColorPicker: [
    ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
    ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
    [
      "#ea9999",
      "#f9cb9c",
      "#ffe599",
      "#b6d7a8",
      "#a2c4c9",
      "#9fc5e8",
      "#b4a7d6",
      "#d5a6bd",
    ],
    [
      "#e06666",
      "#f6b26b",
      "#ffd966",
      "#93c47d",
      "#76a5af",
      "#6fa8dc",
      "#8e7cc3",
      "#c27ba0",
    ],
    [
      "#c00",
      "#e69138",
      "#f1c232",
      "#6aa84f",
      "#45818e",
      "#3d85c6",
      "#674ea7",
      "#a64d79",
    ],
    [
      "#900",
      "#b45f06",
      "#bf9000",
      "#38761d",
      "#134f5c",
      "#0b5394",
      "#351c75",
      "#741b47",
    ],
    [
      "#600",
      "#783f04",
      "#7f6000",
      "#274e13",
      "#0c343d",
      "#073763",
      "#20124d",
      "#4c1130",
    ],
  ],
};
