import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie, onAddToList, isInList }) => {
  const { hash, title, year, rating, duration, ageRating, imagePath } = movie;

  return (
    <div className="movie-card">
      <Link to={`/movies/${hash}`} className="movie-card-link">
        <div className="movie-card-image">
          <img 
            src={`https://${imagePath}`} 
            alt={title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-movie.png';
            }}
          />
          <div className="movie-card-overlay">
            <div className="movie-rating">
              <span className="star">★</span> {rating}
            </div>
          </div>
        </div>
        
        <div className="movie-card-content">
          <h3 className="movie-title">{title}</h3>
          <div className="movie-info">
            <span className="movie-year">{year}</span>
            <span className="movie-duration">{duration}</span>
            {ageRating && <span className="movie-age-rating">{ageRating}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;