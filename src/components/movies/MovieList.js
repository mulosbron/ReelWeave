import React from 'react';
import MovieCard from './MovieCard';
import Loading from '../common/Loading';

const MovieList = ({ 
  movies, 
  loading, 
  error, 
  onAddToList, 
  userLists = [],
  emptyMessage = "No movies found" 
}) => {
  if (loading) {
    return <Loading message="Loading movies..." />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error loading movies: {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-retry">
          Retry
        </button>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="empty-message">
        <p>{emptyMessage}</p>
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