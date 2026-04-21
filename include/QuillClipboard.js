/**
 * DIM - Deus In Machina
 *
 * @author Ulrich Kühn 2024, 2025, 2026
 * @file Clipboard for Quill (pasting from within quill and external sources, images, html, text)
 */
class QuillClipboard extends Clipboard {
  // remove all tags except a basic whitelist, and remove all attributes to prevent extra formatting, XSS and other unwanted effects when pasting external HTML
  static stripTags(html) {
    let allowedTags = new Set([
      "strong",
      "b",
      "em",
      "i",
      "u",
      "strike",
      "s",
      "p",
      "div",
      "br",
    ]);

    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    // all elements inside <body>
    let elements = Array.from(doc.body.querySelectorAll("*"));
    for (let elem of elements) {
      let tag = elem.tagName.toLowerCase();
      // remove ALL attributes
      let names = Array.from(elem.attributes).map((a) => a.name);
      for (let name of names) {
        elem.removeAttribute(name);
      }
      if (!allowedTags.has(tag)) {
        // flatten non-whitelisted tags to plain text
        let text = doc.createTextNode(elem.textContent || "");
        elem.replaceWith(text);
      }
    }

    return doc.body.innerHTML;
  }

  onPaste(e) {
    e.preventDefault();

    if (!this.quill.isEnabled()) {
      console.error("QuillClipboard paste in locked text");
    } else {
      let sel = this.quill.getSelection(true);
      if (sel.length) this.quill.deleteText(sel.index, sel.length);
      // Get current formatting at cursor
      let formats = this.quill.getFormat(sel.index);
      let quillItem = null,
        htmlItem = null,
        imageItem = null;
      for (let clipboardItem of e.clipboardData.items) {
        if (clipboardItem.type.startsWith("image/")) imageItem = clipboardItem;
        else if (clipboardItem.type == "quill/delta") quillItem = clipboardItem;
        else if (clipboardItem.type == "text/html") htmlItem = clipboardItem;
      }

      // images from clipboard: insert as base64 data URL with current image settings
      if (imageItem) {
        let settings = theSettings.effectiveSettings();
        let image = imageItem.getAsFile();
        let reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => {
          this.quill.insertEmbed(
            sel.index,
            "image",
            reader.result +
              " " +
              settings.imageWidth +
              " " +
              settings.imageHeight,
          );
          this.quill.formatText(sel.index, 1, {
            title: "",
            alignment: settings.imageAlignment,
            shadow: settings.imageShadow,
          });
        };
      } else {
        let delta = null;
        // quill
        if (quillItem)
          delta = new Delta(JSON.parse(e.clipboardData.getData("quill/delta")));
        // external HTML: sanitize it to prevent unwanted formatting and XSS
        else if (htmlItem) {
          let html = QuillClipboard.stripTags(
            e.clipboardData.getData("text/html"),
          );
          delta = this.convert(html);
        }
        // plain text: convert newlines to paragraphs
        else {
          let text = e.clipboardData.getData("text/plain");
          let html = Util.escapeHTML(text)
            .replace(/\t/g, " ")
            .split(/\r?\n/)
            .map((line) => `<p>${line || "<br>"}</p>`)
            .join("");
          delta = this.convert(html);
        }
        if (delta) {
          // apply current formats to all ops in the pasted delta
          delta.ops = delta.ops.map((op) => {
            if (typeof op.insert == "string") {
              op.attributes = { ...(op.attributes || {}), ...formats };
            }
            return op;
          });
          this.quill.updateContents(
            new Delta().retain(sel.index).concat(delta),
          );
          this.quill.setSelection(sel.index + delta.length(), 0);
        }
      }
    }
  }
}

Quill.register("modules/clipboard", QuillClipboard, true);
