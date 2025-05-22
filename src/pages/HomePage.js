import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RecommendationList from '../components/recommendations/RecommendationList';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const { isConnected } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>{t('home.welcome')}</h1>
        <p>{t('home.tagline')}</p>
        <div className="cta-buttons">
          <Link to="/movies" className="home-btn primary-btn"><span>{t('home.browseMovies')}</span></Link>
          <Link to="/tvshows" className="home-btn secondary-btn"><span>{t('home.browseTvShows')}</span></Link>
        </div>
      </section>

      {isConnected && (
        <section className="recommendations-section">
          <RecommendationList limit={8} />
        </section>
      )}

      <section className="features-section">
        <h2>{t('home.whyReelWeave')}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>{t('home.features.decentralized.title')}</h3>
            <p>{t('home.features.decentralized.description')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('home.features.community.title')}</h3>
            <p>{t('home.features.community.description')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('home.features.tracking.title')}</h3>
            <p>{t('home.features.tracking.description')}</p>
          </div>
          <div className="feature-card">
            <h3>{t('home.features.recommendations.title')}</h3>
            <p>{t('home.features.recommendations.description')}</p>
          </div>
        </div>
      </section>

      <section className="quick-start-section">
        <h2>{t('home.getStarted')}</h2>
        <ol>
          {t('home.steps', { returnObjects: true }).map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default HomePage;