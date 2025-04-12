import React from 'react';
import { Link } from 'react-router-dom';
import { useArweaveWallet } from 'arweave-wallet-kit';
import './FeaturedMovie.css';

const FeaturedMovie = ({ movie }) => {
  const { connected } = useArweaveWallet();
  
  if (!movie) return null;

  const {
    id,
    title,
    year,
    imdbRating,
    posterUrl,
    plot,
    genres = [],
    duration
  } = movie;

  // Format duration from minutes to hours and minutes
  const formatDuration = (mins) => {
    if (!mins) return 'N/A';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="featured-movie" style={{ backgroundImage: `url(${posterUrl})` }}>
      <div className="featured-overlay">
        <div className="featured-content">
          <div className="featured-info">
            <h1>{title}</h1>
            <div className="featured-meta">
              <span className="featured-year">{year}</span>
              <span className="featured-rating">IMDb: {imdbRating}</span>
              <span className="featured-duration">{formatDuration(duration)}</span>
            </div>
            <div className="featured-genres">
              {genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
            <p className="featured-plot">{plot}</p>
            <div className="featured-actions">
              <Link to={`/movie/${id}`} className="btn btn-primary">
                View Details
              </Link>
              {connected && (
                <button className="btn btn-secondary">
                  Add to Watchlist
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMovie;
