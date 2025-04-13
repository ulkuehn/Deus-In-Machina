/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of Exporter class
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
                colSpan: 3,
              },
              { content: { type: "text", content: "" } },
              { content: { type: "text", content: "" } },
            ]);
          }
        }
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
                      content: mapImages[0].data,
                      width: mapImages[0].width,
                      height: mapImages[0].height,
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
                    content: [
                      {
                        type: "image",
                        content: mapImages[i + 1].data,
                        width: mapImages[i + 1].width,
                        height: mapImages[i + 1].height,
                      },
                    ],
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
          values: ["txt", "html", "rtf", "docx"],
          i18nValues: [
            "exportWindow_typeTXT",
            "exportWindow_typeHTML",
            "exportWindow_typeRTF",
            "exportWindow_typeDOCX",
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

  /**
   * do a text only export to print the editor content
   */
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
      profile.objectEditor = { ops: [{ insert: "\n" }] };
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
                        let styles = [];
                        Object.keys(this.#usedFormats).forEach((formatID) => {
                          if (formatID != UUID0) {
                            let style = Formats.formatToDocx(
                              theFormats.effectiveFormat(formatID),
                            );
                            style.id = formatID;
                            style.name =
                              theFormats.getFormat(formatID).formats_name;
                            styles.push(style);
                          }
                        });
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
                            paragraphStyles: styles,
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
        if (textContents.length || !profile.ignoreEmptyTexts) {
          // each (non empty) text
          textsExport.push(
            Exporter.#textPlacegiver(
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
        let documentExport = Exporter.#documentPlacegiver(
          profile.documentEditor.ops,
          documentStatistics,
          textsExport,
          objectsExport,
        );

        // JSON
        let [jsonExport, formats, objects] =
          Exporter.#deltaToJSON(documentExport);

        // tables
        Object.assign(this.#usedFormats, formats);
        Object.assign(this.#usedObjects, objects);

        switch (profile.exportType) {
          case "txt":
            resolve(Exporter.#JSON2Text(jsonExport));
            break;
          case "html":
            resolve(Exporter.#JSON2HTML(jsonExport));
            break;
          case "docx":
            resolve(Exporter.#JSON2DOCX(jsonExport));
            break;
          case "rtf":
            Object.keys(this.#usedFormats).forEach((id) => {
              this.#styleTable.push(id);
              let format = theFormats.getFormat(id);
              if (
                format.formats_fontFamily &&
                !this.#fontTable.includes(format.formats_fontFamily)
              )
                this.#fontTable.push(format.formats_fontFamily);
              if (
                format.formats_textColor &&
                !this.#colorTable.includes(format.formats_textColor)
              )
                this.#colorTable.push(format.formats_textColor);
              if (
                format.formats_backgroundColor &&
                !this.#colorTable.includes(format.formats_backgroundColor)
              )
                this.#colorTable.push(format.formats_backgroundColor);
            });
            Object.keys(this.#usedObjects).forEach((id) => {
              this.#styleTable.push(id);
              let fac = theObjectTree.objectStyle(id).fontsAndColors();
              fac.fonts.forEach((font) => {
                if (!this.#fontTable.includes(font)) this.#fontTable.push(font);
              });
              fac.colors.forEach((color) => {
                if (!this.#colorTable.includes(color))
                  this.#colorTable.push(color);
              });
            });
            resolve(this.#JSON2RTF(jsonExport));
            break;
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
   * @param {Object} statistics
   * @param {Object[]} textsExport dimOps of all exported texts
   * @param {Object[]} objectsExport dimOps of all exported objects
   * @returns {Object[]} dimOps
   */
  static #documentPlacegiver(
    documentPlaceholderOps,
    statistics,
    textsExport,
    objectsExport,
  ) {
    let ops = [];
    let blockBefore = false;
    documentPlaceholderOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      // after a block insert, remove next "\n" to avoid an extra empty paragraph
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
        blockBefore = false;
      }
    });
    return ops;
  }

  /**
   * substitute text placeholders with actual values
   *
   * @param {Object[]} textPlaceholderOps
   * @param {String} textID
   * @param {Object[]} textContents substituted text contents in dimOps
   * @returns {Object[]} dimOps
   */
  static #textPlacegiver(textPlaceholderOps, textID, textContents) {
    let ops = [];
    let blockBefore = false;
    textPlaceholderOps.forEach((op) => {
      let newOp = JSON.parse(JSON.stringify(op));
      // after a block insert, remove next "\n" to avoid an extra empty paragraph
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
        blockBefore = false;
      }
    });
    return ops;
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
      // after a block insert, remove next "\n" to avoid an extra empty paragraph
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
        blockBefore = false;
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
                  if (cell.colSpan) {
                    sCells.push({
                      col: colNo,
                      row: rowNo,
                      colSpan: cell.colSpan,
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
              para += `</p><table style="width:100%"><colgroup>`;
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
                  para += `<td ${c.content[i][j].colSpan ? `colspan=${c.content[i][j].colSpan}` : ""} style="${cellStyle}">${Exporter.#JSON2HTML(Exporter.#deltaToJSON([c.content[i][j].content])[0])}</td>`;
                  if (c.content[i][j].colSpan) j += c.content[i][j].colSpan - 1;
                }
                para += "</tr>";
              }
              para += "</table><p";
              if (p.format != UUID0) para += ` class="format${p.format}-true">`;
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
   * convert exporter JSON to DOCX
   * @param {Object[]} json
   * @returns {docx.Paragraph[]} suitable as children element of a docx section
   */
  static #JSON2DOCX(json) {
    let paragraphs = [];
    json.forEach((p) => {
      if (p.type == "paragraph") {
        let paragraph = { children: [] };
        if (p.format != UUID0) paragraph.style = p.format;
        p.content.forEach((c) => {
          switch (c.type) {
            case "text":
              let textRun = { text: c.content };
              if (c.bold) textRun.bold = true;
              if (c.italic) textRun.italics = true;
              if (c.underline) textRun.underline = true;
              if (c.strike) textRun.strike = true;
              if (c.objects)
                c.objects.forEach((id) =>
                  Object.assign(
                    textRun,
                    StylingControls.controls2DOCX(
                      theObjectTree.objectStyle(id).styleProperties.text,
                    ),
                  ),
                );
              paragraph.children.push(new docx.TextRun(textRun));
              break;
            case "image":
              paragraph.children.push(
                new docx.ImageRun({
                  data: Buffer.from(c.content.split(",")[1], "base64"),
                  transformation: {
                    width: c.width,
                    height: c.height,
                  },
                  altText: {
                    title: c.title,
                  },
                }),
              );
              switch (c.alignment) {
                case "image_alignmentLeft":
                  paragraph.alignment = docx.AlignmentType.LEFT;
                  break;
                case "image_alignmentCenter":
                  paragraph.alignment = docx.AlignmentType.CENTER;
                  break;
                case "image_alignmentRight":
                  paragraph.alignment = docx.AlignmentType.RIGHT;
                  break;
              }
              break;
            case "table":
              let tableRows = [];
              c.content.forEach((row) => {
                let rowContent = [];
                for (let colNo = 0; colNo < row.length; colNo++) {
                  let cellContent = {
                    children: Exporter.#JSON2DOCX(
                      Exporter.#deltaToJSON([row[colNo].content])[0],
                    ),
                  };
                  if (row[colNo].colSpan) {
                    cellContent.columnSpan = row[colNo].colSpan;
                    colNo += row[colNo].colSpan - 1;
                  }
                  rowContent.push(new docx.TableCell(cellContent));
                }
                tableRows.push(new docx.TableRow({ children: rowContent }));
              });
              paragraphs.push(
                new docx.Table({
                  columnWidths: c.width,
                  rows: tableRows,
                  width: {
                    size: 100,
                    type: docx.WidthType.PERCENTAGE,
                  },
                }),
              );
              break;
          }
        });
        paragraphs.push(new docx.Paragraph(paragraph));
      }
    });

    return paragraphs;
  }

  /**
   * convert exporter JSON to RTF
   * @param {Object[]} json
   * @returns {String} rtf
   */
  #JSON2RTF(json) {
    let rtf = "";

    json.forEach((p) => {
      if (p.type == "paragraph") {
        let paraContent = "";
        let stdFmt = Formats.formatToRTF(
          theFormats.effectiveFormat(UUID0),
          this.#fontTable,
          this.#colorTable,
          this.#styleTable.indexOf(UUID0),
        );
        let paraFmt = Formats.formatToRTF(
          theFormats.effectiveFormat(p.format),
          this.#fontTable,
          this.#colorTable,
          this.#styleTable.indexOf(p.format),
        );
        p.content.forEach((c) => {
          switch (c.type) {
            case "text":
              let rtfControls = "";
              if (c.bold) rtfControls += "\\b1";
              if (c.italic) rtfControls += "\\i1";
              if (c.underline) rtfControls += "\\ul1";
              if (c.strike) rtfControls += "\\strike1";
              if ("objects" in c)
                c.objects.forEach((id) => {
                  rtfControls += StylingControls.controls2RTF(
                    theObjectTree.objectStyle(id).styleProperties.text,
                    theFormats.formats[UUID0].formats_fontSize,
                    this.#fontTable,
                    this.#colorTable,
                  );
                });
              if (rtfControls)
                paraContent += `{${rtfControls} ${Exporter.#escapeRTF(c.content)}}`;
              else paraContent += Exporter.#escapeRTF(c.content);
              break;

            case "image":
              if (c.alignment)
                switch (c.alignment) {
                  case "image_alignmentCenter":
                    paraFmt += `\\qc`;
                    break;
                  case "image_alignmentRight":
                    paraFmt += `\\qr`;
                    break;
                }
              paraContent += `{\\*\\shppict{\\pict\\picw${parseInt(
                c.width,
              )}\\pich${parseInt(c.height)}\\picwgoal${Math.floor(
                (parseInt(c.width) / 180) * 1440,
              )}\\pichgoal${Math.floor(
                (parseInt(c.height) / 180) * 1440,
              )}\\pngblip ${Buffer.from(
                c.content.split(",")[1],
                "base64",
              ).toString("hex")}}}`;
              break;

            case "table":
              paraContent += `\\plain${stdFmt}`;
              c.content.forEach((row) => {
                paraContent += `\\trowd\\trpaddb50\\trpaddt50\\trpaddl50\\trpaddr50\n`;
                let percentWidth = 0;
                let span = 0;
                let doSpan = "";
                for (let colNo = 0; colNo < row.length; colNo++) {
                  percentWidth += c.width[colNo];
                  if (row[colNo].colSpan) {
                    span = row[colNo].colSpan - 1;
                    doSpan = `\\clmgf`;
                  }
                  // cell width is relative in 50th percent by \clwWidth
                  // and absolute in twips by \cellx, based on 9071 twips = 9071/20/72 inch = 6.3 inch = 16 cm total table width
                  paraContent += `${doSpan}\\clbrdrt\\brdrs\\brdrw1\\brdrcf0\\clbrdrr\\brdrs\\brdrw1\\brdrcf0\\clbrdrl\\brdrs\\brdrw1\\brdrcf0\\clbrdrb\\brdrs\\brdrw1\\brdrcf0\\clftsWidth2\\clwWidth${c.width[colNo] * 50}\\cellx${Math.floor((percentWidth / 100) * 9071)}\n`;
                  if (span) {
                    doSpan = `\\clmrg`;
                    span--;
                  }
                }
                for (let colNo = 0; colNo < row.length; colNo++) {
                  // chopping off the last \par\n
                  paraContent += `\\pard\\intbl ${this.#JSON2RTF(
                    Exporter.#deltaToJSON([row[colNo].content])[0],
                  ).slice(0, -5)}\\cell\n`;
                }
                paraContent += `\\row\n`;
              });
              paraContent += `\\pard\\plain${paraFmt} `;
              break;
          }
        });
        rtf += `\\pard\\plain${paraFmt} ${paraContent}\\par\n`;
      }
    });

    return rtf;
  }

  /**
   * convert delta/exporter JSON mix to exporter JSON
   *
   * this JSON format ist derived from deltaOps and inserted by ...placegiver functions
   * the eventual export format (text | html | rtf | docx | ...) is built from this JSON format
   *
   * structure of exporter JSON intermediate format:
   *    document = [ paragraph* ]
   *    paragraph = { content: [ element* ], format: String }
   *    element = text | image | table
   *    text = { type: "text", content: String, bold: Boolean, ..., objects: [ String* ] }
   *    image = { type: "image", content: String, alignment: String,
   *              title: String, width: Int, height: Int }
   *    table = { type: "table", rows: Int, cols: Int, header: Boolean,
   *              width: [ Int* ], content: [ row* ]} -- width in percent
   *    row = [ cell* ]
   *    cell = { content: type | image | Object[], colSpan: Int } -- irrespective of colSpan the number if cell items in each row must be the same, so colSpan just skips following cell items
   *
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
    return [paragraphs, formats, objects];
  }

  /**
   * convert delta ops to html directly (needed by other classes)
   *
   * @param {Object[]} deltaOps
   * @returns {String} html
   */
  static delta2HTML(deltaOps) {
    return Exporter.#JSON2HTML(Exporter.#deltaToJSON(deltaOps)[0]);
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
   *
   * @TODO should we honour window.devicePixelRatio? see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
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
        rasterMap[mapIndex] = {
          data: canvas.toDataURL(),
          width: width,
          height: height,
        };
        $rasterizeDiv.remove();
        resolve("ok");
      });
    });
  }
}
