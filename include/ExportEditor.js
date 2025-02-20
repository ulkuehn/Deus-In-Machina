/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of ExportEditor class
 */

/**
 * @classdesc an ExportEditor is a special quill based editor featuring placeholders for various meta information and other variable content
 */
class ExportEditor {
  #editor;

  /**
   * class constructor
   *
   * @param {String} mode image mode
   * @param {JQuery} $mainDiv
   * @param {String} id editor id
   * @param {Object[]} editorContents
   * @param {Number} height
   * @param {Object} settings
   * @param {Object} formats
   * @param {String[]} placeholders
   * @param {String} buttonClass
   * @param {Boolean} withFormat if true display basic formatting and format selector
   * @param {Boolean} withZoom if true display zoom control
   */
  constructor(
    mode,
    $mainDiv,
    id,
    editorContents,
    height,
    settings,
    formats,
    placeholders,
    buttonClass = "btn-outline-dark",
    withFormat = true,
    withZoom = false,
  ) {
    let $menuBarDiv = $("<div>").attr({
      style:
        "display:grid; grid-template-columns:min-content min-content min-content min-content auto auto 200px 40px; column-gap:5px; margin-bottom:5px",
    });

    // basic formatting
    let $boldControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `bold${id}`,
    });
    let $italicControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `italic${id}`,
    });
    let $underlineControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `underline${id}`,
    });
    let $strikeControl = $("<input>").attr({
      type: "checkbox",
      class: "btn-check",
      id: `strike${id}`,
    });

    let $boldDiv = $("<div>")
      .attr({
        style: `grid-column:1; align-self:center; visibility:${
          withFormat ? "visible" : "hidden"
        }`,
      })
      .append(
        $boldControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="bold${id}" title="${_(
          "editorBars_boldTitle",
        )}"><b style="font-size:18px; text-shadow:black 0px 0px 1px">${_(
          "editorBars_boldLabel",
        )}</b></label>`,
      );
    let $italicDiv = $("<div>")
      .attr({
        style: `grid-column:2; align-self:center; visibility:${
          withFormat ? "visible" : "hidden"
        }`,
      })
      .append(
        $italicControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="italic${id}" title="${_(
          "editorBars_italicTitle",
        )}"><i style="font-size:18px;">${_(
          "editorBars_italicLabel",
        )}</i></label>`,
      );
    let $underlineDiv = $("<div>")
      .attr({
        style: `grid-column:3; align-self:center; visibility:${
          withFormat ? "visible" : "hidden"
        }`,
      })
      .append(
        $underlineControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="underline${id}" title="${_(
          "editorBars_underlineTitle",
        )}"><u style="font-size:18px;">${_(
          "editorBars_underlineLabel",
        )}</u></label>`,
      );
    let $strikeDiv = $("<div>")
      .attr({
        style: `grid-column:4; align-self:center; visibility:${
          withFormat ? "visible" : "hidden"
        }`,
      })
      .append(
        $strikeControl,
        `<label class="btn ${buttonClass} btn-sm" style="width:30px; padding:0; margin:0" for="strike${id}" title="${_(
          "editorBars_strikeTitle",
        )}"><s style="font-size:18px;">${_(
          "editorBars_strikeLabel",
        )}</s></label>`,
      );

    // paragraph format dropdown
    $(`#formatSheet${id}`).empty();
    let $formatSelect = $("<select>").attr({
      id: `format${id}`,
      style: "max-width:300px; height:29px",
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
        $(`#formatSheet${id}`).append(
          Formats.toCSS(
            formatID,
            formats[formatID],
            undefined,
            undefined,
            ".ql-editor",
          ),
        );
        if (settings.previewFormats) {
          $(`#formatSheet${id}`).append(
            `${
              formatID == UUID0
                ? `#format${id} option { `
                : `#format${id} .format${formatID} {`
            } ${Formats.toPreviewCSS(formats[formatID])}}\n`,
          );
        }
        let parchment = new Parchment.Attributor.Class(
          `format${formatID}`,
          `format${formatID}`,
          {
            scope: Parchment.Scope.BLOCK,
          },
        );
        Parchment.register(parchment);
      });
    let $formatDiv = $("<div>")
      .attr({
        style: `grid-column:5; align-self:center; visibility:${
          withFormat ? "visible" : "hidden"
        }`,
      })
      .append($formatSelect);

    // placeholder dropdown
    let $placeholderSelect = $("<select>").attr({
      id: `placeholder${id}`,
      style: "height: 29px; width:100%",
    });
    if (placeholders) {
      $placeholderSelect.append(
        `<option style="text-align:right" value="">${_("placeholders_insertPlaceholder")}</option>`,
      );
      placeholders.forEach((placeholder) => {
        $placeholderSelect.append(
          `<option value="${placeholder}" ${
            Exporter.placeholders[placeholder].block
              ? `style="text-align:center;"`
              : ""
          }>${_(`placeholders_${placeholder}`)}</option>`,
        );
      });
    }
    let $placeholderDiv = $("<div>")
      .attr({
        style: `grid-column:6/span ${
          withZoom ? 1 : 3
        }; justify-self:stretch; align-self:center;`,
      })
      .append($placeholderSelect);

    // zoom control
    let $zoomSelectDiv = null;
    let $zoomDisplayDiv = null;
    if (withZoom) {
      $zoomSelectDiv = $("<div>")
        .attr({
          style: "grid-column:7; align-self:center;",
        })
        .html(
          `<input type="range" class="range-dark form-range" min="0" max="160" id="zoomSelector${id}" value="80">`,
        );
      $zoomDisplayDiv = $("<div>")
        .attr({
          style: "grid-column:8; justify-self:end; align-self:center;",
        })
        .html(
          `<span id="zoomValue${id}" style="cursor:pointer" onclick="$('#zoomSelector${id}').val(80); $('#zoomSelector${id}').trigger('input')">100%</span>`,
        );
    }

    // editor pane
    let $editorDiv = $("<div>").attr({
      type: "editor",
      id: id,
      style: `background-color:#fff; border:1px solid black; height:${height}`,
      spellcheck: false,
    });

    $mainDiv.append(
      $menuBarDiv.append(
        $boldDiv,
        $italicDiv,
        $underlineDiv,
        $strikeDiv,
        $formatDiv,
        $placeholderDiv,
        $zoomSelectDiv,
        $zoomDisplayDiv,
      ),
      $editorDiv,
    );

    let quill = new Quill(`#${id}`, QuillConfig.config);
    quill.setContents(editorContents);
    this.#editor = quill;

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
              $(`#bold${id}`).prop("checked", !("bold" in format));
              quill.format("bold", !("bold" in format));
            },
          };
          items.formatItalic = {
            name: _("editorContextMenu_italic"),
            isHtmlName: true,
            icon: "italic" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#italic${id}`).prop("checked", !("italic" in format));
              quill.format("italic", !("italic" in format));
            },
          };
          items.formatUnderline = {
            name: _("editorContextMenu_underline"),
            isHtmlName: true,
            icon: "underline" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#underline${id}`).prop("checked", !("underline" in format));
              quill.format("underline", !("underline" in format));
            },
          };
          items.formatStrike = {
            name: _("editorContextMenu_strike"),
            isHtmlName: true,
            icon: "strike" in format ? "fas fa-check" : null,
            callback: () => {
              $(`#strike${id}`).prop("checked", !("strike" in format));
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
              // execCommand should be avoided -- but clipboard.write fails on delta data (?)
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
        return {
          items: items,
        };
      },
    });

    // button behaviour
    $boldControl.on("change", () => {
      quill.format("bold", $boldControl.prop("checked"));
    });
    $italicControl.on("change", () => {
      quill.format("italic", $italicControl.prop("checked"));
    });
    $underlineControl.on("change", () => {
      quill.format("underline", $underlineControl.prop("checked"));
    });
    $strikeControl.on("change", () => {
      quill.format("strike", $strikeControl.prop("checked"));
    });

    // change paragraph format
    $formatSelect.on("change", () => {
      if (quill.getSelection()) {
        // unset all possible paragraph formats, as we do not know which one is set
        Object.keys(formats).forEach((formatID) => {
          quill.format(`format${formatID}`, false);
        });
        // set new format
        quill.format(`format${$formatSelect.val()}`, true);
      }
    });

    // DOM paste handler
    $(`#${id}`).on("paste", (event) => {
      if (!event.originalEvent.clipboardData.types.includes("text/quill")) {
        event.preventDefault();
        let range = this.#editor.getSelection(true);
        if (range) {
          this.#paste(range);
        }
      }
    });

    // insert placeholder
    $placeholderSelect.on("change", () => {
      if ($placeholderSelect.val()) {
        let range = quill.getSelection();
        if (range && !range.length) {
          quill.insertEmbed(
            range.index,
            "placeholder",
            $placeholderSelect.val(),
          );
        }
        $placeholderSelect.val("");
      }
    });

    // change zoom
    if (withZoom) {
      // by slider
      $(`#zoomSelector${id}`).on("input", function () {
        let zoom = Util.scaledZoom($(this).val());
        $(`#zoomValue${id}`).html(`${zoom}%`);
        $(`#formatSheet${id}`).empty();
        for (let [formatID, format] of Object.entries(formats)) {
          $(`#formatSheet${id}`).append(
            Formats.toCSS(formatID, format, undefined, zoom, ".ql-editor"),
          );
          if (settings.previewFormats) {
            $(`#formatSheet${id}`).append(
              `${
                formatID == UUID0
                  ? `#format${id} option { `
                  : `#format${id} .format${formatID} {`
              } ${Formats.toPreviewCSS(formats[formatID])}}\n`,
            );
          }
        }
        $(`#formatSheet${id}`).append(`img { zoom:${zoom}% }`);
      });

      // by wheel / pinch
      $(`#${id}`)[0].addEventListener(
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

            $(`#formatSheet${id}`).empty();
            for (let [formatID, format] of Object.entries(formats)) {
              $(`#formatSheet${id}`).append(
                Formats.toCSS(formatID, format, undefined, zoom, ".ql-editor"),
              );
              if (settings.previewFormats) {
                $(`#formatSheet${id}`).append(
                  `${
                    formatID == UUID0
                      ? `#format${id} option { `
                      : `#format${id} .format${formatID} {`
                  } ${Formats.toPreviewCSS(formats[formatID])}}\n`,
                );
              }
            }
            $(`#formatSheet${id}`).append(`img { zoom:${zoom}% }`);
          }
        },
        { passive: false },
      );
    }

    // adjust buttons and format selector on select
    quill.on("selection-change", (range, oldRange, source) => {
      if (range) {
        $placeholderSelect.attr("disabled", range.length > 0);
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
        $(`#format${id}`).val(format);
      }
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
   * set image parameters
   *
   * @param {Number} index position of image object in the editor
   * @param {Number} width
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
   * paste into quill
   *
   * @param {Selection} selection
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
        }
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
    });
  }
}
