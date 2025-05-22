import React from 'react';
import { useTranslation } from 'react-i18next';
import TvShowCard from './TvShowCard';
import Loading from '../common/Loading';

const TvShowList = ({ 
  tvShows, 
  loading, 
  error, 
  onAddToList, 
  userLists = [],
  emptyMessage = null
}) => {
  const { t } = useTranslation();
  
  if (loading) {
    return <Loading message={t('pages.tvShows.loadingMessage')} />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{t('pages.tvShows.error')} {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-retry">
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  if (!tvShows || tvShows.length === 0) {
    return (
      <div className="empty-message">
        <p>{emptyMessage || t('pages.tvShows.noShowsFound')}</p>
      </div>
    );
  }

  const isTvShowInList = (tvShowHash) => {
    return userLists.some(item => item.tvShowId === tvShowHash);
  };

  return (
    <div className="tvshow-list">
      <div className="tvshow-grid">
        {tvShows.map((tvshow) => (
          <TvShowCard
            key={tvshow.hash}
            tvshow={tvshow}
            onAddToList={onAddToList}
            isInList={isTvShowInList(tvshow.hash)}
          />
        ))}
      </div>
    </div>
  );
};

export default TvShowList;