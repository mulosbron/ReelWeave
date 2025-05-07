import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // NavLink ekledik aktif stil için
import WalletConnect from '../auth/WalletConnect';
import useAuth from '../../hooks/useAuth'; // isConnected kontrolü için

const Header = () => {
  const { isConnected } = useAuth(); // Cüzdan bağlı mı kontrolü

  return (
    <header className="app-header">
      <div className="header-container">
        <nav className="main-navigation">
          <div className="nav-container">
            <div className="nav-logo">
              <Link to="/">ReelWeave</Link>
            </div>

            <div className="nav-menu">
              <ul className="nav-links">
                <li><NavLink to="/" end>Home</NavLink></li> {/* NavLink ve end prop'u */}
                <li><NavLink to="/movies">Movies</NavLink></li>
                <li><NavLink to="/tvshows">TV Shows</NavLink></li>
                <li><NavLink to="/community">Community</NavLink></li> {/* Yeni Link */}
                {isConnected && ( // Sadece cüzdan bağlıysa göster
                  <li><NavLink to="/my-lists">My Lists</NavLink></li> /* Yeni Link */
                )}
              </ul>

              <div className="nav-actions">
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