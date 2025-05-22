import React from 'react';
import { useTranslation } from 'react-i18next';
import MovieCard from './MovieCard';
import Loading from '../common/Loading';

const MovieList = ({ 
  movies, 
  loading, 
  error, 
  onAddToList, 
  userLists = [],
  emptyMessage = null
}) => {
  const { t } = useTranslation();
  
  if (loading) {
    return <Loading message={t('pages.movies.loadingMessage')} />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{t('pages.movies.error')} {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-retry">
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="empty-message">
        <p>{emptyMessage || t('pages.movies.noMoviesFound')}</p>
      </div>
    );
  }

  const isMovieInList = (movieHash) => {
    return userLists.some(item => item.movieId === movieHash);
  };

  return (
    <div className="movie-list">
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.hash}
            movie={movie}
            onAddToList={onAddToList}
            isInList={isMovieInList(movie.hash)}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieList;