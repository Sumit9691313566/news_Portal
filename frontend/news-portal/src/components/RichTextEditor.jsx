import { useEffect, useMemo, useRef } from "react";
import { sanitizeRichTextHtml } from "../utils/richText";

const SIZE_COMMANDS = {
  small: "2",
  normal: "3",
  large: "5",
  xlarge: "6",
};

export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

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

  const applyCommand = (command, commandValue = null) => {
    if (!editorRef.current) return;
    restoreSelection();
    editorRef.current.focus();
    const ok = document.execCommand(command, false, commandValue);
    if (!ok && command === "hiliteColor") {
      // Edge/Chromium fallback.
      document.execCommand("backColor", false, commandValue);
    }
    saveSelection();
    onChange(sanitizeRichTextHtml(editorRef.current.innerHTML));
  };

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
        <button type="button" onClick={() => applyCommand("bold")} title="Bold">
          B
        </button>
        <button type="button" onClick={() => applyCommand("italic")} title="Italic">
          I
        </button>
        <button type="button" onClick={() => applyCommand("underline")} title="Underline">
          U
        </button>
        <button
          type="button"
          onClick={() => applyCommand("strikeThrough")}
          title="Strikethrough"
        >
          S
        </button>

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

        <button
          type="button"
          onClick={() => applyCommand("insertUnorderedList")}
          title="Bulleted list"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => applyCommand("insertOrderedList")}
          title="Number list"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => applyCommand("justifyLeft")}
          title="Align left"
        >
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
        <button type="button" onClick={() => applyCommand("removeFormat")} title="Clear formatting">
          Clear
        </button>
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
        onInput={(e) => onChange(sanitizeRichTextHtml(e.currentTarget.innerHTML))}
      />
    </div>
  );
}
