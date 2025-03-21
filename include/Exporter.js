/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Exporter class
 */

/**
 * @classdesc Exporter combines all functionality to export a project's information to common formats like RTF
 */

class Exporter {
  /**
   * escape string for rtf
   * @static
   *
   * @param {String} string The string to escape
   * @return {String} escaped string
   */
  static #escapeRTF(string) {
    if (typeof string != "string") {
      return string;
    }
    let rtfString = "";
    for (let char of string
      .replace(/\\/g, "\\\\")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}")) {
      let cp = char.codePointAt(0);
      switch (true) {
        case cp < 128:
          rtfString += char;
          break;
        case cp < 65536:
          rtfString += `\\u${cp < 32768 ? cp : cp - 65536}?`;
          break;
        default:
          rtfString += "?";
          break;
      }
    }

    return rtfString;
  }

  /**
   * helper methods
   */
  static #escapeUncookedHTML(x) {
    return x.isCooked ? x.insert : Util.escapeHTML(x.insert);
  }
  static #escapeUncookedRTF(x) {
    return x.isCooked ? x.insert : Exporter.#escapeRTF(x.insert);
  }

  /**
   * strings for drawing rtf tables
   * @static
   */
  static #rtfBorder = `\\clbrdrt\\brdrs\\brdrw1\\brdrcf0\\clbrdrr\\brdrs\\brdrw1\\brdrcf0\\clbrdrl\\brdrs\\brdrw1\\brdrcf0\\clbrdrb\\brdrs\\brdrw1\\brdrcf0`;
  static #rtfRow = `\\trowd\\trpaddb50\\trpaddt50\\trpaddl50\\trpaddr50`;

  /**
   * document level placeholders
   */
  static #documentPlaceholders = {
    // document title
    projectTitlePlaceholder: {
      function: () => {
        return { insert: theProperties.title };
      },
    },
    // document subtitle
    projectSubtitlePlaceholder: {
      function: () => {
        return { insert: theProperties.subtitle };
      },
    },
    // document author
    projectAuthorPlaceholder: {
      function: () => {
        return { insert: theProperties.author };
      },
    },
    // document infos (multiple paragraphs)
    projectInfoPlaceholder: {
      function: (exportType) => {
        switch (exportType) {
          case "txt":
            return { insert: theProperties.info };
            break;
          case "html":
            return {
              insert: Util.escapeHTML(theProperties.info)
                .split("\n")
                .join("<br>"),
              isCooked: true,
            };
            break;
          case "rtf":
            return {
              insert: Exporter.#escapeRTF(theProperties.info)
                .split("\n")
                .join("\\line "),
              isCooked: true,
            };
            break;
        }
      },
    },
    // creation time
    projectCreatedPlaceholder: {
      function: () => {
        return {
          insert: theProject.created
            ? theProject.created.toLocalString(
                theSettings.effectiveSettings().dateTimeFormatLong,
              )
            : "---",
        };
      },
    },
    // last changed time
    projectChangedPlaceholder: {
      function: () => {
        return {
          insert: theProject.changed
            ? theProject.changed.toLocalString(
                theSettings.effectiveSettings().dateTimeFormatLong,
              )
            : "---",
        };
      },
    },
    // current time
    projectNowPlaceholder: {
      function: () => {
        return {
          insert: new Timestamp().toLocalString(
            theSettings.effectiveSettings().dateTimeFormatLong,
          ),
        };
      },
    },
    // storage version
    projectVersionPlaceholder: {
      function: () => {
        return { insert: theProject.version ? theProject.version : "---" };
      },
    },
    // storage path
    projectPathPlaceholder: {
      function: (exportType) => {
        return { insert: theProject.path ? theProject.path : "---" };
      },
    },
    // character count
    projectCharactersPlaceholder: {
      function: (exportType, statistics) => {
        return { insert: statistics.characters };
      },
    },
    // word count
    projectWordsPlaceholder: {
      function: (exportType, statistics) => {
        return { insert: statistics.words };
      },
    },
    // exported texts (see textPlaceholders)
    textsBlockPlaceholder: {
      block: true,
      function: (exportType, statistics, textsExport) => {
        return { insert: textsExport, isCooked: true, isBlock: true };
      },
    },
    // exported objects (see objectPlaceholders)
    objsBlockPlaceholder: {
      block: true,
      html: true,
      function: (exportType, statistics, textsExport, objectsExport) => {
        return { insert: objectsExport, isCooked: true, isBlock: true };
      },
    },
  };

  /**
   * text level placeholders
   * @static
   */
  static #textPlaceholders = {
    // text name
    textNamePlaceholder: {
      function: (textID) => {
        return {
          insert: theTextTree.getText(textID).name,
        };
      },
    },
    // text path in tree
    textPathPlaceholder: {
      function: (textID, textContents, exportType) => {
        switch (exportType) {
          case "txt":
            return { insert: theTextTree.getParents(textID).join(" --> ") };
            break;
          case "html":
            return {
              insert: theTextTree
                .getParents(textID)
                .map((x) => Util.escapeHTML(x))
                .join(" &#10142; "),
              isCooked: true,
            };
            break;
          case "rtf":
            return {
              insert: theTextTree
                .getParents(textID)
                .map((x) => Exporter.#escapeRTF(x))
                .join(" \\u10142? "),
              isCooked: true,
            };
            break;
          case "docx":
            return {
              insert: theTextTree.getParents(textID).join(" ➞"),
            };
        }
      },
    },
    // text status
    textStatusPlaceholder: {
      function: (textID) => {
        for (
          let i = 0;
          i < theProperties.categories.categories_status.length;
          i++
        ) {
          if (
            theProperties.categories.categories_status[i].id ==
            theTextTree.getText(textID).status
          ) {
            return {
              insert:
                theProperties.categories.categories_status[i]
                  .categories_statusName,
            };
          }
        }
      },
    },
    // text type
    textTypePlaceholder: {
      function: (textID) => {
        for (
          let i = 0;
          i < theProperties.categories.categories_type.length;
          i++
        ) {
          if (
            theProperties.categories.categories_type[i].id ==
            theTextTree.getText(textID).type
          ) {
            return {
              insert:
                theProperties.categories.categories_type[i].categories_typeName,
            };
          }
        }
      },
    },
    // user value
    textUserPlaceholder: {
      function: (textID) => {
        for (
          let i = 0;
          i < theProperties.categories.categories_user.length;
          i++
        ) {
          if (
            theProperties.categories.categories_user[i].id ==
            theTextTree.getText(textID).userValue
          ) {
            return {
              insert:
                theProperties.categories.categories_user[i].categories_userName,
            };
          }
        }
      },
    },
    // creation time
    textCreatedPlaceholder: {
      function: (textID) => {
        return {
          insert: theTextTree
            .getText(textID)
            .created.toLocalString(
              theSettings.effectiveSettings().dateTimeFormatLong,
            ),
        };
      },
    },
    // last changed time
    textChangedPlaceholder: {
      function: (textID) => {
        return {
          insert: theTextTree
            .getText(textID)
            .changed.toLocalString(
              theSettings.effectiveSettings().dateTimeFormatLong,
            ),
        };
      },
    },
    // character count
    textCharactersPlaceholder: {
      function: (textID) => {
        return { insert: theTextTree.getText(textID).characters };
      },
    },
    // word count
    textWordsPlaceholder: {
      function: (textID) => {
        return { insert: theTextTree.getText(textID).words };
      },
    },
    // text contents
    textContentBlockPlaceholder: {
      block: true,
      function: (textID, textContents) => {
        return { insert: textContents, isCooked: true, isBlock: true };
      },
    },
  };

  /**
   * object level placeholders
   * @static
   */
  static #objectPlaceholders = {
    // object name
    objNamePlaceholder: {
      function: (objectID) => {
        return {
          insert: theObjectTree.getObject(objectID).name,
        };
      },
    },
    // object path in tree
    objPathPlaceholder: {
      function: (objectID, exportType) => {
        switch (exportType) {
          case "txt":
            return {
              insert: theObjectTree.getParents(objectID).join(" --> "),
            };
            break;
          case "html":
            return {
              insert: theObjectTree
                .getParents(objectID)
                .map((x) => Util.escapeHTML(x))
                .join(" &#10142; "),
              isCooked: true,
            };
            break;
          case "rtf":
            return {
              insert: theObjectTree
                .getParents(objectID)
                .map((x) => Exporter.#escapeRTF(x))
                .join(" \\u10142? "),
              isCooked: true,
            };
        }
      },
    },
    // creation time
    objCreatedPlaceholder: {
      function: (objectID) => {
        return {
          insert: theObjectTree
            .getObject(objectID)
            .created.toLocalString(
              theSettings.effectiveSettings().dateTimeFormatLong,
            ),
        };
      },
    },
    // last changed time
    objChangedPlaceholder: {
      function: (objectID) => {
        return {
          insert: theObjectTree
            .getObject(objectID)
            .changed.toLocalString(
              theSettings.effectiveSettings().dateTimeFormatLong,
            ),
        };
      },
    },
    // object contents (as list)
    objContentBlockPlaceholder: {
      block: true,
      function: (objectID, exportType, objectContents) => {
        return { insert: objectContents, isCooked: true, isBlock: true };
      },
    },
    // objects contents (as table)
    objContentTablePlaceholder: {
      block: true,
      function: (
        objectID,
        exportType,
        objectContents,
        useCitationTexts,
        propertyNames,
        propertyTypes,
        propertyContents,
      ) => {
        switch (exportType) {
          case "txt":
            let data = [];
            let sCells = [];
            data.push([
              _("Scheme_propertyName"),
              _("Scheme_propertyType"),
              _("Scheme_propertyContent"),
            ]);
            for (let i = 0; i < propertyNames.length; i++) {
              if (propertyTypes[i].insert == "") {
                data.push([propertyContents[i].insert, "", ""]);
                sCells.push({ col: 0, row: i + 1, colSpan: 3 });
              } else {
                data.push([
                  propertyNames[i].insert,
                  propertyTypes[i].insert,
                  propertyContents[i].insert,
                ]);
              }
            }
            return {
              insert: table(data, {
                border: getBorderCharacters("norc"),
                columns: [
                  {
                    width: 15,
                    paddingLeft: 0,
                    paddingRight: 2,
                    wrapWord: true,
                  },
                  {
                    width: 15,
                    paddingLeft: 0,
                    paddingRight: 2,
                    wrapWord: true,
                  },
                  {
                    width:
                      theSettings.effectiveSettings().exportTableLineLength -
                      (15 + 2 + 15 + 2),
                    paddingLeft: 0,
                    paddingRight: 0,
                    wrapWord: true,
                  },
                ],
                spanningCells: sCells,
              }),
            };
          case "html":
            {
              let html = `<table style="width:100%"><thead><tr><th style="font-weight:bold; padding:0 10px 4px 0"><p>${_(
                "Scheme_propertyName",
              )}</p></th><th style="font-weight:bold; padding:0 10px 4px 0"><p>${_("Scheme_propertyType")}</p></th><th style="font-weight:bold; padding:0 10px 4px 0"><p>${_(
                "Scheme_propertyContent",
              )}</p></th></tr></thead><tbody>`;
              for (let i = 0; i < propertyNames.length; i++) {
                if (propertyTypes[i].insert == "") {
                  html += `<tr><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0" colspan=3><p>${Exporter.#escapeUncookedHTML(
                    propertyContents[i],
                  )}</p></td></tr>`;
                } else {
                  html += `<tr><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0"><p>${Exporter.#escapeUncookedHTML(
                    propertyNames[i],
                  )}</p></td><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0"><p>${Exporter.#escapeUncookedHTML(
                    propertyTypes[i],
                  )}</p></td><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0"><p>${Exporter.#escapeUncookedHTML(
                    propertyContents[i],
                  )}</p></td></tr>`;
                }
              }
              html += "</table>";
              return { insert: html, isCooked: true, isBlock: true };
            }
            break;
          case "rtf":
            {
              let cell1Def = `${Exporter.#rtfBorder}\\cellx2000`;
              let cell2Def = `${Exporter.#rtfBorder}\\cellx4000`;
              let cell3Def = `${Exporter.#rtfBorder}\\cellx9000`;
              let rtf = `${
                Exporter.#rtfRow
              }${cell1Def}${cell2Def}${cell3Def}\\pard\\intbl ${_(
                "Scheme_propertyName",
              )}\\cell \\pard\\intbl ${_(
                "Scheme_propertyType",
              )}\\cell \\pard\\intbl ${_(
                "Scheme_propertyContent",
              )}\\cell\\row\n`;
              for (let i = 0; i < propertyNames.length; i++) {
                if (propertyTypes[i].insert == "") {
                  rtf += `${
                    Exporter.#rtfRow
                  }\\clmgf${cell1Def}\\clmrg${cell2Def}\\clmrg${cell3Def}\\pard\\intbl ${Exporter.#escapeUncookedRTF(
                    propertyContents[i],
                  )}\\cell \\pard\\intbl \\cell \\pard\\intbl \\cell\\row\n`;
                } else {
                  rtf += `${
                    Exporter.#rtfRow
                  }${cell1Def}${cell2Def}${cell3Def}\\pard\\intbl ${Exporter.#escapeUncookedRTF(
                    propertyNames[i],
                  )}\\cell \\pard\\intbl ${Exporter.#escapeUncookedRTF(
                    propertyTypes[i],
                  )}\\cell \\pard\\intbl ${Exporter.#escapeUncookedRTF(
                    propertyContents[i],
                  )}\\cell\\row\n`;
                }
              }
              return { insert: rtf, isCooked: true, isBlock: true };
            }
            break;
        }
      },
    },
    // sample text styled with object style
    objStyleSamplePlaceholder: {
      block: true,
      function: (
        objectID,
        exportType,
        objectContents,
        useCitationTexts,
        propertyNames,
        propertyTypes,
        propertyContents,
        that,
      ) => {
        switch (exportType) {
          case "txt":
            return { insert: "" };
            break;
          case "html":
            {
              // set object style (in case it is not already set)
              let so = new StyledObject();
              so.styleProperties =
                theObjectTree.objectStyle(objectID).styleProperties;
              that.useObjectStyle(objectID, so);
              return {
                insert:
                  `<p><span class="object${objectID}-true">` +
                  (
                    theSettings.effectiveSettings().exportTextSample ||
                    _("sampleTexts_medium")
                  )
                    .split("\n")
                    .join("<br>") +
                  "</span></p>",
                isCooked: true,
                isBlock: true,
              };
            }
            break;
          case "rtf":
            {
              let fac = theObjectTree.objectStyle(objectID).fontsAndColors();
              fac.fonts.forEach((font) => {
                if (!that.#fontTable.includes(font)) {
                  that.#fontTable.push(font);
                }
              });
              fac.colors.forEach((color) => {
                if (!that.#colorTable.includes(color)) {
                  that.#colorTable.push(color);
                }
              });
              return {
                insert:
                  `\\pard\\plain${Formats.formatToRTF(
                    theFormats.formats[UUID0],
                    that.#fontTable,
                    that.#colorTable,
                    that.#styleTable.indexOf(UUID0),
                  )}{${StylingControls.controls2RTF(
                    theObjectTree.objectStyle(objectID).styleProperties.text,
                    theFormats.formats[UUID0].formats_fontSize,
                    that.#fontTable,
                    that.#colorTable,
                  )} ` +
                  Exporter.#escapeRTF(
                    theSettings.effectiveSettings().exportTextSample ||
                      _("sampleTexts_medium"),
                  )
                    .split("\n")
                    .join("\\line ") +
                  "}\\par\n",
                isCooked: true,
                isBlock: true,
              };
            }
            break;
        }
      },
    },
    // object references (text passages linked with the object)
    objTextReferencesPlaceholder: {
      block: true,
      function: (
        objectID,
        exportType,
        objectContents,
        useCitationTexts,
        propertyNames,
        propertyTypes,
        propertyContents,
        that,
      ) => {
        switch (exportType) {
          case "txt":
            {
              let text = "";
              theObjectTree
                .getObject(objectID)
                .textReferences(
                  theSettings.effectiveSettings().exportTextImage
                    ? "imageReferenceExportText"
                    : "imageReferenceEmpty",
                )
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let name = theTextTree.getText(textRef.text).name;
                        textRef.citations.forEach((citation) => {
                          text += `${name}:\n${citation.parts.map((c) => c.text).join("")}\n`;
                        });
                      }
                    });
                  }
                });
              return {
                insert: text + "\n",
              };
            }
            break;
          case "html":
            {
              let html = "";
              theObjectTree
                .getObject(objectID)
                .textReferences()
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let name = theTextTree.getText(textRef.text).name;
                        textRef.citations.forEach((citation) => {
                          html += `<p><b>${Util.escapeHTML(
                            name,
                          )}:</b></p><p>${citation.parts
                            .map((part) =>
                              part.html
                                ? part.text
                                : Util.escapeHTML(part.text),
                            )
                            .join("")}</p>`;
                        });
                      }
                    });
                  }
                });
              return { insert: html, isCooked: true, isBlock: true };
            }
            break;
          case "rtf":
            {
              let rtf = "";
              theObjectTree
                .getObject(objectID)
                .textReferences(
                  theSettings.effectiveSettings().exportTextImage
                    ? "imageReferenceExportText"
                    : "imageReferenceEmpty",
                )
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let name = theTextTree.getText(textRef.text).name;
                        let format = Formats.formatToRTF(
                          theFormats.formats[UUID0],
                          that.#fontTable,
                          that.#colorTable,
                          that.#styleTable.indexOf(UUID0),
                        );
                        textRef.citations.forEach((citation) => {
                          rtf += `\\pard\\plain${format}{\\b1 ${Exporter.#escapeRTF(
                            name,
                          )}:}\\par\n\\pard\\plain${format} ${Exporter.#escapeRTF(
                            citation.parts.map((c) => c.text).join(""),
                          )}\\par\n`;
                        });
                      }
                    });
                  }
                });
              return { insert: rtf, isCooked: true, isBlock: true };
            }
            break;
        }
      },
    },
    // object references as table
    objTextReferencesTablePlaceholder: {
      block: true,
      function: (
        objectID,
        exportType,
        objectContents,
        useCitationTexts,
        propertyNames,
        propertyTypes,
        propertyContents,
        that,
      ) => {
        switch (exportType) {
          case "txt":
            {
              let data = [];
              data.push([_("mainWindow_textName"), _("mainWindow_citation")]);
              let prevName = "";
              theObjectTree
                .getObject(objectID)
                .textReferences(
                  theSettings.effectiveSettings().exportTextImage
                    ? "imageReferenceExportText"
                    : "imageReferenceEmpty",
                )
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let name = theTextTree.getText(textRef.text).name;
                        textRef.citations.forEach((citation) => {
                          data.push([
                            name == prevName ? "" : name,
                            citation.parts.map((c) => c.text).join(""),
                          ]);
                          prevName = name;
                        });
                      }
                    });
                  }
                });
              return {
                insert: table(data, {
                  border: getBorderCharacters("norc"),
                  columns: [
                    {
                      width: 15,
                      paddingLeft: 0,
                      paddingRight: 2,
                      wrapWord: true,
                    },
                    {
                      width:
                        theSettings.effectiveSettings().exportTableLineLength -
                        17,
                      paddingLeft: 0,
                      paddingRight: 0,
                      wrapWord: true,
                    },
                  ],
                }),
              };
            }
            break;
          case "html":
            {
              let html = `<table style="width:100%"><thead><tr><th style="font-weight:bold; padding:0 10px 4px 0"><p>${_(
                "mainWindow_textName",
              )}</p></th><th style="font-weight:bold; padding:0 10px 4px 0"><p>${_(
                "mainWindow_citation",
              )}</p></th></tr></thead><tbody>`;

              theObjectTree
                .getObject(objectID)
                .textReferences()
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let row = `<td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0" rowspan=${textRef.citations.length}>${Util.escapeHTML(
                          theTextTree.getText(textRef.text).name,
                        )}</td>`;

                        textRef.citations.forEach((citation) => {
                          row += `<td style="white-space:pre-wrap; vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0">${citation.parts
                            .map((part) =>
                              part.html
                                ? part.text
                                : Util.escapeHTML(part.text),
                            )
                            .join("")}</td>`;
                          html += `<tr>${row}</tr>`;
                          row = "";
                        });
                      }
                    });
                  }
                });
              html += "</tbody></table>";
              return { insert: html, isCooked: true, isBlock: true };
            }
            break;
          case "rtf":
            {
              let cell1Def = `${Exporter.#rtfBorder}\\cellx3000`;
              let cell2Def = `${Exporter.#rtfBorder}\\cellx9000`;
              let rtf = `${
                Exporter.#rtfRow
              }${cell1Def}${cell2Def}\\pard\\intbl ${_(
                "mainWindow_textName",
              )}\\cell \\pard\\intbl ${_("mainWindow_citation")}\\cell\\row\n`;
              let prevName = null;

              theObjectTree
                .getObject(objectID)
                .textReferences(
                  theSettings.effectiveSettings().exportTextImage
                    ? "imageReferenceExportText"
                    : "imageReferenceEmpty",
                )
                .forEach((objRef) => {
                  if (objRef.object == objectID) {
                    objRef.references.forEach((textRef) => {
                      if (useCitationTexts.includes(textRef.text)) {
                        let name = theTextTree.getText(textRef.text).name;
                        let format = Formats.formatToRTF(
                          theFormats.formats[UUID0],
                          that.#fontTable,
                          that.#colorTable,
                          that.#styleTable.indexOf(UUID0),
                        );
                        textRef.citations.forEach((citation) => {
                          rtf += `${
                            Exporter.#rtfRow
                          }${cell1Def}${cell2Def}\\pard\\intbl${format} ${
                            prevName == name ? "" : Exporter.#escapeRTF(name)
                          }\\cell \\pard\\intbl${format} ${Exporter.#escapeRTF(
                            citation.parts.map((c) => c.text).join(""),
                          )}\\cell\\row\n`;
                          prevName = name;
                        });
                      }
                    });
                  }
                });

              return { insert: rtf, isCooked: true, isBlock: true };
            }
            break;
        }
      },
    },
  };

  /**
   * placeholders for objects in texts
   * @static
   */
  static #objectTextPlaceholders = {
    // object name
    objTextNamePlaceholder: {
      function: (objectID) => {
        return {
          insert: theObjectTree.getObject(objectID).name,
        };
      },
    },
    // upper cased
    objTextNameUpperPlaceholder: {
      function: (objectID) => {
        return {
          insert: theObjectTree.getObject(objectID).name.toUpperCase(),
        };
      },
    },
    // path in object tree
    objTextPathPlaceholder: {
      /**
       * @todo implement way to insert cooked ops into text content, so they won't be escaped (again) and change arrow symbol to respective html / rtf code
       */
      function: (objectID, exportType) => {
        switch (exportType) {
          case "txt":
            return {
              insert: theObjectTree.getParents(objectID).join(" --> "),
            };
            break;
          case "html":
          case "rtf":
          case "docx":
            return {
              insert: theObjectTree
                .getParents(objectID)
                // .map((x) => Util.escapeHTML(x))
                .join(" ➞ "), // .join(" &#10142; ")
              // isCooked: true,
            };
            break;
        }
      },
    },
    // upper cased
    objTextPathUpperPlaceholder: {
      function: (objectID, exportType) => {
        switch (exportType) {
          case "txt":
            return {
              insert: theObjectTree
                .getParents(objectID)
                .join(" --> ")
                .toUpperCase(),
            };
            break;
          case "html":
          case "rtf":
          case "docx":
            return {
              insert: theObjectTree
                .getParents(objectID)
                .join(" ➞ ")
                .toUpperCase(),
            };
            break;
        }
      },
    },
  };

  /**
   * object property related placeholders
   * @static
   */
  static #propertyPlaceholders = {
    // property name
    propertyNamePlaceholder: {
      function: (item) => {
        switch (item.type) {
          case "schemeTypes_header":
            return { insert: "" };
            break;
          default:
            return { insert: item.name };
            break;
        }
      },
    },
    // property type
    propertyTypePlaceholder: {
      function: (item) => {
        switch (item.type) {
          case "schemeTypes_header":
            return { insert: "" };
            break;
          case "schemeTypes_select":
          case "schemeTypes_radio":
            return {
              insert: `${_(item.type)} (${_("Scheme_selectList", {
                list: item.params[0].split("#").join(", "),
              })})`,
            };
            break;
          case "schemeTypes_range":
            return {
              insert: `${_(item.type)} (${_("Scheme_rangeMinMax", {
                min: item.params[0],
                max: item.params[1],
              })})`,
            };
            break;
          default:
            return { insert: _(item.type) };
            break;
        }
      },
    },
    // property content
    propertyContentPlaceholder: {
      block: true,
      html: true,
      function: (item, that, exportType, content, mapImages) => {
        // header
        if (item.type == "schemeTypes_header")
          switch (exportType) {
            case "txt":
              return {
                insert: item.name.toUpperCase().split("").join(" "),
              };
            case "html":
              return {
                insert: `<span style="font-weight:bold; letter-spacing:1ex;">${Util.escapeHTML(
                  item.name,
                )}</span>`,
                isCooked: true,
              };
            case "rtf":
              return {
                insert: `{\\b1\\expnd${Math.round(
                  theFormats.formats[UUID0].formats_fontSize * 4,
                )}\\expndtw${Math.round(
                  theFormats.formats[UUID0].formats_fontSize * 20,
                )} ${Exporter.#escapeRTF(item.name)}}`,
                isCooked: true,
              };
              break;
          }
        if (content == null) return { insert: "---" };
        else
          switch (item.type) {
            // object relation
            case "schemeTypes_relation":
            case "schemeTypes_irelation":
              return {
                insert: theObjectTree.getObject(content).name,
              };
            // checkbox
            case "schemeTypes_checkbox":
              return {
                insert: content
                  ? _("Scheme_checkTrue")
                  : _("Scheme_checkFalse"),
              };
              break;
            // everything text related
            case "schemeTypes_text":
            case "schemeTypes_select":
            case "schemeTypes_radio":
            case "schemeTypes_date":
            case "schemeTypes_dateRange":
              return { insert: content };
              break;
            // color
            case "schemeTypes_color":
              switch (exportType) {
                case "txt":
                case "rtf":
                  return { insert: content };
                case "html": {
                  let html = content;
                  for (let c = 255; c >= 0; c -= 55) {
                    let h = ("0" + c.toString(16)).slice(-2);
                    html += `<div style="display:inline-block; margin-right:25px; height:100px; width:100px; border:#${h}${h}${h} solid 25px; background-color:${content}"></div>`;
                  }
                  return { insert: html, isCooked: true };
                }
              }
              break;
            // editor
            case "schemeTypes_editor":
              switch (exportType) {
                case "txt":
                  return { insert: Exporter.#deltaToText(content.ops) };
                case "html":
                  return {
                    insert: Exporter.deltaToHTML(
                      content.ops,
                      that.#usedFormats,
                      that.#usedObjects,
                    ),
                    isCooked: true,
                    isBlock: true,
                  };
                case "rtf":
                  return {
                    insert: that.#deltaToRTF(content.ops),
                    isCooked: true,
                    isBlock: true,
                  };
                  break;
              }
              break;
            // range / slider
            case "schemeTypes_range":
              return { insert: `${content} ${item.params[3]}` };
              break;
            // map
            case "schemeTypes_map":
              switch (exportType) {
                case "txt":
                  return {
                    insert: content.marker
                      .map(
                        (marker) =>
                          `${marker.info ? marker.info : "---"}: ${_(
                            "Scheme_locationLatLong",
                            {
                              lat: marker.latLng.lat.toFixed(6),
                              lng: marker.latLng.lng.toFixed(6),
                            },
                          )}`,
                      )
                      .join("\n"),
                  };
                case "html":
                  let html = "";
                  if (mapImages) {
                    if (mapImages[0]) {
                      html += `<p>${_("Scheme_overviewMap")}<br><img src="${
                        mapImages[0]
                      }"/></p>`;
                    }
                    for (let i = 0; i < content.marker.length; i++) {
                      html += `<p style="margin-top:10px">${
                        content.marker[i].info
                          ? `${Util.escapeHTML(content.marker[i].info)}: `
                          : ""
                      }${_("Scheme_locationLatLong", {
                        lat: content.marker[i].latLng.lat.toFixed(6),
                        lng: content.marker[i].latLng.lng.toFixed(6),
                      })}${
                        mapImages[i + 1]
                          ? `<br><img src="${mapImages[i + 1]}"/>`
                          : ""
                      }</p>`;
                    }
                  } else if (content.marker.length) {
                    html += `<table><thead><tr><th style="padding:0 10px 4px 0">${_(
                      "Scheme_locationName",
                    )}</th><th style="padding:0 10px 4px 0">${_(
                      "Scheme_locationLat",
                    )}</th><th style="padding:0 10px 4px 0">${_(
                      "Scheme_locationLon",
                    )}</th></tr><tbody>`;
                    content.marker.map((marker) => {
                      html += `<tr><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0">${Util.escapeHTML(
                        marker.info,
                      )}</td><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0">${marker.latLng.lat.toFixed(
                        6,
                      )}</td><td style="vertical-align:top; border-top:1px solid black; padding:4px 10px 4px 0">${marker.latLng.lng.toFixed(
                        6,
                      )}</td></tr>`;
                    });
                    html += "</table>";
                  } else {
                    html = `<p>${_("Scheme_locationNoMarkers")}</p>`;
                  }
                  return {
                    insert: html,
                    isCooked: true,
                    isBlock: true,
                  };
                case "rtf":
                  {
                    let rtf = "";
                    if (mapImages) {
                      if (mapImages[0]) {
                        rtf += `\\pard\\plain\\sl1 ${Exporter.#escapeRTF(
                          _("Scheme_overviewMap"),
                        )}\\line{\\pict\\pngblip\\picwgoal${Math.floor(
                          (theSettings.effectiveSettings()
                            .exportOverwiewmapWidth /
                            180) *
                            1440,
                        )}\\pichgoal${Math.floor(
                          (theSettings.effectiveSettings()
                            .exportOverwiewmapHeight /
                            180) *
                            1440,
                        )}\n`;
                        let bytes = Buffer.from(
                          mapImages[0].split(",")[1],
                          "base64",
                        ).toString("hex");
                        while (bytes.length) {
                          rtf += `${bytes.substring(0, 128)}\n`;
                          bytes = bytes.substring(128);
                        }
                        rtf += `}\\par\n`;
                      }
                      for (let i = 0; i < content.marker.length; i++) {
                        rtf += `\\pard\\plain\\sl1 ${
                          content.marker[i].info
                            ? `${Exporter.#escapeRTF(content.marker[i].info)}: `
                            : ""
                        }${Exporter.#escapeRTF(
                          _("Scheme_locationLatLong", {
                            lat: content.marker[i].latLng.lat.toFixed(6),
                            lng: content.marker[i].latLng.lng.toFixed(6),
                          }),
                        )}\\line{\\pict\\pngblip\\picwgoal${Math.floor(
                          (theSettings.effectiveSettings()
                            .exportDetailmapWidth /
                            180) *
                            1440,
                        )}\\pichgoal${Math.floor(
                          (theSettings.effectiveSettings()
                            .exportDetailmapHeight /
                            180) *
                            1440,
                        )}\n`;
                        let bytes = Buffer.from(
                          mapImages[i + 1].split(",")[1],
                          "base64",
                        ).toString("hex");
                        while (bytes.length) {
                          rtf += `${bytes.substring(0, 128)}\n`;
                          bytes = bytes.substring(128);
                        }
                        rtf += `}\\par\n`;
                      }
                    } else if (content.marker.length) {
                      content.marker.map((marker) => {
                        rtf += `\\pard\\plain ${
                          marker.info
                            ? `${Exporter.#escapeRTF(marker.info)}: `
                            : ""
                        }${Exporter.#escapeRTF(
                          _("Scheme_locationLatLong", {
                            lat: marker.latLng.lat.toFixed(6),
                            lng: marker.latLng.lng.toFixed(6),
                          }),
                        )}\\par\n`;
                      });
                    } else {
                      rtf = `\\pard\\plain ${_("Scheme_locationNoMarkers")}\\par`;
                    }
                    return {
                      insert: rtf,
                      isCooked: true,
                      isBlock: true,
                    };
                    //TODO
                  }
                  break;
              }
              break;
            // file
            case "schemeTypes_file":
              return {
                insert: `${_("Scheme_fileName")}: ${
                  content && content.filePath ? content.filePath : "---"
                }, ${_("Scheme_fileSize")}: ${
                  content && content.id && theFiles[content.id]
                    ? Util.formatBytes(theFiles[content.id].size)
                    : "---"
                }, ${_("Scheme_fileTime")}: ${
                  content && content.fileModtime
                    ? new Timestamp(content.fileModtime).toLocalString(
                        theSettings.effectiveSettings().dateTimeFormatLong,
                      )
                    : "---"
                }`,
              };
              break;
          }
      },
    },
  };

  /**
   * all placeholders combined
   * @static
   */
  static placeholders = {
    ...Exporter.#documentPlaceholders,
    ...Exporter.#textPlaceholders,
    ...Exporter.#objectTextPlaceholders,
    ...Exporter.#objectPlaceholders,
    ...Exporter.#propertyPlaceholders,
  };

  /**
   * UI settings, organized per tab
   */
  static settings = [
    {
      tab: "exportWindow_profileTab",
      settings: [
        {
          name: "profileName",
          i18n: "exportWindow_profileName",
          type: "text",
          default: "",
        },
        {
          name: "profileCreated",
          i18n: "exportWindow_profileCreated",
          type: "timestamp",
          default: null,
        },
        {
          name: "profileChanged",
          i18n: "exportWindow_profileChanged",
          type: "timestamp",
          default: null,
        },
      ],
    },
    {
      tab: "exportWindow_documentTab",
      settings: [
        {
          name: "exportType",
          i18n: "exportWindow_exportType",
          type: "select",
          values: ["txt", "html", "rtf", "docx"],
          i18nValues: [
            "exportWindow_typeTXT",
            "exportWindow_typeHTML",
            "exportWindow_typeRTF",
            "exportWindow_typeDOCX",
          ],
          default: "docx",
        },
        {
          name: "documentEditor",
          i18n: "exportWindow_documentEditor",
          type: "editor",
          format: true,
          height: "400px",
          placeholders: Object.keys(Exporter.#documentPlaceholders),
          default: {
            ops: [
              {
                insert: { placeholder: "projectTitlePlaceholder" },
              },
              { insert: "\n" },
              {
                insert: { placeholder: "projectAuthorPlaceholder" },
              },
              { insert: "\n" },
              {
                insert: { placeholder: "textsBlockPlaceholder" },
              },
            ],
          },
        },
      ],
    },
    {
      tab: "exportWindow_textsTab",
      settings: [
        {
          name: "exportTexts",
          i18n: "exportWindow_exportTexts",
          type: "select",
          values: ["allTexts", "checkedTexts"],
          i18nValues: ["exportWindow_allTexts", "exportWindow_checkedTexts"],
          default: "allTexts",
        },
        {
          name: "ignoreEmptyTexts",
          i18n: "exportWindow_ignoreEmptyTexts",
          type: "check",
          default: true,
        },
        {
          name: "textFormats",
          i18n: "exportWindow_useTextFormats",
          type: "check",
          default: true,
        },
        {
          name: "textEditor",
          i18n: "exportWindow_textEditor",
          type: "editor",
          format: true,
          height: "400px",
          placeholders: Object.keys(Exporter.#textPlaceholders),
          default: {
            ops: [
              {
                insert: { placeholder: "textContentBlockPlaceholder" },
              },
            ],
          },
        },
      ],
    },
    {
      tab: "exportWindow_objectTextTab",
      settings: [
        {
          name: "exportObjectsText",
          i18n: "exportWindow_exportObjectsText",
          type: "select",
          values: ["allObjects", "checkedObjects", "noObjects"],
          i18nValues: [
            "exportWindow_allObjects",
            "exportWindow_checkedObjects",
            "exportWindow_noObjects",
          ],
          default: "allObjects",
        },
        {
          name: "objectFormats",
          i18n: "exportWindow_useObjectFormats",
          type: "check",
          default: true,
        },
        {
          name: "objectStartEditor",
          i18n: "exportWindow_objectStartEditor",
          type: "editor",
          format: false,
          height: "200px",
          placeholders: Object.keys(Exporter.#objectTextPlaceholders),
          default: null,
        },
        {
          name: "objectEndEditor",
          i18n: "exportWindow_objectEndEditor",
          type: "editor",
          format: false,
          height: "200px",
          placeholders: Object.keys(Exporter.#objectTextPlaceholders),
          default: null,
        },
      ],
    },
    {
      tab: "exportWindow_objectTab",
      settings: [
        {
          name: "exportObjects",
          i18n: "exportWindow_exportObjects",
          type: "select",
          values: ["allObjects", "checkedObjects", "usedObjects"],
          i18nValues: [
            "exportWindow_allObjects",
            "exportWindow_checkedObjects",
            "exportWindow_usedObjects",
          ],
          default: "usedObjects",
        },
        {
          name: "exportCitationTexts",
          i18n: "exportWindow_exportCitationTexts",
          type: "select",
          values: [
            "allCitationTexts",
            "checkedCitationTexts",
            "coveredCitationTexts",
          ],
          i18nValues: [
            "exportWindow_allCitationTexts",
            "exportWindow_checkedCitationTexts",
            "exportWindow_coveredCitationTexts",
          ],
          default: "allCitationTexts",
        },
        {
          name: "objectEditor",
          i18n: "exportWindow_objectEditor",
          type: "editor",
          format: true,
          height: "400px",
          placeholders: Object.keys(Exporter.#objectPlaceholders),
          default: null,
        },
      ],
    },
    {
      tab: "exportWindow_propertiesTab",
      settings: [
        {
          name: "objectPropertiesEditor",
          i18n: "exportWindow_propertiesEditor",
          type: "editor",
          format: true,
          height: "400px",
          placeholders: Object.keys(Exporter.#propertyPlaceholders),
          default: null,
        },
      ],
    },
  ];

  /**
   * build default profile
   *
   * @param {String} name
   * @returns {Object}
   */
  static defaultProfile(name = null) {
    let profile = {};
    Exporter.settings.forEach((tab) => {
      tab.settings.forEach((setting) => {
        if (setting.type == "text" || setting.type == "textarea") {
          profile[setting.name] = _(setting.default);
        } else {
          profile[setting.name] = setting.default;
        }
      });
    });

    profile.profileName = name || _("mainWindow_defaultExportProfile");
    profile.profileCreated = new Timestamp().epochSeconds;
    profile.profileChanged = profile.profileCreated;
    return profile;
  }

  #profiles; // {id1:profile1, id2:profile2, ...} where profile_i = {setting1:value1, setting2:value2, ...}
  #recentProfileID; // last used profile

  #usedFonts; // object mapping all used fonts in an export to true
  #usedFormats; // object mapping all used formats in an export to true
  #usedObjects; // object mapping all used objects in an export to true
  #colorTable; // array of all colors used in an export
  #fontTable; // array of all fonts used in an export
  #styleTable; // array of all styles used in an export
  #dirty;

  /**
   * class constructor
   *
   * @param {Object} profiles
   * @param {String} recentProfileID
   * @param {Boolean} dirty
   */
  constructor(profiles = null, recentProfileID = null, dirty = true) {
    if (profiles && Object.keys(profiles).length) {
      this.#profiles = profiles;
    } else {
      this.#profiles = {};
      this.#profiles[UUID0] = Exporter.defaultProfile();
    }
    this.#dirty = dirty;
    this.#recentProfileID = recentProfileID;
  }

  // getters and setters

  get profiles() {
    return this.#profiles;
  }

  set profiles(profiles) {
    this.#profiles = profiles;
  }

  get recentProfileID() {
    return this.#recentProfileID;
  }

  isDirty() {
    return this.#dirty;
  }

  undirty() {
    this.#dirty = false;
  }

  /**
   * build css style for given fonts
   *
   * @param {String} id
   * @param {String[]} fontNames
   * @returns {String}
   */
  static fonts2CSS(id, fontNames) {
    let fontCSS = `<style id="${id}">\n`;
    fontNames.forEach((name) => {
      fontCSS += `@font-face { font-family:${name}; src:local(${name}) }\n`;
    });
    return fontCSS + "</style>\n";
  }

  /**
   * build css style for given formats
   *
   * @param {String} id
   * @param {Object} formats
   * @returns {String}
   */
  static formats2CSS(id, formats) {
    let formatCSS = `<style id="${id}">\n`;
    for (let [id, format] of Object.entries(formats)) {
      formatCSS += Formats.toCSS(
        id,
        format,
        undefined,
        undefined,
        undefined,
        true,
      );
    }
    return formatCSS + "</style>\n";
  }

  /**
   * build css style for given objects
   *
   * @param {String} id
   * @param {Object} objects
   * @returns {String}
   */
  static objects2CSS(id, objects) {
    let objectCSS = `<style id="${id}">\n`;
    for (let [id, object] of Object.entries(objects)) {
      objectCSS += `.object${id}-true { ${object.toCSS("text")} }\n`;
      objectCSS += `.object${id}-true img { ${object.toCSS("image")} }\n`;
    }
    return objectCSS + "</style>\n";
  }

  /**
   * add style to list for object with given id
   */
  useObjectStyle(objectID, style) {
    this.#usedObjects[objectID] = style;
  }

  /**
   * remove quill format attributes with given ids from all editors in all profiles
   *
   * @param {String[]} ids
   */
  removeFormatAttributes(ids) {
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
    let attrs = {};
    ids.forEach((id) => {
      attrs["format" + id] = null;
    });
    Object.keys(this.#profiles).forEach((profileID) => {
      let changed = false;
      Exporter.settings.forEach((tab) => {
        tab.settings.forEach((setting) => {
          if (
            setting.type == "editor" &&
            this.#profiles[profileID][setting.name] &&
            "ops" in this.#profiles[profileID][setting.name]
          ) {
            let delta = new Delta(this.#profiles[profileID][setting.name].ops);
            let newDelta = delta.compose(
              new Delta().retain(delta.length(), attrs),
            );
            // if contents was changed, update and reload to editor
            if (delta.diff(newDelta).ops.length > 0) {
              this.#profiles[profileID][setting.name].ops = newDelta.ops;
              changed = true;
            }
          }
        });
      });
      if (changed) {
        this.#profiles[profileID].profileChanged = new Timestamp().epochSeconds;
      }
    });
    ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
  }

  /**
   * save an existing preview as an export file
   * @static
   *
   * @param {String} content
   * @param {Object} profile
   */
  static savePreview(content, profile) {
    ipcRenderer
      .invoke("mainProcess_fileSaveDialog", [
        {
          name: _("project_exportTypes"),
          extensions: [profile.exportType],
        },
      ])
      .then((file) => {
        if (file) {
          // as under linux (other than windows) the filter extension is not added automatically we need to do it ourselves
          if (!nodePath.parse(file).ext) {
            file += `.${profile.exportType}`;
          }
          fs.open(file, "w", (err, fd) => {
            if (err) {
              ipcRenderer.invoke("mainProcess_errorMessage", [
                _("mainWindow_exportError"),
                _("mainWindow_exportOpenError", { file: file }),
              ]);
            } else {
              try {
                fs.writeSync(fd, content);
              } finally {
                fs.close(fd, (err) => {
                  if (err) {
                    ipcRenderer.invoke("mainProcess_errorMessage", [
                      _("mainWindow_exportError"),
                      _("mainWindow_exportCloseError", {
                        file: file,
                      }),
                    ]);
                  } else {
                    ipcRenderer.invoke("mainProcess_addRecentExport", [
                      file,
                      profile.exportType,
                      new Timestamp().toLocalString(
                        theSettings.effectiveSettings().dateTimeFormatShort,
                      ),
                    ]);
                    ipcRenderer.invoke("mainProcess_infoMessage", [
                      _("mainWindow_exportComplete"),
                      _("mainWindow_exportSuccess", {
                        file: file,
                      }),
                    ]);
                  }
                });
              }
            }
          });
        }
      });
  }

  exportForPrint() {
    this.#usedFonts = {};
    this.#usedFormats = {};
    this.#usedFormats[UUID0] = theFormats.formats[UUID0];
    this.#usedObjects = {};

    return new Promise((resolve) => {
      let profile = Exporter.defaultProfile();
      profile.exportType = "html";
      profile.exportTexts = "checkedTexts";
      profile.exportObjectsText = "checkedObjects";
      profile.documentEditor = {
        ops: [
          {
            insert: { placeholder: "textsBlockPlaceholder" },
          },
        ],
      };
      profile.objectEditor = { ops: [] };
      profile.objectEndEditor = { ops: [] };
      profile.objectStartEditor = { ops: [] };
      profile.objectPropertiesEditor = { ops: [] };

      this.#export(profile).then((result) => {
        Object.values(this.#usedFormats).forEach((format) => {
          if (format.formats_fontFamily) {
            this.#usedFonts[format.formats_fontFamily] = true;
          }
        });
        Object.values(this.#usedObjects).forEach((object) => {
          if (object.styleProperties.formats_fontFamily) {
            this.#usedFonts[object.styleProperties.formats_fontFamily] = true;
          }
        });
        resolve([
          `${Exporter.formats2CSS(
            "formatSheet",
            this.#usedFormats,
          )}${Exporter.objects2CSS(
            "objectSheet",
            this.#usedObjects,
          )}${Exporter.fonts2CSS("fontSheet", theFonts.availableFamilies)}`,
          result,
        ]);
      });
    });
  }

  /**
   * export or preview
   *
   * @param {Object} profile
   * @param {Boolean} preview
   */
  export(profile, preview) {
    this.#usedFonts = {};
    this.#usedFormats = {};
    this.#usedFormats[UUID0] =
      profile.exportType == "txt"
        ? {
            formats_fontFamily: "'monospace'",
            formats_fontSize: 12,
          }
        : theFormats.formats[UUID0];
    this.#usedObjects = {};
    // rtf related tables
    this.#colorTable = ["#000000"];
    this.#styleTable = [];
    this.#fontTable = [];

    if (preview) {
      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
      this.#export(profile).then((result) => {
        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
        Object.values(this.#usedFormats).forEach((format) => {
          if (format.formats_fontFamily) {
            this.#usedFonts[format.formats_fontFamily] = true;
          }
        });
        Object.values(this.#usedObjects).forEach((object) => {
          if (object.styleProperties.formats_fontFamily) {
            this.#usedFonts[object.styleProperties.formats_fontFamily] = true;
          }
        });
        ipcRenderer.invoke("mainProcess_openWindow", [
          "exportpreview",
          true,
          true,
          0,
          0,
          _("windowTitles_exportPreviewWindow", {
            name: profile.profileName,
          }),
          "./exportPreviewWindow/exportPreviewWindow.html",
          "exportPreviewWindow_init",
          null,
          [
            theSettings.effectiveSettings(),
            _("mainWindow_exportTitle", {
              title: theProperties.fulltitle || theProgramLongName,
              time: new Timestamp().toLocalString(
                theSettings.effectiveSettings().dateTimeFormatShort,
              ),
            }),
            result,
            profile,
            Object.keys(this.#usedFonts),
            this.#usedFormats,
            // transport only styleProps, as complex objs cannot be handed over (or only as JSON)
            Object.fromEntries(
              Object.entries(this.#usedObjects).map(([k, v]) => [
                k,
                v.styleProperties,
              ]),
            ),
          ],
        ]);
      });
    } else {
      ipcRenderer
        .invoke("mainProcess_fileSaveDialog", [
          {
            name: _("project_exportTypes"),
            extensions: [profile.exportType],
          },
        ])
        .then((file) => {
          if (file) {
            // as under linux (other than windows) the filter extension is not added automatically we need to do it ourselves; see https://github.com/electron/electron/issues/21935
            if (!nodePath.parse(file).ext) {
              file += `.${profile.exportType}`;
            }
            fs.open(file, "w", (err, fd) => {
              if (err) {
                ipcRenderer.invoke("mainProcess_errorMessage", [
                  _("mainWindow_exportError"),
                  _("mainWindow_exportOpenError", {
                    file: file,
                  }),
                ]);
              } else {
                try {
                  switch (profile.exportType) {
                    case "txt":
                      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
                      this.#export(profile).then((result) => {
                        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
                        fs.writeSync(fd, result);
                        Exporter.#exportFileFinal(fd, file, profile);
                      });
                      break;
                    case "rtf":
                      fs.writeSync(fd, `{\\rtf1\\ansi\n`);
                      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
                      this.#export(profile).then((result) => {
                        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
                        fs.writeSync(fd, this.#rtfFontTable());
                        fs.writeSync(fd, this.#rtfColorTable());
                        fs.writeSync(fd, this.#rtfStylesheet());
                        fs.writeSync(
                          fd,
                          `{\\*\\generator ${theProgramLongName} (${theProgramID})}{\\info{\\title ${Exporter.#escapeRTF(
                            theProperties.fulltitle,
                          )}}{\\author ${Exporter.#escapeRTF(
                            theProperties.author,
                          )}}{\\doccomm ${Exporter.#escapeRTF(
                            theProperties.info,
                          )}}{\\version${theProject.version}}}\n`,
                        );
                        fs.writeSync(fd, result);
                        fs.writeSync(fd, "}");
                        Exporter.#exportFileFinal(fd, file, profile);
                      });
                      break;
                    case "html":
                      fs.writeSync(
                        fd,
                        `<html><meta charset="utf-8"><meta name="author" content="${Util.escapeHTML(
                          theProperties.author,
                        )}"><meta name="description" content="${Util.escapeHTML(
                          theProperties.info,
                        )}"><meta name="generator" content="${theProgramLongName} (${theProgramID})"><head><title>${Util.escapeHTML(
                          _("mainWindow_exportTitle", {
                            title:
                              theProperties.fulltitle || theProgramLongName,
                            time: new Timestamp().toLocalString(
                              theSettings.effectiveSettings()
                                .dateTimeFormatShort,
                            ),
                          }),
                        )}</title></head>\n<body>\n`,
                      );
                      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
                      this.#export(profile).then((result) => {
                        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
                        fs.writeSync(fd, result);
                        Object.values(this.#usedFormats).forEach((format) => {
                          if (format.formats_fontFamily) {
                            this.#usedFonts[format.formats_fontFamily] = true;
                          }
                        });
                        Object.values(this.#usedObjects).forEach((object) => {
                          if (object.styleProperties.formats_fontFamily) {
                            this.#usedFonts[
                              object.styleProperties.formats_fontFamily
                            ] = true;
                          }
                        });
                        fs.writeSync(
                          fd,
                          Exporter.formats2CSS(
                            "formatSheet",
                            this.#usedFormats,
                          ),
                        );
                        fs.writeSync(
                          fd,
                          Exporter.objects2CSS(
                            "objectSheet",
                            this.#usedObjects,
                          ),
                        );
                        fs.writeSync(fd, "</body></html>");
                        Exporter.#exportFileFinal(fd, file, profile);
                      });
                      break;
                    case "docx":
                      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
                      this.#export(profile).then((result) => {
                        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
                        const theDoc = new docx.Document({
                          creator: theProperties.author,
                          description: theProperties.info,
                          title: theProperties.fulltitle,
                          revision: theProject.version,
                          sections: [
                            {
                              properties: {},
                              children: result,
                            },
                          ],
                        });

                        docx.Packer.toBuffer(theDoc).then((buffer) => {
                          fs.writeSync(fd, buffer);
                          Exporter.#exportFileFinal(fd, file, profile);
                        });
                      });
                      break;
                  }
                } catch (err) {}
              }
            });
          }
        });
    }
  }

  /**
   * close export file and finalize export
   *
   * @param {File} fd
   * @param {String} file
   * @param {Object} profile
   */
  static #exportFileFinal(fd, file, profile) {
    fs.close(fd, (err) => {
      if (err) {
        ipcRenderer.invoke("mainProcess_errorMessage", [
          _("mainWindow_exportError"),
          _("mainWindow_exportCloseError", {
            file: file,
          }),
        ]);
      } else {
        ipcRenderer.invoke("mainProcess_addRecentExport", [
          file,
          profile.exportType,
          new Timestamp().toLocalString(
            theSettings.effectiveSettings().dateTimeFormatShort,
          ),
        ]);
        ipcRenderer
          .invoke("mainProcess_yesNoDialog", [
            _("mainWindow_exportComplete"),
            _("mainWindow_exportSuccess", {
              file: file,
            }),
          ])
          .then((result) => {
            !result && ipcRenderer.invoke("mainProcess_openPath", file);
          });
      }
    });
  }

  /**
   * export to string
   *
   * @param {Object} profile
   * @returns {Promise} resolves upon finalizing all exporting with export string
   */
  #export(profile) {
    return new Promise((resolve, reject) => {
      // what texts to cover
      let useTexts = [];
      switch (profile.exportTexts) {
        case "allTexts":
          useTexts = theTextCollection
            ? theTextCollection.getAll()
            : theTextTree.getAll();
          break;
        case "checkedTexts":
          useTexts = theTextCollection
            ? theTextCollection.getChecked()
            : theTextTree.getChecked();
          break;
      }
      // what texts to cover for citations
      let useCitationTexts = [];
      switch (profile.exportCitationTexts) {
        case "allCitationTexts":
          useCitationTexts = theTextTree.getAll();
          break;
        case "checkedCitationTexts":
          useCitationTexts = theTextTree.getChecked();
          break;
        case "coveredCitationTexts":
          useCitationTexts = useTexts;
          break;
      }
      // what objects within texts to cover
      let useTextObjects = [];
      switch (profile.exportObjectsText) {
        case "allObjects":
          useTextObjects = theObjectTree.getObjects();
          break;
        case "checkedObjects":
          useTextObjects = theObjectTree.getChecked();
          break;
      }
      // what objects and their properties to cover
      let useObjects = [];
      switch (profile.exportObjects) {
        case "allObjects":
          useObjects = theObjectTree.getObjects();
          break;
        case "checkedObjects":
          useObjects = theObjectTree.getChecked();
          break;
        case "usedObjects":
          let o = {};
          useTexts.forEach((textID) => {
            Object.keys(theTextTree.getText(textID).objects).forEach(
              (objectID) => {
                o[objectID] = true;
              },
            );
          });
          // use the object's tree order
          theObjectTree.getObjects().forEach((objectID) => {
            if (o[objectID]) {
              useObjects.push(objectID);
            }
          });
          break;
      }

      let documentStatistics = theProject.statistics(useTexts);

      switch (profile.exportType) {
        case "txt":
          {
            // texts
            let textsExport = "";
            useTexts.forEach((textID) => {
              let textContents = Exporter.#deltaToText(
                Exporter.#textContentPlacegiver(
                  profile.exportType,
                  theTextTree.getText(textID).delta,
                  useTextObjects,
                  profile.objectStartEditor.ops,
                  profile.objectEndEditor.ops,
                ),
              );
              // each (non empty) text
              if (textContents != "" || !profile.ignoreEmptyTexts) {
                textsExport += Exporter.#deltaToText(
                  Exporter.#textPlacegiver(
                    profile.exportType,
                    profile.textEditor.ops,
                    textID,
                    textContents,
                  ),
                );
              }
            });

            // objects and their properties
            let objectsExport = "";
            useObjects.forEach((objectID) => {
              let objectContent = "";
              let propertyNames = [];
              let propertyTypes = [];
              let propertyContents = [];
              // objects properties: iterate all properties (including those inherited by parent objects)
              theObjectTree.getParents(objectID, false).forEach((oID) => {
                theObjectTree.getObject(oID).scheme.forEach((item) => {
                  let content = null;
                  let props = theObjectTree.getObject(objectID).properties;
                  if (props && props[oID] && props[oID][item.id]) {
                    content = props[oID][item.id];
                  }
                  objectContent += Exporter.#deltaToText(
                    this.#propertiesPlacegiver(
                      profile.objectPropertiesEditor.ops,
                      item,
                      profile.exportType,
                      content,
                    ),
                  );
                  // elements necessary for tabled export
                  propertyNames.push(
                    Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                      item,
                    ),
                  );
                  propertyTypes.push(
                    Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                      item,
                    ),
                  );
                  propertyContents.push(
                    Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                      item,
                      this,
                      profile.exportType,
                      content,
                    ),
                  );
                });
              });
              // reverse object relations
              theObjectTree.reverseRelations(objectID).forEach((revRel) => {
                objectContent += Exporter.#deltaToText(
                  this.#propertiesPlacegiver(
                    profile.objectPropertiesEditor.ops,
                    revRel,
                    profile.exportType,
                    revRel.content,
                  ),
                );
                // for tabled export
                propertyNames.push(
                  Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                    revRel,
                  ),
                );
                propertyTypes.push(
                  Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                    revRel,
                  ),
                );
                propertyContents.push(
                  Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                    revRel,
                    this,
                    profile.exportType,
                    revRel.content,
                  ),
                );
              });

              objectsExport += Exporter.#deltaToText(
                this.#objectPlacegiver(
                  profile.objectEditor.ops,
                  objectID,
                  profile.exportType,
                  objectContent,
                  useCitationTexts,
                  propertyNames,
                  propertyTypes,
                  propertyContents,
                ),
              );
            });

            // document
            resolve(
              Exporter.#deltaToText(
                Exporter.#documentPlacegiver(
                  profile.documentEditor.ops,
                  profile.exportType,
                  documentStatistics,
                  textsExport,
                  objectsExport,
                ),
              ),
            );
          }
          break;

        case "html":
          {
            // texts
            let textsExport = "";
            useTexts.forEach((textID) => {
              let textContents = Exporter.deltaToHTML(
                Exporter.#textContentPlacegiver(
                  profile.exportType,
                  theTextTree.getText(textID).delta,
                  useTextObjects,
                  profile.objectStartEditor.ops,
                  profile.objectEndEditor.ops,
                ),
                profile.textFormats ? this.#usedFormats : null,
                profile.objectFormats ? this.#usedObjects : null,
              );
              // each (non empty) text
              if (textContents != "" || !profile.ignoreEmptyTexts) {
                textsExport += Exporter.deltaToHTML(
                  Exporter.#textPlacegiver(
                    profile.exportType,
                    profile.textEditor.ops,
                    textID,
                    textContents,
                  ),
                  profile.textFormats ? this.#usedFormats : null,
                  profile.objectFormats ? this.#usedObjects : null,
                );
              }
            });

            // raster the maps
            let rasteredMaps = {};
            let promises = [];
            if (Exporter.#doExportProperties(profile)) {
              useObjects.forEach((objectID) => {
                theObjectTree.getParents(objectID, false).forEach((oID) => {
                  theObjectTree.getObject(oID).scheme.forEach((item) => {
                    if (item.type == "schemeTypes_map") {
                      let props = theObjectTree.getObject(objectID).properties;
                      if (props && props[oID] && props[oID][item.id]) {
                        promises.push(
                          Exporter.#rasterize(
                            rasteredMaps,
                            objectID,
                            item.id,
                            props[oID][item.id],
                          ),
                        );
                      }
                    }
                  });
                });
              });
            }
            Promise.allSettled(promises).then(() => {
              let objectsExport = "";
              useObjects.forEach((objectID) => {
                let objectContent = "";
                let propertyNames = [];
                let propertyTypes = [];
                let propertyContents = [];
                // objects properties: iterate all properties (including those inherited by parent objects)
                theObjectTree.getParents(objectID, false).forEach((oID) => {
                  theObjectTree.getObject(oID).scheme.forEach((item) => {
                    let content = null;
                    let props = theObjectTree.getObject(objectID).properties;
                    if (props && props[oID] && props[oID][item.id]) {
                      content = props[oID][item.id];
                    }
                    let mapImages = null;
                    if (
                      rasteredMaps &&
                      rasteredMaps[objectID] &&
                      rasteredMaps[objectID][item.id]
                    ) {
                      mapImages = rasteredMaps[objectID][item.id];
                    }
                    objectContent += Exporter.deltaToHTML(
                      this.#propertiesPlacegiver(
                        profile.objectPropertiesEditor.ops,
                        item,
                        profile.exportType,
                        content,
                        mapImages,
                      ),
                      profile.textFormats ? this.#usedFormats : null,
                      profile.objectFormats ? this.#usedObjects : null,
                    );
                    // elements necessary for tabled export
                    propertyNames.push(
                      Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                        item,
                      ),
                    );
                    propertyTypes.push(
                      Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                        item,
                      ),
                    );
                    propertyContents.push(
                      Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                        item,
                        this,
                        profile.exportType,
                        content,
                        mapImages,
                      ),
                    );
                  });
                });
                // reverse object relations
                theObjectTree.reverseRelations(objectID).forEach((revRel) => {
                  objectContent += Exporter.deltaToHTML(
                    this.#propertiesPlacegiver(
                      profile.objectPropertiesEditor.ops,
                      revRel,
                      profile.exportType,
                      revRel.content,
                      null,
                    ),
                    profile.textFormats ? this.#usedFormats : null,
                    profile.objectFormats ? this.#usedObjects : null,
                  );
                  // for tabled export
                  propertyNames.push(
                    Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                      revRel,
                    ),
                  );
                  propertyTypes.push(
                    Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                      revRel,
                    ),
                  );
                  propertyContents.push(
                    Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                      revRel,
                      this,
                      profile.exportType,
                      revRel.content,
                      null,
                    ),
                  );
                });

                objectsExport += Exporter.deltaToHTML(
                  this.#objectPlacegiver(
                    profile.objectEditor.ops,
                    objectID,
                    profile.exportType,
                    objectContent,
                    useCitationTexts,
                    propertyNames,
                    propertyTypes,
                    propertyContents,
                  ),
                  profile.textFormats ? this.#usedFormats : null,
                  profile.objectFormats ? this.#usedObjects : null,
                );
              });

              // document
              resolve(
                Exporter.deltaToHTML(
                  Exporter.#documentPlacegiver(
                    profile.documentEditor.ops,
                    profile.exportType,
                    documentStatistics,
                    textsExport,
                    objectsExport,
                  ),
                  profile.textFormats ? this.#usedFormats : null,
                  profile.objectFormats ? this.#usedObjects : null,
                ),
              );
            });
          }
          break;

        case "rtf":
          {
            // texts
            let textsExport = "";
            useTexts.forEach((textID) => {
              let textContents = this.#deltaToRTF(
                Exporter.#textContentPlacegiver(
                  profile.exportType,
                  theTextTree.getText(textID).delta,
                  useTextObjects,
                  profile.objectStartEditor.ops,
                  profile.objectEndEditor.ops,
                ),
                profile.textFormats,
                profile.objectFormats,
              );
              // each (non empty) text
              if (textContents != "" || !profile.ignoreEmptyTexts) {
                textsExport += this.#deltaToRTF(
                  Exporter.#textPlacegiver(
                    profile.exportType,
                    profile.textEditor.ops,
                    textID,
                    textContents,
                  ),
                  profile.textFormats,
                  profile.objectFormats,
                );
              }
            });

            // objects and their properties -- first determine if object properties will be exported as some preliminary steps (such as rasterizing maps) would then be necessary
            // raster the maps
            let rasteredMaps = {};
            let promises = [];
            if (Exporter.#doExportProperties(profile)) {
              useObjects.forEach((objectID) => {
                theObjectTree.getParents(objectID, false).forEach((oID) => {
                  theObjectTree.getObject(oID).scheme.forEach((item) => {
                    if (item.type == "schemeTypes_map") {
                      let props = theObjectTree.getObject(objectID).properties;
                      if (props && props[oID] && props[oID][item.id]) {
                        promises.push(
                          Exporter.#rasterize(
                            rasteredMaps,
                            objectID,
                            item.id,
                            props[oID][item.id],
                          ),
                        );
                      }
                    }
                  });
                });
              });
            }
            Promise.allSettled(promises).then(() => {
              let objectsExport = "";
              useObjects.forEach((objectID) => {
                let objectContent = "";
                let propertyNames = [];
                let propertyTypes = [];
                let propertyContents = [];
                // objects properties: iterate all properties (including those inherited by parent objects)
                theObjectTree.getParents(objectID, false).forEach((oID) => {
                  theObjectTree.getObject(oID).scheme.forEach((item) => {
                    let content = null;
                    let props = theObjectTree.getObject(objectID).properties;
                    if (props && props[oID] && props[oID][item.id]) {
                      content = props[oID][item.id];
                    }
                    let mapImages = null;
                    if (
                      rasteredMaps &&
                      rasteredMaps[objectID] &&
                      rasteredMaps[objectID][item.id]
                    ) {
                      mapImages = rasteredMaps[objectID][item.id];
                    }
                    objectContent += this.#deltaToRTF(
                      this.#propertiesPlacegiver(
                        profile.objectPropertiesEditor.ops,
                        item,
                        profile.exportType,
                        content,
                        mapImages,
                      ),
                      profile.textFormats,
                      profile.objectFormats,
                    );
                    // elements necessary for tabled export
                    propertyNames.push(
                      Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                        item,
                      ),
                    );
                    propertyTypes.push(
                      Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                        item,
                      ),
                    );
                    propertyContents.push(
                      Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                        item,
                        this,
                        profile.exportType,
                        content,
                        mapImages,
                      ),
                    );
                  });
                });
                // reverse object relations
                theObjectTree.reverseRelations(objectID).forEach((revRel) => {
                  objectContent += this.#deltaToRTF(
                    this.#propertiesPlacegiver(
                      profile.objectPropertiesEditor.ops,
                      revRel,
                      profile.exportType,
                      revRel.content,
                    ),
                    profile.textFormats,
                    profile.objectFormats,
                  );
                  // for tabled export
                  propertyNames.push(
                    Exporter.#propertyPlaceholders.propertyNamePlaceholder.function(
                      revRel,
                    ),
                  );
                  propertyTypes.push(
                    Exporter.#propertyPlaceholders.propertyTypePlaceholder.function(
                      revRel,
                    ),
                  );
                  propertyContents.push(
                    Exporter.#propertyPlaceholders.propertyContentPlaceholder.function(
                      revRel,
                      this,
                      profile.exportType,
                      revRel.content,
                    ),
                  );
                });

                objectsExport += this.#deltaToRTF(
                  this.#objectPlacegiver(
                    profile.objectEditor.ops,
                    objectID,
                    profile.exportType,
                    objectContent,
                    useCitationTexts,
                    propertyNames,
                    propertyTypes,
                    propertyContents,
                  ),
                  profile.textFormats,
                  profile.objectFormats,
                );
              });

              // document
              resolve(
                this.#deltaToRTF(
                  Exporter.#documentPlacegiver(
                    profile.documentEditor.ops,
                    profile.exportType,
                    documentStatistics,
                    textsExport,
                    objectsExport,
                  ),
                  profile.textFormats,
                  profile.objectFormats,
                ),
              );
            });
          }
          break;

        case "docx":
          // texts
          let textsExport = [];
          useTexts.forEach((textID) => {
            let textContents = Exporter.#textContentPlacegiver(
              profile.exportType,
              theTextTree.getText(textID).delta,
              useTextObjects,
              profile.objectStartEditor.ops,
              profile.objectEndEditor.ops,
            );
            // each (non empty) text
            if (textContents.length || !profile.ignoreEmptyTexts) {
              textsExport = textsExport.concat(
                Exporter.#deltaToDocx(
                  Exporter.#textPlacegiver(
                    profile.exportType,
                    profile.textEditor.ops,
                    textID,
                    textContents,
                  ),
                ),
              );
            }
          });
          resolve(textsExport, profile.textFormats, profile.objectFormats);
          break;
      }
    });
  }

  /**
   * determine if for this profile object properties will be exported
   * @static
   *
   * @param {Object} profile
   * @returns {Boolean}
   */
  static #doExportProperties(profile) {
    for (let i = 0; i < profile.documentEditor.ops.length; i++) {
      let op = profile.documentEditor.ops[i];
      if (op.insert && op.insert.placeholder == "objsBlockPlaceholder") {
        for (let j = 0; j < profile.objectEditor.ops.length; j++) {
          let op = profile.objectEditor.ops[j];
          if (
            op.insert &&
            (op.insert.placeholder == "objContentBlockPlaceholder" ||
              op.insert.placeholder == "objContentTablePlaceholder")
          ) {
            for (
              let k = 0;
              k < profile.objectPropertiesEditor.ops.length;
              k++
            ) {
              let op = profile.objectPropertiesEditor.ops[k];
              if (
                op.insert &&
                op.insert.placeholder == "propertyContentPlaceholder"
              ) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * substitute document placeholders with actual values
   * @static
   *
   * @param {Object[]} deltaOps
   * @param {String} exportType
   * @param {Object} statistics
   * @param {String} textsExport
   * @param {String} objectsExport
   * @returns {Object[]}
   */
  static #documentPlacegiver(
    deltaOps,
    exportType,
    statistics,
    textsExport,
    objectsExport,
  ) {
    let newOps = [];
    deltaOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      if (op.insert && op.insert.placeholder) {
        if (
          Object.keys(Exporter.#documentPlaceholders).includes(
            op.insert.placeholder,
          )
        ) {
          Object.assign(
            newOp,
            Exporter.#documentPlaceholders[op.insert.placeholder].function(
              exportType,
              statistics,
              textsExport,
              objectsExport,
            ),
          );
        }
      }
      newOps.push(newOp);
    });
    return newOps;
  }

  /**
   * substitute text placeholders with actual values
   *
   * @param {String} exportType
   * @param {Object[]} deltaOps
   * @param {String} textID
   * @param {String} textContents
   * @returns {Object[]}
   */
  static #textPlacegiver(exportType, deltaOps, textID, textContents) {
    let newOps = [];
    deltaOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      if (op.insert && op.insert.placeholder) {
        if (
          Object.keys(Exporter.#textPlaceholders).includes(
            op.insert.placeholder,
          )
        ) {
          if (Array.isArray(textContents)) {
            for (let i = 0; i < textContents.length - 1; i++) {
              newOps.push(
                Exporter.#textPlaceholders[op.insert.placeholder].function(
                  textID,
                  textContents[i],
                  exportType,
                ),
              );
            }
            textContents = textContents[textContents.length];
          }
          Object.assign(
            newOp,
            Exporter.#textPlaceholders[op.insert.placeholder].function(
              textID,
              textContents,
              exportType,
            ),
          );
        }
      }
      newOps.push(newOp);
    });
    return newOps;
  }

  /**
   * substitute text content placeholder
   * @static
   *
   * @param {String} exportType
   * @param {Object[]} deltaOps
   * @param {String[]} useObjects ids of obejcts to use for textObject placeholders
   * @param {Object[]} startOps
   * @param {Object[]} endOps
   * @returns {Object[]}
   */
  static #textContentPlacegiver(
    exportType,
    deltaOps,
    useObjects,
    startOps,
    endOps,
  ) {
    let newOps = [];
    deltaOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      let before = "";
      let after = "";
      if (op.attributes) {
        Object.keys(op.attributes).forEach((attr) => {
          if (attr.startsWith("object")) {
            let objectID = attr.slice(6);
            if (useObjects.includes(objectID)) {
              before += Exporter.#objectTextPlacegiver(
                startOps,
                objectID,
                exportType,
              );
              after += Exporter.#objectTextPlacegiver(
                endOps,
                objectID,
                exportType,
              );
            } else {
              // if this object is ignored, remove the attribute
              delete newOp.attributes[attr];
            }
          }
        });
      }
      if (typeof op.insert != "object") {
        newOp.insert = before + op.insert + after;
        newOps.push(newOp);
      } else {
        if (before) {
          newOps.push({ insert: before });
        }
        newOps.push(newOp);
        if (after) {
          newOps.push({ insert: after });
        }
      }
    });
    return newOps;
  }

  /**
   * substitute text objects placeholders
   * @static
   *
   * @param {Object[]} deltaOps
   * @param {String} objectID
   * @param {String} exportType
   * @returns {Object[]}
   */
  static #objectTextPlacegiver(deltaOps, objectID, exportType) {
    let text = "";
    deltaOps.forEach((op) => {
      let insert = op.insert;
      if (op.insert && op.insert.placeholder) {
        if (
          Object.keys(Exporter.#objectTextPlaceholders).includes(
            op.insert.placeholder,
          )
        ) {
          insert = Exporter.#objectTextPlaceholders[
            op.insert.placeholder
          ].function(objectID, exportType).insert;
        }
      }
      text += insert;
    });
    // remove all "\n"
    return text.replace(/\n/g, "");
  }

  /**
   * substitute object placeholders with actual values (not static!)
   *
   * @param {Object[]} deltaOps
   * @param {String} objectID
   * @param {String} exportType
   * @param {String} objectContents
   * @param {String[]} useCitationTexts
   * @param {Object[]} propertyNames
   * @param {Object[]} propertyTypes
   * @param {Object[]} propertyContents
   * @returns {Object[]}
   */
  #objectPlacegiver(
    deltaOps,
    objectID,
    exportType,
    objectContents,
    useCitationTexts,
    propertyNames,
    propertyTypes,
    propertyContents,
  ) {
    let newOps = [];
    deltaOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      if (op.insert && op.insert.placeholder) {
        if (
          Object.keys(Exporter.#objectPlaceholders).includes(
            op.insert.placeholder,
          )
        ) {
          Object.assign(
            newOp,
            Exporter.#objectPlaceholders[op.insert.placeholder].function(
              objectID,
              exportType,
              objectContents,
              useCitationTexts,
              propertyNames,
              propertyTypes,
              propertyContents,
              this,
            ),
          );
        }
      }
      newOps.push(newOp);
    });
    return newOps;
  }

  /**
   * substitute object property placeholders with actual values (not static!)
   *
   * @param {Object[]} deltaOps
   * @param {*} item
   * @param {String} exportType
   * @param {*} content
   * @param {*} mapImages
   * @returns {Object[]}
   */
  #propertiesPlacegiver(deltaOps, item, exportType, content, mapImages) {
    let newOps = [];
    deltaOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      if (op.insert && op.insert.placeholder) {
        if (
          Object.keys(Exporter.#propertyPlaceholders).includes(
            op.insert.placeholder,
          )
        ) {
          Object.assign(
            newOp,
            Exporter.#propertyPlaceholders[op.insert.placeholder].function(
              item,
              this,
              exportType,
              content,
              mapImages,
            ),
          );
        }
      }
      newOps.push(newOp);
    });
    return newOps;
  }

  /**
   * convert delta to simple text
   * @static
   *
   * @param {Object[]} deltaOps
   * @returns {String}
   */
  static #deltaToText(deltaOps) {
    let text = "";
    let doImages = theSettings.effectiveSettings().exportTextImage;
    deltaOps.forEach((op) => {
      if (typeof op.insert != "object") {
        text += op.insert;
      } else if (doImages) {
        // images
        text += _("image_reference", {
          title: op.attributes.title ? ` "${op.attributes.title}"` : "",
          width: op.attributes.width,
          height: op.attributes.height,
        });
      }
    });
    return text;
  }

  /**
   * convert delta to rtf
   *
   * @param {Object[]} deltaOps
   * @param {Boolean} doFormats
   * @param {Boolean} doObjects
   * @returns {String}
   */
  #deltaToRTF(deltaOps, doFormats = true, doObjects = true) {
    let blocks = [];
    let text = "";
    let formatID = UUID0;
    let hasFormat = false;
    for (let i = 0; i < deltaOps.length; i++) {
      let op = deltaOps[i];
      if (op.isCooked && op.isBlock) {
        blocks.push(...this.#textToRTF(text, formatID));
        text = "";
        formatID = UUID0;
        blocks.push(op.insert);
        if (
          i < deltaOps.length - 1 &&
          deltaOps[i + 1].insert.startsWith("\n")
        ) {
          // ignore "\n" of placeholder block
          deltaOps[i + 1].insert = deltaOps[i + 1].insert.substring(1);
        }
      } else {
        let objectIDs = [];
        let exportString = "";
        if (op.isCooked) {
          exportString = op.insert;
        } else if (typeof op.insert != "object") {
          exportString = Exporter.#escapeRTF(op.insert);
        } else {
          exportString = `{\\*\\shppict{\\pict\\picw${parseInt(
            op.attributes.width,
          )}\\pich${parseInt(op.attributes.height)}\\picwgoal${Math.floor(
            (parseInt(op.attributes.width) / 180) * 1440,
          )}\\pichgoal${Math.floor(
            (parseInt(op.attributes.height) / 180) * 1440,
          )}\\pngblip ${Buffer.from(
            op.insert.image.split(",")[1],
            "base64",
          ).toString("hex")}}}`;
          // for block alignments put image in a paragraph
          // @todo to reflect left/center/right alignment we could create a new block accordingly -- this is left for future enhancement
          if (DIMImage.alignments.slice(3).includes(op.attributes.alignment)) {
            exportString = `\n${exportString}\n`;
          }
        }
        if ("attributes" in op) {
          let rtfControls = "";
          Object.keys(op.attributes).forEach((attr) => {
            switch (attr) {
              case "bold":
                rtfControls += "\\b1";
                break;
              case "italic":
                rtfControls += "\\i1";
                break;
              case "underline":
                rtfControls += "\\ul1";
                break;
              case "strike":
                rtfControls += "\\strike1";
                break;
              default:
                if (attr.startsWith("format") && doFormats) {
                  hasFormat = true;
                  formatID = attr.substring("format".length);
                } else if (attr.startsWith("object") && doObjects) {
                  let objectID = attr.substring("object".length);
                  objectIDs.push(objectID);
                  let fac = theObjectTree
                    .objectStyle(objectID)
                    .fontsAndColors();
                  fac.fonts.forEach((font) => {
                    if (!this.#fontTable.includes(font)) {
                      this.#fontTable.push(font);
                    }
                  });
                  fac.colors.forEach((color) => {
                    if (!this.#colorTable.includes(color)) {
                      this.#colorTable.push(color);
                    }
                  });
                  rtfControls += StylingControls.controls2RTF(
                    theObjectTree.objectStyle(objectID).styleProperties.text,
                    theFormats.formats[UUID0].formats_fontSize,
                    this.#fontTable,
                    this.#colorTable,
                  );
                }
                break;
            }
          });
          if (rtfControls) {
            exportString = `{${rtfControls} ${exportString}}`;
          }
        }
        if (formatID && !this.#styleTable.includes(formatID)) {
          this.#styleTable.push(formatID);
          this.#usedFormats[formatID] = theFormats.formats[formatID];
          let [font, c1, c2] = Formats.fontAndColors(
            theFormats.formats[formatID],
          );
          if (font && !this.#fontTable.includes(font)) {
            this.#fontTable.push(font);
          }
          if (c1 && !this.#colorTable.includes(c1)) {
            this.#colorTable.push(c1);
          }
          if (c2 && !this.#colorTable.includes(c2)) {
            this.#colorTable.push(c2);
          }
        }
        objectIDs.forEach((objectID) => {
          if (!this.#styleTable.includes(objectID)) {
            this.#styleTable.push(objectID);
            this.#usedObjects[objectID] = new StyledObject();
            this.#usedObjects[objectID].styleProperties =
              theObjectTree.objectStyle(objectID).styleProperties;
          }
        });

        text += exportString;
        if (hasFormat) {
          blocks.push(...this.#textToRTF(text, formatID));
          text = "";
          formatID = UUID0;
          hasFormat = false;
        }
      }
    }
    blocks.push(...this.#textToRTF(text, formatID));
    let rtf = blocks.join("");
    return rtf;
  }

  /**
   * convert text to rtf using given format
   *
   * @param {String} text
   * @param {Object} format
   * @returns {String[]}
   */
  #textToRTF(text, format) {
    let blocks = [];
    if (text) {
      if (text.endsWith("\n")) {
        text = text.substring(0, text.length - 1);
      }
      let paras = text.split("\n");
      if (format) {
        let lastPara = paras.pop();
        blocks.unshift(
          `\\pard\\plain${Formats.formatToRTF(
            theFormats.effectiveFormat(format),
            this.#fontTable,
            this.#colorTable,
            this.#styleTable.indexOf(format),
          )} ${lastPara}\\par\n`,
        );
      }
      for (let i = paras.length - 1; i >= 0; i--) {
        blocks.unshift(
          `\\pard\\plain${Formats.formatToRTF(
            this.#usedFormats[UUID0],
            this.#fontTable,
            this.#colorTable,
            this.#styleTable.indexOf(UUID0),
          )} ${paras[i]}\\par\n`,
        );
      }
    }
    return blocks;
  }

  /**
   * convert delta to html
   *
   * @param {Object[]} deltaOps
   * @param {} usedFormats
   * @param {} usedObjects
   * @returns {String} html result
   */
  static deltaToHTML(deltaOps, usedFormats = null, usedObjects = null) {
    let blocks = [];
    let text = "";
    let formatClass = "";
    let hasFormat = false;
    for (let i = 0; i < deltaOps.length; i++) {
      let op = deltaOps[i];
      if (op.isCooked && op.isBlock) {
        blocks.push(...Exporter.#textToHTML(text, formatClass));
        text = "";
        formatClass = "";
        blocks.push(op.insert);
        if (
          i < deltaOps.length - 1 &&
          deltaOps[i + 1].insert.startsWith("\n")
        ) {
          // ignore "\n" of placeholder block
          deltaOps[i + 1].insert = deltaOps[i + 1].insert.substring(1);
        }
      } else {
        let objectClasses = [];
        let exportString;
        if (op.isCooked) {
          exportString = op.insert;
        } else if (typeof op.insert != "object") {
          exportString = Util.escapeHTML(op.insert);
        } else {
          // images
          let style = "";
          Object.keys(op.attributes).forEach((att) => {
            if (att in DIMImage.styles) {
              for (let [k, v] of Object.entries(
                DIMImage.styles[att][op.attributes[att]],
              )) {
                style += `${k}:${v};`;
              }
            }
          });
          exportString = `<img src="${op.insert.image}" width="${op.attributes.width}" height="${op.attributes.height}" style="${style}" ${op.attributes.title ? `title="${op.attributes.title}"` : ""}>`;
        }
        if ("attributes" in op) {
          Object.keys(op.attributes).forEach((attr) => {
            switch (attr) {
              case "bold":
                exportString = `<strong>${exportString}</strong>`;
                break;
              case "italic":
                exportString = `<em>${exportString}</em>`;
                break;
              case "underline":
                exportString = `<u>${exportString}</u>`;
                break;
              case "strike":
                exportString = `<s>${exportString}</s>`;
                break;
              default:
                if (attr.startsWith("format") && usedFormats) {
                  hasFormat = true;
                  let formatID = attr.substring("format".length);
                  if (formatID != UUID0) {
                    usedFormats[formatID] = theFormats.formats[formatID];
                    formatClass = `${attr}-${op.attributes[attr]}`;
                  }
                } else if (attr.startsWith("object") && usedObjects) {
                  objectClasses.push(`${attr}-${op.attributes[attr]}`);
                  let objectID = attr.substring("object".length);
                  usedObjects[objectID] = new StyledObject();
                  usedObjects[objectID].styleProperties =
                    theObjectTree.objectStyle(objectID).styleProperties;
                }
                break;
            }
          });
        }
        if (objectClasses.length) {
          exportString = `<span class="${objectClasses.join(
            " ",
          )}">${exportString}</span>`;
        }

        text += exportString;
        if (hasFormat) {
          blocks.push(...Exporter.#textToHTML(text, formatClass));
          text = "";
          formatClass = "";
          hasFormat = false;
        }
      }
    }
    blocks.push(...Exporter.#textToHTML(text, formatClass));
    let html = blocks.join("");
    return html;
  }

  /**
   * convert text to html using given format
   *
   * @param {String} text
   * @param {Object} format
   * @returns {String[]}
   */
  static #textToHTML(text, format) {
    let blocks = [];
    if (text) {
      if (text.endsWith("\n")) {
        text = text.substring(0, text.length - 1);
      }
      let paras = text.split("\n");
      if (format) {
        let lastPara = paras.pop();
        blocks.unshift(
          `<p class="${format}">${lastPara ? lastPara : "<br>"}</p>`,
        );
      }
      for (let i = paras.length - 1; i >= 0; i--) {
        blocks.unshift(`<p>${paras[i] ? paras[i] : "<br>"}</p>`);
      }
    }
    return blocks;
  }

  /**
   * convert delta to docx structure
   *
   * @param {Object[]} deltaOps
   * @param {Boolean} doFormats
   * @param {Boolean} doObjects
   * @returns {docx.Paragraph[]} suitable as children element of a docx section
   */
  static #deltaToDocx(deltaOps, doFormats = true, doObjects = true) {
    let text = "";
    deltaOps.forEach((op) => {
      // if (Array.isArray(op.insert)) {
      //   op.insert.forEach((op1) => {
      //     if (typeof op1.insert != "object") {
      //       text += op1.insert;
      //     }
      //   });
      // } else
      if (typeof op.insert != "object") {
        text += op.insert;
      }
    });
    return Exporter.#textToDocx(text);
  }

  static #textToDocx(text) {
    let blocks = [];
    if (text) {
      if (text.endsWith("\n")) {
        text = text.substring(0, text.length - 1);
      }
      let paras = text.split("\n");
      for (let i = paras.length - 1; i >= 0; i--) {
        blocks.unshift(
          new docx.Paragraph({
            children: [new docx.TextRun(paras[i])],
          }),
        );
      }
    }
    return blocks;
  }

  /**
   * build rtf stylesheet
   *
   * @returns {String}
   */
  #rtfStylesheet() {
    let rtf = `{\\stylesheet `;
    for (let i = 0; i < this.#styleTable.length; i++) {
      let id = this.#styleTable[i];
      if (this.#usedFormats[id]) {
        rtf += `{\\s${i} ${Formats.formatToRTF(
          theFormats.effectiveFormat(id),
          this.#fontTable,
          this.#colorTable,
        )} ${Exporter.#escapeRTF(theFormats.formats[id].formats_name)};}`;
      }
    }
    return rtf + `}\n`;
  }

  /**
   * build rtf color table
   *
   * @returns {String}
   */
  #rtfColorTable() {
    let rtf = "{\\colortbl";
    this.#colorTable.forEach((color) => {
      let [r, g, b] = Util.hexToRgb(color);
      rtf += `\\red${r}\\green${g}\\blue${b};`;
    });
    return `${rtf}}\n`;
  }

  /**
   * build rtf font table
   *
   * @returns {String}
   */
  #rtfFontTable() {
    let rtf = `{\\fonttbl`;
    for (let i = 0; i < this.#fontTable.length; i++) {
      // remove possible quotes
      let fontName = this.#fontTable[i];
      let m = fontName.match(/['"](.*)['"]/);
      if (m) {
        fontName = m[1];
      }
      let family = "\\fnil";
      if (Fonts.rtfFamilies[fontName]) {
        family = `\\${Fonts.rtfFamilies[fontName]}`;
      }
      rtf += `{\\f${i}${family}\\fcharset0 ${fontName};}`;
    }
    return `${rtf}}\n`;
  }

  /**
   * rasterize leaflet maps
   * @static
   *
   * @param {Object} rasterMaps
   * @param {String} objectID
   * @param {String} itemID
   * @param {Object} mapContents
   * @returns
   */
  static #rasterize(rasterMaps, objectID, itemID, mapContents) {
    return new Promise((resolve) => {
      if (
        !navigator.onLine ||
        theSettings.effectiveSettings().exportRasterizeMaps == "noRaster"
      ) {
        resolve("noraster");
      } else {
        if (!rasterMaps[objectID]) {
          rasterMaps[objectID] = {};
        }
        if (!rasterMaps[objectID][itemID]) {
          rasterMaps[objectID][itemID] = {};
        }

        let bounds;
        if (mapContents.marker.length) {
          let minLat = 99;
          let maxLat = -99;
          let minLng = 99999;
          let maxLng = -99999;
          mapContents.marker.forEach((marker) => {
            if (marker.latLng.lat < minLat) {
              minLat = marker.latLng.lat;
            }
            if (marker.latLng.lat > maxLat) {
              maxLat = marker.latLng.lat;
            }
            if (marker.latLng.lng < minLng) {
              minLng = marker.latLng.lng;
            }
            if (marker.latLng.lng > maxLng) {
              maxLng = marker.latLng.lng;
            }
          });
          bounds = [
            [minLat, minLng],
            [maxLat, maxLng],
          ];
        }

        let promises = [];
        if (
          theSettings.effectiveSettings().exportRasterizeMaps != "detailRaster"
        ) {
          promises.push(
            Exporter.#rasterizeOne(
              rasterMaps[objectID][itemID],
              0,
              theSettings.effectiveSettings().exportOverwiewmapWidth,
              theSettings.effectiveSettings().exportOverwiewmapHeight,
              bounds,
              parseInt(
                theSettings.effectiveSettings().exportOverwiewmapMaxZoom,
              ),
              mapContents.marker.map((marker) => marker.latLng),
            ),
          );
        }
        if (
          theSettings.effectiveSettings().exportRasterizeMaps !=
          "overviewRaster"
        ) {
          for (let i = 0; i < mapContents.marker.length; i++) {
            promises.push(
              Exporter.#rasterizeOne(
                rasterMaps[objectID][itemID],
                i + 1,
                theSettings.effectiveSettings().exportDetailmapWidth,
                theSettings.effectiveSettings().exportDetailmapHeight,
                [mapContents.marker[i].latLng, mapContents.marker[i].latLng],
                parseInt(
                  theSettings.effectiveSettings().exportDetailmapMaxZoom,
                ),
                [mapContents.marker[i].latLng],
              ),
            );
          }
        }
        Promise.allSettled(promises).then(() => {
          resolve("ok");
        });
      }
    });
  }

  /**
   * rasterize one leaflet map
   * @static
   *
   * @param {*} rasterMap
   * @param {*} mapIndex
   * @param {*} width
   * @param {*} height
   * @param {*} bounds
   * @param {*} maxZoom
   * @param {*} markers
   * @returns
   */
  static #rasterizeOne(
    rasterMap,
    mapIndex,
    width,
    height,
    bounds,
    maxZoom,
    markers,
  ) {
    return new Promise((resolve, reject) => {
      let $rasterizeDiv = $("<div>").attr({
        style: `position:absolute; top:-5000px; left:-5000px; width:${width}px; height:${height}px; visibility:hidden; z-index:-1`,
      });
      $("body").append($rasterizeDiv);
      let rasterizeMap = Leaflet.map($rasterizeDiv[0], {
        attributionControl: false,
        layers: [
          Leaflet.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          ),
        ],
        preferCanvas: true,
      });
      rasterizeMap.fitBounds(bounds, { maxZoom: maxZoom, padding: [20, 20] });

      markers.forEach((latLng) => {
        Leaflet.marker(latLng).addTo(rasterizeMap);
      });

      leafletImage(rasterizeMap, (err, canvas) => {
        rasterMap[mapIndex] = canvas.toDataURL();
        $rasterizeDiv.remove();
        resolve("ok");
      });
    });
  }
}
