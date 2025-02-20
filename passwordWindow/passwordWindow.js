/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of password window -- shown when opening crypted projects; password processing is done in main renderer by Project.js
 */

/**
 * i18n related stuff
 */
const { __ } = require("../i18n/passwordWindow.js");
let theLanguage;
function _(...x) {
  return __(theLanguage, ...x);
}

/**
 * initialize window
 *
 * @param {Object} settings effective settings
 * @param {String} password
 */
ipcRenderer.on("passwordWindow_init", (event, [settings, password]) => {
  ipcRenderer.invoke("mainProcess_loggingVerbose", [
    "exportEditorWindow_init",
    { settings },
    { password: password.replace(/./g, "*") },
  ]);
  theLanguage = settings.language;

  let $grid = $("<div>").attr({
    style:
      "margin:20px 10px 0px 10px; display:grid; column-gap:10px; grid-template-columns: auto max-content",
  });

  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:1/span 1; place-self:center stretch;",
      })
      .html(
        `<div class="input-group">
        <input type="password" class="form-control form-control-sm" style="line-height:24px" spellcheck="false" id="cryptoPassword" value="${password}" onkeypress="if(event.keyCode==13) sendPassword()">
        <span class="input-group-text" id="showCryptoPassword" onmouseover="showPassword()" onmouseout="hidePassword()"><i class="fa-solid fa-eye-slash fa-fw"></i></span>
        </div>`,
      ),
  );

  $grid.append(
    $("<div>")
      .attr({
        style: "grid-column:2/span 1; align-self:center",
      })
      .html(
        `<div style="display:flex; justify-content:flex-end;"><div><button type="button" class="btn btn-primary" onclick="sendPassword()">${_(
          "passwordWindow_openButton",
        )}</button></div></div>`,
      ),
  );
  $("body *").css({
    "--scrollbar-width": settings.scrollbarThin ? "thin" : "auto",
    "--scrollbar-back": Util.scrollbarBack(
      settings.scrollbarStyle,
      settings.passwordBackgroundColor || settings.generalBackgroundColor,
    ),
    "--scrollbar-fore": Util.scrollbarFore(
      settings.scrollbarStyle,
      settings.passwordBackgroundColor || settings.generalBackgroundColor,
    ),
  });
  $("body")
    .css({
      "--foreground-color": Util.blackOrWhite(
        settings.passwordBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.passwordBackgroundColor || settings.generalBackgroundColor,
    })
    .append($grid);
});

/**
 * send password to main window
 */
function sendPassword() {
  ipcRenderer.invoke("mainProcess_sendPassword", $("#cryptoPassword").val());
}

/**
 * show password in clear
 */
function showPassword() {
  $("#cryptoPassword").attr("type", "text");
  $("#cryptoPassword + span i").removeClass("fa-eye-slash");
  $("#cryptoPassword + span i").addClass("fa-eye");
}

/**
 * hide password
 */
function hidePassword() {
  $("#cryptoPassword").attr("type", "password");
  $("#cryptoPassword + span i").removeClass("fa-eye");
  $("#cryptoPassword + span i").addClass("fa-eye-slash");
}
