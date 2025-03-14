/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of "about" menu item
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/aboutWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

/**
 * list of third party software tools that need to be mentioned
 */
const softwareList = {
  "better-sqlite3-multiple-ciphers": {
    url: "https://github.com/m4heshd/better-sqlite3-multiple-ciphers",
    license: "MIT",
  },
  "bootstrap": { url: "https://github.com/twbs/bootstrap", license: "MIT" },
  "datatables.net-dt": {
    url: "https://www.npmjs.com/package/datatables.net-dt",
    license: "MIT",
  },
  "daterangepicker": { url: "http://www.daterangepicker.com/", license: "MIT" },
  "Electron": { url: "https://www.electronjs.org/", license: "MIT" },
  "electron-log": {
    url: "https://github.com/megahertz/electron-log",
    license: "MIT",
  },
  "Fontawesome": {
    url: "https://github.com/FortAwesome/Font-Awesome",
    license: "Font Awesome Free License, CC BY 4.0, SIL OFL 1.1, MIT",
  },
  "html-to-text": {
    url: "https://www.npmjs.com/package/html-to-text",
    license: "MIT",
  },
  "i18njs": { url: "http://i18njs.com/", license: "MIT" },
  "jquery": { url: "https://www.npmjs.com/package/jquery", license: "MIT" },
  "jquery-contextmenu": {
    url: "https://www.npmjs.com/package/jquery-contextmenu",
    license: "MIT",
  },
  "jsTree": { url: "https://www.jstree.com/", license: "MIT" },
  "jsTree Bootstrap Theme": {
    url: "https://www.npmjs.com/package/jstree-bootstrap-theme",
    license: "MIT",
  },
  "Leaflet": { url: "https://leafletjs.com/", license: "BSD 2-Clause" },
  "leaflet-image": {
    url: "https://www.npmjs.com/package/leaflet-image",
    license: "BSD 2-Clause",
  },
  "Moment": { url: "http://momentjs.com/", license: "MIT" },
  "Nodehun": { url: "https://www.npmjs.com/package/nodehun", license: "MIT" },
  "rtf-parser": {
    url: "https://www.npmjs.com/package/rtf-parser",
    license: "ISC",
  },
  "Quill": { url: "https://quilljs.com/", license: "BSD 3-Clause" },
  "Spectrum Colorpicker": {
    url: "http://bgrins.github.io/spectrum/",
    license: "MIT",
  },
  "Split.js": { url: "https://github.com/nathancahill/split", license: "MIT" },
  "Table": {
    url: "https://www.npmjs.com/package/table",
    license: "BSD 3-Clause",
  },
  "uuid": { url: "https://www.npmjs.com/package/uuid", license: "MIT" },
  "wordcloud2.js": {
    url: "https://wordcloud2-js.timdream.org/",
    license: "MIT",
  },
};

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} programName name of this software
 * @param {String} programVersion current software version
 * @param {String} schemeVersion current database scheme version
 * @param {String} chromeVersion version of the underlying chrome base
 * @param {String} electronVersion version of the electron system
 * @param {String} osInfo operating system info
 * @param {String} tmpDir path of the temporary folder
 * @param {String} userPath path of the folder holding configuration files
 * @param {String} logFile path of the log file
 * @param {Number} startTime unix timestamp in ms when the program was started
 */
