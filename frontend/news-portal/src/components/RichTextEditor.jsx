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

const CSS_COMMANDS = new Set([
  "foreColor",
  "hiliteColor",
  "backColor",
]);

const isSafeLink = (url = "") =>
  /^(https?:\/\/|mailto:|tel:)/i.test(String(url).trim());

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const plainTextToHtml = (text = "") => {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "<p></p>";

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lineHtml = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br>");
      return `<p>${lineHtml}</p>`;
    })
    .join("");
};

export default function RichTextEditor({ value, onChange, placeholder = "" }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const historyRef = useRef({
    entries: [],
    index: -1,
    lastHtml: "",
    isApplying: false,
  });
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
    if (!historyRef.current.entries.length) {
      historyRef.current.entries = [safe];
      historyRef.current.index = 0;
      historyRef.current.lastHtml = safe;
    }
  }, [value]);

  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, false);
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

  const preserveToolbarSelection = (event) => {
    event.preventDefault();
    saveSelection();
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

  const syncEditorHtml = (html = "", options = {}) => {
    if (!editorRef.current) return "";
    const { updateDom = true } = options;
    const sanitized = sanitizeRichTextHtml(html);
    if (updateDom && editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
    saveSelection();
    refreshToolbarState();
    onChange(sanitized);
    return sanitized;
  };

  const pushHistory = (html = "") => {
    const sanitized = sanitizeRichTextHtml(html);
    const history = historyRef.current;
    if (history.isApplying) {
      history.lastHtml = sanitized;
      return;
    }
    if (sanitized === history.lastHtml) return;

    const nextEntries = history.entries.slice(0, history.index + 1);
    nextEntries.push(sanitized);
    if (nextEntries.length > 150) {
      nextEntries.shift();
    }

    history.entries = nextEntries;
    history.index = nextEntries.length - 1;
    history.lastHtml = sanitized;
  };

  const applyHistoryState = (nextIndex) => {
    const history = historyRef.current;
    if (nextIndex < 0 || nextIndex >= history.entries.length) return;
    history.isApplying = true;
    history.index = nextIndex;
    history.lastHtml = history.entries[nextIndex];
    syncEditorHtml(history.entries[nextIndex]);
    history.isApplying = false;
  };

  const undoHistory = () => {
    applyHistoryState(historyRef.current.index - 1);
  };

  const redoHistory = () => {
    applyHistoryState(historyRef.current.index + 1);
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
    if (command === "undo") {
      undoHistory();
      return;
    }
    if (command === "redo") {
      redoHistory();
      return;
    }
    restoreSelection();
    editorRef.current.focus();

    try {
      document.execCommand("styleWithCSS", false, CSS_COMMANDS.has(command));
    } catch {
      // Browser compatibility fallback.
    }

    const ok = document.execCommand(command, false, commandValue);
    if (!ok && command === "hiliteColor") {
      document.execCommand("backColor", false, commandValue);
    }

    const nextHtml = syncEditorHtml(editorRef.current.innerHTML, {
      updateDom: false,
    });
    pushHistory(nextHtml);
  };

  const applyFontSize = (nextSizeKey) => {
    setFontSizeKey(nextSizeKey);
    applyCommand("fontSize", SIZE_COMMANDS[nextSizeKey]);
  };

  const prepareColorCommand = () => {
    saveSelection();
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
    restoreSelection();
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

  const insertTable = () => {
    const rowInput = window.prompt("Table me kitni rows chahiye?", "2");
    if (!rowInput) return;

    const colInput = window.prompt("Table me kitne columns chahiye?", "2");
    if (!colInput) return;

    const rows = Math.min(12, Math.max(1, Number.parseInt(rowInput, 10) || 0));
    const cols = Math.min(8, Math.max(1, Number.parseInt(colInput, 10) || 0));

    if (!rows || !cols) {
      window.alert("Valid rows aur columns enter karo.");
      return;
    }

    const headCells = Array.from({ length: cols }, (_, index) => {
      return `<th style="border: 1px solid #d7dce2; padding: 8px; background-color: #f7f7f7;">Heading ${index + 1}</th>`;
    }).join("");

    const bodyRows = Array.from({ length: rows }, (_, rowIndex) => {
      const cells = Array.from({ length: cols }, (_, colIndex) => {
        return `<td style="border: 1px solid #d7dce2; padding: 8px;">Row ${rowIndex + 1} Col ${colIndex + 1}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        <thead>
          <tr>${headCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
      <p></p>
    `;

    applyCommand("insertHTML", tableHtml);
  };

  const blockOptions = useMemo(
    () => [
      { label: "Normal", value: "<p>" },
      { label: "Heading 2", value: "<h2>" },
      { label: "Heading 3", value: "<h3>" },
      { label: "Quote", value: "<blockquote>" },
    ],
    []
  );

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("undo")}
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("redo")}
            title="Redo"
          >
            Redo
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={activeState.bold ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("bold")}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            className={activeState.italic ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("italic")}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            className={activeState.underline ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("underline")}
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            className={activeState.strikeThrough ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("strikeThrough")}
            title="Strikethrough"
          >
            S
          </button>
        </div>

        <div className="toolbar-group">
          <select
            defaultValue="<p>"
            onMouseDown={prepareColorCommand}
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
            onMouseDown={preserveToolbarSelection}
            onClick={() => stepFontSize(-1)}
            title="Decrease text size"
          >
            A-
          </button>
          <select
            value={fontSizeKey}
            onMouseDown={prepareColorCommand}
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
            onMouseDown={preserveToolbarSelection}
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
              onClick={prepareColorCommand}
              onMouseDown={prepareColorCommand}
              onChange={(e) => applyCommand("foreColor", e.target.value)}
            />
          </label>

          <label className="color-picker" title="Highlight color">
            Highlight
            <input
              type="color"
              onClick={prepareColorCommand}
              onMouseDown={prepareColorCommand}
              onChange={(e) => applyCommand("hiliteColor", e.target.value)}
            />
          </label>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={activeState.insertUnorderedList ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("insertUnorderedList")}
            title="Bulleted list"
          >
            UL
          </button>
          <button
            type="button"
            className={activeState.insertOrderedList ? "is-active" : ""}
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("insertOrderedList")}
            title="Number list"
          >
            OL
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("justifyLeft")}
            title="Align left"
          >
            Left
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("justifyCenter")}
            title="Align center"
          >
            Center
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("justifyRight")}
            title="Align right"
          >
            Right
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={insertLink}
            title="Insert link"
          >
            Link
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={insertTable}
            title="Insert table"
          >
            Table
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => applyCommand("unlink")}
            title="Remove link"
          >
            Unlink
          </button>
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
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
        onKeyDown={(e) => {
          const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z";
          const isRedo =
            (e.ctrlKey || e.metaKey) &&
            (e.key.toLowerCase() === "y" ||
              (e.shiftKey && e.key.toLowerCase() === "z"));

          if (isUndo) {
            e.preventDefault();
            undoHistory();
            return;
          }

          if (isRedo) {
            e.preventDefault();
            redoHistory();
          }
        }}
        onPaste={(e) => {
          const html = e.clipboardData?.getData("text/html");
          e.preventDefault();
          if (html) {
            applyCommand("insertHTML", sanitizeRichTextHtml(html));
            return;
          }

          const text = e.clipboardData?.getData("text/plain") || "";
          applyCommand("insertHTML", plainTextToHtml(text));
        }}
        onInput={(e) => {
          const nextHtml = syncEditorHtml(e.currentTarget.innerHTML, {
            updateDom: false,
          });
          pushHistory(nextHtml);
        }}
      />

      <div className="rich-footer">
        <span>Ctrl+B / Ctrl+I / Ctrl+U</span>
        <span>{countWordsFromHtml(value)} words</span>
      </div>
    </div>
  );
}
