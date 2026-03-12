import { useEffect, useMemo, useRef, useState } from "react";
import { countWordsFromHtml, sanitizeRichTextHtml } from "../utils/richText";

const SIZE_COMMANDS = {
  small: "2",
  normal: "3",
  medium: "4",
  large: "5",
  xlarge: "6",
  xxlarge: "7",
};

const SIZE_ORDER = ["small", "normal", "medium", "large", "xlarge", "xxlarge"];

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
  const [fontSizeKey, setFontSizeKey] = useState("normal");

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

    try {
      const rawFontSize = String(document.queryCommandValue("fontSize") || "").trim();
      const matchedSize =
        Object.entries(SIZE_COMMANDS).find(([, value]) => value === rawFontSize)?.[0] ||
        "normal";
      setFontSizeKey(matchedSize);
    } catch {
      setFontSizeKey("normal");
    }
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

    const sanitized = sanitizeRichTextHtml(editorRef.current.innerHTML);
    editorRef.current.innerHTML = sanitized;
    saveSelection();
    refreshToolbarState();
    onChange(sanitized);
  };

  const applyFontSize = (nextSizeKey) => {
    setFontSizeKey(nextSizeKey);
    applyCommand("fontSize", SIZE_COMMANDS[nextSizeKey]);
  };

  const stepFontSize = (direction) => {
    const currentIndex = Math.max(0, SIZE_ORDER.indexOf(fontSizeKey));
    const nextIndex = Math.min(
      SIZE_ORDER.length - 1,
      Math.max(0, currentIndex + direction)
    );
    applyFontSize(SIZE_ORDER[nextIndex]);
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

          <button
            type="button"
            className="font-step-btn"
            onClick={() => stepFontSize(-1)}
            title="Decrease text size"
          >
            A-
          </button>
          <select
            value={fontSizeKey}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Text size"
          >
            <option value="small">10 px</option>
            <option value="normal">12 px</option>
            <option value="medium">14 px</option>
            <option value="large">18 px</option>
            <option value="xlarge">24 px</option>
            <option value="xxlarge">32 px</option>
          </select>
          <button
            type="button"
            className="font-step-btn"
            onClick={() => stepFontSize(1)}
            title="Increase text size"
          >
            A+
          </button>
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
