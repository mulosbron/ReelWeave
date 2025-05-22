import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();
  
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>{t('pages.notFound.title')}</h2>
        <p>{t('pages.notFound.description')}</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            {t('pages.notFound.backToHome')}
          </Link>
          <Link to="/movies" className="btn btn-secondary">
            {t('community.browseMovies')}
          </Link>
          <Link to="/tvshows" className="btn btn-secondary">
            {t('community.browseTvShows')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;