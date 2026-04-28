import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaBullhorn,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaInfoCircle,
  FaPenNib,
  FaShieldAlt,
} from "react-icons/fa";
import SiteFooter from "../components/SiteFooter";
import "../styles/category.css";
import "../styles/terms.css";
import brandLogo from "../../logo.png";

const disclaimerCards = [
  {
    icon: <FaInfoCircle />,
    title: "Informational Purpose",
    body: "Content on Garud Samachar is published for informational purposes based on available sources, reports, official statements, documents, and on-ground inputs.",
  },
  {
    icon: <FaExclamationTriangle />,
    title: "Accuracy Limit",
    body: "We aim for accuracy and verification, but we do not warrant completeness, absolute correctness, uninterrupted availability, or real-time freshness of every item.",
  },
  {
    icon: <FaPenNib />,
    title: "Opinion Content",
    body: "Opinions, columns, analysis, and guest contributions belong to their respective authors and do not necessarily reflect the official views of Garud Samachar.",
  },
  {
    icon: <FaExternalLinkAlt />,
    title: "External Content",
    body: "Third-party websites, embedded media, advertisements, and external references may follow their own policies. We are not responsible for third-party content or claims.",
  },
];

const disclaimerDetails = [
  {
    title: "Reliance on Content",
    body: "Readers should use their own judgment before relying on any report, opinion, analysis, data point, or external reference published on the platform. Important decisions should be verified from official or professional sources where required.",
  },
  {
    title: "No Liability",
    body: "Garud Samachar, its owners, editors, contributors, employees, or partners are not liable for any loss, damage, inconvenience, or consequence arising from reliance on content published on the website.",
  },
  {
    title: "Updates and Corrections",
    body: "News develops over time. We may update, correct, remove, or revise content when new verified information becomes available or when an error is identified.",
  },
  {
    title: "Complaints and Grievances",
    body: "For corrections, complaints, privacy concerns, or content-related grievances, readers may contact the Grievance Officer using the official email listed below.",
  },
];

const disclaimerFacts = [
  "Published for public information",
  "Verification may evolve with updates",
  "Reader discretion is advised",
];

const editorialChecks = [
  "Source review and editorial screening",
  "Corrections considered when credible input is received",
  "External references remain under third-party control",
];

const disclaimerSidePoints = [
  "Verify important decisions from official sources.",
  "News details may change as fresh updates arrive.",
  "Opinion articles represent the author's own view.",
  "Advertisements and external links follow separate policies.",
  "Report corrections with clear reference details.",
  "Use reader judgment before relying on any claim.",
];

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="layout-wrapper terms-wrapper about-wrapper">
      <Helmet>
        <title>Disclaimer | Garud Samachar</title>
        <meta
          name="description"
          content="Read the Garud Samachar disclaimer covering informational content, accuracy limits, opinions, third-party links, liability, corrections, and grievance contact."
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

      <main className="about-page disclaimer-page">
        <section className="disclaimer-mast" aria-labelledby="disclaimer-title">
          <div className="disclaimer-notice-panel">
            <div className="disclaimer-title-row">
              <span className="disclaimer-label">Disclaimer</span>
              <span className="disclaimer-status">
                <FaShieldAlt />
                Reader notice
              </span>
            </div>
            <h1 id="disclaimer-title">Read every update with context</h1>
            <p>
              Garud Samachar publishes news, reports, updates, opinions, and
              public-interest information based on available sources, editorial
              review, and on-ground inputs. This disclaimer explains the limits
              of reliance, liability, and external references.
            </p>
            <div className="disclaimer-badges">
              {disclaimerFacts.map((fact) => (
                <span key={fact}>
                  <FaCheckCircle />
                  {fact}
                </span>
              ))}
            </div>
          </div>

          <div className="disclaimer-summary-card" aria-label="Disclaimer overview">
            <div className="disclaimer-summary-icon">
              <FaFileAlt />
            </div>
            <h2>Core Notice</h2>
            <p>We aim for accuracy, but cannot guarantee absolute completeness.</p>
            <div className="disclaimer-summary-divider" />
            <ul>
              <li>Opinion pieces reflect author views.</li>
              <li>External links follow their own policies.</li>
              <li>Corrections can be sent to the Grievance Officer.</li>
            </ul>
          </div>
        </section>

        <section className="disclaimer-check-strip" aria-label="Editorial checks">
          <div className="disclaimer-check-heading">
            <FaClipboardCheck />
            <span>How to read this notice</span>
          </div>
          <div className="disclaimer-check-list">
            {editorialChecks.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="disclaimer-highlight-grid" aria-label="Disclaimer highlights">
          {disclaimerCards.map((item) => (
            <article key={item.title} className="disclaimer-highlight-card">
              <div>{item.icon}</div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </section>

        <section className="disclaimer-detail-panel">
          <div className="disclaimer-detail-heading">
            <span>Details</span>
            <h2>Important disclaimer points</h2>
            <p>
              These points clarify how readers should understand published
              reports, opinion content, corrections, and liability limitations.
            </p>
            <div className="disclaimer-side-ticker" aria-label="Disclaimer reminders">
              <div className="disclaimer-side-ticker-track">
                {[...disclaimerSidePoints, ...disclaimerSidePoints].map(
                  (point, index) => (
                    <div className="disclaimer-side-point" key={`${point}-${index}`}>
                      {point}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="disclaimer-detail-list">
            {disclaimerDetails.map((section, index) => (
              <section className="disclaimer-detail-item" key={section.title}>
                <span className="disclaimer-detail-count">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="disclaimer-action-strip">
          <article className="disclaimer-action-card">
            <FaBalanceScale />
            <h2>No professional advice</h2>
            <p>
              Content should not be treated as legal, medical, financial,
              investment, or professional advice. Readers should consult qualified
              professionals where appropriate.
            </p>
          </article>
          <article className="disclaimer-action-card disclaimer-contact-card">
            <FaBullhorn />
            <h2>Corrections and complaints</h2>
            <p>
              If you notice an error or have a complaint, please contact the
              Grievance Officer at{" "}
              <a href="mailto:garudsamacharoffice@gmail.com">
                garudsamacharoffice@gmail.com
              </a>
              .
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
