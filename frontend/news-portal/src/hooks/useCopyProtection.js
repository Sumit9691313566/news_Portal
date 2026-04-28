import { useEffect, useState } from "react";

const BLOCKED_KEY_COMBOS = new Set(["c", "x", "s", "p", "u", "a"]);

export default function useCopyProtection(enabled = true) {
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [shieldVisible, setShieldVisible] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    let noticeTimer;
    let shieldTimer;
    const showNotice = () => {
      window.clearTimeout(noticeTimer);
      setNoticeVisible(true);
      noticeTimer = window.setTimeout(() => setNoticeVisible(false), 1600);
    };
    const showShield = (duration = 1800) => {
      window.clearTimeout(shieldTimer);
      setShieldVisible(true);
      shieldTimer = window.setTimeout(() => setShieldVisible(false), duration);
    };

    const blockEvent = (event) => {
      event.preventDefault();
      showNotice();
    };

    const handleKeyDown = (event) => {
      const key = String(event.key || "").toLowerCase();
      const isModifierCombo = event.ctrlKey || event.metaKey;

      if (
        key === "printscreen"
      ) {
        blockEvent(event);
        showShield();
        return;
      }

      if (
        (isModifierCombo && BLOCKED_KEY_COMBOS.has(key)) ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        blockEvent(event);
      }
    };

    const handleSelectStart = (event) => {
      const target = event.target;
      if (target?.closest?.("a, button, input, textarea, select")) return;
      blockEvent(event);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShieldVisible(true);
        return;
      }
      window.clearTimeout(shieldTimer);
      setShieldVisible(false);
    };
    const handleWindowBlur = () => {
      showShield(2500);
    };
    const handlePrint = () => {
      showShield(2500);
      showNotice();
    };

    document.body.classList.add("copy-protection-active");
    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeprint", handlePrint);

    return () => {
      window.clearTimeout(noticeTimer);
      window.clearTimeout(shieldTimer);
      document.body.classList.remove("copy-protection-active");
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeprint", handlePrint);
    };
  }, [enabled]);

  return { noticeVisible, shieldVisible };
}