ipcRenderer.on(
  "aboutWindow_init",
  (
    event,
    [
      settings,
      programName,
      programVersion,
      schemeVersion,
      chromeVersion,
      electronVersion,
      osInfo,
      tmpDir,
      userPath,
      logFile,
      startTime,
    ],
  ) => {
    theLanguage = settings.language;

    new Fonts().loadStandardFonts("..");

    // create content
    let $tabs = $("<nav>").attr({ class: "nav nav-pills" });
    let $content = $("<div>").attr({ class: "tab-content" });
    $("body *").css({
      "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
      "--scrollbar-back": Util.scrollbarBack(
        settings.scrollbarStyle,
        settings.aboutBackgroundColor || settings.generalBackgroundColor,
      ),
      "--scrollbar-fore": Util.scrollbarFore(
        settings.scrollbarStyle,
        settings.aboutBackgroundColor || settings.generalBackgroundColor,
      ),
    });
    $("body")
      .css({
        "--foreground-color": Util.blackOrWhite(
          settings.aboutBackgroundColor || settings.generalBackgroundColor,
        ),
        "--background-color":
          settings.aboutBackgroundColor || settings.generalBackgroundColor,
      })
      .append($("<div>").attr({ class: "tab-navigation" }).append($tabs))
      .append($content);

    // add info tab
    Util.addTab(
      $tabs,
      $content,
      true,
      "infoTab",
      _("aboutWindow_infoTab"),
      `<h1>${programName}</h1><p>${_("aboutWindow_version", { version: programVersion })}</p><p>${_("aboutWindow_copyright")}</p><div style="position:absolute; right:0px; bottom:0px; width:250px; height:250px; background:black; filter:blur(85px)"></div><div class="fa-stack fa-5x" style="position:absolute; right:0px; bottom:0px; width:250px; height:250px; padding-top:20px; overflow:hidden;"><i class="fa-solid fa-cog fa-stack-1x fa-lg fa-pulse" style="color:#f7b801; --fa-animation-duration:6s;"></i><i class="fa-solid fa-infinity fa-stack-2x fa-spin" style="color:#7678ed; --fa-animation-duration:12s"></i></div>`,
    );

    // add license tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "licenseTab",
      _("aboutWindow_licenseTab"),
      _("aboutWindow_license", { name: programName }),
    );

    // add software tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "softwareTab",
      _("aboutWindow_softwareTab"),
      $("<div>").append(
        softwareInfo(programName),
        mediaInfo(programName),
        fontsInfo(programName),
        thanksTo(),
      ),
    );

    // add runtime tab
    Util.addTab(
      $tabs,
      $content,
      false,
      "runtimeTab",
      _("aboutWindow_runtimeTab"),
      runtimeInfo(
        settings.dateTimeFormatLong,
        programVersion,
        schemeVersion,
        chromeVersion,
        electronVersion,
        osInfo,
        tmpDir,
        userPath,
        logFile,
        startTime,
      ),
    );

    Util.initTabs();

    // update runtime info every second
    setInterval(() => {
      $("#runTime").html(new Timestamp(startTime).timeToNow());
    }, 1000);
  },
);

/**
 * format infos about used software packages
 *
 * @param {String} programName
 * @returns {Object} jquery
 */
function softwareInfo(programName) {
  let $grid = $("<div>")
    .attr({
      style: `display:grid; row-gap:10px; column-gap:20px; grid-template-columns:max-content auto`,
    })
    .append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 2;",
        })
        .html(
          `<p style="margin-bottom:10px; font-weight:bold">${_(
            "aboutWindow_software",
            { name: programName },
          )}</p>`,
        ),
    );

  Object.keys(softwareList)
    .sort(Intl.Collator().compare)
    .forEach((software) => {
      $grid.append(
        $("<div>")
          .attr({
            style: "grid-column:1/span 1; justify-self:end;",
          })
          .html(software),
      );

      $grid.append(
        $("<div>")
          .attr({
            style: "grid-column:2/span 1;",
          })
          .html(
            `<span style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','${softwareList[software].url}');">${softwareList[software].url}</span>`,
          ),
      );
    });

  return $grid;
}

/**
 * format infos about media files
 *
 * @param {String} programName
 * @returns {Qbject} jquery
 */
function mediaInfo(programName) {
  let $content = $("<div>").html(
    `<p style="margin:30px 0px 10px 0px; font-weight:bold">${_(
      "aboutWindow_media",
      { name: programName },
    )}</p>`,
  );

  [...Sounds.splashSounds, ...Sounds.backgroundSounds].forEach((sound) => {
    $content.append(
      $("<p>").html(
        `<span style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','${sound.source}');">${sound.source}</span> &mdash; ` +
          _("aboutWindow_credits", { credits: sound.credits }),
      ),
    );
  });

  return $content;
}

