import { useState } from "react";
import { API_BASE_URL } from "../services/api";

export default function NotificationPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [sending, setSending] = useState(false);

  const sendNow = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Admin token missing. Please login as admin first.");
        setSending(false);
        return;
      }

      // make absolute URL if relative
      const frontendBase = window.location.origin;
      const finalUrl = link && link.startsWith("/") ? `${frontendBase}${link}` : link || frontendBase;

      const headers = { "Content-Type": "application/json" };
      headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/push/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title, message, url: finalUrl, image }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Send failed");
      } else {
        alert("Notification queued/sent");
      }
    } catch (e) {
      alert("Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Send Notification</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <input placeholder="Link (e.g. /news/123)" value={link} onChange={(e) => setLink(e.target.value)} />
        <input placeholder="Image URL" value={image} onChange={(e) => setImage(e.target.value)} />
        <div>
          <button onClick={sendNow} disabled={sending} className="btn primary">
            {sending ? "Sending..." : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
