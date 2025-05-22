import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom'; // Added NavLink for active styles
import { useTranslation } from 'react-i18next';
import WalletConnect from '../auth/WalletConnect';
import GatewaySelector from './GatewaySelector';
import LanguageSelector from './LanguageSelector';
import useAuth from '../../hooks/useAuth'; // For checking if wallet is connected

const Header = () => {
  const { isConnected } = useAuth(); // Check if wallet is connected
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <nav className="main-navigation">
          <div className="nav-container">
            <div className="nav-logo">
              <Link to="/">{t('app.name')}</Link>
            </div>

            <button 
              className={`hamburger-menu ${menuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
              aria-label="toggle menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
              <ul className="nav-links">
                <li><NavLink to="/" end onClick={closeMenu}>{t('header.home')}</NavLink></li>
                <li><NavLink to="/movies" onClick={closeMenu}>{t('header.movies')}</NavLink></li>
                <li><NavLink to="/tvshows" onClick={closeMenu}>{t('header.tvShows')}</NavLink></li>
                <li><NavLink to="/community" onClick={closeMenu}>{t('header.community')}</NavLink></li>
                {isConnected && (
                  <li><NavLink to="/my-lists" onClick={closeMenu}>{t('header.myLists')}</NavLink></li>
                )}
              </ul>

              <div className="nav-actions">
                <LanguageSelector />
                <GatewaySelector />
                <WalletConnect />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;