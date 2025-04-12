import React from 'react';
import { Link } from 'react-router-dom';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  // Ensure movie has all required properties
  if (!movie) return null;

  const {
    id,
    title,
    year,
    imdbRating,
    posterUrl
  } = movie;

  // Default poster if none available
  const defaultPoster = '/placeholder-poster.jpg';

  return (
    <div className="movie-card">
      <Link to={`/movie/${id}`}>
        <div className="movie-poster">
          <img 
            src={posterUrl || defaultPoster} 
            alt={`${title} poster`} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultPoster;
            }}
          />
          <div className="movie-rating">
            <span>{imdbRating || 'N/A'}</span>
          </div>
        </div>
        <div className="movie-info">
          <h3 className="movie-title">{title}</h3>
          <p className="movie-year">{year}</p>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;
