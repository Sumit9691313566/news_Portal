import { useEffect, useState } from "react";
import {
  dismissPushPrompt,
  registerAndSubscribe,
  shouldShowPushPrompt,
} from "../services/push";

const PushPermissionPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(shouldShowPushPrompt());
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setBusy(true);
    setError("");

    try {
      await registerAndSubscribe();
      setVisible(false);
    } catch (err) {
      setError(err?.message || "Notification allow nahi hua.");
    } finally {
      setBusy(false);
    }
  };

  const handleLater = () => {
    dismissPushPrompt();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="push-permission" role="dialog" aria-live="polite">
      <div className="push-permission__text">
        <strong>Daily nayi khabrein paane ke liye notifications allow karein?</strong>
        <span>Garud Samachar par nayi news publish hote hi update mil jayega.</span>
        {error ? <small>{error}</small> : null}
      </div>
      <div className="push-permission__actions">
        <button type="button" onClick={handleLater} disabled={busy}>
          Later
        </button>
        <button type="button" onClick={handleAllow} disabled={busy}>
          {busy ? "Allowing..." : "Allow"}
        </button>
      </div>
    </div>
  );
};

export default PushPermissionPrompt;
