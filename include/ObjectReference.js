/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024
 * @file implementation of ObjectReference class
 */

/**
 * @classdesc the ObjectReference class implements the overwiew of all citations for the currently checked objects in the currently checked texts
 */
class ObjectReference {
  /**
   * determine the citations relevant for a given combination of objects and texts
   *
   * @param {Object[{id:String,delta:[]}]} texts list of texts and their content
   * @param {String[]} objects list ob objectIDs
   * @param {String} handleImages how to handle (substitute) images
   * @returns {Object[]} [{object:id, references:[{text:id, citations:[{pos:pos,len:len,parts:[text:string,html:boolean]},...]}, ...]}, ...]
   */
  static citations(texts, objects, handleImages) {
    let objectReferences = {};
    texts.forEach((text) => {
      let pos = 0;
      text.delta.forEach((deltaOP) => {
        if (deltaOP.attributes) {
          Object.keys(deltaOP.attributes).forEach((attr) => {
            if (attr.startsWith("object")) {
              let objectID = attr.slice(6);
              if (!(objectID in objectReferences)) {
                objectReferences[objectID] = {};
              }
              if (!(text.id in objectReferences[objectID])) {
                objectReferences[objectID][text.id] = [];
              }
              if (typeof deltaOP.insert == "string") {
                objectReferences[objectID][text.id].push({
                  pos: pos,
                  len: deltaOP.insert.length,
                  text: deltaOP.insert,
                  html: false,
                });
              } else {
                if ("image" in deltaOP.insert) {
                  let content = "";
                  switch (handleImages) {
                    // full size image as displayed in the editor
                    case "imageReferenceFull":
                      content = `<img src="${deltaOP.insert.image}" style="width:${deltaOP.attributes.width}; height:${deltaOP.attributes.height}; ${Object.keys(DIMImage.styles.shadow[deltaOP.attributes.shadow]).reduce((a, x) => a + `${x}:${DIMImage.styles.shadow[deltaOP.attributes.shadow][x]};`, "")} ${Object.keys(DIMImage.styles.alignment[deltaOP.attributes.alignment]).reduce((a, x) => a + `${x}:${DIMImage.styles.alignment[deltaOP.attributes.alignment][x]};`, "")}">`;
                    // thumbnail max 50px high, max 250px wide
                    case "imageReferenceThumb":
                      let width = parseInt(deltaOP.attributes.origwidth);
                      let height = parseInt(deltaOP.attributes.origheight);
                      let factor = Math.min(50 / height, 250 / width);
                      if (factor > 1) factor = 1;
                      width = Math.floor(width * factor);
                      height = Math.floor(height * factor);
                      content = `<img src="${deltaOP.insert.image}" style="width:${width}px; height:${height}px; ">`;
                      break;
                    // image meta data as text
                    case "imageReferenceText":
                      content = _("image_reference", {
                        title: deltaOP.attributes.title
                          ? ` "${Util.escapeHTML(deltaOP.attributes.title)}"`
                          : "",
                        width: deltaOP.attributes.width,
                        height: deltaOP.attributes.height,
                      });
                      break;
                    // just an icon
                    case "imageReferenceIcon":
                      content = `<i class='fas fa-panorama'></i>`;
                      break;
                    case "imageReferenceIconLarge":
                      content = `<i class='fas fa-panorama fa-2x'></i>`;
                      break;
                    // nothing
                    case "imageReferenceEmpty":
                      break;
                    // export as text description
                    case "imageReferenceExportText":
                      content = _("image_reference", {
                        title: deltaOP.attributes.title
                          ? ` "${deltaOP.attributes.title}"`
                          : "",
                        width: deltaOP.attributes.width,
                        height: deltaOP.attributes.height,
                      });
                      break;
                  }
                  objectReferences[objectID][text.id].push({
                    pos: pos,
                    len: 1, // images are always one char long
                    text: content,
                    html: true,
                  });
                }
              }
            }
          });
        }
        if (
          "insert" in deltaOP &&
          typeof deltaOP.insert == "string" &&
          deltaOP.insert.match(/^\n+$/)
        ) {
          Object.keys(objectReferences).forEach((objectID) => {
            if (text.id in objectReferences[objectID]) {
              let lastPush =
                objectReferences[objectID][text.id][
                  objectReferences[objectID][text.id].length - 1
                ];
              if (lastPush.pos + lastPush.len == pos) {
                lastPush.text += deltaOP.insert;
              }
            }
          });
        }
        pos += typeof deltaOP.insert == "string" ? deltaOP.insert.length : 1;
      });
    });

    let result = [];
    objects.forEach((objectID) => {
      if (objectID in objectReferences) {
        let references = [];
        texts.forEach((text) => {
          if (text.id in objectReferences[objectID]) {
            let pos = 0;
            let len = 0;
            let startPos = -1;
            let citation = [];
            let citations = [];
            objectReferences[objectID][text.id].forEach((ref) => {
              if (pos > 0 && ref.pos > pos) {
                citations.push({
                  pos: startPos,
                  len: len,
                  parts: citation,
                });
                citation = [];
                startPos = -1;
                len = 0;
              }
              if (startPos == -1) {
                startPos = ref.pos;
              }
              citation.push({ text: ref.text, html: ref.html });
              pos = ref.pos + ref.len + 1;
              len += ref.len + (ref.text.endsWith("\n") ? 1 : 0);
            });
            citations.push({
              pos: startPos,
              len: len,
              parts: citation,
            });
            references.push({ text: text.id, citations: citations });
          }
        });
        result.push({ object: objectID, references: references });
      }
    });

    return result;
  }

