import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ isConnected, onConnect, onDisconnect, walletAddress }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">ReelWeave</Link>
        </div>

        <div className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            <li>
              <Link 
                to="/" 
                className={isActive('/')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/movies" 
                className={isActive('/movies')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Movies
              </Link>
            </li>
            <li>
              <Link 
                to="/tvshows" 
                className={isActive('/tvshows')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TV Shows
              </Link>
            </li>
            {isConnected && (
              <li>
                <Link 
                  to="/my-lists" 
                  className={isActive('/my-lists')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Lists
                </Link>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {isConnected ? (
              <div className="wallet-info">
                <span className="wallet-address">{formatAddress(walletAddress)}</span>
                <button 
                  onClick={onDisconnect} 
                  className="btn btn-disconnect"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={onConnect} 
                className="btn btn-connect"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;