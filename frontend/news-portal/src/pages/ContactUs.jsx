import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import useCopyProtection from "../hooks/useCopyProtection";
import "../styles/category.css";
import "../styles/terms.css";
import brandLogo from "../../logo.png";

const contactCards = [
  {
    title: "Editorial Desk",
    body: "For story tips, corrections, news leads, field updates, public-interest documents, and urgent editorial matters.",
    email: "garudsamachar@gmail.com",
    note: "Best for: news tips, corrections, eyewitness inputs, local issues, and newsroom follow-up.",
  },
  {
    title: "General Queries",
    body: "For reader feedback, support, official communication, partnerships, business inquiries, and advertising-related requests.",
    email: "garudsamacharoffice@gmail.com",
    note: "Best for: general support, collaborations, official requests, advertising, and administrative communication.",
  },
];

const tipChecklist = [
  "Location, date, and approximate time of the incident",
  "Names or official details, if they can be shared responsibly",
  "Photos, videos, documents, or links that support the information",
  "Your contact details for verification, if you are comfortable sharing them",
];

const responseSteps = [
  {
    title: "1. Message Received",
    body: "Your email reaches the relevant desk based on the subject and content.",
  },
  {
    title: "2. Verification Review",
    body: "Editorial messages are reviewed for source clarity, public interest, and supporting details.",
  },
  {
    title: "3. Follow-up",
    body: "If more information is required, the team may contact you for clarification.",
  },
];

export default function ContactUs() {
  const navigate = useNavigate();
  const { noticeVisible: copyNoticeVisible, shieldVisible } = useCopyProtection();

  return (
    <div className="layout-wrapper terms-wrapper about-wrapper">
      {shieldVisible && (
        <div className="copy-protection-shield" aria-hidden="true">
          <div>
            <strong>Protected Page</strong>
            <span>Screen capture and background preview are restricted on this page.</span>
          </div>
        </div>
      )}
      {copyNoticeVisible && (
        <div className="copy-protection-notice">Copy and screenshot actions are restricted.</div>
      )}
      <Helmet>
        <title>Contact Us | Garud Samachar</title>
        <meta
          name="description"
          content="Contact Garud Samachar for feedback, story tips, editorial inquiries, general queries, business communication, and advertising."
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <header className="masthead terms-masthead">
        <div className="brand-row terms-brand-row">
          <button
            type="button"
            className="terms-brand"
            onClick={() => navigate("/")}
          >
            <img className="brand-logo" src={brandLogo} alt="Garud Samachar logo" />
            <span className="brand-title-hindi">Garud Samachar</span>
          </button>

          <button
            type="button"
            className="terms-home-btn"
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>
      </header>

      <main className="about-page">
        <section className="about-hero contact-hero" aria-labelledby="contact-title">
          <div className="about-hero-copy">
            <div className="terms-kicker">Contact Us</div>
            <h1 id="contact-title">Contact Garud Samachar</h1>
            <p>
              We value your feedback, story tips, corrections, and inquiries.
              Whether you are a reader, source, advertiser, or community member,
              the Garud Samachar team is ready to hear from you.
            </p>
          </div>
          <div className="about-hero-panel">
            <span>Response Priority</span>
            <strong>Mention "URGENT"</strong>
            <small>
              For urgent editorial matters, include "URGENT" in the email subject
              so the newsroom can identify it quickly.
            </small>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span>Office</span>
            <h2>Registered Office</h2>
          </div>
          <p className="about-body-text">
            Panchvati Colony Phase 3, Karond, Bhopal
          </p>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span>Email</span>
            <h2>Choose the right desk</h2>
          </div>
          <div className="about-contact-grid">
            {contactCards.map((card) => (
              <div key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <p>
                  Email: <a href={`mailto:${card.email}`}>{card.email}</a>
                </p>
                <p>{card.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Business / Advertising</span>
              <h2>Advertising and collaborations</h2>
            </div>
            <p className="about-body-text">
              For advertising, sponsored communication, brand partnerships, and
              business-related inquiries, please contact the general queries desk
              at garudsamacharoffice@gmail.com.
            </p>
          </div>
          <div>
            <div className="about-section-heading">
              <span>Working Hours</span>
              <h2>Mon-Sat, 10:00 AM-6:00 PM</h2>
            </div>
            <p className="about-body-text">
              We aim to respond promptly during working hours. Messages received
              outside office hours are reviewed on the next working day.
            </p>
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Story Tips</span>
              <h2>What to include in a news tip</h2>
            </div>
            <ul className="about-check-list">
              {tipChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="about-section-heading">
              <span>Response Process</span>
              <h2>How we handle your message</h2>
            </div>
            <div className="about-info-list contact-process-list">
              {responseSteps.map((step) => (
                <section className="about-info-row" key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span>Subject Line Guide</span>
            <h2>Use a clear subject for faster routing</h2>
          </div>
          <div className="about-topic-list">
            <span>URGENT: Editorial Matter</span>
            <span>Correction Request</span>
            <span>Story Tip</span>
            <span>Advertising Inquiry</span>
            <span>General Feedback</span>
          </div>
        </section>

        <section className="about-section about-lead">
          <p className="about-body-text">
            We respect responsible communication. Please avoid sending unverified
            allegations without supporting context. If your message involves a
            sensitive public-interest matter, include enough detail for the team
            to verify it carefully.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