  /**
   * class constructor
   */
  constructor() {
    $("#OR").html(
      '<table id="object-reference-table" class="display" width="100%"></table>',
    );

    // build the (empty) table -- it will be filled in setup()
    $("#object-reference-table").DataTable({
      fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        $("td:eq(0)", nRow).attr({
          onclick: `theObjectTree.selectSome('${aData[3]}',true)`,
          style: "cursor:pointer",
          title: _("objectReferences_selectObject"),
        });
        $("td:eq(1)", nRow).attr({
          onclick: `theTextTree.selectSome('${aData[4]}',true); theTextEditor.blinkText('${aData[4]}')`,
          style: "cursor:pointer",
          title: _("objectReferences_selectText"),
        });
        $("td:eq(2)", nRow).attr({
          onclick: `theTextEditor.select('${aData[4]}',${aData[5]},${aData[6]})`,
          style: "cursor:pointer",
          title: _("objectReferences_selectQuote"),
        });
      },
      language: {
        info: _("dataTables_info"),
        infoEmpty: _("dataTables_empty"),
        infoFiltered: _("dataTables_filtered"),
        emptyTable: _("objectReferences_empty"),
        zeroRecords: _("objectReferences_empty"),
        paginate: {
          first: _("dataTables_firstPage"),
          previous: _("dataTables_previousPage"),
          last: _("dataTables_lastPage"),
          next: _("dataTables_nextPage"),
        },
        lengthMenu: _("dataTables_lengthMenu"),
        search: _("objectReferences_search"),
      },
      pagingType: "full_numbers",
      lengthMenu: [
        [5, 10, 25, -1],
        [5, 10, 25, _("dataTables_lengthAll")],
      ],
      order: [[2, "asc"]],
      columns: [
        {
          title: _("objectReferences_object"),
          searchable: false,
          orderable: false,
          width: "15%",
        },
        {
          title: _("objectReferences_text"),
          searchable: false,
          orderable: false,
          width: "15%",
        },
        {
          title: _("objectReferences_quote"),
          orderData: [7, 5, 2], // the "2" is needed not for sorting proper but to use the sorting icons on column 2, see https://datatables.net/forums/discussion/64064
          className: "preWrap",
          searchable: true,
        },
        {
          visible: false,
        },
        {
          visible: false,
        },
        {
          visible: false,
          type: "num",
        },
        {
          visible: false,
        },
        {
          visible: false,
          type: "num",
        },
      ],
    });
    // adapt data tables input style
    $(".dt-length .dt-input").css("margin-right", "5px");
    $(".dt-length .dt-input").addClass("form-select-sm");
    $(".dt-length .dt-input").removeClass("dt-input");
    $(".dt-search .dt-input").css({
      background: "#ffffff",
      height: "32px",
    });

    if (theSettings) {
      this.setup(theSettings.effectiveSettings());
    }
  }

  /**
   * style the objectReference div
   *
   * @param {Object} settings effective settings
   */
  setup(settings) {
    $("#OR").css({
      "--foreground-color": Util.blackOrWhite(
        settings.ORBackgroundColor || settings.generalBackgroundColor,
      ),
      "--background-color":
        settings.ORBackgroundColor || settings.generalBackgroundColor,
    });

    // fill quotes table
    let tableData = []; // elements are lists of: 0=objectName, 1=textName, 2=citationText, 3=objectID, 4=textID, 5=citationPos, 6=citationLen, 7=editorIndex
    ObjectReference.citations(
      theTextEditor.ids.map((x) => ({
        id: x,
        delta: theTextTree.getText(x).delta,
      })),
      theObjectTree.getChecked(),
      settings.imageReference,
    ).forEach((r) => {
      let objectName = Util.escapeHTML(theObjectTree.getObject(r.object).name);
      r.references.forEach((rr) => {
        let textName = Util.escapeHTML(theTextTree.getText(rr.text).name);
        rr.citations.forEach((c) => {
          tableData.push([
            objectName,
            textName,
            c.parts
              .map((part) =>
                part.html ? part.text : Util.escapeHTML(part.text),
              )
              .join(""),
            r.object,
            rr.text,
            c.pos,
            c.len,
            theTextEditor.ids.indexOf(rr.text),
          ]);
        });
      });
    });

    $("#object-reference-table").DataTable().clear();
    $("#object-reference-table").DataTable().rows.add(tableData).draw();
  }
}
