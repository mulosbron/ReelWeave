import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>ArweaveIMDB</h3>
          <p>A decentralized movie database built on Arweave blockchain</p>
        </div>
        <div className="footer-section">
          <h3>Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/search">Search</a></li>
            <li><a href="/watchlist">Watchlist</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="https://arweave.org" target="_blank" rel="noopener noreferrer">Arweave</a></li>
            <li><a href="https://www.arconnect.io" target="_blank" rel="noopener noreferrer">ArConnect</a></li>
            <li><a href="https://imdb.com" target="_blank" rel="noopener noreferrer">IMDB</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ArweaveIMDB. All rights reserved.</p>
        <p>Data sourced from IMDB. Stored permanently on Arweave blockchain.</p>
      </div>
    </footer>
  );
};

export default Footer;
