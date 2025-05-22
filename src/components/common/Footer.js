import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>{APP_NAME}</h3>
            <p>{t('footer.tagline')}</p>
            <p className="footer-version">{t('footer.version')} {APP_VERSION}</p>
          </div>
          
          <div className="footer-section">
            <h3>{t('footer.quickLinks')}</h3>
            <ul className="footer-links">
              <li><Link to="/">{t('header.home')}</Link></li>
              <li><Link to="/movies">{t('header.movies')}</Link></li>
              <li><Link to="/tvshows">{t('header.tvShows')}</Link></li>
              <li><Link to="/community">{t('header.community')}</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>{t('footer.resources')}</h3>
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
                  href="https://docs.wander.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  ArConnect
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.ar.io/ai/sdk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  AR.IO
                </a>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>{t('footer.connectWithUs')}</h3>
            <p>{t('footer.builtWith')}</p>
            <p>{t('footer.features')}</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} {APP_NAME}. {t('footer.allRightsReserved')}</p>
          <p className="footer-disclaimer">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;