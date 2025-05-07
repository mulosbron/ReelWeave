import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{APP_NAME}</h3>
            <p>Your decentralized movie and TV show tracking platform</p>
            <p className="footer-version">Version {APP_VERSION}</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/movies">Movies</Link></li>
              <li><Link to="/tvshows">TV Shows</Link></li>
              <li><Link to="/my-lists">My Lists</Link></li>
              <li><Link to="/community">Community</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li>
                <a 
                  href="https://arweave.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Arweave
                </a>
              </li>
              <li>
                <a 
                  href="https://www.arconnect.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  ArConnect
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect With Us</h3>
            <p>Built with ❤️ on Arweave</p>
            <p>Decentralized • Permanent • Community-Driven</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} {APP_NAME}. All rights reserved.</p>
          <p className="footer-disclaimer">
            All movie and TV show data is sourced from public APIs and stored on Arweave blockchain.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;