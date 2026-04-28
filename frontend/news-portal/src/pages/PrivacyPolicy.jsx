import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaCookieBite,
  FaEnvelope,
  FaEye,
  FaLock,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import SiteFooter from "../components/SiteFooter";
import "../styles/category.css";
import "../styles/terms.css";
import brandLogo from "../../logo.png";

const privacyPillars = [
  {
    icon: <FaShieldAlt />,
    title: "Minimal Collection",
    body: "We collect only the information needed to run the platform, respond to readers, improve performance, and protect the website.",
  },
  {
    icon: <FaLock />,
    title: "Responsible Protection",
    body: "Reader messages, usage signals, and editorial communication are handled with reasonable technical and organizational safeguards.",
  },
  {
    icon: <FaUserCheck />,
    title: "Reader Control",
    body: "You can control cookies through your browser and contact us for privacy questions, correction requests, or data concerns.",
  },
];

const dataLifecycle = [
  {
    title: "Collected",
    body: "Contact details, reader emails, story tips, device signals, pages visited, cookies, and analytics data may be collected when you use the website.",
  },
  {
    title: "Used",
    body: "Data helps us respond to queries, verify feedback, improve content quality, detect abuse, maintain security, and understand overall website performance.",
  },
  {
    title: "Protected",
    body: "We restrict access where appropriate and use reasonable safeguards against unauthorized access, misuse, alteration, or loss.",
  },
  {
    title: "Retained",
    body: "Information is kept only as long as reasonably needed for communication, verification, legal, security, or operational purposes.",
  },
];

const policyBlocks = [
  {
    icon: <FaEnvelope />,
    title: "Contact & Editorial Data",
    body: "When you email us, submit a correction, send feedback, or share a story tip, we may receive your name, email address, message content, attachments, and any other information you choose to provide.",
  },
  {
    icon: <FaEye />,
    title: "Usage & Analytics Data",
    body: "We may collect basic technical information such as IP address, browser, device type, pages visited, referral source, approximate location signals, cookies, and website performance data.",
  },
  {
    icon: <FaCookieBite />,
    title: "Cookies",
    body: "Cookies and analytics tools may be used to understand traffic, improve loading speed, remember basic preferences, and diagnose technical issues. You can manage cookies in your browser settings.",
  },
  {
    icon: <FaBalanceScale />,
    title: "Legal Disclosure",
    body: "We may disclose information if required by law, regulation, legal process, or when needed to protect rights, safety, public interest, or the integrity of Garud Samachar.",
  },
];

const readerRights = [
  "Ask us to review contact information you shared with us",
  "Request correction of inaccurate contact details",
  "Raise a concern about cookies, analytics, or website usage data",
  "Contact us if personal information was shared with us by mistake",
  "Request clarification about how a reader message or story tip is handled",
];

const responsibleTips = [
  "Share only information that is necessary for verification",
  "Avoid sending private data of others unless it is relevant and lawful",
  "For urgent editorial matters, mention URGENT in the subject line",
  "Include context, location, date, and supporting material when available",
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const scrollToPolicyDetails = () => {
    document.getElementById("privacy-policy-details")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="layout-wrapper terms-wrapper about-wrapper">
      <Helmet>
        <title>Privacy Policy | Garud Samachar</title>
        <meta
          name="description"
          content="Read the Garud Samachar Privacy Policy covering data collection, cookies, analytics, security, legal disclosure, reader rights, and privacy contacts."
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

      <main className="about-page privacy-page">
        <section className="privacy-hero-premium" aria-labelledby="privacy-title">
          <div className="privacy-hero-content">
            <div className="terms-kicker">Privacy Policy</div>
            <h1 id="privacy-title">Your trust matters to Garud Samachar</h1>
            <p>
              We respect your privacy and are committed to protecting personal
              data shared with our newsroom, website, and digital services. This
              policy explains what we collect, why we use it, how long we keep it,
              and how you can contact us.
            </p>
            <div className="privacy-hero-actions">
              <button type="button" onClick={scrollToPolicyDetails}>
                Read Policy Details
              </button>
              <button type="button" onClick={() => navigate("/contact-us")}>
                Contact Page
              </button>
            </div>
          </div>

          <div className="privacy-trust-card" aria-label="Privacy summary">
            <img src={brandLogo} alt="Garud Samachar" />
            <strong>Privacy by Responsibility</strong>
            <span>No sale of reader personal data</span>
            <span>Cookie controls through browser settings</span>
            <span>Reasonable safeguards for reader communication</span>
          </div>
        </section>

        <section className="privacy-pillars" aria-label="Privacy commitments">
          {privacyPillars.map((item) => (
            <article key={item.title} className="privacy-pillar">
              <div>{item.icon}</div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="about-section privacy-lifecycle-section">
          <div className="about-section-heading">
            <span>Data Lifecycle</span>
            <h2>How information moves through our system</h2>
          </div>
          <div className="privacy-lifecycle">
            {dataLifecycle.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="privacy-policy-details">
          <div className="about-section-heading">
            <span>Policy Details</span>
            <h2>What we collect and why</h2>
          </div>
          <div className="privacy-policy-grid">
            {policyBlocks.map((item) => (
              <article key={item.title} className="privacy-policy-card">
                <div>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Your Rights</span>
              <h2>Reader privacy requests</h2>
            </div>
            <ul className="about-check-list">
              {readerRights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="about-section-heading">
              <span>Story Tips</span>
              <h2>Send sensitive information carefully</h2>
            </div>
            <ul className="about-check-list">
              {responsibleTips.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="about-section privacy-detail-section">
          <div className="about-section-heading">
            <span>Additional Notes</span>
            <h2>Security, third-party links, and updates</h2>
          </div>
          <div className="about-info-list">
            <section className="about-info-row">
              <h3>Data Security</h3>
              <p>
                We use reasonable safeguards to protect information from
                unauthorized access, misuse, alteration, or loss. No digital
                platform is completely risk-free, but we work to keep reader data
                protected.
              </p>
            </section>
            <section className="about-info-row">
              <h3>Third-Party Links</h3>
              <p>
                External websites, embedded media, social platforms, or linked
                services may follow their own privacy practices. Garud Samachar is
                not responsible for third-party policies.
              </p>
            </section>
            <section className="about-info-row">
              <h3>Children's Privacy</h3>
              <p>
                Garud Samachar is a general news platform and does not knowingly
                collect children's personal data for marketing. Guardians may
                contact us for review if such information was shared by mistake.
              </p>
            </section>
            <section className="about-info-row">
              <h3>Policy Updates</h3>
              <p>
                This policy may be updated from time to time. The latest version
                will be published on this page.
              </p>
            </section>
          </div>
        </section>

        <section className="about-section about-contact-section privacy-contact-strip">
          <div>
            <div className="about-section-heading">
              <span>Contact</span>
              <h2>Privacy questions or requests</h2>
            </div>
            <p className="about-body-text">
              For privacy questions, correction requests, cookie concerns, or
              data-related feedback, contact either of the official Garud Samachar
              email addresses below.
            </p>
          </div>
          <div className="about-contact-grid">
            <div>
              <h3>Primary Contact</h3>
              <p>
                Email:{" "}
                <a href="mailto:garudsamachar@gmail.com">
                  garudsamachar@gmail.com
                </a>
              </p>
            </div>
            <div>
              <h3>Office Contact</h3>
              <p>
                Email:{" "}
                <a href="mailto:garudsamacharoffice@gmail.com">
                  garudsamacharoffice@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
