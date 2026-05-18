import { useNavigate } from "react-router-dom";
import {
  FaArrowUp,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import "../styles/footer.css";
import brandLogo from "../../logo.png";

const quickLinks = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about-us" },
  { label: "Contact Us", path: "/contact-us" },
  { label: "Terms and Conditions", path: "/terms-and-conditions" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Disclaimer", path: "/disclaimer" },
];

const coverageLinks = [
  { label: "All News", category: "All" },
  { label: "Latest Updates", category: "All" },
  { label: "National & State", category: "National" },
  { label: "Crime & Public Issues", category: "Crime" },
  { label: "Garud Special", category: "Article" },
  { label: "Special Reports", category: "Article" },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1KSCk7Whj9/",
    icon: <FaFacebookF />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/grudsmachar?igsh=MXB3dnBkdm9iaWE1MA==",
    icon: <FaInstagram />,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@garudsamachar?si=ed611IQie6taKJU6",
    icon: <FaYoutube />,
  },
  {
    label: "Twitter",
    href: "https://x.com/garudsamachar",
    icon: <FaTwitter />,
  },
];

export default function SiteFooter() {
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCoverage = (category) => {
    navigate(category === "All" ? "/" : `/?cat=${encodeURIComponent(category)}`);
    scrollToTop();
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="site-footer-brand" aria-label="Garud Samachar">
          <button
            type="button"
            className="site-footer-logo"
            onClick={() => navigate("/")}
          >
            <img src={brandLogo} alt="Garud Samachar logo" />
            <span>
              <strong>Garud Samachar</strong>
              <small>Digital News Network</small>
            </span>
          </button>

          <p>
            Garud Samachar delivers fast, verified, and public-interest news
            with responsible reporting across all important categories, public
            issues, and local communities.
          </p>

          <div className="site-footer-social" aria-label="Social links">
            {socialLinks.map((link) => (
              <a
                href={link.href}
                key={link.label}
                aria-label={link.label}
                target="_blank"
                rel="noreferrer"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </section>

        <nav className="site-footer-column site-footer-links" aria-label="Company links">
          <h2>Company</h2>
          {quickLinks.map((link) =>
            link.path ? (
              <button
                type="button"
                key={link.label}
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ) : (
              <span key={link.label}>{link.label}</span>
            )
          )}
        </nav>

        <section className="site-footer-column site-footer-coverage" aria-label="Coverage">
          <h2>News Coverage</h2>
          {coverageLinks.map((link) => (
            <button
              type="button"
              key={link.label}
              onClick={() => openCoverage(link.category)}
            >
              {link.label}
            </button>
          ))}
        </section>

        <section className="site-footer-contact" aria-label="Contact">
          <h2>Get In Touch</h2>
          <p>
            <FaMapMarkerAlt />
            <span>Panchvati Colony Phase 3, Karond, Bhopal</span>
          </p>
          <p>
            <FaEnvelope />
            <a href="mailto:garudsamachar@gmail.com">garudsamachar@gmail.com</a>
          </p>
          <p>
            <FaEnvelope />
            <a href="mailto:garudsamacharoffice@gmail.com">
              garudsamacharoffice@gmail.com
            </a>
          </p>
          <p>
            <FaPhoneAlt />
            <a href="tel:+919522950225">+91 95229 50225</a>
          </p>
        </section>
      </div>

      <div className="site-footer-bottom">
        <p>© 2026 Garud Samachar. Owned and operated by Garud Stacks Private Limited.</p>
        <div className="site-footer-bottom-right">
          <span className="site-footer-credit">
            Designed & developed by <strong>Sumit Lodhi</strong>
          </span>
          <div className="site-footer-bottom-links">
          <button type="button" onClick={() => navigate("/terms-and-conditions")}>
            Terms
          </button>
          <button type="button" onClick={() => navigate("/about-us")}>
            About
          </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="site-footer-top"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <FaArrowUp />
      </button>
    </footer>
  );
}
