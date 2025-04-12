import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useArweaveWallet } from 'arweave-wallet-kit';
import { getMovieById } from '../../services/movieService';
import { addToWatchlist } from '../../services/watchlistService';
import { getReviewsByMovie, submitReview } from '../../services/reviewService';
import ReviewList from '../reviews/ReviewList';
import ReviewForm from '../reviews/ReviewForm';
import LoadingSpinner from '../ui/LoadingSpinner';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const { connected, address } = useArweaveWallet();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlistStatus, setWatchlistStatus] = useState('');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  useEffect(() => {
    const fetchMovieAndReviews = async () => {
      try {
        setLoading(true);
        const movieData = await getMovieById(id);
        setMovie(movieData);
        
        const reviewsData = await getReviewsByMovie(id);
        setReviews(reviewsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
        setLoading(false);
      }
    };

    fetchMovieAndReviews();
  }, [id]);

  const handleAddToWatchlist = async (status) => {
    if (!connected) {
      return;
    }

    try {
      setAddingToWatchlist(true);
      await addToWatchlist(address, id, status);
      setWatchlistStatus(status);
      setAddingToWatchlist(false);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setAddingToWatchlist(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    if (!connected) {
      return;
    }

    try {
      const newReview = await submitReview({
        walletAddress: address,
        movieId: id,
        ...reviewData
      });
      
      setReviews([newReview, ...reviews]);
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!movie) {
    return <div className="error-message">Movie not found</div>;
  }

  const {
    title,
    year,
    imdbRating,
    posterUrl,
    plot,
    genres = [],
    directors = [],
    actors = [],
    duration,
    ageRating
  } = movie;

  // Format duration from minutes to hours and minutes
  const formatDuration = (mins) => {
    if (!mins) return 'N/A';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="movie-details-container">
      <div className="movie-details-header">
        <div className="movie-poster-container">
          <img 
            src={posterUrl || '/placeholder-poster.jpg'} 
            alt={`${title} poster`} 
            className="movie-poster"
          />
        </div>
        <div className="movie-info-container">
          <h1 className="movie-title">{title}</h1>
          <div className="movie-meta">
            <span className="movie-year">{year}</span>
            <span className="movie-rating">{ageRating}</span>
            <span className="movie-duration">{formatDuration(duration)}</span>
            <span className="movie-imdb-rating">IMDb: {imdbRating}</span>
          </div>
          
          <div className="movie-genres">
            {genres.map((genre, index) => (
              <span key={index} className="genre-tag">{genre}</span>
            ))}
          </div>
          
          <div className="movie-plot">
            <h3>Plot</h3>
            <p>{plot}</p>
          </div>
          
          <div className="movie-credits">
            {directors.length > 0 && (
              <div className="movie-directors">
                <h3>Director{directors.length > 1 ? 's' : ''}</h3>
                <p>{directors.join(', ')}</p>
              </div>
            )}
            
            {actors.length > 0 && (
              <div className="movie-actors">
                <h3>Cast</h3>
                <p>{actors.join(', ')}</p>
              </div>
            )}
          </div>
          
          {connected && (
            <div className="movie-actions">
              <button 
                className={`btn ${watchlistStatus === 'watched' ? 'btn-active' : 'btn-primary'}`}
                onClick={() => handleAddToWatchlist('watched')}
                disabled={addingToWatchlist}
              >
                {watchlistStatus === 'watched' ? 'Watched' : 'Mark as Watched'}
              </button>
              <button 
                className={`btn ${watchlistStatus === 'want-to-watch' ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => handleAddToWatchlist('want-to-watch')}
                disabled={addingToWatchlist}
              >
                {watchlistStatus === 'want-to-watch' ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          )}
          
          {!connected && (
            <div className="connect-prompt">
              <p>Connect your ArConnect wallet to add this movie to your watchlist and leave reviews</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="movie-reviews-section">
        <h2>Reviews</h2>
        
        {connected && (
          <ReviewForm onSubmit={handleReviewSubmit} />
        )}
        
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
};

export default MovieDetails;
