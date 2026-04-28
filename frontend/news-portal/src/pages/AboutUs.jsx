import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import useCopyProtection from "../hooks/useCopyProtection";
import "../styles/category.css";
import "../styles/terms.css";
import brandLogo from "../../logo.png";

const principles = [
  {
    title: "Accuracy First",
    body: "Every important claim is checked against reliable sources before publication.",
  },
  {
    title: "Independence",
    body: "Editorial decisions are not shaped by undisclosed paid influence.",
  },
  {
    title: "Public Interest",
    body: "We focus on stories that help people understand decisions, services, risks, and opportunities around them.",
  },
  {
    title: "Speed with Responsibility",
    body: "We publish timely updates while keeping verification and context at the center.",
  },
];

const workflow = [
  "Source validation and background checks before publication",
  "Cross-checking facts, numbers, names, locations, and official statements",
  "Contextual reporting so readers understand why a story matters",
  "Transparent updates and corrections when new verified information emerges",
];

const coverageAreas = [
  "Politics",
  "Governance",
  "Society",
  "Education",
  "Business",
  "Technology",
  "Health",
  "Hyperlocal News",
];

const commitments = [
  {
    title: "Editorial Standards",
    body: "Our newsroom follows documented editorial guidelines, conflict-of-interest disclosures, and correction practices. When an error is identified, we work to correct it with clarity and transparency.",
  },
  {
    title: "Ownership & Governance",
    body: "Garud Samachar is a digital news brand owned and operated by Garud Stacks Private Limited.",
  },
  {
    title: "Legal & Compliance",
    body: "We comply with all applicable laws in India, including the Information Technology Rules, 2021.",
  },
];

export default function AboutUs() {
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
        <title>About Us | Garud Samachar</title>
        <meta
          name="description"
          content="Learn about Garud Samachar, a digital-first newsroom committed to truth, accuracy, public interest journalism, editorial standards, and transparent governance."
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
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <div className="terms-kicker">About Us</div>
            <h1 id="about-title">Garud Samachar</h1>
            <p>
              Garud Samachar is a digital-first newsroom committed to truth,
              accuracy, and public interest journalism. We deliver fast,
              verified, and contextual news to help citizens make informed
              decisions.
            </p>
          </div>
          <div className="about-hero-panel" aria-label="Newsroom focus">
            <span>Digital-first newsroom</span>
            <strong>Verification over virality</strong>
            <small>Fast updates, responsible reporting, and community-first coverage.</small>
          </div>
        </section>

        <section className="about-section about-lead">
          <p>
            In an age of information overload, we prioritize verification over
            virality. Our editorial process emphasizes source validation,
            cross-checking, and responsible storytelling across politics,
            governance, society, education, business, technology, health, and
            hyperlocal coverage.
          </p>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span>Our Principles</span>
            <h2>What We Stand For</h2>
          </div>
          <div className="about-principles-grid">
            {principles.map((item) => (
              <div className="about-principle" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Process</span>
              <h2>How Our Newsroom Works</h2>
            </div>
            <ul className="about-check-list">
              {workflow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="about-section-heading">
              <span>Coverage</span>
              <h2>Areas We Cover</h2>
            </div>
            <div className="about-topic-list">
              {coverageAreas.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section-heading">
            <span>Accountability</span>
            <h2>Standards, Ownership & Compliance</h2>
          </div>
          <div className="about-info-list">
            {commitments.map((item) => (
              <section className="about-info-row" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="about-section about-split">
          <div>
            <div className="about-section-heading">
              <span>Vision</span>
              <h2>People-first journalism</h2>
            </div>
            <p className="about-body-text">
              Our vision is to become a trusted, people-first digital news
              platform for readers who value facts, context, and accountability.
            </p>
          </div>
          <div>
            <div className="about-section-heading">
              <span>Mission</span>
              <h2>Verified news at scale</h2>
            </div>
            <p className="about-body-text">
              Our mission is to deliver verified, unbiased, and meaningful
              journalism at scale, with a strong focus on public interest.
            </p>
          </div>
        </section>

        <section className="about-section about-contact-section">
          <div className="about-section-heading">
            <span>Contact</span>
            <h2>Reach Garud Samachar</h2>
          </div>
          <div className="about-contact-grid">
            <div>
              <h3>Newsroom Contact</h3>
              <p>
                Email:{" "}
                <a href="mailto:garudsamachar@gmail.com">
                  garudsamachar@gmail.com
                </a>
              </p>
              <p>Address: Panchvati Colony Phase 3, Karond, Bhopal</p>
            </div>
            <div>
              <h3>Grievance Officer</h3>
              <p>Name: Rajesh Patel</p>
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
