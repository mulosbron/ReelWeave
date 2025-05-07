import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import { LIST_TYPES, CONTENT_TYPES } from '../../utils/constants';
import CommentList from '../comments/CommentList';

const TvShowDetails = ({ tvshow }) => {
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

  const handleAddToList = async (listType) => {
    if (!isConnected) {
      // Redirect to home to connect
      navigate('/');
      return;
    }

    try {
      const inList = isItemInList(tvshow.hash, listType);
      
      if (inList) {
        await removeFromList(tvshow.hash, listType);
      } else {
        await addToList(
          tvshow.hash,
          CONTENT_TYPES.TV_SHOW,
          listType,
          walletAddress,
          { title: tvshow.title, year: tvshow.year, poster: tvshow.imagePath }
        );
      }
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  return (
    <div className="tvshow-details">
      <div className="details-header">
        <Link to="/tvshows" className="btn-back">
          ← Back
        </Link>
      </div>

      <div className="details-content">
        <div className="details-poster">
          {tvshow.imagePath && (
            <img 
              src={getFullImageUrl(tvshow.imagePath)} 
              alt={tvshow.title} 
            />
          )}
        </div>

        <div className="details-info">
          <h1 className="tvshow-title">{tvshow.title}</h1>
          
          <div className="tvshow-meta">
            <span>{tvshow.year}</span>
            <span className="separator">•</span>
            <span>{tvshow.episodes}</span>
            <span className="separator">•</span>
            <span>{tvshow.ageRating}</span>
          </div>
          
          <div className="tvshow-rating">
            <span className="rating-star">★</span> 
            <span>{tvshow.rating}</span>
            <span className="rating-scale">/10</span>
          </div>
          
          <div className="tvshow-actions">
            <button 
              className={`list-button ${isItemInList(tvshow.hash, LIST_TYPES.WATCHLIST) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHLIST)}
              disabled={listLoading}
            >
              {isItemInList(tvshow.hash, LIST_TYPES.WATCHLIST) ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            
            <button 
              className={`list-button ${isItemInList(tvshow.hash, LIST_TYPES.WATCHED) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHED)}
              disabled={listLoading}
            >
              {isItemInList(tvshow.hash, LIST_TYPES.WATCHED) ? 'Watched' : 'Mark as Watched'}
            </button>
            
            <button 
              className={`list-button ${isItemInList(tvshow.hash, LIST_TYPES.FAVORITES) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.FAVORITES)}
              disabled={listLoading}
            >
              {isItemInList(tvshow.hash, LIST_TYPES.FAVORITES) ? 'Favorite' : 'Add to Favorites'}
            </button>
          </div>
          
          <div className="tvshow-description">
            <h2>About</h2>
            <p>{tvshow.plot || "An acclaimed television series that has captivated audiences worldwide."}</p>
          </div>
        </div>
      </div>

      <div className="tvshow-additional-info">
        <h2>Additional Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Creator</span>
            <span className="info-value">{tvshow.creator || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cast</span>
            <span className="info-value">{tvshow.actors || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Genre</span>
            <span className="info-value">{tvshow.genre || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Episodes</span>
            <span className="info-value">{tvshow.episodes}</span>
          </div>
        </div>
      </div>
      
      {/* Yorum bileşeni */}
      <CommentList 
        itemId={tvshow.hash} 
        itemType={CONTENT_TYPES.TV_SHOW} 
      />
    </div>
  );
};

export default TvShowDetails;