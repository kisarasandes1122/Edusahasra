import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa"
import "./Footer.css"
import logo from '../../../assets/images/Edusahasra.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo-section">
          <img
            src={logo}
            alt="Edusahasra Logo"
            className="logo"
          />
          <p>Edusahasra connects donors with schools in rural Sri Lanka to bridge educational gaps</p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <nav>
            <a href="/">Home</a>
            <a href="/donors">Donors</a>
            <a href="/schools">Schools</a>
            <a href="/impact">Impact</a>
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
          </nav>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <div className="contact-info">
            <p>
              <a href="mailto:support@edusahasra.com">support@edusahasra.com</a>
            </p>
            <p>
              <a href="tel:0712424252">0712424252</a>
            </p>
            <p>Colombo, Sri Lanka</p>
          </div>
        </div>

        <div className="footer-section">
          <h3>Stay Connected</h3>
          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <FaFacebook className="social-icon" />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram className="social-icon" />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedin className="social-icon" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Edusahasra. All right Reserved</p>
      </div>
    </footer>
  )
}

export default Footer;

