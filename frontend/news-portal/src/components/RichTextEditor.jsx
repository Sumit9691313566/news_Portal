import { useEffect, useMemo, useRef, useState } from "react";
import { countWordsFromHtml, sanitizeRichTextHtml } from "../utils/richText";

const SIZE_COMMANDS = {
  small: "2",
  normal: "3",
  large: "5",
  xlarge: "6",
};

const isSafeLink = (url = "") =>
  /^(https?:\/\/|mailto:|tel:)/i.test(String(url).trim());

export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  useEffect(() => {
    if (!editorRef.current) return;
    const safe = sanitizeRichTextHtml(value || "");
    if (editorRef.current.innerHTML !== safe) {
      editorRef.current.innerHTML = safe;
    }
  }, [value]);

  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {
      // Browser compatibility fallback.
    }
  }, []);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    savedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const saved = savedRangeRef.current;
    if (!saved) return;
    selection.removeAllRanges();
    selection.addRange(saved);
  };

  const refreshToolbarState = () => {
    const next = {
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      insertUnorderedList: false,
      insertOrderedList: false,
    };

    Object.keys(next).forEach((cmd) => {
      try {
        next[cmd] = !!document.queryCommandState(cmd);
      } catch {
        next[cmd] = false;
      }
    });

    setActiveState(next);
  };

  useEffect(() => {
    const handler = () => {
      saveSelection();
      refreshToolbarState();
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const applyCommand = (command, commandValue = null) => {
    if (!editorRef.current) return;
    restoreSelection();
    editorRef.current.focus();

    const ok = document.execCommand(command, false, commandValue);
    if (!ok && command === "hiliteColor") {
      document.execCommand("backColor", false, commandValue);
    }

    saveSelection();
    refreshToolbarState();
    onChange(sanitizeRichTextHtml(editorRef.current.innerHTML));
  };

  const insertLink = () => {
    const selectedText = window.getSelection()?.toString()?.trim();
    const raw = window.prompt("Enter URL (https://, mailto:, tel:)", "https://");
    if (!raw) return;

    const href = raw.trim();
    if (!isSafeLink(href)) {
      window.alert("Only https://, mailto: and tel: links are allowed.");
      return;
    }

    if (!selectedText) {
      applyCommand("insertHTML", `<a href="${href}">${href}</a>`);
      return;
    }

    applyCommand("createLink", href);
  };

  const blockOptions = useMemo(
    () => [
      { label: "Normal", value: "p" },
      { label: "Heading 2", value: "h2" },
      { label: "Heading 3", value: "h3" },
      { label: "Quote", value: "blockquote" },
    ],
    []
  );

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={() => applyCommand("undo")} title="Undo">
            Undo
          </button>
          <button type="button" onClick={() => applyCommand("redo")} title="Redo">
            Redo
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={activeState.bold ? "is-active" : ""}
            onClick={() => applyCommand("bold")}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            className={activeState.italic ? "is-active" : ""}
            onClick={() => applyCommand("italic")}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            className={activeState.underline ? "is-active" : ""}
            onClick={() => applyCommand("underline")}
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            className={activeState.strikeThrough ? "is-active" : ""}
            onClick={() => applyCommand("strikeThrough")}
            title="Strikethrough"
          >
            S
          </button>
        </div>

        <div className="toolbar-group">
          <select
            defaultValue="p"
            onChange={(e) => applyCommand("formatBlock", e.target.value)}
            title="Block type"
          >
            {blockOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            defaultValue="normal"
            onChange={(e) => applyCommand("fontSize", SIZE_COMMANDS[e.target.value])}
            title="Text size"
          >
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
            <option value="xlarge">XL</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label className="color-picker" title="Text color">
            Text
            <input
              type="color"
              onChange={(e) => applyCommand("foreColor", e.target.value)}
            />
          </label>

          <label className="color-picker" title="Highlight color">
            Highlight
            <input
              type="color"
              onChange={(e) => applyCommand("hiliteColor", e.target.value)}
            />
          </label>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={activeState.insertUnorderedList ? "is-active" : ""}
            onClick={() => applyCommand("insertUnorderedList")}
            title="Bulleted list"
          >
            UL
          </button>
          <button
            type="button"
            className={activeState.insertOrderedList ? "is-active" : ""}
            onClick={() => applyCommand("insertOrderedList")}
            title="Number list"
          >
            OL
          </button>
          <button type="button" onClick={() => applyCommand("justifyLeft")} title="Align left">
            Left
          </button>
          <button
            type="button"
            onClick={() => applyCommand("justifyCenter")}
            title="Align center"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => applyCommand("justifyRight")}
            title="Align right"
          >
            Right
          </button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={insertLink} title="Insert link">
            Link
          </button>
          <button type="button" onClick={() => applyCommand("unlink")} title="Remove link">
            Unlink
          </button>
          <button
            type="button"
            onClick={() => applyCommand("removeFormat")}
            title="Clear formatting"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className="rich-input"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
        onPaste={(e) => {
          const html = e.clipboardData?.getData("text/html");
          if (!html) return;
          e.preventDefault();
          applyCommand("insertHTML", sanitizeRichTextHtml(html));
        }}
        onInput={(e) => onChange(sanitizeRichTextHtml(e.currentTarget.innerHTML))}
      />

      <div className="rich-footer">
        <span>Ctrl+B / Ctrl+I / Ctrl+U</span>
        <span>{countWordsFromHtml(value)} words</span>
      </div>
    </div>
  );
}
