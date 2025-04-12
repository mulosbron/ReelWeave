import React, { useState, useEffect } from 'react';
import { useArweaveWallet } from 'arweave-wallet-kit';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { connected, address, connect, disconnect } = useArweaveWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shortAddress, setShortAddress] = useState('');

  useEffect(() => {
    if (address) {
      // Format address for display (first 6 and last 4 characters)
      setShortAddress(`${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
    }
  }, [address]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          ArweaveIMDB
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          <i className={isMenuOpen ? 'fas fa-times' : 'fas fa-bars'} />
        </div>

        <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={() => setIsMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/search" className="nav-links" onClick={() => setIsMenuOpen(false)}>
              Search
            </Link>
          </li>
          {connected && (
            <>
              <li className="nav-item">
                <Link to="/watchlist" className="nav-links" onClick={() => setIsMenuOpen(false)}>
                  My Watchlist
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/profile" className="nav-links" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="wallet-connect">
          {connected ? (
            <div className="wallet-info">
              <span className="wallet-address">{shortAddress}</span>
              <button className="disconnect-btn" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="connect-btn" onClick={handleConnect}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
