/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of SchemeEditor class
 */

/**
 * @classdesc quill based rich text editor for object properties
 */
class SchemeEditor {
  #editor; // quill object

  /**
   * class constructor
   *
   * @param {String} mode mode for image window
   * @param {jQuery} $mainDiv container for controls and editor
   * @param {String} id
   * @param {Object} editorContents delta ops to initialize the editor with
   * @param {Number} height
   * @param {Object} settings effective settings
   * @param {Object[]} formats
   * @param {String} buttonClass
   * @param {Boolean} withZoom if true add controls for changing text zoom
   * @param {Boolean} withCSS if true add format related css rules
   */
  constructor(
    mode,
    $mainDiv,
    id,
    editorContents,
    height,
    settings,
    formats,
    buttonClass,
    withZoom,
    withCSS,
  ) {
    let $menuBarDiv = $("<div>").attr({
      style:
        "display:grid; grid-template-columns:min-content min-content min-content min-content auto 200px 40px; column-gap:5px; margin-bottom:5px",
    });

    // inline controls
    let $boldControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `schemeEditorBold${id}`,
    });
    let $italicControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `schemeEditorItalic${id}`,
    });
    let $underlineControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `schemeEditorUnderline${id}`,
    });
    let $strikeControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `schemeEditorStrike${id}`,
    });

    let $boldDiv = $("<div>")
      .attr({ style: "grid-column:1; align-self:center;" })
      .append(
        $boldControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="schemeEditorBold${id}" title="${_(
          "editorBars_boldTitle",
        )}"><b style="font-size:18px; text-shadow:black 0px 0px 1px">${_(
          "editorBars_boldLabel",
        )}</b></label>`,
      );
    let $italicDiv = $("<div>")
      .attr({ style: "grid-column:2; align-self:center;" })
      .append(
        $italicControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="schemeEditorItalic${id}" title="${_(
          "editorBars_italicTitle",
        )}"><i style="font-size:18px;">${_(
          "editorBars_italicLabel",
        )}</i></label>`,
      );
    let $underlineDiv = $("<div>")
      .attr({ style: "grid-column:3; align-self:center;" })
      .append(
        $underlineControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="schemeEditorUnderline${id}" title="${_(
          "editorBars_underlineTitle",
        )}"><u style="font-size:18px;">${_(
          "editorBars_underlineLabel",
        )}</u></label>`,
      );
    let $strikeDiv = $("<div>")
      .attr({ style: "grid-column:4; align-self:center;" })
      .append(
        $strikeControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="schemeEditorStrike${id}" title="${_(
          "editorBars_strikeTitle",
        )}"><s style="font-size:18px;">${_(
          "editorBars_strikeLabel",
        )}</s></label>`,
      );

    // paragraph format
    let $formatSelect = $("<select>").attr({
      id: `schemeEditorFormat${id}`,
      style: "max-width:400px; height:30px",
    });
    Object.keys(formats)
      .sort((a, b) => {
        // default format always first
        if (a == UUID0) {
          return -1;
        }
        if (b == UUID0) {
          return 1;
        }
        // everything else is sorted alphabetically
        return formats[a].formats_name.localeCompare(formats[b].formats_name);
      })
      .forEach((formatID) => {
        $formatSelect.append(
          `<option ${
            settings.previewFormats ? `class="format${formatID}"` : ""
          } value="${formatID}" ${formatID == UUID0 ? "selected" : ""}>${Util.escapeHTML(formats[formatID].formats_name)}</option>`,
        );
        if (settings.previewFormats) {
          $("#formatSheet").append(
            `${
              formatID == UUID0
                ? `#schemeEditorFormat${id} option { `
                : `#schemeEditorFormat${id} .format${formatID} {`
            } ${Formats.toPreviewCSS(formats[formatID])}}\n`,
          );
        }
        if (withCSS) {
          $("#formatSheet").append(
            Formats.toCSS(
              formatID,
              formats[formatID],
              undefined,
              undefined,
              ".ql-editor",
            ),
          );
          let parchment = new Parchment.Attributor.Class(
            `format${formatID}`,
            `format${formatID}`,
            {
              scope: Parchment.Scope.BLOCK,
            },
          );
          Parchment.register(parchment);
        }
      });
    let $formatDiv = $("<div>")
      .attr({
        style: "grid-column:5;",
      })
      .append($formatSelect);

    // zoom
    let $zoomSelectDiv = null;
    let $zoomDisplayDiv = null;
    if (withZoom) {
      $zoomSelectDiv = $("<div>")
        .attr({
          style: "grid-column:6; align-self:center; justify-self:stretch;",
        })
        .html(
          `<input type="range" class="range-dark form-range" min="0" max="160" id="zoomSelector${id}" value="80">`,
        );
      $zoomDisplayDiv = $("<div>")
        .attr({
          style: "grid-column:7;align-self:center; justify-self:end",
        })
        .html(
          `<span id="zoomValue${id}" style="cursor:pointer" onclick="$('#zoomSelector${id}').val(80); $('#zoomSelector${id}').trigger('input')">100%</span>`,
        );
    } else {
      $zoomSelectDiv = $("<div>")
        .attr({
          style: "grid-column:6/span 2; align-self:center; justify-self:end;",
        })
        .html(
          `<button class="btn btn-sm simple-btn btn-outline-secondary" style="cursor:pointer"  title="${_("Scheme_detach")}" id="detach${id}"><i class="fa-solid fa-arrow-up-right-from-square"></i>`,
        );
    }

    // editor
    let $editorDiv = $("<div>").attr({
      "data-type": "editor",
      id: `property${id}`,
      style: `background-color:#fff; border:1px solid black; height:${height}`,
      spellcheck: false,
    });

    // putting all together
    $mainDiv.append(
      $menuBarDiv.append(
        $boldDiv,
        $italicDiv,
        $underlineDiv,
        $strikeDiv,
        $formatDiv,
        $zoomSelectDiv,
        $zoomDisplayDiv,
      ),
      $editorDiv,
    );

    // rich text
    let quill = new Quill(`#property${id}`, QuillConfig.config);
    quill.setContents(editorContents);
    this.#editor = quill;

    // button behaviour
    $boldControl.on("change", function () {
      quill.format("bold", $(this).prop("checked"));
    });
    $italicControl.on("change", function () {
      quill.format("italic", $(this).prop("checked"));
    });
    $underlineControl.on("change", function () {
      quill.format("underline", $(this).prop("checked"));
    });
    $strikeControl.on("change", function () {
      quill.format("strike", $(this).prop("checked"));
    });

    // changing paragraph format handler
    $formatSelect.on("change", () => {
      if (quill.getSelection()) {
        // unset all possible paragraph formats, as we do not know which one is set
        Object.keys(formats).forEach((formatID) => {
          quill.format(`format${formatID}`, false);
        });
        // and set new format
        quill.format(`format${$formatSelect.val()}`, true);
      }
    });

    // paste handler
    $(`#property${id}`).on("paste", (event) => {
      if (!event.originalEvent.clipboardData.types.includes("text/quill")) {
        event.preventDefault();
        let range = this.#editor.getSelection(true);
        if (range) {
          this.#paste(range);
        }
      }
    });

    // selection change handler - change buttons and format selector
    quill.on("selection-change", (range, oldRange, source) => {
      if (range) {
        // set basic format checkboxes
        let format = quill.getFormat();
        $boldControl.prop("checked", "bold" in format);
        $italicControl.prop("checked", "italic" in format);
        $underlineControl.prop("checked", "underline" in format);
        $strikeControl.prop("checked", "strike" in format);

        // set format selector to paragraph format or none if no format or multiple formats
        let pos = 0;
        format = null;
        quill
          .getText(range.index, range.length)
          .split("\n")
          .forEach((textlet) => {
            let paraFormat = UUID0; // standard
            Object.keys(
              quill.getFormat(range.index + pos, textlet.length + 1),
            ).forEach((format) => {
              if (format.startsWith("format")) {
                paraFormat = format.slice(6);
              }
            });
            if (format == null) {
              format = paraFormat;
            } else {
              if (format != paraFormat) {
                format = "";
              }
            }
            pos += textlet.length + 1;
          });
        $(`#schemeEditorFormat${id}`).val(format);
      }
    });

    // change zoom
    if (withZoom) {
      // by slider
      $(`#zoomSelector${id}`).on("input", function () {
        let zoom = Util.scaledZoom($(this).val());
        $(`#zoomValue${id}`).html(`${zoom}%`);
        $("#formatSheet").empty();
        for (let [formatID, format] of Object.entries(formats)) {
          $("#formatSheet").append(
            Formats.toCSS(formatID, format, undefined, zoom, ".ql-editor"),
          );
          if (settings.previewFormats) {
            $("#formatSheet").append(
              `${
                formatID == UUID0
                  ? `#schemeEditorFormat${id} option { `
                  : `#schemeEditorFormat${id} .format${formatID} {`
              } ${Formats.toPreviewCSS(format)}}\n`,
            );
          }
        }
        $("#formatSheet").append(`img { zoom:${zoom}% }`);
        $(":root").css({
          "--first-line-indent": `${(settings.firstLineIndent * zoom) / 100}px`,
        });
      });

      // by wheel / pinch
      $(`#property${id}`)[0].addEventListener(
        "wheel",
        function (event) {
          if (event.ctrlKey == true) {
            event.preventDefault();
            let scale = parseInt($(`#zoomSelector${id}`).val());
            scale -= event.deltaY;
            if (scale < 0) {
              scale = 0;
            }
            if (scale > 160) {
              scale = 160;
            }
            let zoom = Util.scaledZoom(scale);
            $(`#zoomSelector${id}`).val(scale);
            $(`#zoomValue${id}`).html(`${zoom}%`);

            $("#formatSheet").empty();
            for (let [formatID, format] of Object.entries(formats)) {
              $("#formatSheet").append(
                Formats.toCSS(formatID, format, undefined, zoom, ".ql-editor"),
              );
              if (settings.previewFormats) {
                $("#formatSheet").append(
                  `${
                    formatID == UUID0
                      ? `#schemeEditorFormat${id} option { `
                      : `#schemeEditorFormat${id} .format${formatID} {`
                  } ${Formats.toPreviewCSS(format)}}\n`,
                );
              }
            }
            $("#formatSheet").append(`img { zoom:${zoom}% }`);
            $(":root").css({
              "--first-line-indent": `${
                (settings.firstLineIndent * zoom) / 100
              }px`,
            });
          }
        },
        { passive: false },
      );
    }

    // context menu
    $mainDiv.contextMenu({
      selector: ".ql-editor",
      autoHide: true,
      build: ($trigger, event) => {
        let items = {};
        let infoPre = `<span class="preWrap" style="font-style:italic">`;
        let infoPost = `</span>`;
        // on image
        if (event.target.nodeName.toLowerCase() == "img") {
          let specs = DIMImage.formats(event.target);
          items.name = {
            isHtmlName: true,
            name: `${infoPre}${_("editorContextMenu_imageInfo", {
              width: specs.width,
              height: specs.height,
            })}${infoPost}`,
          };
          items.name.icon = "fas fa-circle-info";
          if (specs.title) {
            items.title = {
              isHtmlName: true,
              name: `${infoPre}${Util.escapeHTML(specs.title)}${infoPost}`,
            };
          }
          items.sepInfo = "x";
          items.props = {
            name: _("editorContextMenu_imageProperties"),
            callback: () => {
              ipcRenderer.invoke("mainProcess_openWindow", [
                "image",
                settings.closingType,
                true,
                600,
                800,
                _("windowTitles_imageWindow"),
                "./imageWindow/imageWindow.html",
                "imageWindow_init",
                null,
                [
                  settings,
                  mode,
                  id,
                  quill.getIndex(Quill.find(event.target)),
                  event.target.src,
                  specs,
                ],
              ]);
            },
          };
          items.select = {
            name: _("editorContextMenu_selectImage"),
            callback: () => {
              quill.setSelection(quill.getIndex(Quill.find(event.target)), 1);
            },
          };
          return {
            items: items,
          };
        }

        // on regular text
        let sel = quill.getSelection();
        let selText = quill.getText(sel.index, sel.length);
        let selDelta = quill.getContents(sel.index, sel.length);
        let [charCount, wordCount, objects] = StyledText.countCharsWordsObjects(
          selDelta.ops,
        );
        // info part
        if (sel.length) {
          items.select = {
            icon: "fas fa-circle-info",
            isHtmlName: true,
            name: `${infoPre}${_("editorContextMenu_selection")}${_(
              "editorContextMenu_words",
              wordCount,
              {
                words: wordCount.toLocaleString(theLanguage),
              },
            )} &ndash; ${_("editorContextMenu_characters", charCount, {
              characters: charCount.toLocaleString(theLanguage),
            })}${infoPost}`,
          };
          items.sepInfo = "x";
        }
        // formats
        if (settings.editorContextMenuFormat) {
          let format = quill.getFormat();
          items.formatBold = {
            name: _("editorContextMenu_bold"),
            isHtmlName: true,
            icon: "bold" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#schemeEditorBold${id}`).prop("checked", !("bold" in format));
              quill.format("bold", !("bold" in format));
            },
          };
          items.formatItalic = {
            name: _("editorContextMenu_italic"),
            isHtmlName: true,
            icon: "italic" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#schemeEditorItalic${id}`).prop(
                "checked",
                !("italic" in format),
              );
              quill.format("italic", !("italic" in format));
            },
          };
          items.formatUnderline = {
            name: _("editorContextMenu_underline"),
            isHtmlName: true,
            icon: "underline" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#schemeEditorUnderline${id}`).prop(
                "checked",
                !("underline" in format),
              );
              quill.format("underline", !("underline" in format));
            },
          };
          items.formatStrike = {
            name: _("editorContextMenu_strike"),
            isHtmlName: true,
            icon: "strike" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#schemeEditorStrike${id}`).prop(
                "checked",
                !("strike" in format),
              );
              quill.format("strike", !("strike" in format));
            },
          };
          items.sepFormat = "x";
        }
        // paste etc
        if (sel.length) {
          items.copy = {
            icon: "fas fa-clipboard",
            name: _("editorContextMenu_copy"),
            callback: function () {
              // execCommand should be avoided
              document.execCommand("copy");
            },
          };
          items.cut = {
            name: _("editorContextMenu_cut"),
            callback: function () {
              // execCommand should be avoided
              // but clipboard.write fails on delta data (?)
              document.execCommand("cut");
            },
          };
        }
        items.paste = {
          name: _("editorContextMenu_paste"),
          callback: () => {
            this.#paste(sel);
          },
        };
        items.loadImage = {
          name: _("editorContextMenu_insertImage"),
          icon: "fa-regular fa-image",
          callback: () => {
            ipcRenderer
              .invoke("mainProcess_fileOpenDialog", [
                {
                  name: _("project_fileTypes"),
                  extensions: ["jpg", "jpeg", "png"],
                },
              ])
              .then((path) => {
                if (path) {
                  let reader = new FileReader();
                  reader.readAsDataURL(new Blob([fs.readFileSync(path)]));
                  reader.onload = () => {
                    quill.deleteText(sel.index, sel.length);
                    quill.insertEmbed(
                      sel.index,
                      "image",
                      reader.result +
                        " " +
                        theSettings.imageWidth +
                        " " +
                        theSettings.imageHeight,
                    );
                    quill.formatText(sel.index, 1, {
                      title: path,
                      alignment: theSettings.imageAlignment,
                      shadow: theSettings.imageShadow,
                    });
                  };
                }
              });
          },
        };
        // web tools part
        if (selText.trim() != "") {
          items.sepWeb = "x";
          let webtools = {};
          theSettings.editorContextMenuWeb.split(/\n+/).forEach((entry) => {
            if (entry.includes("::")) {
              let [name, url] = entry.split("::");
              name = name.trim();
              url = url.trim();
              if (name != "" && url.includes("$")) {
                webtools[name] = {
                  name: name,
                  callback: () => {
                    ipcRenderer.invoke(
                      "mainProcess_openURL",
                      url.replace("$", encodeURI(selText.trim())),
                    );
                  },
                };
              }
            }
          });
          if (Object.keys(webtools).length) {
            webtools[Object.keys(webtools)[0]].icon = "fas fa-globe";
            items = { ...items, ...webtools };
          }
        }

        return {
          items: items,
        };
      },
    });
  }

  // getters and setters

  get contents() {
    return this.#editor.getContents();
  }

  set contents(value) {
    this.#editor.setContents(value);
  }

  /**
   * change an image's parameters
   *
   * @param {Number} index quill index of image
   * @param {Number} width pixel width
   * @param {Number} height
   * @param {String} title
   * @param {String} alignment
   * @param {Boolean} shadow
   */
  setImage(index, width, height, title, alignment, shadow) {
    this.#editor.formatText(index, 1, {
      width: width,
      height: height,
      title: title,
      alignment: alignment,
      shadow: shadow,
    });
  }

  /**
   * paste from clipboard, either text or image
   *
   * @param {ObjectConstructor} selection current editor selection
   */
  #paste(selection) {
    navigator.clipboard.read().then((clipItems) => {
      for (let clipboardItem of clipItems) {
        if (
          clipboardItem.types.includes("image/png") ||
          clipboardItem.types.includes("image/jpeg")
        ) {
          // paste image
          for (let type of clipboardItem.types) {
            if (type.startsWith("image/")) {
              clipboardItem.getType(type).then((image) => {
                let reader = new FileReader();
                reader.readAsDataURL(image);
                reader.onload = () => {
                  this.#editor.deleteText(selection.index, selection.length);
                  this.#editor.insertEmbed(
                    selection.index,
                    "image",
                    reader.result +
                      " " +
                      theSettings.imageWidth +
                      " " +
                      theSettings.imageHeight,
                  );
                  this.#editor.formatText(selection.index, 1, {
                    title: "",
                    alignment: theSettings.imageAlignment,
                    shadow: theSettings.imageShadow,
                  });
                };
              });
            }
          }
        } else {
          if (
            clipboardItem.types.includes("text/plain") ||
            clipboardItem.types.includes("text/html")
          ) {
            // paste text
            navigator.clipboard.readText().then((clipText) => {
              this.#editor.deleteText(selection.index, selection.length);
              this.#editor.insertText(selection.index, clipText);
            });
          }
        }
      }
    });
  }
}
