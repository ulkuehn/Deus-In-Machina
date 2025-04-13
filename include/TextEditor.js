/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025
 * @file implementation of TextEditor class
 */

/**
 * @classdesc the TextEditor class provides all functionality for the main editor pane
 */
class TextEditor {
  /**
   * let an editor selection blink (unselect/reselect) for some time
   *
   * @param {Quill} quill editor object
   * @param {Number} from index of where selection starts
   * @param {Number} len length of selection
   * @param {Number} times blinking count
   * @param {Number} time blinking time in ms
   * @returns {Promise} resolves upon end of blinking sequence
   */
  static blinkSelection(quill, from, len, times, time) {
    return new Promise((resolve) => {
      let promises = [];
      for (let i = 1; i <= times; i++) {
        promises.push(
          new Promise((resolve) =>
            setTimeout(() => {
              quill.setSelection(0, 0);
              resolve();
            }, time * i),
          ),
        );
        promises.push(
          new Promise((resolve) =>
            setTimeout(
              () => {
                quill.setSelection(from, len);
                resolve();
              },
              time * i + time / 2,
            ),
          ),
        );
      }
      Promise.allSettled(promises).then(() => resolve());
    });
  }

  /**
   * timed method to handle selection changes
   *
   * @param {TextEditor} thisTextEditor
   * @param {Object} range Quill selection
   * @param {String} textID
   */
  static updateSelection(thisTextEditor, range, textID) {
    delete thisTextEditor.#selectionChangeTimers[textID];
    if (range) {
      thisTextEditor.#selectedEditor = textID;
      thisTextEditor.setStatusBar(textID);
      if (theSettings.effectiveSettings().autoSelectTreeItem) {
        (theTextCollection || theTextTree).selectSome(textID, true);
      }

      // update format checkboxes
      let format = thisTextEditor.#editors[textID].quill.getFormat(range);
      $("#formatBold").prop("checked", "bold" in format);
      $("#formatItalic").prop("checked", "italic" in format);
      $("#formatUnderline").prop("checked", "underline" in format);
      $("#formatStrike").prop("checked", "strike" in format);

      // set format selector to paragraph format or none if no format or multiple formats
      let pos = 0;
      format = null;
      thisTextEditor.#editors[textID].quill
        .getText(range.index, range.length)
        .split("\n")
        .forEach((textlet) => {
          let paraFormat = UUID0; // standard
          Object.keys(
            thisTextEditor.#editors[textID].quill.getFormat(
              range.index + pos,
              textlet.length + 1,
            ),
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
      $("#formatSelector").val(format);
    } else {
      // selection lost
    }
  }

  /**
   * timed method to save changed content to textTree and update OR pane -- function is triggered by change event and will be suspended on quick successive changes
   *
   * @param {TextEditor} thisTextEditor
   * @param {String} id
   */
  static updateTextTreeAndObjectReference(thisTextEditor, id) {
    delete thisTextEditor.#textChangeTimers[id];
    // changeText also takes care of updating text-object and object-text reference counts
    theTextTree
      .changeText(
        id,
        thisTextEditor.#editors[id].quill.getContents().ops,
        thisTextEditor.#editors[id].changed.epochSeconds,
      )
      .then(() => {
        thisTextEditor.setStatusBar(id);
        theObjectReference = new ObjectReference();
        thisTextEditor.#adjustSearch();
        thisTextEditor.#editors[id].changed = null;
      });
  }

  #editors; // mapping of id -> editor
  #selectedEditor;
  #textChangeTimers;
  #selectionChangeTimers;
  #ids; // text ids in sequential order
  #spellcheckWatch;
  #hasContextMenu = false;
  #searchPositions = null; // object of arrays
  #doAdjustSearch = true;
  #searchTextTimeout = null;
  #showingWhere = false;
  #doChangeHandler = true;
  #wheelTimer = null; // id of timer used to manage wheeling/zoom events
  #isWheeling = false;
  #isZooming = false;
  #objectStatusTimer = null;

  /**
   * class constructor
   *
   * @param {Number} zoomValue
   */
  constructor(zoomValue = Util.neutralZoomValue) {
    this.#textChangeTimers = {};
    this.#selectionChangeTimers = {};
    this.#editors = {};
    this.#selectedEditor = null;
    this.#spellcheckWatch = null;
    this.#ids = [];
    let settings = theSettings ? theSettings.effectiveSettings() : {};

    // bar separators
    let barSeparator = `<span style="display:block; height:100%; width:1px; margin:0 4px 0 4px; background-color:${Util.blackOrWhite(
      Util.lighterOrDarker(
        settings.TEBackgroundColor || settings.generalBackgroundColor,
        settings.contrastLevel,
      ),
    )}"></span>`;

    // layout
    let $grid = $("<div>").attr({
      style: "height:100%; display:grid; grid-template-rows: 36px auto 28px",
    });

    // menu bar
    let $menuBar = $("<div>").attr({
      id: "MB",
      style:
        "display:grid; column-gap:5px; grid-template-columns:min-content min-content min-content min-content min-content 160px min-content min-content auto min-content min-content min-content max-content min-content min-content min-content min-content min-content",
    });

    // basic styling controls (bold, italic etc)
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:1; align-self:center; margin-left:3px",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatBold"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatBold" title="${_(
            "editorBars_boldTitle",
          )}"><b style="font-size:18px; text-shadow:black 0px 0px 1px">${_(
            "editorBars_boldLabel",
          )}</b></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:2; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatItalic"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatItalic" title="${_(
            "editorBars_italicTitle",
          )}"><i style="font-size:18px;">${_(
            "editorBars_italicLabel",
          )}</i></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:3; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatUnderline"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatUnderline" title="${_(
            "editorBars_underlineTitle",
          )}"><u style="font-size:18px;">${_(
            "editorBars_underlineLabel",
          )}</u></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:4; align-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="formatStrike"><label class="btn btn-outline-light btn-sm simple-btn" style="width:30px; padding:0; margin:0" for="formatStrike" title="${_(
            "editorBars_strikeTitle",
          )}"><s style="font-size:18px;">${_(
            "editorBars_strikeLabel",
          )}</s></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:5; align-self:center",
        })
        .html(
          `<button type="button" id="formatSymbols" class="btn btn-outline-light btn-sm simple-btn" style="width:40px; padding:0; margin:0" title="${_(
            "editorBars_symbolsTitle",
          )}"><span style="font-size:18px;">&alpha;&Omega;</span></button>`,
        ),
    );

    // format selector
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:6; align-self:center;",
        })
        .html(
          `<select id="formatSelector" style="height:calc(100% - 6px); width:100%" title="${_("editorBars_formatsTitle")}"></select>`,
        ),
    );
    // format editor
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:7; align-self:center",
        })
        .html(
          `<button type="button" id="formatsEditor" class="btn btn-outline-light btn-sm simple-btn" style="height:calc(100% - 8px); width:30px; padding:6px" title="${_(
            "editorBars_formatsEditorTitle",
          )}"><i class="fa-solid fa-paragraph"></i></button>`,
        ),
    );
    // separator
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:8",
        })
        .html(barSeparator),
    );

    // search bar
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:9; align-self:center; background-color:white; border:1px solid black",
        })
        .html(
          `<div><input type="text" spellcheck="false" id="searchText" style="border:none; background-color:#00000000; width:calc(100% - 25px)"><i class="fa-solid fa-magnifying-glass fa-fw" id="searchIcon" title="${_(
            "editorBars_searchModeTitle",
          )}" style="margin-left:2px"></i></div><div style="display:none;"><input type="text" spellcheck="false" id="replaceText" style="border:none; background-color:#00000000; width:calc(100% - 25px)"><i class="fa-solid fa-right-left fa-fw" id="replaceIcon" title="${_(
            "editorBars_replaceModeTitle",
          )}" style="margin-left:2px"></i></div>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:10; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchCase"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px" for="searchCase" title="${_(
            "search_withCase",
          )}"><span style="font-size:18px; letter-spacing:-1px">aA</span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:11; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchWord"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px" for="searchWord" title="${_(
            "search_wholeWord",
          )}"><span style="font-size:18px;"><u>ab</u></span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:12; align-self:center; justify-self:center",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="searchRegex"><label class="btn btn-outline-light btn-sm simple-btn" style="padding:0; width:35px; ${
            settings.searchWithRegex ? "" : "display:none"
          }" for="searchRegex" title="${_(
            "search_withRegex",
          )}"><span style="font-size:18px;"><b>.*</b></span></label>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:13; place-self:center center; min-width:40px; text-align:center",
          id: "searchCount",
        })
        .html(_("editorBars_noSearchResults")),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:14; align-self:center",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:calc(100% - 8px); padding:0; width:30px" id="searchPrev" title="${_(
            "editorBars_searchPrevTitle",
          )}" disabled><i class="fa-solid fa-angle-up fa-fw"></i></button>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:15; align-self:center; justify-self:center;",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:calc(100% - 8px); padding:0; width:30px" id="searchNext" title="${_(
            "editorBars_searchNextTitle",
          )}" disabled><i class="fa-solid fa-angle-down fa-fw"></i></button>`,
        ),
    );
    // separator
    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:16",
        })
        .html(barSeparator),
    );

    $menuBar.append(
      $("<div>")
        .attr({
          style: "grid-column:17; align-self:center; justify-self:center",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:calc(100% - 8px); padding:0; width:30px" id="replaceNext" title="${_(
            "editorBars_replaceNextTitle",
          )}" disabled><i class="fa-solid fa-right-left"></i></button>`,
        ),
    );
    $menuBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:18; align-self:center; justify-self:center; margin-right:3px",
        })
        .html(
          `<button type="button" class="btn btn-outline-light btn-sm simple-btn" style="height:calc(100% - 8px); padding:0; width:30px" id="replaceAll" title="${_(
            "editorBars_replaceAllTitle",
          )}" disabled><i class="fa-solid fa-retweet fa-fw"></i></button>`,
        ),
    );

    $grid.append($menuBar);

    // editor area
    $grid.append(
      $("<div>")
        .attr({
          id: "TEE",
          style: "padding:5px; overflow:auto",
        })
        .append(
          $("<div>").attr({
            id: "emptyEditor",
            class: "emptyEditor",
          }),
        ),
    );

    // status bar
    let $statusBar = $("<div>").attr({
      id: "SB",
      style:
        "padding-right:3px; display:grid; grid-template-columns: 65px max-content 45px 45px max-content max-content min-content min-content min-content min-content min-content auto",
    });

    // status bar objects overlay
    $statusBar.append(
      $("<div>").attr({
        id: "SBObjects",
        style:
          "grid-column:1/span 12; height:28px; padding:2px 0 0 5px; justify-self:center; display:none",
      }),
    );

    // zoom selector
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:1; align-self:center; justify-self:end;",
        })
        .html(
          `<i class="fa-solid fa-text-height"></i> <span id="zoomValue" style="cursor:pointer" title="${_(
            "editorBars_resetZoomTitle",
          )}" onclick="$('#zoomSelector').val(${
            Util.neutralZoomValue
          });$('#zoomSelector').trigger('input')">${Util.scaledZoom(
            zoomValue,
          )}%</span>`,
        ),
    );
    $statusBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:2; justify-self:end; align-self:center; width:150px; margin-left:10px; margin-right:10px",
        })
        .html(
          `<input type="range" class="form-range" min="0" max="160" id="zoomSelector" value="${zoomValue}" title="${_(
            "editorBars_textZoomTitle",
          )}">`,
        ),
    );

    // spell correction markup
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:3;align-self:center;",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="showSpelling"><label class="btn btn-outline-light btn-sm simple-btn" for="showSpelling" title="${_(
            "editorBars_showSpellingTitle",
          )}"><i class="fa-solid fa-spell-check"></i></label>`,
        ),
    );

    // object markup
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:4;align-self:center;",
        })
        .html(
          `<input type="checkbox" class="btn-check" id="showObjectStyles" checked><label class="btn btn-outline-light btn-sm simple-btn" for="showObjectStyles" title="${_(
            "editorBars_showObjectStylesTitle",
          )}"><i class="fa-solid fa-font"></i></label>`,
        ),
    );

    // text opacity selector
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:5; align-self:center; justify-self:end;",
        })
        .html(
          `<span id="textOpacityValue" title="${_(
            "editorBars_resetOpacityTitle",
          )}" onclick="$('#textOpacitySelector').val(50);$('#textOpacitySelector').trigger('change')">50%</span>`,
        ),
    );
    $statusBar.append(
      $("<div>")
        .attr({
          style:
            "grid-column:6; justify-self:end; align-self:center; width:100px; margin-left:10px; margin-right:10px",
        })
        .html(
          `<input type="range" class="form-range" min="0" max="100" id="textOpacitySelector" title="${_(
            "editorBars_textOpacityTitle",
          )}" value="50">`,
        ),
    );
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:7",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // counts
    $statusBar.append(
      $("<div>").attr({
        style: "grid-column:8; place-self:center center; white-space:nowrap;",
        id: "SBcounts",
      }),
    );
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:9",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // total counts
    $statusBar.append(
      $("<div>").attr({
        style:
          "grid-column:10; place-self:center center; white-space:nowrap; overflow:hidden;",
        id: "SBtotalcounts",
      }),
    );
    // separator
    $statusBar.append(
      $("<div>")
        .attr({
          style: "grid-column:11",
          class: "SBseparator",
        })
        .html(barSeparator),
    );

    // text name
    $statusBar.append(
      $("<div>").attr({
        style:
          "grid-column:12; align-self:center; text-align:end; white-space:nowrap; overflow:hidden; text-overflow:ellipsis",
        id: "SBtext",
      }),
    );

    $grid.append($statusBar);
    $("#TE").empty().append($grid);
    this.unsetStatusBar();
    $("#TEE")[0].addEventListener("wheel", this.#zoom.bind(this));

    // search bar
    $("#searchText").on("input", () => {
      if (this.#searchTextTimeout) {
        clearTimeout(this.#searchTextTimeout);
      }
      // debounce input
      this.#searchTextTimeout = setTimeout(() => {
        this.#searchTextTimeout = null;
        this.#checkSearchRegex();
        this.#doAdjustSearch = true;
        this.#adjustSearch();
      }, 500);
    });

    $("#searchIcon").on("click", () => {
      $("#searchText").parent().css("display", "none");
      $("#replaceText").parent().css("display", "block");
    });
    $("#replaceIcon").on("click", () => {
      $("#searchText").parent().css("display", "block");
      $("#replaceText").parent().css("display", "none");
    });
    $("#searchCase").on("change", () => {
      this.#adjustSearch();
    });
    $("#searchWord").on("change", () => {
      this.#adjustSearch();
    });
    $("#searchRegex").on("change", () => {
      if (this.#checkSearchRegex()) {
        this.#adjustSearch();
      }
    });
    $("#searchText").on("keydown", (e) => {
      if (e.code == "Enter") setTimeout(() => this.#search(), 250);
    });
    $("#searchNext").on("click", () => {
      this.#search();
    });
    $("#searchPrev").on("click", () => {
      this.#search(false);
    });
    $("#replaceNext").on("click", () => {
      this.#replaceNext();
    });
    $("#replaceAll").on("click", () => {
      if (settings.replaceAllConfirm) {
        let count = this.#countSearchPositions(true); // skip locked texts
        if (count) {
          ipcRenderer
            .invoke("mainProcess_yesNoDialog", [
              _("editorBars_replaceAllTitle"),
              _("editorBars_confirmReplace", count, {
                count: count,
                replaceBy: $("#replaceText").val(),
              }),
              true,
            ])
            .then((result) => {
              if (result == 0) {
                this.#replaceAll();
              }
            });
        }
      } else {
        this.#replaceAll();
      }
    });

    // change spelling markup
    $("#showSpelling").on("change", () => {
      this.#ids.forEach((id) => {
        $(this.#editors[id].quill.container).attr(
          "spellcheck",
          $("#showSpelling").prop("checked"),
        );
      });
    });

    // change object markup
    $("#showObjectStyles").on("change", () => {
      theObjectTree.buildObjectSheet(
        undefined,
        undefined,
        $("#showObjectStyles").prop("checked"),
        $("#textOpacitySelector").val(),
      );
    });

    // change text opacity
    $("#textOpacitySelector").on("change", () => {
      $("#textOpacityValue").html($("#textOpacitySelector").val() + "%");
      theObjectTree.buildObjectSheet(
        undefined,
        undefined,
        $("#showObjectStyles").prop("checked"),
        $("#textOpacitySelector").val(),
      );
    });

    // change zoom
    $("#zoomSelector").on("input", () => {
      theLayout.zoomValue = $("#zoomSelector").val();
      $("#zoomValue").html(Util.scaledZoom($("#zoomSelector").val()) + "%");
      $(":root").css({
        "--first-line-indent": `${
          (settings.firstLineIndent *
            Util.scaledZoom($("#zoomSelector").val())) /
          100
        }px`,
      });
      theObjectTree.buildObjectSheet();
    });

    // change paragraph format
    $("#formatSelector").on("change", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        if (this.#editors[this.#selectedEditor].quill.getSelection()) {
          // unset all possible paragraph formats, as we do not know which one is set
          Object.keys(theFormats.formats).forEach((formatID) => {
            this.#editors[this.#selectedEditor].quill.format(
              `format${formatID}`,
              false,
            );
          });
          // set new format
          this.#editors[this.#selectedEditor].quill.format(
            `format${$("#formatSelector").val()}`,
            true,
          );
        }
      }
    });

    // basic formatting
    $("#formatBold").on("change", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        this.#editors[this.#selectedEditor].quill.format(
          "bold",
          $("#formatBold").prop("checked"),
        );
      }
    });
    $("#formatItalic").on("change", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        this.#editors[this.#selectedEditor].quill.format(
          "italic",
          $("#formatItalic").prop("checked"),
        );
      }
    });
    $("#formatUnderline").on("change", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        this.#editors[this.#selectedEditor].quill.format(
          "underline",
          $("#formatUnderline").prop("checked"),
        );
      }
    });
    $("#formatStrike").on("change", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        this.#editors[this.#selectedEditor].quill.format(
          "strike",
          $("#formatStrike").prop("checked"),
        );
      }
    });

    // open formats window
    $("#formatsEditor").on("click", () => {
      ipcRenderer.invoke("mainProcess_openWindow", [
        "formats",
        settings.closingType,
        true,
        0,
        0,
        _("windowTitles_formatsWindow"),
        "./formatsWindow/formatsWindow.html",
        "formatsWindow_init",
        null,
        [settings, theFormats.formats, theFonts.availableFamilies],
      ]);
    });

    // insert symbol
    $("#formatSymbols").on("click", () => {
      if (
        this.#selectedEditor &&
        theTextTree.getText(this.#selectedEditor).editable
      ) {
        ipcRenderer.invoke("mainProcess_openWindow", [
          "symbols",
          true, // close w/o asking
          false,
          50,
          50,
          _("windowTitles_symbolsWindow"),
          "./symbolsWindow/symbolsWindow.html",
          "symbolsWindow_init",
          null,
          [settings],
        ]);
      }
    });

    this.setup(settings);

    // on mousedown (before contextmenu event), check if context menu is currently open
    $(`#TEE`).on("mousedown", (e) => {
      this.#hasContextMenu = $("#context-menu-layer").length > 0;
    });

    // extend contextmenu to handle objects connected with a text selection
    $.contextMenu.types.checkclick = function (item, opt, root) {
      $(
        `<label><input type="checkbox" ${
          item.checked ? "checked" : ""
        } class="form-check-input" style="margin-top:2px; border:1px solid #2f2f2f; box-shadow:none"><span>${
          item.name
        }</span></label>`,
      ).appendTo(this);

      // right click: open object
      this.on("contextmenu", function (e) {
        opt.$menu.trigger("contextmenu:hide");
        theObjectTree.editProps(item.id);
      });

      // left click: (de)activate object
      this.on("click", function (e) {
        if (e.target.type == "checkbox") {
          opt.$menu.trigger("contextmenu:hide");
          if (item.checked) {
            theObjectTree.uncheckSome(item.id);
          } else {
            theObjectTree.checkSome(item.id);
          }
          item.checked = !item.checked;
        }
      });
    };
  }

  // getters and setters

  get selectedEditor() {
    return this.#selectedEditor;
  }

  get zoomValue() {
    return $("#zoomSelector").val();
  }

  set zoomValue(value) {
    $("#zoomSelector").val(value);
    $("#zoomSelector").trigger("change");
  }

  get objectStyles() {
    return $("#showObjectStyles").prop("checked");
  }

  get opacity() {
    return $("#textOpacitySelector").val();
  }

  get editors() {
    return this.#editors;
  }

  get ids() {
    return this.#ids;
  }

  /**
   * style the editor pane according to current settings
   *
   * @param {Object} settings
   */
  setup(settings) {
    let bgColor = settings.TEBackgroundColor || settings.generalBackgroundColor;
    $("#TEE").css({
      "--foreground-color": "#000000",
      "--background-color": bgColor,
    });
    $(":root").css({
      "--first-line-indent": `${
        (settings.firstLineIndent * Util.scaledZoom($("#zoomSelector").val())) /
        100
      }px`,
    });

    $("#emptyEditor").empty();
    if (settings.showLogo) {
      $("#emptyEditor").append(
        `<div style="position:absolute; width:200px; height:200px; background:black; filter:blur(85px)"></div><div class="fa-stack fa-5x"><i class="fa-solid fa-cog fa-stack-1x fa-lg fa-pulse" style="--fa-animation-duration:6s; color:#f7b801"></i><i class="fa-solid fa-infinity fa-stack-2x fa-spin" style="--fa-animation-duration:12s; color:#7678ed"></i></div>`,
      );
    }

    // derive bgColors of menu and status bars
    let barColor = Util.lighterOrDarker(bgColor, settings.contrastLevel);
    $("#MB").css({
      "background-color": barColor,
    });
    $("#SB").css({
      "background-color": barColor,
    });
    // additional border line?
    let border = `1px solid ${Util.blackOrWhite(barColor)}`;
    $("#MB").css("border-bottom", settings.borderLine ? border : "");
    $("#SB").css("border-top", settings.borderLine ? border : "");
    // style range sliders
    $("input[type=range]").addClass(
      Util.blackOrWhite(barColor, "range-light", "range-dark"),
    );
    // set button classes
    let buttonClass = Util.blackOrWhite(
      barColor,
      "btn-outline-light",
      "btn-outline-dark",
    );
    [
      "#formatBold",
      "#formatItalic",
      "#formatUnderline",
      "#formatStrike",
      "#searchCase",
      "#searchWord",
      "#searchRegex",
      "#showObjectStyles",
      "#showSpelling",
    ].forEach((control) => {
      $(`${control} + label`).removeClass([
        "btn-outline-light",
        "btn-outline-dark",
      ]);
      $(`${control} + label`).addClass(buttonClass);
    });
    [
      "#formatSymbols",
      "#formatsEditor",
      "#searchNext",
      "#searchPrev",
      "#replaceNext",
      "#replaceAll",
    ].forEach((control) => {
      $(control).removeClass(["btn-outline-light", "btn-outline-dark"]);
      $(control).addClass(buttonClass);
    });

    // status bar and zoom value text color
    $("#SB").css("color", Util.blackOrWhite(barColor));
    $("#zoomValue").css("color", Util.blackOrWhite(barColor));
    $("#SBtotalcounts").css("color", Util.blackOrWhite(barColor));
    $("#SBtext").css("color", Util.blackOrWhite(barColor));
    $("#searchCount").css("color", Util.blackOrWhite(barColor));
    // search with regex?
    if (!theSettings.effectiveSettings().searchWithRegex) {
      $("#searchRegex + label").css("display", "none");
    }
    if (theFormats) {
      this.updateFormats(theFormats.formats);
    }

    // styles
    let sheetHTML = `.edi + .edi { border-top-color:${settings.textSeparatorColor || Util.blackOrWhite(bgColor)}; border-top-width:${settings.textSeparatorWidth}px; border-top-style:${settings.textSeparatorStyle}; margin-top:${settings.textSeparatorAbove}px; padding-top:${settings.textSeparatorBelow}px }\n`;
    sheetHTML += `.ql-editor[contenteditable="false"] { ${
      settings.lockedBackgroundColor
        ? `background-color:${settings.lockedBackgroundColor};`
        : ""
    } opacity:${settings.lockedOpacity / 100} }\n`;

    if (settings.spellcheckDecorationColor || settings.spellcheckShadowColor) {
      sheetHTML += `.edi::spelling-error { `;
      if (settings.spellcheckDecorationColor) {
        sheetHTML += ` text-decoration-skip-ink:none; text-decoration:underline ${settings.spellcheckDecorationColor} wavy ${parseInt(settings.spellcheckDecorationThickness)}%;`;
      } else {
        sheetHTML += ` text-decoration:none;`;
      }
      if (settings.spellcheckShadowColor) {
        sheetHTML += ` text-shadow:${settings.spellcheckShadowColor} 1px 0 5px;`;
      }
      sheetHTML += "}";
    }
    $("#editorSheet").html(sheetHTML);
    this.#selectionStyle(settings.selectionColor);
  }

  /**
   * (un)set bold
   */
  bold() {
    if (this.#selectedEditor) {
      let bold =
        "bold" in this.#editors[this.#selectedEditor].quill.getFormat();
      $("#formatBold").prop("checked", !bold);
      this.#editors[this.#selectedEditor].quill.format("bold", !bold);
    }
  }
  /**
   * (un)set italic
   */
  italic() {
    if (this.#selectedEditor) {
      let italic =
        "italic" in this.#editors[this.#selectedEditor].quill.getFormat();
      $("#formatItalic").prop("checked", !italic);
      this.#editors[this.#selectedEditor].quill.format("italic", !italic);
    }
  }
  /**
   * (un)set underline
   */
  underline() {
    if (this.#selectedEditor) {
      let underline =
        "underline" in this.#editors[this.#selectedEditor].quill.getFormat();
      $("#formatUnderline").prop("checked", !underline);
      this.#editors[this.#selectedEditor].quill.format("underline", !underline);
    }
  }
  /**
   * (un)set strike
   */
  strike() {
    if (this.#selectedEditor) {
      let strike =
        "strike" in this.#editors[this.#selectedEditor].quill.getFormat();
      $("#formatStrike").prop("checked", !strike);
      this.#editors[this.#selectedEditor].quill.format("strike", !strike);
    }
  }

  /**
   * go to current selection / cursor position and highlight it
   */
  showWhere() {
    if (this.#selectedEditor && !this.#showingWhere) {
      try {
        this.#showingWhere = true;
        this.scrollToSelection();
        let sel = this.#editors[this.#selectedEditor].quill.getSelection();
        if (sel.length) {
          this.#showingWhere = false;
        } else {
          let start = sel.index ? sel.index - 1 : sel.index;
          let length = 2;
          // take care of unicodes beyond #7fff -- as quill.format may break these
          let u1 =
            this.#editors[this.#selectedEditor].quill
              .getContents(start, 1)
              .ops[0].insert.charCodeAt(0) >= 32768;
          let u2 =
            this.#editors[this.#selectedEditor].quill
              .getContents(start + 1, 1)
              .ops[0].insert.charCodeAt(0) >= 32768;
          if (u1 && u2) {
            start -= 1;
            length += 2;
          } else {
            if (u1) {
              start -= 1;
              length += 1;
            } else if (u2) {
              length += 1;
            }
          }
          this.#editors[this.#selectedEditor].quill.formatText(
            start,
            length,
            "whereami",
            true,
          );
          setTimeout(() => {
            this.#editors[this.#selectedEditor].quill.formatText(
              start,
              length,
              "whereami",
              false,
            );
            this.#showingWhere = false;
          }, 1000);
        }
      } catch (err) {
        this.#showingWhere = false;
      }
    }
  }

  /**
   * update format selector
   *
   * @param {Object} formats
   */
  updateFormats(formats) {
    $("#formatSelector").empty();
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
        $("#formatSelector").append(
          `<option ${
            theSettings.effectiveSettings().previewFormats
              ? `class="format${formatID}"`
              : ""
          } value="${formatID}">${Util.escapeHTML(
            formats[formatID].formats_name,
          )}</option>`,
        );
      });
  }

  /**
   * reload editor with given id from textTree (silently, no change-text event)
   *
   * @param {String} textID
   */
  reloadText(textID) {
    if (textID in this.#editors) {
      this.#editors[textID].quill.setContents(
        theTextTree.getText(textID).delta,
        "silent",
      );
      theObjectReference = new ObjectReference();
    }
  }

  /**
   * change quill editable or locked according to editability setting of text in the TextTree
   *
   * @param {String} textID
   */
  setEditable(textID) {
    if (textID in this.#editors) {
      this.#editors[textID].quill.enable(theTextTree.getText(textID).editable);
    }
  }

  /**
   * show texts with given ids in TextEditor; this includes
   * - keeping ids that are already in editor
   * - deleting ids no longer needed
   * - inserting new ids
   * - moving ids to different places (reordering)
   *
   * @param {String[]} textIDs
   */
  showTextsInEditor(textIDs) {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
    this.allEditorsSaved().then(() => {
      if (textIDs.length) {
        $("#emptyEditor").css("display", "none");
      } else {
        $("#emptyEditor").css("display", "flex");
        // removing and re-adding css class restarts animation
        $("#emptyEditor").removeClass("emptyEditor");
        $("#emptyEditor").addClass("emptyEditor");
      }
      let oldTextIDs = this.#ids;
      textIDs.reverse().forEach((textID) => {
        let index = oldTextIDs.indexOf(textID);
        if (index != -1) {
          // text already in TextEditor
          let $editor = $(`#edi${textID}`).detach();
          $("#TEE").prepend($editor);
          oldTextIDs.splice(index, 1);
        } else {
          // text new to TextEditor
          let $newEditor = $("<div>").attr({
            id: `edi${textID}`,
            spellcheck: $("#showSpelling").prop("checked"),
          });
          $newEditor.addClass("edi");
          $("#TEE").prepend($newEditor);
          this.#editors[textID] = {
            quill: this.#createQuill(textID),
            changed: null,
          };
          this.#editors[textID].quill.enable(
            theTextTree.getText(textID).editable,
          );

          // editor context menu definition
          $(`#edi${textID}`).contextMenu({
            selector: ".ql-editor",
            autoHide: true,
            build: ($trigger, e) => {
              return this.#hasContextMenu ||
                !theTextTree.getText(textID).editable
                ? false
                : this.#contextMenu(textID, e);
            },
          });
        }
      });

      oldTextIDs.forEach((textID) => {
        $(`#edi${textID}`).remove();
        delete this.#editors[textID];
      });

      this.#ids = [...textIDs].reverse();
      theObjectReference = new ObjectReference();
      this.#adjustSearch();
      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
    });
  }

  /**
   * wait until all editors have been saved
   *
   * @returns {Promise} resolves when all texts have been saved
   */
  allEditorsSaved() {
    return new Promise((resolve, reject) => {
      if (Object.keys(this.#textChangeTimers).length == 0) {
        resolve("saved");
      } else {
        setTimeout(
          TextEditor.#allEditorsSavedTimer,
          250,
          this.#textChangeTimers,
          resolve,
        );
      }
    });
  }

  /**
   * get delta-ops of editor with given id (or null)
   *
   * @param {String} id
   * @returns {Object[]}
   */
  getDelta(id) {
    if (this.#editors[id]) {
      return this.#editors[id].quill.getContents().ops;
    }
    return null;
  }

  /**
   * get quill of editor with given id (or null)
   *
   * @param {String} id
   * @returns {Quill}
   */
  getQuill(id) {
    if (this.#editors[id]) {
      return this.#editors[id].quill;
    }
    return null;
  }

  /**
   * scroll the current editor selection into view
   *
   * @param {Number} verticalShift determines if scrolling is
   * - top of selection to top of viewport(0.0)
   * - bottom of selection to bottom of viewport (1.0)
   * - center of selection to center of viewport (0.5)
   * - or anything inbetween
   */
  scrollToSelection(verticalShift = 0.5) {
    if (this.#selectedEditor) {
      if (verticalShift < 0.0) {
        verticalShift = 0.0;
      }
      if (verticalShift > 1.0) {
        verticalShift = 1.0;
      }
      let selection = this.#editors[this.#selectedEditor].quill.getSelection();
      if (selection) {
        let bounds =
          this.#editors[this.#selectedEditor].quill.getBounds(selection);
        let i = 0;
        let top = 0;
        // add heights of editors that come before the editor the selection is in
        while (this.#ids[i] != this.#selectedEditor) {
          top += $(`#edi${this.#ids[i]}`).height();
          i += 1;
          top -=
            $(`#edi${this.#ids[i]} .ql-editor`).height() -
            $(`#edi${this.#ids[i]}`).height();
        }
        // if height of selection exceeds viewport height, scroll top of selection to top of viewport
        if (bounds.height >= $("#TEE").height()) {
          verticalShift = 0.0;
        }
        let scrollTo = Math.round(
          bounds.top +
            top -
            verticalShift * ($("#TEE").height() - bounds.height),
        );
        if (scrollTo < 0) {
          scrollTo = 0;
        }
        $("#TEE").scrollTop(scrollTo);
      }
    }
  }

  /**
   * select a range in text with given id
   *
   * @param {String} id
   * @param {Number} from
   * @param {Number} len
   */
  select(id, from, len) {
    if (this.#editors[id]) {
      // do two selections to always create a selection event (even if selecting the same region twice in a row)
      this.#editors[id].quill.setSelection(from, 0);
      this.#editors[id].quill.setSelection(from, len);
      document
        .getSelection()
        .getRangeAt(0)
        .endContainer.parentNode.scrollIntoViewIfNeeded(true);
    }
  }

  /**
   * in all editor selections set or unset all checked objects
   *
   * @param {Boolean} set
   */
  markCheckedObjects(set = true) {
    Object.keys(this.#editors).forEach((id) => {
      if (this.#editors[id].quill.getSelection()) {
        theObjectTree.getChecked().forEach((objectID) => {
          this.#editors[id].quill.format(`object${objectID}`, set);
        });
        theTextTree.texts[id].calcObjectLength();
      }
    });
  }

  /**
   * in all editor selections unset all checked objects
   */
  unmarkCheckedObjects() {
    this.markCheckedObjects(false);
  }

  /**
   * in all editor selections unset the object with given id
   *
   * @param {String} objectID
   */
  unmarkObject(objectID) {
    Object.keys(this.#editors).forEach((id) => {
      if (this.#editors[id].quill.getSelection()) {
        this.#editors[id].quill.format(`object${objectID}`, false);
      }
    });
  }

  /**
   * in all editor selections unset all objects
   */
  unmarkAllObjects() {
    Object.keys(this.#editors).forEach((id) => {
      if (this.#editors[id].quill.getSelection()) {
        if (theObjectTree) {
          Object.keys(theObjectTree.objects).forEach((oid) => {
            this.#editors[id].quill.format(`object${oid}`, false);
          });
        }
      }
    });
  }

  /**
   * reset status bar infos
   */
  unsetStatusBar() {
    $(".SBseparator").css("visibility", "hidden");
    $("#SBtext").empty();
    $("#SBtext").attr("title", "");
    $("#SBtotalcounts").empty();
    $("#SBtotalcounts").attr("title", "");
    $("#SBcounts").empty();
    $("#SBcounts").attr("title", "");
    this.#selectedEditor = null;
  }

  /**
   * set search parameters
   *
   * @param {Object} search
   */
  setSearch(search) {
    $("#searchCase").prop("checked", search ? search.case : false);
    $("#searchWord").prop("checked", search ? search.word : false);
    $("#searchRegex").prop("checked", search ? search.regex : false);
    $("#searchText").val(search ? search.text : "");
  }

  /**
   * populate status bar with infos from text with given id
   *
   * @param {String} textID
   */
  setStatusBar(textID) {
    let settings = theSettings.effectiveSettings();

    if (textID) {
      $(".SBseparator").css("visibility", "visible");
      $("#SBtext").html(
        `<span style="padding-left:7px;">${_("editorBars_textPath", {
          value: settings.textPath
            ? theTextTree.getPath(textID, true)
            : Util.escapeHTML(theTextTree.getText(textID).name),
        })}</span>`,
      );
      $("#SBtext").attr(
        "title",
        settings.textPath
          ? _("editorBars_textPathTitle")
          : _("editorBars_textNameTitle"),
      );
      let totalWords = 0;
      let totalChars = 0;
      let totalObjects = {};
      let texts = 0;
      this.#ids.forEach((id) => {
        texts++;
        totalWords += theTextTree.getText(id).words;
        totalChars += theTextTree.getText(id).characters;
        totalObjects = { ...totalObjects, ...theTextTree.getText(id).objects };
      });
      if (texts > 1) {
        $("#SBtotalcounts").html(
          `<span style="display:inline-block; padding-left:7px; padding-right:7px;">${_(
            "editorBars_textLength",
            {
              sep: "+",
              words: totalWords.toLocaleString(theLanguage),
              characters: totalChars.toLocaleString(theLanguage),
              objects:
                Object.keys(totalObjects).length.toLocaleString(theLanguage),
            },
          )}</span>`,
          $("#SBtotalcounts").attr("title", _("editorBars_allTextsTitle")),
        );
      } else {
        $("#SBtotalcounts").html("&nbsp;&nbsp;&nbsp;");
        $("#SBtotalcounts").attr("title", "");
      }
      $("#SBcounts").html(
        `<span style="display:inline-block; padding-left:7px; padding-right:7px;">${_(
          "editorBars_textLength",
          {
            sep: "&ndash;",
            words: theTextTree
              .getText(textID)
              .words.toLocaleString(theLanguage),
            characters: theTextTree
              .getText(textID)
              .characters.toLocaleString(theLanguage),
            objects: theTextTree
              .getText(textID)
              .objectCount.toLocaleString(theLanguage),
          },
        )}</span>`,
      );
      $("#SBcounts").attr("title", _("editorBars_focusedTextTitle"));
    }
  }

  /**
   * show (activated) object names in status bar
   *
   * @param {Boolean} isClick true if causing event was a click, false on mouseenter
   * @param {String} classes
   */
  statusBarObjects(isClick, classes) {
    let settings = theSettings.effectiveSettings();
    if (
      (isClick && settings.objectsOnClick) ||
      (!isClick && settings.objectsOnOver)
    ) {
      let objects = [];
      classes.split(" ").forEach((cls) => {
        let m = cls.match(/^object(.*)-true$/);
        if (m && theObjectTree.isChecked(m[1])) {
          objects.push(m[1]);
        }
      });
      if (objects.length) {
        if (this.#objectStatusTimer) clearTimeout(this.#objectStatusTimer);
        $("#SBObjects").html(
          objects
            .map((id) => theObjectTree.objects[id].name)
            .join(" &nbsp;&bull;&nbsp; "),
        );
        $("#SBObjects").show();
        theObjectTree.selectSome(objects, true);
        this.#objectStatusTimer = setTimeout(
          () => $("#SBObjects").hide(),
          settings.objectsShowTime * 1000,
        );
      }
    }
  }

  /**
   * insert a unicode symbol at current cursor position
   *
   * @param {String} code
   */
  insertSymbol(code) {
    if (this.#selectedEditor) {
      let range = this.#editors[this.#selectedEditor].quill.getSelection();
      if (range.length) {
        this.#editors[this.#selectedEditor].quill.deleteText(
          range.index,
          range.length,
        );
      }
      this.#editors[this.#selectedEditor].quill.insertText(
        range.index,
        String.fromCodePoint(parseInt(code, 16)),
      );
    }
  }

  /**
   * initialize spelling correction by finding the correct indices into the text where spellchecking starts off and opening user dialog
   */
  startSpellcheck() {
    this.#spellcheckWatch = null;
    // start at currently selected editor
    let editorID = this.#selectedEditor;
    // or first editor if no editor is selected
    if (!editorID && this.#ids.length > 0) {
      editorID = this.#ids[0];
    }
    // do spellchecking only if we have an editor
    if (editorID) {
      let editorIndex = 0;
      while (
        this.#ids[editorIndex] != editorID &&
        editorIndex < this.#ids.length
      ) {
        editorIndex++;
      }
      if (editorIndex < this.#ids.length) {
        let quill = this.#editors[editorID].quill;
        let selection = quill.getSelection();
        if (!selection) {
          quill.setSelection(0, 0);
          selection = quill.getSelection();
        }
        let textlets = this.#getTextlets(editorID);
        // textlet count
        let textIndex = 0;
        // word count
        let wordIndex = 0;
        // character count of word
        let wordPos = textlets[textIndex].position;
        // split text at non-letter boundaries
        let words = textlets[textIndex].text.split(/(\P{L}+)/u);
        while (wordPos < selection.index + selection.length) {
          wordPos += words[wordIndex].length;
          wordIndex++;
          if (wordIndex >= words.length) {
            wordIndex = 0;
            textIndex++;
            wordPos = textlets[textIndex].position;
            words = textlets[textIndex].text.split(/(\P{L}+)/u);
          }
        }
        // save id of selected editor (possibly null), start editor id and start position
        this.#spellcheckWatch = {
          oldEditor: this.#selectedEditor,
          oldSelection: selection,
          startEditor: editorID,
          startTextIndex: textIndex,
          startWordIndex: wordIndex,
          firstEditor: false,
        };
        // open spelling correction dialog
        ipcRenderer.invoke("mainProcess_openWindow", [
          "spellcheck",
          true, // no closing behaviour besides closing ...
          true,
          600,
          300,
          _("windowTitles_spellingCorrectionWindow"),
          "./spellingCorrectionWindow/spellingCorrectionWindow.html",
          "spellingCorrectionWindow_init",
          null,
          [
            theSettings.effectiveSettings(),
            editorIndex,
            textIndex,
            wordIndex,
            wordPos,
          ],
        ]);
      }
    }
  }

  /**
   * end spelling correction by resetting appearance and cursor position
   */
  endSpellcheck() {
    let settings = theSettings.effectiveSettings();
    if (settings.spellCorrectionSelectionColor) {
      this.#selectionStyle(settings.selectionColor);
    }
    if (this.#spellcheckWatch.oldEditor && this.#spellcheckWatch.oldSelection) {
      if (this.#selectedEditor) {
        this.#editors[this.#selectedEditor].quill.setSelection(null);
      }
      let quill = this.#editors[this.#spellcheckWatch.oldEditor].quill;
      let selection = this.#spellcheckWatch.oldSelection;
      // set spellcheckWatch to null before selecting!
      this.#spellcheckWatch = null;
      quill.setSelection(selection);
      this.scrollToSelection();
    } else {
      this.#spellcheckWatch = null;
    }
  }

  /**
   * insert given word as correction of a misspelled word at current selection
   *
   * @param {Number} editorIndex
   * @param {String} word
   * @returns {Promise} resolves after possible correction animation has finished
   */
  changeMisspelledWord(editorIndex, word) {
    let editorID = this.#ids[editorIndex];
    // not possible to css animate ::selection pseudo, so do it programatically
    return new Promise((resolve) => {
      if (editorID) {
        let settings = theSettings.effectiveSettings();
        let quill = this.#editors[editorID].quill;
        let selection = quill.getSelection();
        if (selection) {
          let format = quill.getFormat();
          let promiseBeforeCorrection = new Promise((resolve) => resolve());
          if (settings.correctionBlinkBefore) {
            promiseBeforeCorrection = TextEditor.blinkSelection(
              quill,
              selection.index,
              selection.length,
              settings.correctionBlinkBefore,
              settings.correctionBlinkTime,
            );
          }
          promiseBeforeCorrection.then(() => {
            quill.deleteText(selection.index, selection.length);
            quill.insertText(selection.index, word);
            quill.setSelection(selection.index, word.length);
            Object.keys(format).forEach((key) => {
              quill.format(key, format[key]);
            });
            let promiseAfterCorrection = new Promise((resolve) => resolve());
            if (settings.correctionBlinkAfter) {
              promiseAfterCorrection = TextEditor.blinkSelection(
                quill,
                selection.index,
                word.length,
                settings.correctionBlinkAfter,
                settings.correctionBlinkTime,
              );
            }
            promiseAfterCorrection.then(() => resolve());
          });
        } else resolve();
      } else resolve();
    });
  }

  /**
   * go forward to the next word needing correction
   *
   * @param {Number} editorIndex
   * @param {Number} textIndex
   * @param {Number} wordIndex
   * @param {Number} wordPos
   */
  nextMisspelledWord(editorIndex, textIndex, wordIndex, wordPos) {
    let settings = theSettings.effectiveSettings();
    // this 'endless' loop ends by return statements (when either a misspelled word is found or we reach the point where spellchecking started)
    while (true) {
      let editorID = this.#ids[editorIndex];
      let textlets = this.#getTextlets(editorID);
      if (wordPos < 0) {
        wordPos = textlets[textIndex].position;
      }
      let words = textlets[textIndex].text.split(/(\P{L}+)/u);
      while (wordIndex < words.length) {
        let word = words[wordIndex];
        if (
          this.#spellcheckWatch.firstEditor &&
          this.#spellcheckWatch.startEditor == editorID &&
          this.#spellcheckWatch.startTextIndex <= textIndex &&
          this.#spellcheckWatch.startWordIndex <= wordIndex
        ) {
          ipcRenderer.invoke("mainProcess_spellCheckFinished");
          return;
        } else {
          if (word.match(/\p{L}+/u)) {
            if (!theSpellChecker.isCorrect(word)) {
              if (settings.spellCorrectionSelectionColor) {
                this.#selectionStyle(settings.spellCorrectionSelectionColor);
              }
              this.#editors[editorID].quill.setSelection(wordPos, word.length);
              // wait for setSelection to finish before scrolling there -- would be better to do this event based, say with a .once("set-selection"); but when the editor is changed there are two set-selection events fired, so we would have to do it with a .on("set-selection") followed by an .off("set-selection"), maybe later ...
              setTimeout(() => {
                this.scrollToSelection();
                // wait for scrollToSelection to finish before getting rectacle position
                setTimeout(() => {
                  let selectionRect = getSelection()
                    .getRangeAt(0)
                    .getClientRects()[0];
                  let list = theSpellChecker.suggest(word);
                  ipcRenderer.invoke("mainProcess_misspelledWord", [
                    settings.spellCorrectionMovingWindow,
                    parseInt(selectionRect.left),
                    parseInt(selectionRect.top),
                    parseInt(selectionRect.width),
                    parseInt(selectionRect.height),
                    editorIndex,
                    textIndex,
                    wordIndex + 1,
                    wordPos + word.length,
                    word,
                    list,
                  ]);
                }, 50);
              }, 150);
              return;
            }
          }
        }
        wordPos += word.length;
        wordIndex++;
      }
      wordIndex = 0;
      wordPos = -1;
      textIndex++;
      if (textIndex == textlets.length) {
        textIndex = 0;
        if (editorIndex < this.#ids.length - 1) {
          editorIndex++;
        } else {
          editorIndex = 0;
          // we reached the last editor and restart at top
          this.#spellcheckWatch.firstEditor = true;
        }
      }
    }
  }

  /**
   * set an image's parameter
   *
   * @param {String} id
   * @param {Number} index
   * @param {Number} width
   * @param {Number} height
   * @param {String} title
   * @param {String} alignment
   * @param {Boolean} shadow
   */
  setImage(id, index, width, height, title, alignment, shadow) {
    this.#editors[id].quill.formatText(index, 1, {
      width: width,
      height: height,
      title: title,
      alignment: alignment,
      shadow: shadow,
    });
  }

  /**
   * split the focused text at the cursor position
   */
  splitText() {
    if (this.#selectedEditor) {
      let quill = this.#editors[this.#selectedEditor].quill;
      let selection = quill.getSelection();
      if (selection) {
        theTextTree.splitText(
          this.#selectedEditor,
          quill.getContents(0, selection.index + selection.length).ops,
          quill.getContents(
            selection.index + selection.length,
            quill.getLength(),
          ).ops,
        );
      }
    }
  }

  /**
   * let the editor with given id blink by css animation
   *
   * @param {String} id
   */
  blinkText(id) {
    this.showText(id, true);
    $(`#edi${id}`).addClass("blinkEditor");
    $(".blinkEditor").on("animationend", () =>
      $(`#edi${id}`).removeClass("blinkEditor"),
    );
  }

  /**
   * bring editor with given id into view
   * if this is a locked editor we must temporarily enable it to enable "setSelection"
   *
   * @param {String} id
   * @param {Boolean} top if true scroll to start of text, else end of text
   */
  showText(id, top) {
    let locked = !theTextTree.getText(id).editable;
    if (locked) this.#editors[id].quill.enable(true);
    this.#editors[id].quill.setSelection(
      top ? 0 : this.#editors[id].quill.getLength(),
      0,
      "silent",
    );
    this.scrollToSelection(top ? 0 : 1);
    if (locked) this.#editors[id].quill.enable(false);
  }

  /**
   * select all text in editor with given id
   *
   * @param {String} id
   */
  selectText(id) {
    this.#editors[id].quill.setSelection(
      0,
      this.#editors[id].quill.getLength(),
    );
    this.scrollToSelection(0);
  }

  /**
   * update text from focus editor window
   *
   * @param {String} id
   * @param {Object[]} ops delta
   */
  updateText(id, ops) {
    this.#editors[id].quill.setContents(ops, "api");
  }

  // private methods

  /**
   * handle zooming by wheel / pinch
   * ctrl is set for wheel/pinch actions to tell apart from scrolling (thus scrolling with ctrl is like wheel/pinch)
   * but we must take some measures to prevent pressing control button directly after scrolling is being taken as zoom event
   * because later incoming wheel events that are already dispatched have event.ctrlKey==true once the control key is pressed
   * so event.ctrlKey is only evaluated when a wheel event series starts and not on every such event
   *
   * @param {Event} event
   */
  #zoom(event) {
    if (this.#wheelTimer) {
      clearTimeout(this.#wheelTimer);
    }
    this.#wheelTimer = setTimeout(() => {
      this.#isWheeling = false;
      this.#isZooming = false;
    }, 100);
    if (!this.#isWheeling) {
      this.#isWheeling = true;
      this.#isZooming = event.ctrlKey;
    }
    if (this.#isZooming) {
      event.preventDefault();
      let scale = parseInt($("#zoomSelector").val());
      scale -= event.deltaY;
      if (scale < 0) {
        scale = 0;
      }
      if (scale > 160) {
        scale = 160;
      }
      $("#zoomSelector").val(scale);
      theLayout.zoomValue = $("#zoomSelector").val();
      $("#zoomValue").html(Util.scaledZoom($("#zoomSelector").val()) + "%");
      $(":root").css({
        "--first-line-indent": `${
          (theSettings.effectiveSettings().firstLineIndent *
            Util.scaledZoom($("#zoomSelector").val())) /
          100
        }px`,
      });
      theObjectTree.buildObjectSheet();
    }
  }

  /**
   * set the editor's selection style
   *
   * @param {String} selColor
   */
  #selectionStyle(selColor) {
    $(":root").css({
      "--selection-foregroundColor": Util.blackOrWhite(selColor),
      "--selection-backgroundColor": selColor,
    });
  }

  /**
   * timer to wait for all text savings being finished
   * @static
   *
   * @param {Object} timeouts
   * @param {*} resolve
   */
  static #allEditorsSavedTimer(timeouts, resolve) {
    if (Object.keys(timeouts).length == 0) {
      resolve("saved");
    } else {
      setTimeout(TextEditor.#allEditorsSavedTimer, 250, timeouts, resolve);
    }
  }

  /**
   *
   * @param {*} textID
   * @param {*} sel
   */
  #paste(textID, sel) {
    let settings = theSettings.effectiveSettings();
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
                  this.#editors[textID].quill.deleteText(sel.index, sel.length);
                  this.#editors[textID].quill.insertEmbed(
                    sel.index,
                    "image",
                    reader.result +
                      " " +
                      settings.imageWidth +
                      " " +
                      settings.imageHeight,
                  );
                  this.#editors[textID].quill.formatText(sel.index, 1, {
                    title: "",
                    alignment: settings.imageAlignment,
                    shadow: settings.imageShadow,
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
            this.#editors[textID].quill.deleteText(sel.index, sel.length);
            this.#editors[textID].quill.insertText(sel.index, clipText);
          });
        }
      }
    });
  }

  /**
   * create new quill in editor div with given id
   *
   * @param {String} textID
   * @returns {Quill}
   */
  #createQuill(textID) {
    let quill = new Quill(`#edi${textID}`, QuillConfig.config);
    quill.setContents(theTextTree.getText(textID).delta);

    // DOM dragstart, copy and cut handlers: if we are taking chunks out of the text we must take care of all objects the text chunk is associated with
    $(`#edi${textID}`).on("dragstart copy cut", (event) => {
      let fragment = document.getSelection().getRangeAt(0).cloneContents();
      let tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment.cloneNode(true));
      let html = tempDiv.innerHTML;
      // if no children we took out text only; but this does not mean the text has no objects associated with, so we need to check carefully and build html explicitly
      if (fragment.childElementCount == 0) {
        let classes = [];
        Object.keys(this.#editors[textID].quill.getFormat()).forEach(
          (format) => {
            if (format.startsWith("object")) {
              classes.push(format + "-true");
            }
          },
        );
        if (classes.length) {
          html = `<span class="${classes.join(" ")}">${html}</span>`;
        }
      }
      if (event.type == "dragstart") {
        // no drag from locked texts
        if (!theTextTree.getText(textID).editable) {
          return false;
        }
        event.originalEvent.dataTransfer.setData("text/html", html);
        event.originalEvent.dataTransfer.setData("text/quill", html);
        // continue standard drag
        return true;
      } else {
        event.originalEvent.clipboardData.setData("text/html", html);
        event.originalEvent.clipboardData.setData("text/quill", html);
        event.originalEvent.clipboardData.setData(
          "text/plain",
          tempDiv.textContent,
        );
        if (event.type == "cut") {
          document.getSelection().deleteFromDocument();
        }
        // no standard copy/cut
        event.preventDefault();
      }
    });

    // DOM drop handler
    $(`#edi${textID}`).on("drop", (event) => {
      let range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (
        range.startContainer &&
        range.startContainer.nodeType == Node.TEXT_NODE
      ) {
        let splitNode = range.startContainer.splitText(range.startOffset);
        // if we are not dropping from another quill editor or are requesting unformatted insert by alt key, then insert plain text
        if (
          !event.originalEvent.dataTransfer.types.includes("text/quill") ||
          event.altKey
        ) {
          range.startContainer.splitText(range.startOffset);
          range.startContainer.nodeValue =
            range.startContainer.nodeValue +
            event.originalEvent.dataTransfer.getData("text/plain");
        } else {
          let spanNode = document.createElement("span");
          spanNode.insertAdjacentHTML(
            "afterbegin",
            event.originalEvent.dataTransfer.getData("text/quill"),
          );
          range.startContainer.parentNode.insertBefore(spanNode, splitNode);
        }
        if (!event.ctrlKey) {
          document.getSelection().deleteFromDocument();
        }
        event.preventDefault();
      } else {
        return true;
      }
    });

    // DOM paste handler
    $(`#edi${textID}`).on("paste", (event) => {
      // if we are not pasting from within, then insert plain text to avoid pasting unwanted html tags and styles
      if (!event.originalEvent.clipboardData.types.includes("text/quill")) {
        event.preventDefault();
        let range = this.#editors[textID].quill.getSelection(true);
        if (range) {
          this.#paste(textID, range);
        }
      }
    });

    // DOM focus handler
    $(`#edi${textID} .ql-editor`).on("focus", (event) => {
      if (this.#selectionChangeTimers[textID]) {
        clearTimeout(this.#selectionChangeTimers[textID]);
      }
      this.#selectionChangeTimers[textID] = setTimeout(
        TextEditor.updateSelection,
        100,
        this,
        quill.getSelection(),
        textID,
      );
    });

    // Quill selection change handler
    quill.on("selection-change", (range, oldRange, source) => {
      if (this.#selectionChangeTimers[textID]) {
        clearTimeout(this.#selectionChangeTimers[textID]);
      }
      this.#selectionChangeTimers[textID] = setTimeout(
        TextEditor.updateSelection,
        100,
        this,
        range,
        textID,
      );
    });

    // Quill change handler
    quill.on("text-change", (changeDelta, oldDelta, source) => {
      if (!theTextTree.getText(textID).editable) {
        console.log("text-change in locked text", textID, changeDelta);
      }
      if (this.#doChangeHandler) {
        this.#editors[textID].changed = new Timestamp();
        // clear a timer that might be running for this text
        if (this.#textChangeTimers[textID]) {
          clearTimeout(this.#textChangeTimers[textID]);
        }
        // and set a new one
        this.#textChangeTimers[textID] = setTimeout(
          TextEditor.updateTextTreeAndObjectReference,
          500,
          this,
          textID,
        );
      }
    });

    return quill;
  }

  /**
   * define the context menu of an editor
   *
   * @param {String} textID
   * @param {Event} event
   * @returns {Object}
   */
  #contextMenu(textID, event) {
    let settings = theSettings.effectiveSettings();
    let menuItems = {};
    let items = menuItems;
    let infoPre = `<span class="preWrap" style="font-style:italic">`;
    let infoPost = `</span>`;
    let ellip = "&middot; &middot; &middot;";
    let citeLen = 15;
    let sep = `<span style="font-weight:bold; padding:0 11px 0 8px; font-size:22px; line-height:0">&#x21cb;</span>`;
    let compact = settings.editorCompactContextMenu;

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
              "main",
              textID,
              this.#editors[textID].quill.getIndex(Quill.find(event.target)),
              event.target.src,
              specs,
            ],
          ]);
        },
      };
      items.select = {
        name: _("editorContextMenu_selectImage"),
        callback: () => {
          this.#editors[textID].quill.setSelection(
            this.#editors[textID].quill.getIndex(Quill.find(event.target)),
            1,
          );
          this.scrollToSelection();
        },
      };
      return {
        items: items,
      };
    }

    // on regular text
    let len = this.#editors[textID].quill.getLength();
    let sel = this.#editors[textID].quill.getSelection();
    let selDelta = this.#editors[textID].quill.getContents(
      sel.index,
      sel.length,
    );
    let selText = this.#editors[textID].quill.getText(sel.index, sel.length);
    let [charCount, wordCount, objects] = StyledText.countCharsWordsObjects(
      selDelta.ops,
    );

    // info part
    if (compact) {
      menuItems.infoMenu = {
        name: _("editorContextMenu_infoMenu"),
        icon: "fas fa-circle-info",
        items: {},
      };
      items = menuItems.infoMenu.items;
    }
    items.name = {
      isHtmlName: true,
      name:
        infoPre + Util.escapeHTML(theTextTree.getText(textID).name) + infoPost,
    };
    if (!compact) {
      items.name.icon = "fas fa-circle-info";
    }

    if (settings.editorContextMenuStats) {
      let text = theTextTree.getText(textID);
      items.stats = {
        isHtmlName: true,
        name: `${infoPre}${_("editorContextMenu_words", text.words, {
          words: text.words.toLocaleString(theLanguage),
        })} &ndash; ${_("editorContextMenu_characters", text.characters, {
          characters: text.characters.toLocaleString(theLanguage),
        })} &ndash; ${_("editorContextMenu_objects", text.objectCount, {
          objects: text.objectCount.toLocaleString(theLanguage),
        })}${infoPost}`,
      };
    }

    if (settings.editorContextMenuTime == "compactTime") {
      let text = theTextTree.getText(textID);
      items.time = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_timestamps", {
            created: text.created.toLocalString(settings.dateTimeFormatShort),
            changed: text.changed.toLocalString(settings.dateTimeFormatShort),
          }) +
          infoPost,
      };
    }
    if (settings.editorContextMenuTime == "fullTime") {
      let text = theTextTree.getText(textID);
      items.created = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_created", {
            created: text.created.toLocalString(settings.dateTimeFormatShort),
            relative: text.created.timeToNow(),
          }) +
          infoPost,
      };
      items.changed = {
        isHtmlName: true,
        name:
          infoPre +
          _("editorContextMenu_changed", {
            changed: text.changed.toLocalString(settings.dateTimeFormatShort),
            relative: text.changed.timeToNow(),
          }) +
          infoPost,
      };
    }

    if (sel.length) {
      items.select = {
        isHtmlName: true,
        name: `${infoPre}${_("editorContextMenu_selection")}${_(
          "editorContextMenu_words",
          wordCount,
          {
            words: wordCount.toLocaleString(theLanguage),
          },
        )} &ndash; ${_("editorContextMenu_characters", charCount, {
          characters: charCount.toLocaleString(theLanguage),
        })} &ndash; ${_("editorContextMenu_objects", objects.length, {
          objects: objects.length.toLocaleString(theLanguage),
        })}${infoPost}`,
      };
    }

    // formats
    if (settings.editorContextMenuFormat) {
      if (compact) {
        menuItems.formatMenu = {
          name: _("editorContextMenu_formatMenu"),
          icon: "fas fa-font",
          items: {},
        };
        items = menuItems.formatMenu.items;
      } else {
        items.sepFormat = "x";
      }
      let format = this.#editors[textID].quill.getFormat();
      items.formatBold = {
        name: _("editorContextMenu_bold"),
        isHtmlName: true,
        icon: "bold" in format ? "fas fa-check" : null,
        callback: () => {
          $("#formatBold").prop("checked", !("bold" in format));
          this.#editors[textID].quill.format("bold", !("bold" in format));
        },
      };
      items.formatItalic = {
        name: _("editorContextMenu_italic"),
        isHtmlName: true,
        icon: "italic" in format ? "fas fa-check" : null,
        callback: () => {
          $("#formatItalic").prop("checked", !("italic" in format));
          this.#editors[textID].quill.format("italic", !("italic" in format));
        },
      };
      items.formatUnderline = {
        name: _("editorContextMenu_underline"),
        isHtmlName: true,
        icon: "underline" in format ? "fas fa-check" : null,
        callback: () => {
          $("#formatUnderline").prop("checked", !("underline" in format));
          this.#editors[textID].quill.format(
            "underline",
            !("underline" in format),
          );
        },
      };
      items.formatStrike = {
        name: _("editorContextMenu_strike"),
        isHtmlName: true,
        icon: "strike" in format ? "fas fa-check" : null,
        callback: () => {
          $("#formatStrike").prop("checked", !("strike" in format));
          this.#editors[textID].quill.format("strike", !("strike" in format));
        },
      };
    }

    // copy, cut, paste part
    if (compact) {
      menuItems.ccpMenu = {
        name: _("editorContextMenu_editMenu"),
        icon: "fas fa-clipboard",
        items: {},
      };
      items = menuItems.ccpMenu.items;
    } else {
      items.sepCCP = "x";
    }
    if (sel.length) {
      items.copy = {
        name: _("editorContextMenu_copy"),
        callback: function () {
          // execCommand should be avoided
          document.execCommand("copy");
        },
      };
      if (!compact) {
        items.copy.icon = "fas fa-clipboard";
      }
      items.cut = {
        name: _("editorContextMenu_cut"),
        callback: function () {
          // execCommand should be avoided but clipboard.write fails on delta data (?)
          document.execCommand("cut");
          // this.#editors[textID].quill.deleteText(sel.index,sel.length);
          // navigator.clipboard.write([selDelta]);
        },
      };
    }
    items.paste = {
      name: _("editorContextMenu_paste"),
      callback: () => {
        this.#paste(textID, sel);
      },
    };
    if (!compact && !sel.length) {
      items.paste.icon = "fas fa-paste";
    }
    items.pasteText = {
      name: _("editorContextMenu_pasteText"),
      callback: () => {
        navigator.clipboard.readText().then((clipText) => {
          this.#editors[textID].quill.deleteText(sel.index, sel.length);
          this.#editors[textID].quill.insertText(sel.index, clipText);
        });
      },
    };
    items.pastePlain = {
      name: _("editorContextMenu_pastePlain"),
      callback: () => {
        navigator.clipboard.readText().then((clipText) => {
          this.#editors[textID].quill.deleteText(sel.index, sel.length);
          this.#editors[textID].quill.insertText(sel.index, clipText);
          this.#editors[textID].quill.removeFormat(sel.index, clipText.length);
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
                this.#editors[textID].quill.deleteText(sel.index, sel.length);
                this.#editors[textID].quill.insertEmbed(
                  sel.index,
                  "image",
                  reader.result +
                    " " +
                    settings.imageWidth +
                    " " +
                    settings.imageHeight,
                );
                this.#editors[textID].quill.formatText(sel.index, 1, {
                  title: path,
                  alignment: settings.imageAlignment,
                  shadow: settings.imageShadow,
                });
              };
            }
          });
      },
    };

    // edit part
    if (compact) {
      menuItems.editMenu = {
        name: _("editorContextMenu_changeMenu"),
        icon: "fas fa-i-cursor",
        items: {},
      };
      items = menuItems.editMenu.items;
    } else {
      items.sepEdit = "x";
    }
    items.focus = {
      name: _("editorContextMenu_focusEditor"),
      callback: () => {
        ipcRenderer.invoke("mainProcess_distractionFreeMode", [
          settings,
          theLayout.zoomValue,
          [
            {
              id: textID,
              created: theTextTree.getText(textID).created.epochSeconds,
              changed: theTextTree.getText(textID).changed.epochSeconds,
              name: theTextTree.getText(textID).name,
              editable: true,
              delta: this.#editors[textID].quill.getContents(),
            },
          ],
          theObjectTree.getCheckInfo().reduce(function (result, item) {
            result[item.id] = {
              name: theObjectTree.getObject(item.id).name,
              style: theObjectTree.getObject(item.id).styleProperties,
              checked: item.checked,
            };
            return result;
          }, {}),
          theFormats.formats,
          theFonts.availableFamilies,
        ]);
      },
    };
    if (!compact) {
      items.focus.icon = "fas fa-arrow-up-right-from-square";
    }
    items.lock = {
      name: _("editorContextMenu_lock"),
      callback: function () {
        theTextTree.getText(textID).editable = false;
        theTextEditor.setEditable(textID);
        theTextTree.updateName(textID);
        if (theTextCollection) {
          theTextCollection.updateNode(textID);
        }
      },
    };
    if (!compact) {
      items.lock.icon = "fas fa-lock";
    }
    if (!settings.autoSelectTreeItem) {
      items.select = {
        name: _("editorContextMenu_reveal"),
        callback: () => {
          theTextTree.selectSome(textID, true);
        },
      };
    }
    if (selText.trim().length) {
      items.deriveName = {
        name: _("editorContextMenu_deriveName"),
        callback: function () {
          theTextTree.updateName(textID, selText.trim());
          if (theTextCollection) {
            theTextCollection.updateNode(textID);
          }
        },
      };
    } else if (
      !theTextCollectionTree.isActive() &&
      sel.index > 0 &&
      sel.index < len - 1
    ) {
      // offer a text split only if full text tree is shown, not on a (flat) text collection and not on the start or end position of a text
      items.splitSep = "x";
      items.split = {
        isHtmlName: true,
        name: `${_("editorContextMenu_split")}<br><em>${
          sel.index > citeLen ? `${ellip} ` : ""
        }${this.#editors[textID].quill.getText(
          sel.index > citeLen ? sel.index - citeLen : 0,
          sel.index > citeLen ? citeLen : sel.index,
        )}${sep}${this.#editors[textID].quill.getText(
          sel.index,
          sel.index < len - citeLen ? citeLen : len - sel.index,
        )}${sel.index < len - citeLen ? ` ${ellip}` : ""}</em>`,
        callback: function () {
          theTextEditor.splitText();
        },
      };
      if (!compact) {
        items.split.icon = "fas fa-scissors";
      }
    }

    // object add/remove part
    if (sel.length && (theObjectTree.getChecked().length || objects.length)) {
      if (compact) {
        menuItems.object1Menu = {
          name: _("editorContextMenu_editObjectsMenu"),
          icon: "fas fa-link",
          items: {},
        };
        items = menuItems.object1Menu.items;
      } else {
        items.sepObject1 = "x";
      }
      if (theObjectTree.getChecked().length) {
        items.setObjects = {
          name: _(
            "editorContextMenu_addObjects",
            theObjectTree.getChecked().length,
          ),
          callback: function () {
            theTextEditor.markCheckedObjects();
          },
        };
        if (!compact) {
          items.setObjects.icon = "fas fa-link";
        }
        items.unsetObjects = {
          name: _(
            "editorContextMenu_removeObjects",
            theObjectTree.getChecked().length,
          ),
          callback: function () {
            theTextEditor.markCheckedObjects(false);
          },
        };
      }
      if (objects.length) {
        items.removeObjects = {
          name: _("editorContextMenu_removeAllObjects", objects.length),
          callback: function () {
            theTextEditor.unmarkAllObjects();
          },
        };
        objects.forEach((object) => {
          items["unlink_" + object] = {
            name: _("editorContextMenu_removeObject", {
              name: theObjectTree.getObject(object).name,
            }),
            className: "context-menu-overflow",
            callback: function () {
              theTextEditor.unmarkObject(object);
            },
          };
        });
      }
    }

    // object de/activate part
    if (sel.length && objects.length) {
      if (compact) {
        menuItems.object2Menu = {
          name: _("editorContextMenu_changeObjectsMenu"),
          icon: "fas fa-check",
          items: {},
        };
        items = menuItems.object2Menu.items;
      } else {
        items.sepObject2 = "x";
      }
      // activate only the objects found in selection
      items.activateObjectsOnly = {
        name: _("editorContextMenu_activateExactly", objects.length),
        callback: function () {
          theObjectTree.uncheckAll();
          theObjectTree.checkSome(objects);
        },
      };
      if (!compact) {
        items.activateObjectsOnly.icon = "fas fa-check";
      }
      if (objects.length > 1) {
        // activate all objects found in selection
        items.activateObjects = {
          name: _("editorContextMenu_activate"),
          callback: function () {
            theObjectTree.checkSome(objects);
          },
        };
        // deactivate all objects found in selection
        items.deactivateObjects = {
          name: _("editorContextMenu_deactivate"),
          callback: function () {
            theObjectTree.uncheckSome(objects);
          },
        };
      }
      objects.forEach((object) => {
        items["check_" + object] = {
          id: object,
          checked: theObjectTree.isChecked(object),
          name: theObjectTree.getObject(object).name,
          type: "checkclick",
          className: "context-menu-input context-menu-overflow",
        };
      });
    }

    // web tools part
    if (selText.trim() != "") {
      let webtools = {};
      settings.editorContextMenuWeb.split(/\n+/).forEach((entry) => {
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
        if (compact) {
          menuItems.toolsMenu = {
            name: _("editorContextMenu_toolsMenu"),
            icon: "fas fa-globe",
            items: webtools,
          };
        } else {
          items.sepTools = "x";
          webtools[Object.keys(webtools)[0]].icon = "fas fa-globe";
          menuItems = { ...menuItems, ...webtools };
        }
      }
    }

    return {
      items: menuItems,
    };
  }

  /**
   * check if search text is valid (either not regex mode or valid regex expression)
   *
   * @returns {Boolean}
   */
  #checkSearchRegex() {
    $("#searchText").css("background-color", "#00000000");
    $("#searchText").parent().parent().removeAttr("title");
    if ($("#searchRegex").prop("checked")) {
      try {
        RegExp(Util.escapeRegExpSearch($("#searchText").val()));
        return true;
      } catch (err) {
        $("#searchText").css("background-color", "#ff000040");
        $("#searchText")
          .parent()
          .parent()
          .attr("title", _("editorBars_regexError"));
        $("#searchCount").text(_("editorBars_noSearchResults"));
        return false;
      }
    }
    return true;
  }

  /**
   * set search related ui elements
   */
  #adjustSearch() {
    if (this.#doAdjustSearch) {
      $("#searchCount").text(_("editorBars_noSearchResults"));
      $("#searchPrev").prop("disabled", true);
      $("#searchNext").prop("disabled", true);
      $("#replaceNext").prop("disabled", true);
      $("#replaceAll").prop("disabled", true);
      if ($("#searchText").val() != "") {
        this.#findSearchPositions(
          $("#searchText").val(),
          $("#searchCase").prop("checked"),
          $("#searchWord").prop("checked"),
          $("#searchRegex").prop("checked"),
        );
        $("#searchCount").text(`?/${this.#countSearchPositions()}`);
        $("#searchPrev").prop("disabled", false);
        $("#searchNext").prop("disabled", false);
        $("#replaceNext").prop("disabled", false);
        $("#replaceAll").prop("disabled", false);
      }
    }
  }

  /**
   * get index of the given found element in the editor with given id
   *
   * @param {String} editorID
   * @param {Object} found
   * @returns {Number}
   */
  #getSearchPosition(editorID, found) {
    let index = 0;
    for (let i = 0; i < this.#ids.length; i++) {
      if (this.#ids[i] != editorID) {
        index += this.#searchPositions[this.#ids[i]].length;
      } else {
        return index + this.#searchPositions[this.#ids[i]].indexOf(found) + 1;
      }
    }
    return 0;
  }

  //
  /**
   * count search positions (number of search results in all editors)
   *
   * @param {Boolean} skipLocked if true don't count locked text
   * @returns {Number}
   */
  #countSearchPositions(skipLocked = false) {
    let count = 0;
    for (let [id, positions] of Object.entries(this.#searchPositions)) {
      if (!skipLocked || theTextTree.getText(id).editable) {
        count += positions.length;
      }
    }
    return count;
  }

  /**
   * split an editors content into text chunks (ignoring images and other non text stuff)
   *
   * @param {String} editorID
   * @returns {Object[]}
   */
  #getTextlets(editorID) {
    let textlets = [];
    let position = 0;
    let textlet = "";
    this.#editors[editorID].quill.getContents().ops.forEach((op) => {
      if (typeof op.insert == "string") {
        textlet += op.insert;
      } else {
        textlets.push({ position: position, text: textlet });
        position += textlet.length + 1; // +1 for image etc
        textlet = "";
      }
    });
    textlets.push({ position: position, text: textlet });
    return textlets;
  }

  /**
   * find search positions -- this is called whenever the search paramaters or the Editor changes
   * search policy regarding images: images break a text (break quill content into textlets around images and search only within the textlets), i.e. searching for "xx" in "abc x<image>x def" would not find anything (thus no replacement either) but would find it in "abc xx<image> def" (replacing to "abc yyy<i> def")
   *
   * @param {String} searchFor
   * @param {Boolean} doCase
   * @param {Boolean} doWord
   * @param {Boolean} doRegex
   */
  #findSearchPositions(searchFor, doCase, doWord, doRegex) {
    let rex = RegExp(
      `${doWord ? "(^|\\P{L})(" : ""}${
        doRegex
          ? Util.escapeRegExpSearch(searchFor)
          : Util.escapeRegExp(searchFor)
      }${doWord ? ")\\P{L}" : ""}`,
      `udg${doCase ? "" : "i"}`,
    );
    let res;
    this.#searchPositions = {};
    this.#ids.forEach((editorID) => {
      this.#searchPositions[editorID] = [];
      this.#getTextlets(editorID).forEach((textlet) => {
        rex.lastIndex = 0;
        while ((res = rex.exec(textlet.text))) {
          this.#searchPositions[editorID].push({
            index: doWord
              ? res.indices[2][0] + textlet.position
              : res.index + textlet.position,
            length: doWord
              ? res.indices[2][1] - res.indices[2][0]
              : res[0].length,
          });
          rex.lastIndex = res.index + 1;
        }
      });
    });
  }

  /**
   * do a search (i.e. advance to next or prev search position based on this.#searchPositions)
   *
   * @param {Boolean} goDown
   * @param {Boolean} overlapSelection
   */
  #search(goDown = true, overlapSelection = true) {
    if (this.#ids.length && this.#countSearchPositions()) {
      let editorIndex = 0;
      let selected = theTextCollection
        ? theTextCollection.singleSelected()
        : theTextTree.singleSelected();
      if (selected) {
        while (this.#ids[editorIndex] != selected) {
          editorIndex++;
        }
      }
      let quill = this.#editors[this.#ids[editorIndex]].quill;
      let selection = quill.getSelection();
      if (!selection) {
        selection = { index: 0, length: 0 };
      }
      let found = null;
      while (!found) {
        // go down
        if (goDown) {
          let i = 0;
          let selPos =
            selection.index +
            (selection.length ? (overlapSelection ? 1 : selection.length) : 0);
          let ediPos = this.#searchPositions[this.#ids[editorIndex]];
          for (; i < ediPos.length && ediPos[i].index < selPos; i++) {}
          if (i >= ediPos.length) {
            // next editor
            editorIndex++;
            if (editorIndex >= this.#ids.length) {
              editorIndex = 0;
            }
            selection = { index: 0, length: 0 };
          } else {
            found = ediPos[i];
          }
        }
        // go up
        else {
          let ediPos = this.#searchPositions[this.#ids[editorIndex]];
          let i = ediPos.length - 1;
          for (; i >= 0 && ediPos[i].index >= selection.index; i--) {}
          if (i < 0) {
            // prev editor
            editorIndex--;
            if (editorIndex < 0) {
              editorIndex = this.#ids.length - 1;
            }
            selection = {
              index:
                this.#editors[this.#ids[editorIndex]].quill.getText().length,
              length: 0,
            };
          } else {
            found = ediPos[i];
          }
        }
      }
      // found it
      this.#editors[this.#ids[editorIndex]].quill.setSelection(
        found.index,
        found.length,
      );
      this.scrollToSelection();
      $("#searchCount").html(
        `${this.#getSearchPosition(
          this.#ids[editorIndex],
          found,
        )}/${this.#countSearchPositions()}`,
      );
    }
  }

  /**
   * replace next position
   */
  #replaceNext() {
    if (this.#ids.length) {
      let editorIndex = 0;
      if (theTextTree.singleSelected()) {
        while (this.#ids[editorIndex] != theTextTree.singleSelected()) {
          editorIndex++;
        }
      }
      let quill = this.#editors[this.#ids[editorIndex]].quill;
      let selection = quill.getSelection();
      let mustSearch = true;
      if (selection) {
        let pos = this.#searchPositions[this.#ids[editorIndex]];
        for (
          let i = 0;
          i < pos.length && pos[i].index <= selection.index;
          i++
        ) {
          if (
            pos[i].index == selection.index &&
            pos[i].length == selection.length
          ) {
            mustSearch = false;
          }
        }
      }
      if (mustSearch) {
        this.#search();
      } else {
        let promiseBeforeReplace = new Promise((resolve) => resolve());
        if (theSettings.effectiveSettings().replaceBlinkBefore) {
          promiseBeforeReplace = TextEditor.blinkSelection(
            quill,
            selection.index,
            selection.length,
            theSettings.effectiveSettings().replaceBlinkBefore,
            theSettings.effectiveSettings().replaceBlinkTime,
          );
        }
        promiseBeforeReplace.then(() => {
          // source "user" prevents changes in locked texts
          quill.deleteText(selection.index, selection.length, "user");
          if ($("#replaceText").val()) {
            // source "user" prevents changes in locked texts
            let delta = quill.insertText(
              selection.index,
              $("#replaceText").val(),
              "user",
            );
            if (delta.ops.length) {
              quill.setSelection(
                selection.index,
                $("#replaceText").val().length,
              );
              let promiseAfterReplace = new Promise((resolve) => resolve());
              if (theSettings.effectiveSettings().replaceBlinkAfter) {
                promiseAfterReplace = TextEditor.blinkSelection(
                  quill,
                  selection.index,
                  $("#replaceText").val().length,
                  theSettings.effectiveSettings().replaceBlinkAfter,
                  theSettings.effectiveSettings().replaceBlinkTime,
                );
              }
              // finally do a non overlapping search, so that if e.g. "xx" is
              // replaced by "xxx", the search doesn't end in the replaced text
              promiseAfterReplace.then(() => {
                this.#adjustSearch();
                this.#search(true, false);
              });
            } else {
              this.#adjustSearch();
              this.#search(true, false);
            }
          }
        });
      }
    }
  }

  /**
   * replace all found positions (in non-locked texts)
   */
  #replaceAll() {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
    this.#doAdjustSearch = false;
    this.#ids.forEach((editorID) => {
      if (theTextTree.getText(editorID).editable) {
        let ops = [];
        let pos = 0;
        let quill = this.#editors[editorID].quill;
        this.#searchPositions[editorID].forEach((position) => {
          if (position.index - pos >= 0) {
            let format = quill.getFormat(position.index, position.length);
            if (position.index - pos > 0) {
              ops.push({ retain: position.index - pos });
            }
            ops.push({ delete: position.length });
            ops.push({ insert: $("#replaceText").val(), attributes: format });
            pos = position.index + position.length;
          }
        });
        quill.updateContents(new Delta(ops));
      }
    });
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
    this.allEditorsSaved().then(() => {
      this.#doAdjustSearch = true;
      this.#adjustSearch();
    });
  }
}
