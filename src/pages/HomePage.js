import React from 'react';
import { Link } from 'react-router-dom';
import RecommendationList from '../components/recommendations/RecommendationList';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const { isConnected } = useAuth();

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>Welcome to ReelWeave</h1>
        <p>Your decentralized movie and TV show tracking platform powered by Arweave</p>
        <div className="cta-buttons">
          <Link to="/movies" className="home-btn primary-btn"><span>BROWSE MOVIES</span></Link>
          <Link to="/tvshows" className="home-btn secondary-btn"><span>BROWSE TV SHOWS</span></Link>
        </div>
      </section>

      {isConnected && (
        <section className="recommendations-section">
          <RecommendationList limit={8} />
        </section>
      )}

      <section className="features-section">
        <h2>Why ReelWeave?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Decentralized Storage</h3>
            <p>Your watchlists and preferences are stored permanently on Arweave blockchain</p>
          </div>
          <div className="feature-card">
            <h3>Community Driven</h3>
            <p>Share reviews and recommendations with the community</p>
          </div>
          <div className="feature-card">
            <h3>Personal Tracking</h3>
            <p>Keep track of what you've watched and what you want to watch</p>
          </div>
          <div className="feature-card">
            <h3>Smart Recommendations</h3>
            <p>Get personalized suggestions based on your viewing history</p>
          </div>
        </div>
      </section>

      <section className="quick-start-section">
        <h2>Get Started</h2>
        <ol>
          <li>Connect your ArConnect wallet</li>
          <li>Browse movies and TV shows</li>
          <li>Create your personal watchlists</li>
          <li>Share reviews with the community</li>
          <li>Get personalized recommendations</li>
        </ol>
      </section>
    </div>
  );
};

export default HomePage;