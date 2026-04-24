/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file implementation of ExportEditor class
 */

/**
 * @classdesc an ExportEditor is a special quill based editor featuring placeholders for various meta information and other variable content
 */
class ExportEditor {
  #editor;
  #detectURL = null;

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
      zIndex: 10,
      build: ($trigger, event) => {
        let items = {};
        let infoPre = `<span class="preWrap" style="font-style:italic">`;
        let infoPost = `</span>`;
        this.#detectURL = null;

        // on image
        if (event.target.nodeName.toLowerCase() == "img") {
          let specs = DIMImage.formats(event.target);
          items.name = {
            isHtmlName: true,
            name: `${infoPre}${_("editorContextMenu_imageInfo", {
              width: specs.width,
              height: specs.height,
            })}${infoPost}`,
            icon: "fas fa-circle-info",
            className: "contextMenuInfo",
          };
          if (specs.title) {
            items.title = {
              isHtmlName: true,
              name: `${infoPre}${Util.escapeHTML(specs.title)}${infoPost}`,
              className: "contextMenuInfo",
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
            className: "contextMenuInfo",
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
        items.pasteText = {
          name: _("editorContextMenu_pasteText"),
          callback: () => {
            navigator.clipboard.readText().then((clipText) => {
              quill.deleteText(sel.index, sel.length);
              quill.insertText(sel.index, clipText);
            });
          },
        };
        items.pastePlain = {
          name: _("editorContextMenu_pastePlain"),
          callback: () => {
            navigator.clipboard.readText().then((clipText) => {
              quill.deleteText(sel.index, sel.length);
              quill.insertText(sel.index, clipText);
              quill.removeFormat(sel.index, clipText.length);
            });
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
        // detect URL
        if (!sel.length) {
          let left = 0;
          let right = quill.getText().length;
          let leftText = quill.getText(0, sel.index);
          let rightText = quill.getText(sel.index);
          let m = leftText.match(/(\S*)$/);
          if (m) {
            leftText = m[1];
            left = sel.index - m[1].length;
          }
          m = rightText.match(/(\S*)/);
          if (m) {
            rightText = m[1];
            right = sel.index + m[1].length;
          }
          m = (leftText + rightText).match(
            /(https?:\/\/)?(?:[A-Za-z0-9-]{1,63}\.){2,}[A-Za-z0-9-]{1,63}(?:[\/?#][^\s()<>\[\]{}]*)?/i,
          );
          if (
            m &&
            sel.index >= left + m.index &&
            sel.index <= left + m.index + m[0].length
          ) {
            try {
              let url = new URL(m[1] ? m[0] : "http://" + m[0]);
              Util.avoidUndo(quill, () => {
                quill.formatText(left + m.index, m[0].length, "url", true);
              });
              this.#detectURL = { index: left + m.index, length: m[0].length };
              items.openURL = {
                name: _("editorContextMenu_openURL"),
                callback: () => {
                  ipcRenderer.invoke("mainProcess_openURL", url.href);
                },
              };
            } catch (_) {
              // catch failing URL() constructor for invalid url
            }
          }
        }
        return {
          items: items,
        };
      },
      events: {
        hide: () => {
          if (this.#detectURL)
            Util.avoidUndo(quill, () => {
              quill.formatText(
                this.#detectURL.index,
                this.#detectURL.length,
                "url",
                false,
              );
            });
          return true;
        },
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

    // DOM dragstart, copy and cut handlers: if we are taking chunks out of the text we must take care of all objects the text chunk is associated with
    $(`#${id}`).on("dragstart copy cut", (event) => {
      if (event.type != "dragstart") event.preventDefault();

      let selection = this.#editor.getSelection();
      let formats =
        this.#editor.getFormat(selection.index, selection.length) || {};
      let delta = this.#editor.getContents(selection.index, selection.length);
      delta.ops = delta.ops.map((op) => {
        if (typeof op.insert == "string") {
          op.attributes = { ...(op.attributes || {}), ...formats };
        }
        return op;
      });

      let dt =
        event.type == "dragstart"
          ? event.originalEvent.dataTransfer
          : event.originalEvent.clipboardData;
      dt.setData("quill/delta", JSON.stringify(delta));
      dt.setData("text/html", Exporter.delta2HTML(delta.ops));
      dt.setData(
        "text/plain",
        this.#editor.getText(selection.index, selection.length),
      );
      if (event.type == "dragstart") return true;
      if (event.type == "cut") document.getSelection().deleteFromDocument();
    });

    // DOM drop handler (drops from within Quill or from outside)
    $(`#${id}`).on("drop", (event) => {
      event.preventDefault();

      // find Quill index where drop happened
      const x = event.clientX;
      const y = event.clientY;

      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }
      if (!range) return;

      let node = range.startContainer;
      let offset = range.startOffset;

      // walk up until Parchment knows this node
      let blot = Parchment.find(node);
      while (!blot && node && node !== quill.root) {
        node = node.parentNode;
        blot = Parchment.find(node);
      }
      if (!blot) return;
      let index = blot.offset(quill.scroll) + offset;

      let formats = quill.getFormat(index);
      let delta = null;
      if (event.originalEvent.dataTransfer.types.includes("quill/delta"))
        delta = new Delta(
          JSON.parse(event.originalEvent.dataTransfer.getData("quill/delta")),
        );
      else if (event.originalEvent.dataTransfer.types.includes("text/html")) {
        let html = QuillClipboard.stripTags(
          event.originalEvent.dataTransfer.getData("text/html"),
        );
        delta = quill.clipboard.convert(html);
      } else if (event.originalEvent.dataTransfer.types.includes("text/plain"))
        delta = new Delta().insert(
          event.originalEvent.dataTransfer.getData("text/plain"),
        );
      if (delta) {
        // apply current formats to all ops in the pasted delta
        delta.ops = delta.ops.map((op) => {
          if (typeof op.insert == "string") {
            op.attributes = { ...(op.attributes || {}), ...formats };
          }
          return op;
        });
        quill.updateContents(new Delta().retain(index).concat(delta));
        if (!event.ctrlKey) {
          document.getSelection().deleteFromDocument();
        }
        quill.setSelection(index, delta.length());
      }
    });

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
}
