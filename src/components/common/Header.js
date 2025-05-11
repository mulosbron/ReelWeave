import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Added NavLink for active styles
import WalletConnect from '../auth/WalletConnect';
import GatewaySelector from './GatewaySelector';
import useAuth from '../../hooks/useAuth'; // For checking if wallet is connected

const Header = () => {
  const { isConnected } = useAuth(); // Check if wallet is connected

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
                <li><NavLink to="/" end>Home</NavLink></li> {/* NavLink with end prop */}
                <li><NavLink to="/movies">Movies</NavLink></li>
                <li><NavLink to="/tvshows">TV Shows</NavLink></li>
                <li><NavLink to="/community">Community</NavLink></li> {/* New Link */}
                {isConnected && ( // Only show if wallet is connected
                  <li><NavLink to="/my-lists">My Lists</NavLink></li> /* New Link */
                )}
              </ul>

              <div className="nav-actions">
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