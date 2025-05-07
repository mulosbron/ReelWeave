import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import { LIST_TYPES, CONTENT_TYPES } from '../../utils/constants';
import CommentList from '../comments/CommentList';

const MovieDetails = ({ movie }) => {
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useAuth();
  const { 
    addToList, 
    removeFromList, 
    isItemInList, 
    loading: listLoading 
  } = useLists();

  // API'den gelen verilerin imagePath'ini tam URL'ye dönüştür
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Eğer zaten http ile başlıyorsa değiştirme
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Arweave.net alan adı ekle
    if (imagePath.includes('arweave.net')) {
      return `https://${imagePath}`;
    }
    
    return imagePath;
  };

  // Handle list actions
  const handleAddToList = async (listType) => {
    if (!isConnected) {
      // Redirect to home to connect
      navigate('/');
      return;
    }

    try {
      const inList = isItemInList(movie.hash, listType);
      
      if (inList) {
        await removeFromList(movie.hash, listType);
      } else {
        await addToList(
          movie.hash,
          CONTENT_TYPES.MOVIE,
          listType,
          walletAddress,
          { title: movie.title, year: movie.year, poster: movie.imagePath }
        );
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  return (
    <div className="movie-details">
      <div className="details-header">
        <Link to="/movies" className="btn-back">
          ← Back
        </Link>
      </div>

      <div className="details-content">
        <div className="details-poster">
          {movie.imagePath && (
            <img 
              src={getFullImageUrl(movie.imagePath)} 
              alt={movie.title} 
            />
          )}
        </div>

        <div className="details-info">
          <h1 className="movie-title">{movie.title}</h1>
          
          <div className="movie-meta">
            <span>{movie.year}</span>
            <span className="separator">•</span>
            <span>{movie.duration}</span>
            <span className="separator">•</span>
            <span>{movie.ageRating}</span>
          </div>
          
          <div className="movie-rating">
            <span className="rating-star">★</span> 
            <span>{movie.rating}</span>
            <span className="rating-scale">/10</span>
          </div>
          
          <div className="movie-actions">
            <button 
              className={`list-button ${isItemInList(movie.hash, LIST_TYPES.WATCHLIST) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHLIST)}
              disabled={listLoading}
            >
              {isItemInList(movie.hash, LIST_TYPES.WATCHLIST) ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            
            <button 
              className={`list-button ${isItemInList(movie.hash, LIST_TYPES.WATCHED) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHED)}
              disabled={listLoading}
            >
              {isItemInList(movie.hash, LIST_TYPES.WATCHED) ? 'Watched' : 'Mark as Watched'}
            </button>
            
            <button 
              className={`list-button ${isItemInList(movie.hash, LIST_TYPES.FAVORITES) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.FAVORITES)}
              disabled={listLoading}
            >
              {isItemInList(movie.hash, LIST_TYPES.FAVORITES) ? 'Favorite' : 'Add to Favorites'}
            </button>
          </div>
          
          <div className="movie-description">
            <h2>About</h2>
            <p>{movie.plot || "A classic film that has captivated audiences for generations."}</p>
          </div>
        </div>
      </div>

      <div className="movie-additional-info">
        <h2>Additional Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Director</span>
            <span className="info-value">{movie.director || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cast</span>
            <span className="info-value">{movie.actors || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Genre</span>
            <span className="info-value">{movie.genre || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">IMDB Rating</span>
            <span className="info-value">{movie.rating}/10</span>
          </div>
        </div>
      </div>
      
      {/* Yorum bileşeni */}
      <CommentList 
        itemId={movie.hash} 
        itemType={CONTENT_TYPES.MOVIE} 
      />
    </div>
  );
};

export default MovieDetails;