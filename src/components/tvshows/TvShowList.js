import React from 'react';
import TvShowCard from './TvShowCard';
import Loading from '../common/Loading';

const TvShowList = ({ 
  tvShows, 
  loading, 
  error, 
  onAddToList, 
  userLists = [],
  emptyMessage = "No TV shows found" 
}) => {
  if (loading) {
    return <Loading message="Loading TV shows..." />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error loading TV shows: {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-retry">
          Retry
        </button>
      </div>
    );
  }

  if (!tvShows || tvShows.length === 0) {
    return (
      <div className="empty-message">
        <p>{emptyMessage}</p>
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