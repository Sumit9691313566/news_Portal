import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";
import "../styles/userNews.css";

const ACCEPTED_MEDIA = "image/*,video/*";

export default function UserNewsSubmit() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState(null);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");

  const mediaKind = media?.type?.startsWith("video/") ? "video" : "image";

  useEffect(() => {
    if (!media) {
      setMediaPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(media);
    setMediaPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [media]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim() && !media) {
      setFeedback("टेक्स्ट संदेश या फोटो/वीडियो में से कम से कम एक चीज भेजना जरूरी है।");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("mobileNumber", mobileNumber.trim());
    formData.append("city", city.trim());
    formData.append("message", message.trim());
    if (media) {
      formData.append("media", media);
    }

    try {
      setSending(true);
      setFeedback("");

      const res = await fetchWithTimeout(
        "user-news",
        {
          method: "POST",
          body: formData,
        },
        60000
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "खबर भेजने में दिक्कत आ गई।");
      }

      setName("");
      setMobileNumber("");
      setCity("");
      setMessage("");
      setMedia(null);
      setFeedback(data?.message || "Aapki khabar bhej di gayi hai.");
    } catch (error) {
      setFeedback(error.message || "खबर भेजने में दिक्कत आ गई।");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="user-news-shell">
      <div className="user-news-page">
        <div className="user-news-hero">
          <div>
            <span className="user-news-kicker">गरुड़ समाचार नागरिक डेस्क</span>
            <h1>अपनी नजर की खबर सीधे हमें भेजें</h1>
            <p>
              अगर आपके पास कोई स्थानीय या महत्वपूर्ण खबर है, तो उसे टेक्स्ट,
              फोटो या वीडियो के साथ सीधे हमें भेजें हम जनता तक पहुंचाएंगे ।
            </p>
          </div>
          <button
            type="button"
            className="user-news-secondary-btn"
            onClick={() => navigate("/")}
          >
            होम पर वापस
          </button>
        </div>

        <div className="user-news-grid">
          <form className="user-news-card" onSubmit={handleSubmit}>
            <h2>खबर भेजने का फॉर्म</h2>
            <p className="user-news-note">
              नाम, मोबाइल नंबर और शहर भरना जरूरी नहीं है। चाहें तो सिर्फ
              टेक्स्ट भेजकर भी खबर साझा कर सकते हैं। अगर आप अपना शहर और
              मोबाइल नंबर देंगे, तो आपसे जुड़कर हमें खुशी होगी ।
            </p>

            <label>
              <span>नाम</span>
              <input
                type="text"
                placeholder="अपना नाम लिखें (वैकल्पिक)"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label>
              <span>मोबाइल नंबर</span>
              <input
                type="text"
                placeholder="मोबाइल नंबर लिखें (वैकल्पिक)"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
              />
            </label>

            <label>
              <span>शहर / कस्बा</span>
              <input
                type="text"
                placeholder="शहर या कस्बा लिखें (वैकल्पिक)"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>

            <label>
              <span>खबर का विवरण</span>
              <textarea
                placeholder="यहां अपनी खबर विस्तार से लिखें..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
              />
            </label>

            <label>
              <span>फोटो / वीडियो</span>
              <input
                type="file"
                accept={ACCEPTED_MEDIA}
                onChange={(event) => setMedia(event.target.files?.[0] || null)}
              />
            </label>

            <button type="submit" className="user-news-primary-btn" disabled={sending}>
              {sending ? "भेजा जा रहा है..." : "खबर भेजें"}
            </button>

            {feedback && <div className="user-news-feedback">{feedback}</div>}
          </form>

          <div className="user-news-card user-news-preview">
            <h2>झलक</h2>
            <div className="user-news-preview-meta">
              <strong>{name.trim() || "अज्ञात उपयोगकर्ता"}</strong>
              <span>{city.trim() || "शहर साझा नहीं किया गया"}</span>
              <span>{mobileNumber.trim() || "मोबाइल नंबर साझा नहीं किया गया"}</span>
            </div>
            <div className="user-news-preview-message">
              {message.trim() || "यहां आपकी लिखी हुई खबर की झलक दिखाई देगी।"}
            </div>

            {mediaPreviewUrl && mediaKind === "image" && (
              <img
                className="user-news-preview-media"
                src={mediaPreviewUrl}
                alt="यूज़र न्यूज़ प्रीव्यू"
              />
            )}
            {mediaPreviewUrl && mediaKind === "video" && (
              <video className="user-news-preview-media" src={mediaPreviewUrl} controls />
            )}

            <div className="user-news-tip-box">
              <h3>सुझाव</h3>
              <ul>
                <li>जगह और घटना का छोटा सा संदर्भ जरूर लिखें।</li>
                <li>अगर वीडियो भेज रहे हैं तो उसे साफ और सीधा रखें।</li>
                <li>वैकल्पिक जानकारी भरने से खबर की जांच आसान हो जाती है।</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
