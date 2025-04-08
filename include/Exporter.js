/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Exporter class
 */

/*
@TODO rowspan in text citation table bei gleichen Texten
@TODO rtf
@TODO docx
@TODO odf
@TODO markdown
*/

/*
structure of exporter JSON intermediate format
this JSON format ist derived from deltaOps and inserted by ...placegiver functions
the eventual export format (text | html | rtf | docx | ...) is built from this JSON format

document = [ paragraph* ]
paragraph = { content: [ element* ], format: String }
element = text | image | table
text = { type: "text", content: String, bold: Boolean, ..., objects: [ String* ] }
image = { type: "image", content: String, alignment: String, title: String, width: Int, height: Int }
table = { type: "table", rows: Int, cols: Int, header: Boolean, width: [ Int* ], content: [ row* ]}
row = [ cell* ]
cell = { content: type | image | Object[], rowSpan: Int, colSpan: Int }
*/

/**
 * @classdesc Exporter combines all functionality to export a project's information to common formats like HTML or RTF
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
   * string for path building (text and object paths)
   * @static
   */
  static #pathSeparator = " &#10142; ";

  /**
   * document level placeholders
   */
  static #documentPlaceholders = {
    // document title
    projectTitlePlaceholder: {
      function: () => {
        return { type: "text", content: theProperties.title };
      },
    },
    // document subtitle
    projectSubtitlePlaceholder: {
      function: () => {
        return { type: "text", content: theProperties.subtitle };
      },
    },
    // document author
    projectAuthorPlaceholder: {
      function: () => {
        return { type: "text", content: theProperties.author };
      },
    },
    // document infos (possibly multiple paragraphs)
    projectInfoPlaceholder: {
      function: () => {
        let result = [];
        let infoParagraphs = theProperties.info.split("\n");
        let lastPara = infoParagraphs.pop();
        infoParagraphs.forEach((p) =>
          result.push({
            type: "paragraph",
            content: [{ type: "text", content: p }],
          }),
        );
        result.push({ type: "text", content: lastPara });
        return result;
      },
    },
    // creation time
    projectCreatedPlaceholder: {
      function: () => {
        return {
          type: "text",
          content: theProject.created
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
          type: "text",
          content: theProject.changed
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
          type: "text",
          content: new Timestamp().toLocalString(
            theSettings.effectiveSettings().dateTimeFormatLong,
          ),
        };
      },
    },
    // storage version
    projectVersionPlaceholder: {
      function: () => {
        return {
          type: "text",
          content: theProject.version ? theProject.version : "---",
        };
      },
    },
    // storage path
    projectPathPlaceholder: {
      function: () => {
        return {
          type: "text",
          content: theProject.path ? theProject.path : "---",
        };
      },
    },
    // character count
    projectCharactersPlaceholder: {
      function: (statistics) => {
        return { type: "text", content: statistics.characters };
      },
    },
    // word count
    projectWordsPlaceholder: {
      function: (statistics) => {
        return { type: "text", content: statistics.words };
      },
    },
    // exported texts (see textPlaceholders)
    textsBlockPlaceholder: {
      block: true,
      function: (statistics, textsExport) => {
        return textsExport;
      },
    },
    // exported objects (see objectPlaceholders)
    objsBlockPlaceholder: {
      block: true,
      function: (statistics, textsExport, objectsExport) => {
        return objectsExport;
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
          type: "text",
          content: theTextTree.getText(textID).name,
        };
      },
    },
    // text path in tree
    textPathPlaceholder: {
      function: (textID) => {
        return {
          type: "text",
          content: theTextTree.getParents(textID).join(Exporter.#pathSeparator),
        };
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
              type: "text",
              content:
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
              type: "text",
              content:
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
              type: "text",
              content:
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
          type: "text",
          content: theTextTree
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
          type: "text",
          content: theTextTree
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
        return {
          type: "text",
          content: theTextTree.getText(textID).characters,
        };
      },
    },
    // word count
    textWordsPlaceholder: {
      function: (textID) => {
        return { type: "text", content: theTextTree.getText(textID).words };
      },
    },
    // text contents
    textContentBlockPlaceholder: {
      block: true,
      function: (textID, textContents) => {
        return textContents;
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
          type: "text",
          content: theObjectTree.getObject(objectID).name,
        };
      },
    },
    // object path in tree
    objPathPlaceholder: {
      function: (objectID) => {
        return {
          type: "text",
          content: theObjectTree
            .getParents(objectID)
            .join(Exporter.#pathSeparator),
        };
      },
    },
    // creation time
    objCreatedPlaceholder: {
      function: (objectID) => {
        return {
          type: "text",
          content: theObjectTree
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
          type: "text",
          content: theObjectTree
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
      function: (objectID, objectContents) => {
        return objectContents;
      },
    },
    // objects contents (as table)
    objContentTablePlaceholder: {
      block: true,
      function: (
        objectID,
        objectContents,
        useCitationTexts,
        propertyNames,
        propertyTypes,
        propertyContents,
      ) => {
        let tableContent = [
          [
            {
              content: {
                type: "text",
                content: _("Scheme_propertyName"),
                bold: true,
              },
            },
            {
              content: {
                type: "text",
                content: _("Scheme_propertyType"),
                bold: true,
              },
            },
            {
              content: {
                type: "text",
                content: _("Scheme_propertyContent"),
                bold: true,
              },
            },
          ],
        ];
        for (let i = 0; i < propertyNames.length; i++) {
          if ("content" in propertyNames[i]) {
            tableContent.push([
              {
                content: propertyNames[i],
              },
              { content: propertyTypes[i] },
              { content: propertyContents[i] },
            ]);
          }
          // scheme headers - they span the whole row
          else {
            tableContent.push([
              {
                content: Object.assign({ italic: true }, propertyContents[i]),
                rowSpan: 3,
              },
              { content: { type: "text", content: "" } },
              { content: { type: "text", content: "" } },
            ]);
          }
        }
        console.log({ tableContent });
        return {
          type: "table",
          rows: propertyNames.length,
          cols: 3,
          width: [20, 20, 60],
          header: true,
          content: tableContent,
        };
      },
    },
    // sample text styled with object style (useless for txt exports)
    objStyleSamplePlaceholder: {
      block: true,
      function: (objectID) => {
        let paras = [];
        (
          theSettings.effectiveSettings().exportTextSample ||
          _("sampleTexts_medium")
        )
          .split("\n")
          .forEach((p) => {
            paras.push({
              type: "paragraph",
              content: [{ type: "text", content: p, objects: [objectID] }],
            });
          });
        return paras;
      },
    },
    // object references (text passages linked with the object)
    objTextReferencesPlaceholder: {
      block: true,
      function: (objectID, objectContents, useCitationTexts) => {
        let paras = [];
        theObjectTree
          .getObject(objectID)
          .textReferences("") // return as raw
          .forEach((objRef) => {
            if (objRef.object == objectID) {
              objRef.references.forEach((textRef) => {
                if (useCitationTexts.includes(textRef.text)) {
                  paras.push({
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        content: theTextTree.getText(textRef.text).name,
                        bold: true,
                      },
                    ],
                  });
                  textRef.citations.forEach((citation) => {
                    let c = [];
                    citation.parts.forEach((part) => {
                      if (typeof part.content == "object")
                        c.push({
                          type: "image",
                          content: part.content.insert.image,
                          width: part.content.attributes.width,
                          height: part.content.attributes.height,
                          title: part.content.attributes.title,
                        });
                      else
                        c.push({
                          type: "text",
                          content: part.content,
                        });
                    });
                    paras.push({
                      type: "paragraph",
                      content: c,
                    });
                  });
                }
              });
            }
          });
        return paras;
      },
    },
    // object references as table
    objTextReferencesTablePlaceholder: {
      block: true,
      function: (objectID, objectContents, useCitationTexts) => {
        let tableContent = [
          [
            {
              content: {
                type: "text",
                content: _("mainWindow_textName"),
                bold: true,
              },
            },
            {
              content: {
                type: "text",
                content: _("mainWindow_citation"),
                bold: true,
              },
            },
          ],
        ];
        let rows = 1;
        theObjectTree
          .getObject(objectID)
          .textReferences("") // return as raw
          .forEach((objRef) => {
            if (objRef.object == objectID) {
              objRef.references.forEach((textRef) => {
                if (useCitationTexts.includes(textRef.text)) {
                  textRef.citations.forEach((citation) => {
                    rows++;
                    let tableRow = [
                      {
                        content: {
                          type: "text",
                          content: theTextTree.getText(textRef.text).name,
                        },
                      },
                    ];
                    let c = [];
                    citation.parts.forEach((part) => {
                      if (typeof part.content == "object")
                        c.push({
                          type: "image",
                          content: part.content.insert.image,
                          width: part.content.attributes.width,
                          height: part.content.attributes.height,
                          title: part.content.attributes.title,
                        });
                      else
                        c.push({
                          type: "text",
                          content: part.content,
                        });
                    });
                    tableRow.push({
                      content: c,
                    });
                    tableContent.push(tableRow);
                  });
                }
              });
            }
          });
        return {
          type: "table",
          rows: rows,
          cols: 2,
          width: [30, 70],
          header: true,
          content: tableContent,
        };
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
          type: "text",
          content: theObjectTree.getObject(objectID).name,
        };
      },
    },
    // upper cased
    objTextNameUpperPlaceholder: {
      function: (objectID) => {
        return {
          type: "text",
          content: theObjectTree.getObject(objectID).name.toUpperCase(),
        };
      },
    },
    // path in object tree
    objTextPathPlaceholder: {
      function: (objectID) => {
        return {
          type: "text",
          content: theObjectTree
            .getParents(objectID)
            .join(Exporter.#pathSeparator),
        };
      },
    },
    // upper cased
    objTextPathUpperPlaceholder: {
      function: (objectID) => {
        return {
          type: "text",
          content: theObjectTree
            .getParents(objectID)
            .join(Exporter.#pathSeparator)
            .toUpperCase(),
        };
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
            return [];
            break;
          default:
            return { type: "text", content: item.name };
            break;
        }
      },
    },
    // property type
    propertyTypePlaceholder: {
      function: (item) => {
        switch (item.type) {
          case "schemeTypes_header":
            return [];
            break;
          case "schemeTypes_select":
          case "schemeTypes_radio":
            return {
              type: "text",
              content: `${_(item.type)} (${_("Scheme_selectList", {
                list: item.params[0].split("#").join(", "),
              })})`,
            };
            break;
          case "schemeTypes_range":
            return {
              type: "text",
              content: `${_(item.type)} (${_("Scheme_rangeMinMax", {
                min: item.params[0],
                max: item.params[1],
              })})`,
            };
            break;
          default:
            return { type: "text", content: _(item.type) };
            break;
        }
      },
    },
    // property content
    propertyContentPlaceholder: {
      block: true,
      function: (item, content, mapImages) => {
        // for headers we put their name as content, while name and type fields are empty
        if (item.type == "schemeTypes_header")
          return { type: "text", content: item.name };
        if (content == null) return { type: "text", content: "---" };
        else
          switch (item.type) {
            // object relation
            case "schemeTypes_relation":
            case "schemeTypes_irelation":
              return {
                type: "text",
                content: theObjectTree.getObject(content).name,
              };
              break;
            // checkbox
            case "schemeTypes_checkbox":
              return {
                type: "text",
                content: content
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
            case "schemeTypes_color":
              return { type: "text", content: content };
              break;
            // editor
            case "schemeTypes_editor":
              return content.ops;
              break;
            // range / slider
            case "schemeTypes_range":
              return { type: "text", content: `${content} ${item.params[3]}` };
              break;
            // map
            case "schemeTypes_map":
              let r = [];
              if (mapImages && mapImages[0]) {
                r.push({
                  type: "paragraph",
                  content: [{ type: "text", content: _("Scheme_overviewMap") }],
                });
                r.push({
                  type: "paragraph",
                  content: [
                    {
                      type: "image",
                      content: mapImages[0],
                    },
                  ],
                });
              }
              for (let i = 0; i < content.marker.length; i++) {
                r.push({
                  type: "paragraph",
                  content: [
                    { type: "text", content: content.marker[i].info + ": " },
                    {
                      type: "text",
                      content: _("Scheme_locationLatLong", {
                        lat: content.marker[i].latLng.lat.toFixed(6),
                        lng: content.marker[i].latLng.lng.toFixed(6),
                      }),
                    },
                  ],
                });
                if (mapImages && mapImages[i + 1])
                  r.push({
                    type: "paragraph",
                    content: [{ type: "image", content: mapImages[i + 1] }],
                  });
              }
              return r;
              break;
            // file
            case "schemeTypes_file":
              return {
                type: "text",
                content: `${_("Scheme_fileName")}: ${
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
          values: ["txt", "html", "rtf", "docx", "json"],
          i18nValues: [
            "exportWindow_typeTXT",
            "exportWindow_typeHTML",
            "exportWindow_typeRTF",
            "exportWindow_typeDOCX",
            "json",
          ],
          default: "html",
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
   * @param {String} domID id of stylesheet
   * @param {Object} formats
   * @returns {String}
   */
  static formats2CSS(domID, formats) {
    let formatCSS = `<style id="${domID}">\n`;
    Object.keys(formats).forEach(
      (id) =>
        (formatCSS += Formats.toCSS(
          id,
          theFormats.getFormat(id),
          undefined,
          undefined,
          undefined,
          true,
        )),
    );
    return formatCSS + "</style>\n";
  }

  /**
   * build css style for given objects
   *
   * @param {String} domID
   * @param {Object} objects
   * @returns {String}
   */
  static objects2CSS(domID, objects) {
    let objectCSS = `<style id="${domID}">\n`;
    Object.keys(objects).forEach((id) => {
      objectCSS += `.object${id}-true { ${theObjectTree.getObject(id).toCSS("text")} }\n`;
      objectCSS += `.object${id}-true img { ${theObjectTree.getObject(id).toCSS("image")} }\n`;
    });
    return objectCSS + "</style>\n";
  }

  /**
   * add style to list for object with given id
   */
  useObjectStyle(objectID, style) {
    this.#usedObjects[objectID] = style;
  }

  /**
   * remove quill format attributes with given ids from all editors in all profiles (called when a format is deleted)
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
                    ipcRenderer
                      .invoke("mainProcess_yesNoDialog", [
                        _("mainWindow_exportComplete"),
                        _("mainWindow_exportSuccess", {
                          file: file,
                        }),
                      ])
                      .then((result) => {
                        !result &&
                          ipcRenderer.invoke("mainProcess_openPath", file);
                      });
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
    this.#usedFormats = { [UUID0]: true };
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
      profile.objectEditor = { ops: [{insert:"\n"}] };
      profile.objectEndEditor = { ops: [{ insert: "\n" }] };
      profile.objectStartEditor = { ops: [{ insert: "\n" }] };
      profile.objectPropertiesEditor = { ops: [{ insert: "\n" }] };

      this.#export(profile).then((result) => {
        // resolve as html head, html body
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
    this.#usedFormats = { [UUID0]: true };
    this.#usedObjects = {};
    // rtf related tables
    this.#colorTable = ["#000000"];
    this.#styleTable = [];
    this.#fontTable = [];

    if (preview) {
      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
      this.#export(profile).then((result) => {
        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
        Object.keys(this.#usedFormats).forEach((id) => {
          if (theFormats.getFormat(id).formats_fontFamily) {
            this.#usedFonts[theFormats.getFormat(id).formats_fontFamily] = true;
          }
        });
        Object.keys(this.#usedObjects).forEach((id) => {
          if (theObjectTree.getObject(id).styleProperties.formats_fontFamily) {
            this.#usedFonts[
              theObjectTree.getObject(id).styleProperties.formats_fontFamily
            ] = true;
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
            Object.fromEntries(
              Object.keys(this.#usedFormats).map((id) => [
                id,
                profile.exportType == "txt" && id == UUID0
                  ? {
                      formats_fontFamily: "'monospace'",
                      formats_fontSize: 12,
                    }
                  : theFormats.getFormat(id),
              ]),
            ),
            // transport only styleProps, as complex objs cannot be handed over (or only as JSON)
            Object.fromEntries(
              Object.keys(this.#usedObjects).map((id) => [
                id,
                theObjectTree.getObject(id).styleProperties,
              ]),
            ),
          ],
        ]);
      });
    }
    // real export, no preview
    else {
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

                    case "html":
                      ipcRenderer.invoke("mainProcess_busyOverlayWindow", 500);
                      this.#export(profile).then((result) => {
                        ipcRenderer.invoke("mainProcess_busyOverlayWindow", 0);
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
                          )}</title>`,
                        );
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
                        fs.writeSync(fd, `</head>\n<body>\n`);
                        fs.writeSync(fd, result);
                        fs.writeSync(fd, "</body></html>");
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
                          styles: {
                            default: {
                              document: Formats.formatToDocx(
                                theFormats.formats[UUID0],
                              ),
                            },
                            paragraphStyles: this.#formats2Docx(
                              this.#usedFormats,
                            ),
                          },
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

      // texts
      let textsExport = [];
      useTexts.forEach((textID) => {
        let [textContents, formats, objects] = Exporter.#textContentPlacegiver(
          theTextTree.getText(textID).delta,
          useTextObjects,
          profile.objectStartEditor.ops,
          profile.objectEndEditor.ops,
        );
        Object.assign(this.#usedFormats, formats);
        Object.assign(this.#usedObjects, objects);
        console.log({ textContents });
        if (textContents.length || !profile.ignoreEmptyTexts) {
          // each (non empty) text
          textsExport.push(
            Exporter.#textPlacegiver1(
              profile.textEditor.ops,
              textID,
              textContents,
            ),
          );
        }
      });

      // objects and their properties
      let rasteredMaps = {};
      let promises = [];
      // raster the maps (if they are exported)
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
        let objectsExport = [];
        useObjects.forEach((objectID) => {
          let objectContent = [];
          let propertyNames = [];
          let propertyTypes = [];
          let propertyContents = [];
          // objects properties: iterate all properties (including those inherited by parent objects)
          theObjectTree.getParents(objectID, false).forEach((oID) => {
            theObjectTree.getObject(oID).scheme.forEach((item) => {
              let mapImages = null;
              if (
                rasteredMaps &&
                rasteredMaps[objectID] &&
                rasteredMaps[objectID][item.id]
              )
                mapImages = rasteredMaps[objectID][item.id];
              let props = theObjectTree.getObject(objectID).properties;
              if (props && props[oID] && props[oID][item.id])
                objectContent.push(
                  Exporter.#propertiesPlacegiver(
                    profile.objectPropertiesEditor.ops,
                    item,
                    props[oID][item.id],
                    mapImages,
                  ),
                );
              // elements necessary for tabled export
              if (
                (props && props[oID] && props[oID][item.id]) ||
                item.type == "schemeTypes_header"
              )
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
                  props[oID][item.id],
                  mapImages,
                ),
              );
            });
          });
          // reverse object relations
          theObjectTree.reverseRelations(objectID).forEach((revRel) => {
            objectContent.push(
              Exporter.#propertiesPlacegiver(
                profile.objectPropertiesEditor.ops,
                revRel,
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
                revRel.content,
              ),
            );
          });

          objectsExport.push(
            Exporter.#objectPlacegiver(
              profile.objectEditor.ops,
              objectID,
              objectContent,
              useCitationTexts,
              propertyNames,
              propertyTypes,
              propertyContents,
            ),
          );
        });

        // document
        let documentExport = Exporter.#documentPlacegiver1(
          profile.documentEditor.ops,
          documentStatistics,
          textsExport,
          objectsExport,
        );

        // JSON
        let [jsonExport, formats, objects] =
          Exporter.#deltaToJSON(documentExport);
        Object.assign(this.#usedFormats, formats);
        Object.assign(this.#usedObjects, objects);
        console.log("usedFormats", this.#usedFormats);
        console.log("usedObjects", this.#usedObjects);

        switch (profile.exportType) {
          case "json":
            resolve(JSON.stringify(jsonExport, null, "  "));
            break;
          case "txt":
            resolve(Exporter.#JSON2Text(jsonExport));
            break;
          case "html":
            resolve(Exporter.#JSON2HTML(jsonExport));
            break;
          /*
          case "rtf":
            {
              // texts
              let textsExport = [];
              useTexts.forEach((textID) => {
                let [textContents, trailingNewLine] =
                  Exporter.#textContentPlacegiver(
                    profile.exportType,
                    theTextTree.getText(textID).delta,
                    useTextObjects,
                    profile.objectStartEditor.ops,
                    profile.objectEndEditor.ops,
                  );
                // each (non empty) text
                if (textContents.length || !profile.ignoreEmptyTexts) {
                  textsExport.push(
                    ...Exporter.#textPlacegiver(
                      profile.exportType,
                      trailingNewLine
                        ? profile.textEditor.ops.slice(
                            0,
                            profile.textEditor.ops.length - 1,
                          )
                        : profile.textEditor.ops,
                      textID,
                      textContents,
                    ),
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
                        let props =
                          theObjectTree.getObject(objectID).properties;
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
                let objectsExport = [];
                useObjects.forEach((objectID) => {
                  let objectContent = [];
                  let propertyNames = [];
                  let propertyTypes = [];
                  let propertyContents = [];
                  // objects properties: iterate all properties (including those inherited by parent objects)
                  theObjectTree.getParents(objectID, false).forEach((oID) => {
                    theObjectTree.getObject(oID).scheme.forEach((item) => {
                      let props = theObjectTree.getObject(objectID).properties;
                      if (props && props[oID] && props[oID][item.id]) {
                        let mapImages = null;
                        if (
                          rasteredMaps &&
                          rasteredMaps[objectID] &&
                          rasteredMaps[objectID][item.id]
                        ) {
                          mapImages = rasteredMaps[objectID][item.id];
                        }
                        objectContent.push(
                          ...this.#propertiesPlacegiver(
                            profile.objectPropertiesEditor.ops,
                            item,
                            profile.exportType,
                            props[oID][item.id],
                            mapImages,
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
                            props[oID][item.id],
                            mapImages,
                          ),
                        );
                      }
                    });
                  });
                  // reverse object relations
                  theObjectTree.reverseRelations(objectID).forEach((revRel) => {
                    objectContent.push(
                      ...this.#propertiesPlacegiver(
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

                  objectsExport.push(
                    ...this.#objectPlacegiver(
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
            {
              // texts
              let textsExport = [];
              useTexts.forEach((textID) => {
                let [textContents, trailingNewLine] =
                  Exporter.#textContentPlacegiver(
                    profile.exportType,
                    theTextTree.getText(textID).delta,
                    useTextObjects,
                    profile.objectStartEditor.ops,
                    profile.objectEndEditor.ops,
                  );
                if (textContents.length || !profile.ignoreEmptyTexts) {
                  // each (non empty) text
                  textsExport.push(
                    ...Exporter.#textPlacegiver(
                      profile.exportType,
                      trailingNewLine
                        ? profile.textEditor.ops.slice(
                            0,
                            profile.textEditor.ops.length - 1,
                          )
                        : profile.textEditor.ops,
                      textID,
                      textContents,
                    ),
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
                        let props =
                          theObjectTree.getObject(objectID).properties;
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
                let objectsExport = [];
                useObjects.forEach((objectID) => {
                  let objectContent = [];
                  let propertyNames = [];
                  let propertyTypes = [];
                  let propertyContents = [];
                  // objects properties: iterate all properties (including those inherited by parent objects)
                  theObjectTree.getParents(objectID, false).forEach((oID) => {
                    theObjectTree.getObject(oID).scheme.forEach((item) => {
                      let props = theObjectTree.getObject(objectID).properties;
                      if (props && props[oID] && props[oID][item.id]) {
                        let mapImages = null;
                        if (
                          rasteredMaps &&
                          rasteredMaps[objectID] &&
                          rasteredMaps[objectID][item.id]
                        ) {
                          mapImages = rasteredMaps[objectID][item.id];
                        }
                        objectContent.push(
                          ...this.#propertiesPlacegiver(
                            profile.objectPropertiesEditor.ops,
                            item,
                            profile.exportType,
                            props[oID][item.id],
                            mapImages,
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
                            props[oID][item.id],
                            mapImages,
                          ),
                        );
                      }
                    });
                  });
                  // reverse object relations
                  theObjectTree.reverseRelations(objectID).forEach((revRel) => {
                    objectContent.push(
                      ...this.#propertiesPlacegiver(
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

                  objectsExport.push(
                    ...this.#objectPlacegiver(
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
                  this.#deltaToDocx(
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
          */
        }
      });
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
    if (profile.exportType == "txt") return false;
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
   * @param {Object[]} documentPlaceholderOps
   * @param {String} exportType
   * @param {Object} statistics
   * @param {Object[]} textsExport dimOps of all exported texts
   * @param {Object[]} objectsExport dimOps of all exported objects
   * @returns {Object[]} dimOps
   */
  static #documentPlacegiver1(
    documentPlaceholderOps,
    statistics,
    textsExport,
    objectsExport,
  ) {
    let ops = [];
    let blockBefore = false;
    documentPlaceholderOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      // after a block (textContent) insert, remove next "\n" to avoid an extra empty paragraph
      if (
        blockBefore &&
        typeof newOp.insert == "string" &&
        newOp.insert.startsWith("\n")
      )
        newOp.insert = newOp.insert.substring(1);
      if (
        newOp.insert &&
        newOp.insert.placeholder &&
        Object.keys(Exporter.#documentPlaceholders).includes(
          newOp.insert.placeholder,
        )
      ) {
        ops.push(
          Exporter.#documentPlaceholders[newOp.insert.placeholder].function(
            statistics,
            textsExport,
            objectsExport,
          ),
        );
        blockBefore =
          Exporter.#documentPlaceholders[newOp.insert.placeholder].block;
      } else {
        ops.push(newOp);
      }
    });
    return ops;
  }

  static #documentPlacegiver(
    documentPlaceholderOps,
    exportType,
    statistics,
    textsExport,
    objectsExport,
  ) {
    let dimOps = [];
    documentPlaceholderOps.forEach((op) => {
      if (
        op.insert &&
        op.insert.placeholder &&
        Object.keys(Exporter.#documentPlaceholders).includes(
          op.insert.placeholder,
        )
      ) {
        dimOps.push(
          ...Exporter.#documentPlaceholders[op.insert.placeholder].function(
            exportType,
            statistics,
            textsExport,
            objectsExport,
          ),
        );
      } else {
        dimOps.push(JSON.parse(JSON.stringify(op)));
      }
    });
    return dimOps;
  }

  /**
   * substitute text placeholders with actual values
   *
   * @param {String} exportType
   * @param {Object[]} textPlaceholderOps
   * @param {String} textID
   * @param {Object[]} textContents substituted text contents in dimOps
   * @returns {Object[]} dimOps
   */
  static #textPlacegiver1(textPlaceholderOps, textID, textContents) {
    console.log("textPlacegiver1", { textPlaceholderOps }, { textContents });
    let ops = [];
    let blockBefore = false;
    textPlaceholderOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      // after a block (textContent) insert, remove next "\n" to avoid an extra empty paragraph
      if (
        blockBefore &&
        typeof newOp.insert == "string" &&
        newOp.insert.startsWith("\n")
      )
        newOp.insert = newOp.insert.substring(1);
      if (
        newOp.insert &&
        newOp.insert.placeholder &&
        Object.keys(Exporter.#textPlaceholders).includes(
          newOp.insert.placeholder,
        )
      ) {
        ops.push(
          Exporter.#textPlaceholders[newOp.insert.placeholder].function(
            textID,
            textContents,
          ),
        );
        blockBefore =
          Exporter.#textPlaceholders[newOp.insert.placeholder].block;
      } else {
        ops.push(newOp);
      }
    });
    console.log({ ops });
    return ops;
  }

  static #textPlacegiver(exportType, textPlaceholderOps, textID, textContents) {
    let dimOps = [];
    textPlaceholderOps.forEach((op) => {
      if (
        op.insert &&
        op.insert.placeholder &&
        Object.keys(Exporter.#textPlaceholders).includes(op.insert.placeholder)
      ) {
        dimOps.push(
          ...Exporter.#textPlaceholders[op.insert.placeholder].function(
            textID,
            textContents,
            exportType,
          ),
        );
      } else {
        dimOps.push(JSON.parse(JSON.stringify(op)));
      }
    });
    return dimOps;
  }

  /**
   * substitute text content placeholder
   * @static
   *
   * @param {Object[]} textDelta text contents
   * @param {String[]} useObjects ids of objects to use for textObject placeholders
   * @param {Object[]} beforeObjectDelta
   * @param {Object[]} afterObjectDelta
   * @returns {[Object[], Object, Object]} json, formats, objects
   */
  static #textContentPlacegiver(
    textDelta,
    useObjects,
    beforeObjectDelta,
    afterObjectDelta,
  ) {
    let ops = [];
    textDelta.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      let beforeOps = [];
      let afterOps = [];
      if (op.attributes) {
        Object.keys(op.attributes).forEach((attr) => {
          if (attr.startsWith("object")) {
            let objectID = attr.slice(6);
            if (useObjects.includes(objectID)) {
              beforeOps = Exporter.#objectTextPlacegiver(
                beforeObjectDelta,
                objectID,
              );
              afterOps = Exporter.#objectTextPlacegiver(
                afterObjectDelta,
                objectID,
              );
            } else {
              // if this object is ignored, remove the attribute
              delete newOp.attributes[attr];
            }
          }
        });
      }
      ops.push(...beforeOps, newOp, ...afterOps);
    });

    return Exporter.#deltaToJSON(ops);
  }

  /**
   * substitute text objects placeholders
   * @static
   *
   * @param {Object[]} objectTextPlaceholderDelta
   * @param {String} objectID
   * @returns {[Object[], Object, Object]} json, formats, objects
   */
  static #objectTextPlacegiver(objectTextPlaceholderDelta, objectID) {
    let dimOps = [];
    objectTextPlaceholderDelta.forEach((op) => {
      if (
        op.insert &&
        op.insert.placeholder &&
        Object.keys(Exporter.#objectTextPlaceholders).includes(
          op.insert.placeholder,
        )
      ) {
        dimOps.push(
          Exporter.#objectTextPlaceholders[op.insert.placeholder].function(
            objectID,
          ),
        );
      } else {
        dimOps.push(JSON.parse(JSON.stringify(op)));
      }
    });

    let [json, formats, objects] = Exporter.#deltaToJSON(dimOps);
    // remove trailing "\n" -- if only "\n" remove whole op
    if (json.length == 1 && !json[0].content.length) return [];
    if (json.length == 1) return json[0].content;

    return [json, formats, objects];
  }

  /**
   * substitute object placeholders with actual values
   *
   * @param {Object[]} objectPlaceholderDelta
   * @param {String} objectID
   * @param {Object[]} objectContents
   * @param {String[]} useCitationTexts
   * @param {Object[]} propertyNames
   * @param {Object[]} propertyTypes
   * @param {Object[]} propertyContents
   * @returns {Object[]}
   */
  static #objectPlacegiver(
    objectPlaceholderDelta,
    objectID,
    objectContents,
    useCitationTexts,
    propertyNames,
    propertyTypes,
    propertyContents,
  ) {
    let ops = [];
    let blockBefore = false;
    objectPlaceholderDelta.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      // after a block (textContent) insert, remove next "\n" to avoid an extra empty paragraph
      if (
        blockBefore &&
        typeof newOp.insert == "string" &&
        newOp.insert.startsWith("\n")
      )
        newOp.insert = newOp.insert.substring(1);
      if (
        newOp.insert &&
        newOp.insert.placeholder &&
        Object.keys(Exporter.#objectPlaceholders).includes(
          newOp.insert.placeholder,
        )
      ) {
        ops.push(
          Exporter.#objectPlaceholders[newOp.insert.placeholder].function(
            objectID,
            objectContents,
            useCitationTexts,
            propertyNames,
            propertyTypes,
            propertyContents,
            this,
          ),
        );
        blockBefore =
          Exporter.#objectPlaceholders[newOp.insert.placeholder].block;
      } else {
        ops.push(newOp);
      }
    });
    return ops;
  }

  /**
   * substitute object property placeholders with actual values
   *
   * @param {Object[]} objectPropertiesPlaceholderDelta
   * @param {*} item
   * @param {*} content
   * @param {*} mapImages
   * @returns {Object[]}
   */
  static #propertiesPlacegiver(
    objectPropertiesPlaceholderDelta,
    item,
    content,
    mapImages,
  ) {
    let ops = [];
    objectPropertiesPlaceholderDelta.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      if (
        newOp.insert &&
        newOp.insert.placeholder &&
        Object.keys(Exporter.#propertyPlaceholders).includes(
          newOp.insert.placeholder,
        )
      ) {
        ops.push(
          Exporter.#propertyPlaceholders[newOp.insert.placeholder].function(
            item,
            content,
            mapImages,
          ),
        );
      } else {
        ops.push(newOp);
      }
    });
    return ops;
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
   * convert exporter JSON to text
   * @param {Object[]} json
   * @returns {String}
   */
  static #JSON2Text(json) {
    let text = "";
    json.forEach((p) => {
      if (p.type == "paragraph") {
        p.content.forEach((c) => {
          switch (c.type) {
            case "text":
              let toUpper = false;
              let spacing = "";
              let transforms = {};
              if (c.bold)
                transforms[
                  theSettings.effectiveSettings().exportSubstituteBold
                ] = true;
              if (c.italic)
                transforms[
                  theSettings.effectiveSettings().exportSubstituteItalic
                ] = true;
              if (c.underline)
                transforms[
                  theSettings.effectiveSettings().exportSubstituteUnderline
                ] = true;
              if (c.strike)
                transforms[
                  theSettings.effectiveSettings().exportSubstituteStrike
                ] = true;
              Object.keys(transforms).forEach((t) => {
                switch (t) {
                  case "exportSubstituteUpper":
                    toUpper = true;
                    break;
                  case "exportSubstituteSpaced":
                    spacing = " ";
                    break;
                  case "exportSubstituteScored":
                    spacing = "_";
                    break;
                  case "exportSubstituteStriked":
                    spacing = "-";
                    break;
                  case "exportSubstituteUpperSpaced":
                    spacing = " ";
                    toUpper = true;
                    break;
                  case "exportSubstituteUpperScored":
                    spacing = "_";
                    toUpper = true;
                    break;
                  case "exportSubstituteUpperStriked":
                    spacing = "-";
                    toUpper = true;
                    break;
                }
              });
              let transformed = toUpper ? c.content.toUpperCase() : c.content;
              if (spacing)
                transformed = transformed
                  .split("")
                  .map((x) => (x == " " ? spacing : x))
                  .join(spacing);
              text += transformed;
              break;
            case "image":
              if (theSettings.effectiveSettings().exportTextImage)
                text += _("image_reference", {
                  title: c.title ? ` "${c.title}"` : "",
                  width: c.width,
                  height: c.height,
                });
              break;
            case "table":
              let objectTable = [];
              let sCells = [];
              let rowNo = 0;
              c.content.forEach((row) => {
                let objectRow = [];
                let colNo = 0;
                row.forEach((cell) => {
                  objectRow.push(
                    Exporter.#JSON2Text(
                      Exporter.#deltaToJSON([cell.content])[0],
                    ).slice(0, -1),
                  );
                  if (cell.rowSpan) {
                    sCells.push({
                      col: colNo,
                      row: rowNo,
                      colSpan: cell.rowSpan,
                    });
                  }
                  colNo++;
                });
                objectTable.push(objectRow);
                rowNo++;
              });
              let columns = [];
              let width = 0;
              for (let i = 0; i < c.width.length - 1; i++) {
                let w = Math.floor(
                  (c.width[i] / 100) *
                    theSettings.effectiveSettings().exportTableLineLength,
                );
                width += w;
                columns.push({
                  width: w - 2,
                  wrapWord: true,
                });
              }
              columns.push({
                width:
                  theSettings.effectiveSettings().exportTableLineLength - width,
                wrapWord: true,
              });
              console.log({ columns });
              text += table(objectTable, {
                border: getBorderCharacters("norc"),
                columns: columns,
                spanningCells: sCells,
              });
              break;
          }
        });
        text += "\n";
      }
    });

    return text;
  }

  /**
   * convert exporter JSON to HTML
   * @param {Object[]} json
   * @returns {String}
   */
  static #JSON2HTML(json) {
    let html = "";
    json.forEach((p) => {
      if (p.type == "paragraph") {
        let para = "";
        p.content.forEach((c) => {
          switch (c.type) {
            case "text":
              let element = Util.escapeHTML(c.content);
              if (c.bold) element = `<strong>${element}</strong>`;
              if (c.italic) element = `<em>${element}</em>`;
              if (c.underline) element = `<u>${element}</u>`;
              if (c.strike) element = `<s>${element}</s>`;
              if ("objects" in c && c.objects.length)
                para += `<span class="object${c.objects.join(
                  "-true object",
                )}-true">${element}</span>`;
              else para += element;
              break;
            case "image":
              let style = "";
              Object.keys(c).forEach((att) => {
                if (att in DIMImage.styles) {
                  for (let [k, v] of Object.entries(
                    DIMImage.styles[att][c[att]],
                  )) {
                    style += `${k}:${v};`;
                  }
                }
              });
              para += `<img src="${c.content}" width="${c.width}px" height="${c.height}px" style="${style}" ${c.title ? `title="${c.title}"` : ""}>`;
              break;
            case "table":
              let cellStyle =
                "vertical-align:top; border:1px solid black; padding:4px";
              para += `<table style="width:100%"><colgroup>`;
              c.width.forEach(
                (w) => (para += `<col span="1" style="width:${w}%"></col>`),
              );
              para += "</colgroup>";
              if (c.header) {
                para += "<thead><tr>";
                c.content[0].forEach(
                  (cell) =>
                    (para += `<th style="${cellStyle}">${Exporter.#JSON2HTML(Exporter.#deltaToJSON([cell.content])[0])}</th>`),
                );
                para += "</tr></thead>";
              }
              para += "<tbody>";
              for (let i = c.header ? 1 : 0; i < c.content.length; i++) {
                para += "<tr>";
                for (let j = 0; j < c.content[i].length; j++) {
                  para += `<td ${c.content[i][j].rowSpan ? `colspan=${c.content[i][j].rowSpan}` : ""} style="${cellStyle}">${Exporter.#JSON2HTML(Exporter.#deltaToJSON([c.content[i][j].content])[0])}</td>`;
                  if (c.content[i][j].rowSpan) j += c.content[i][j].rowSpan;
                }
                para += "</tr>";
              }
              para += "</table>";
              break;
          }
        });
        html += "<p";
        if (p.format != UUID0) html += ` class="format${p.format}-true"`;
        html += ">" + para + "</p>";
      }
    });

    return html;
  }

  /**
   * convert delta/exporter JSON mix to exporter JSON
   * @param {Object[]} deltaJSON
   * @returns {Object[]}
   */
  static #deltaToJSON(deltaJSON) {
    let paragraphs = [];
    let content = [];
    let formatID = UUID0;
    let formats = {};
    let objects = {};
    deltaJSON.flat(Infinity).forEach((op) => {
      // already in JSON format
      if ("type" in op) {
        if (op.type == "paragraph") {
          if (content.length)
            paragraphs.push({
              type: "paragraph",
              content: content,
              format: formatID,
            });
          content = [];
          formatID = UUID0;
          paragraphs.push(op);
        } else {
          content.push(op);
        }
      }
      // delta format
      else {
        let textContent = {
          type: "text",
          content: "",
          objects: [],
          style: {},
        };
        if (typeof op.insert != "object") {
          if ("attributes" in op) {
            Object.keys(op.attributes).forEach((attr) => {
              switch (attr) {
                case "bold":
                  textContent.bold = true;
                  break;
                case "italic":
                  textContent.italic = true;
                  break;
                case "underline":
                  textContent.underline = true;
                  break;
                case "strike":
                  textContent.strike = true;
                  break;
                default:
                  if (attr.startsWith("format")) {
                    formatID = attr.substring("format".length);
                    formats[formatID] = true;
                  } else if (attr.startsWith("object")) {
                    let objectID = attr.substring("object".length);
                    textContent.objects.push(objectID);
                    objects[objectID] = true;
                  }
                  break;
              }
            });
          }
          let chunks = op.insert.split(/(\n)/).filter((x) => x);
          for (let i = 0; i < chunks.length; i++) {
            if (chunks[i] == "\n") {
              content.push(textContent);
              let paragraph = { type: "paragraph", content: content };
              paragraph.format = formatID;
              paragraphs.push(paragraph);
              content = [];
              textContent = {
                type: "text",
                content: "",
                objects: [],
                style: {},
              };
            } else {
              textContent.content = chunks[i];
              content.push(textContent);
              textContent = {
                type: "text",
                content: "",
                objects: [],
                style: {},
              };
            }
          }
          formatID = UUID0;
        } else {
          content.push({
            type: "image",
            alignment: op.attributes.alignment,
            content: op.insert.image,
            width: parseInt(op.attributes.width),
            height: parseInt(op.attributes.height),
            origwidth: parseInt(op.attributes.origwidth),
            origheight: parseInt(op.attributes.origheight),
            title: op.attributes.title,
            shadow: Boolean(op.attributes.shadow),
          });
        }
      }
    });
    if (content.length)
      paragraphs.push({
        type: "paragraph",
        content: content,
        format: formatID,
      });
    console.log({ paragraphs }, { formats }, { objects });
    return [paragraphs, formats, objects];
  }

  /**
   * convert delta to docx structure
   *
   * @param {Object[]} deltaOps
   * @param {Boolean} doFormats
   * @param {Boolean} doObjects
   * @returns {docx.Paragraph[]} suitable as children element of a docx section
   */
  #deltaToDocx(deltaOps, doFormats = true, doObjects = true) {
    let paragraphs = [];
    let children = [];
    let formatID = null;
    let alignment = null;
    deltaOps.forEach((op) => {
      let textRun = {};
      if (typeof op.insert != "object") {
        if ("attributes" in op) {
          Object.keys(op.attributes).forEach((attr) => {
            switch (attr) {
              case "bold":
                textRun.bold = true;
                break;
              case "italic":
                textRun.italics = true;
                break;
              case "underline":
                textRun.underline = {};
                break;
              case "strike":
                textRun.strike = true;
                break;
              default:
                if (attr.startsWith("format") && doFormats) {
                  formatID = attr.substring("format".length);
                  if (formatID == UUID0) formatID = null;
                  else {
                    this.#usedFormats[formatID] = theFormats.formats[formatID];
                  }
                } else if (attr.startsWith("object") && doObjects) {
                  let objectID = attr.substring("object".length);
                  Object.assign(
                    textRun,
                    StylingControls.controls2DOCX(
                      theObjectTree.objectStyle(objectID).styleProperties.text,
                    ),
                  );
                }
                break;
            }
          });
        }
        let chunks = op.insert.split(/(\n)/).filter((x) => x);
        for (let i = 0; i < chunks.length; i++) {
          if (chunks[i] == "\n") {
            let paragraph = { children: children };
            if (formatID) paragraph.style = formatID;
            if (alignment) paragraph.alignment = alignment;
            paragraphs.push(new docx.Paragraph(paragraph));
            children = [];
            // formatID = null;
            alignment = null;
          } else {
            if (Object.keys(textRun).length) {
              textRun.text = chunks[i];
              children.push(new docx.TextRun(textRun));
            } else children.push(new docx.TextRun(chunks[i]));
          }
        }
        formatID = null;
      } else {
        switch (op.attributes.alignment) {
          case "image_alignmentLeft":
            alignment = docx.AlignmentType.LEFT;
            break;
          case "image_alignmentCenter":
            alignment = docx.AlignmentType.CENTER;
            break;
          case "image_alignmentRight":
            alignment = docx.AlignmentType.RIGHT;
            break;
        }
        children.push(
          new docx.ImageRun({
            data: Buffer.from(op.insert.image.split(",")[1], "base64"),
            transformation: {
              width: parseInt(op.attributes.width),
              height: parseInt(op.attributes.height),
            },
            altText: {
              title: op.attributes.title,
            },
          }),
        );
      }
    });
    let paragraph = { children: children };
    if (formatID) paragraph.style = formatID;
    paragraphs.push(new docx.Paragraph(paragraph));
    console.log({ deltaOps }, { paragraphs });
    return paragraphs;
  }

  #formats2Docx(formats) {
    let styles = [];
    Object.keys(formats).forEach((formatID) => {
      if (formatID != UUID0) {
        let style = Formats.formatToDocx(theFormats.effectiveFormat(formatID));
        style.id = formatID;
        style.name = formats[formatID].formats_name;
        styles.push(style);
      }
    });
    return styles;
  }

  /**
   * convert text to docx using given format
   *
   * @param {String} text
   * @param {String} format
   * @returns {docx.Paragraph[]}
   */
  static #textToDocx(text, format) {
    let paragraphs = [];
    if (text) {
      if (text.endsWith("\n")) {
        text = text.substring(0, text.length - 1);
      }
      let paras = text.split("\n");
      if (format) {
        let lastPara = paras.pop();
        paragraphs.unshift(
          new docx.Paragraph({
            children: [new docx.TextRun(lastPara)],
            style: format,
          }),
        );
      }
      for (let i = paras.length - 1; i >= 0; i--) {
        paragraphs.unshift(
          new docx.Paragraph({
            children: [new docx.TextRun(paras[i])],
          }),
        );
      }
    }
    return paragraphs;
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
