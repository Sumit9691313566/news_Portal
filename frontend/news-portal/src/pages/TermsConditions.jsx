import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaBan,
  FaCopyright,
  FaExternalLinkAlt,
  FaFileContract,
  FaGavel,
  FaNewspaper,
  FaUserShield,
} from "react-icons/fa";
import SiteFooter from "../components/SiteFooter";
import "../styles/category.css";
import "../styles/terms.css";
import brandLogo from "../../logo.png";

const keyTerms = [
  {
    icon: <FaCopyright />,
    title: "Intellectual Property",
    body: "All text, images, videos, graphics, layout, branding, and other content are owned by Garud Samachar or used under license. Unauthorized copying, reproduction, republication, distribution, scraping, or commercial use is prohibited.",
  },
  {
    icon: <FaNewspaper />,
    title: "Permitted Use",
    body: "Content is provided for personal, informational, and non-commercial reading. Any commercial use, syndication, reuse, or redistribution requires prior written permission from Garud Samachar.",
  },
  {
    icon: <FaUserShield />,
    title: "User Conduct",
    body: "Users must not post, submit, share, or engage in unlawful, harmful, abusive, misleading, defamatory, hateful, threatening, spammy, or rights-violating activity on or through the platform.",
  },
  {
    icon: <FaExternalLinkAlt />,
    title: "External Links",
    body: "Our website may link to external websites, videos, social platforms, advertisements, or embedded services. Garud Samachar is not responsible for third-party content, policies, availability, or practices.",
  },
];

const detailedTerms = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using the Garud Samachar website, mobile web pages, videos, notifications, e-paper, user-submission features, or any other digital service, you agree to follow these Terms & Conditions.",
  },
  {
    title: "2. Accuracy & Availability",
    body: "We strive to publish accurate, verified, and updated information. However, we do not guarantee that every item will be complete, error-free, uninterrupted, or available at all times. News may change as new facts emerge.",
  },
  {
    title: "3. Editorial Rights",
    body: "Garud Samachar may edit, update, remove, reject, correct, reorganize, or archive content at its discretion for editorial, legal, safety, technical, or operational reasons.",
  },
  {
    title: "4. User Submissions",
    body: "If you send news tips, images, videos, documents, comments, or other material, you confirm that the information is lawful, accurate to the best of your knowledge, and that you have the right to share it. We may verify, edit, publish, reject, or remove submissions.",
  },
  {
    title: "5. Prohibited Activity",
    body: "You must not misuse the platform, attempt unauthorized access, upload malicious code, impersonate others, spread false information, violate intellectual property rights, harass people, or use the website for illegal activity.",
  },
  {
    title: "6. Advertising & Sponsored Material",
    body: "Advertisements, sponsored communication, or third-party offers may appear on the website. The relevant advertiser or service provider is responsible for its claims, products, pricing, offers, and services.",
  },
  {
    title: "7. Changes to Services",
    body: "We may modify, suspend, improve, restrict, or discontinue any content, feature, section, design, or service without prior notice, including for technical, editorial, commercial, legal, or security reasons.",
  },
  {
    title: "8. Governing Law",
    body: "These Terms & Conditions are governed by the laws of India. Any disputes will fall under the jurisdiction of competent courts in Bhopal, Madhya Pradesh, unless applicable law requires otherwise.",
  },
];

const prohibitedItems = [
  "Unauthorized copying, republishing, redistribution, or commercial reuse",
  "Posting or submitting unlawful, abusive, defamatory, or harmful material",
  "Trying to disrupt, hack, scrape, overload, or misuse website systems",
  "Using Garud Samachar branding, logo, or content without permission",
];

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="layout-wrapper terms-wrapper about-wrapper">
      <Helmet>
        <title>Terms & Conditions | Garud Samachar</title>
        <meta
          name="description"
          content="Read Garud Samachar Terms & Conditions covering intellectual property, permitted use, user conduct, external links, accuracy, changes, governing law, and violations."
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
            <span className="legal-brand-copy">
              <strong>Garud Samachar</strong>
              <small>Digital News Network</small>
            </span>
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

      <main className="about-page terms-policy-page">
        <section className="terms-hero-premium" aria-labelledby="terms-title">
          <div className="terms-hero-content">
            <div className="terms-kicker">Terms & Conditions</div>
            <h1 id="terms-title">Rules for using Garud Samachar</h1>
            <p>
              By accessing this website, you agree to these Terms & Conditions.
              They explain how our content may be used, what conduct is not
              allowed, how editorial rights work, and which laws apply.
            </p>
            <div className="terms-hero-meta">
              <span>Applies to website, videos, e-paper, submissions, and digital services</span>
              <span>Jurisdiction: Bhopal, Madhya Pradesh, India</span>
            </div>
          </div>

          <div className="terms-legal-card" aria-label="Legal overview">
            <FaFileContract />
            <strong>Use responsibly</strong>
            <span>Personal and informational use is permitted.</span>
            <span>Unauthorized commercial reuse is prohibited.</span>
            <span>Violation may result in legal action.</span>
          </div>
        </section>

        <section className="terms-key-grid" aria-label="Key terms">
          {keyTerms.map((item) => (
            <article key={item.title} className="terms-key-card">
              <div>{item.icon}</div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="about-section terms-rules-section">
          <div className="about-section-heading">
            <span>Detailed Terms</span>
            <h2>Conditions of access and use</h2>
          </div>
          <div className="about-info-list terms-legal-list">
            {detailedTerms.map((section) => (
              <section className="about-info-row" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Not Allowed</span>
              <h2>Prohibited use</h2>
            </div>
            <ul className="about-check-list">
              {prohibitedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="terms-warning-box">
            <FaBan />
            <h2>Violation may result in legal action</h2>
            <p>
              Misuse of content, unlawful activity, platform abuse, copyright
              violation, or harmful conduct may lead to content removal, access
              restriction, complaint, or legal action as permitted by law.
            </p>
          </div>
        </section>

        <section className="about-section terms-bottom-grid">
          <article>
            <FaBalanceScale />
            <h2>Governing Law</h2>
            <p>
              These terms are governed by Indian law. Disputes are subject to the
              jurisdiction of competent courts in Bhopal, Madhya Pradesh, unless
              applicable law requires otherwise.
            </p>
          </article>
          <article>
            <FaGavel />
            <h2>Changes</h2>
            <p>
              Garud Samachar may update these terms or modify services without
              prior notice. The latest version published on this page will apply.
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