function thanksTo() {
  let $content = $("<div>").html(
    `<p style="margin:30px 0px 10px 0px; font-weight:bold">${_(
      "aboutWindow_thanks",
    )}</p>`,
  );

  ["https://www.blindtextgenerator.de/", "https://obamaipsum.com/"].forEach(
    (url) => {
      $content.append(
        $("<p>").html(
          `<span style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','${url}');">${url}</span>`,
        ),
      );
    },
  );
  return $content;
}

/**
 * format infos about used fonts
 *
 * @param {String} programName
 * @returns {Object} jquery
 */
function fontsInfo(programName) {
  let $content = $("<div>").html(
    `<p style="margin:30px 0px 10px 0px; font-weight:bold">${_(
      "aboutWindow_fonts",
      { name: programName },
    )}</p>`,
  );

  [Fonts.uiFamily, ...Fonts.standardFamilies].forEach((family) => {
    $content.append(
      $("<p>").html(
        `<span style="cursor:pointer" onmouseover="this.style.fontWeight='bold';" onmouseout="this.style.fontWeight='normal'" onclick="ipcRenderer.invoke('mainProcess_openURL','${family.source}');">${family.name} &mdash; ${family.source}</span>`,
      ),
    );
  });

  return $content;
}

/**
 * implement runtime tab
 *
 * @param {String} dateTimeFormatLong
 * @param {String} programVersion
 * @param {String} schemeVersion
 * @param {String} chromeVersion
 * @param {String} electronVersion
 * @param {String} osInfo
 * @param {String} tmpDir
 * @param {String} userPath
 * @param {String} startTime
 * @returns {Object} jquery
 */
function runtimeInfo(
  dateTimeFormatLong,
  programVersion,
  schemeVersion,
  chromeVersion,
  electronVersion,
  osInfo,
  tmpDir,
  userPath,
  logFile,
  startTime,
) {
  let $grid = $("<div>").attr({
    style: `display:grid; row-gap:20px; column-gap:20px; grid-template-columns:max-content`,
  });

  [
    ["aboutWindow_softwareVersion", programVersion],
    ["aboutWindow_schemeVersion", schemeVersion],
    ["aboutWindow_chromeVersion", chromeVersion],
    ["aboutWindow_electronVersion", electronVersion],
    ["aboutWindow_operatingSystem", osInfo],
    [
      "aboutWindow_logFile",
      `<span style="word-break:break-all"><i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer;margin-right:10px" onclick="openFile('${encodeURI(logFile)}')"></i>${logFile}</span>`,
    ],
    [
      "aboutWindow_userPath",
      `<span style="word-break:break-all"><i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer;margin-right:10px" onclick="showDir('${encodeURI(
        userPath,
      )}')"></i>${userPath}</span>`,
    ],
    [
      "aboutWindow_tmpDir",
      `<span style="word-break:break-all"><i class="fa-solid fa-arrow-up-right-from-square" style="cursor:pointer;margin-right:10px" onclick="showDir('${encodeURI(
        tmpDir,
      )}')"></i>${tmpDir}</span>`,
    ],
    [
      "aboutWindow_startTime",
      new Timestamp(startTime).toLocalString(dateTimeFormatLong),
    ],
    [
      "aboutWindow_runTime",
      `<span id="runTime">${new Timestamp(startTime).timeToNow()}</span>`,
    ],
  ].forEach((item) => {
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:1/span 1; justify-self:end",
        })
        .html(_(item[0])),
    );
    $grid.append(
      $("<div>")
        .attr({
          style: "grid-column:2/span 1;",
        })
        .html(item[1]),
    );
  });

  return $grid;
}

/**
 * open a file path in the os file explorer
 *
 * @param {String} path
 */
function showDir(path) {
  ipcRenderer.invoke("mainProcess_openFileInExplorer", decodeURI(path));
}

/**
 * open a file in the os with the standard app
 *
 * @param {String} path
 */
function openFile(path) {
  ipcRenderer.invoke("mainProcess_openPath", decodeURI(path));
}
