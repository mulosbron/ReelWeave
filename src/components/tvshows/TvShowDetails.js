import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import { LIST_TYPES, CONTENT_TYPES } from '../../utils/constants';
import CommentList from '../comments/CommentList';
import { commentsService } from '../../services/api/comments';
import { listsService } from '../../services/api/lists';

const TvShowDetails = ({ tvshow }) => {
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useAuth();
  const { 
    removeFromList, 
    isItemInList, 
    loading: listLoading 
  } = useLists();
  
  // Kullanıcı değerlendirmeleri için state
  const [userRatings, setUserRatings] = useState({
    average: 0,
    count: 0,
    loading: true,
    error: null
  });

  // Kullanıcı değerlendirmelerini getir
  useEffect(() => {
    const fetchUserRatings = async () => {
      const tvShowId = tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop();
      if (!tvShowId) return;
      
      try {
        setUserRatings(prev => ({
          ...prev,
          loading: true,
          error: null
        }));
        
        const ratingData = await commentsService.getAverageRating(
          tvShowId, 
          CONTENT_TYPES.TV_SHOW
        );
        
        setUserRatings(prev => ({
          ...prev,
          average: ratingData.average,
          count: ratingData.count,
          loading: false,
          error: null
        }));
        
      } catch (error) {
        console.error('Error fetching user ratings:', error);
        setUserRatings(prev => ({
          ...prev,
          average: 0,
          count: 0,
          loading: false,
          error: 'Failed to load ratings'
        }));
      }
    };
    
    fetchUserRatings();
  }, [tvshow]);

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
      console.log("Cüzdan bağlı değil, ana sayfaya yönlendiriliyor");
      window.alert("Bu işlemi gerçekleştirmek için cüzdanınızı bağlamanız gerekiyor.");
      navigate('/');
      return;
    }

    const tvShowId = tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop();
    
    if (!tvShowId) {
      console.error("Dizi ID'si bulunamadı", tvshow);
      window.alert("Dizi ID'si bulunamadı, işlem yapılamıyor");
      return;
    }

    try {
      console.log(`Liste işlemi başlatılıyor: ${listType}`, tvShowId);
      const inList = isItemInList(tvShowId, listType);
      
      if (inList) {
        console.log(`Diziden kaldırılıyor: ${tvShowId}, liste tipi: ${listType}`);
        await removeFromList(tvShowId, listType);
      } else {
        console.log(`Diziye ekleniyor: ${tvShowId}, liste tipi: ${listType}`);
        const result = await listsService.addToList(
          tvShowId,
          CONTENT_TYPES.TV_SHOW,
          listType,
          walletAddress,
          { 
            title: tvshow.title, 
            year: tvshow.year, 
            poster: tvshow.imagePath,
            rating: tvshow.rating
          }
        );
        console.log("Liste ekleme sonucu:", result);
      }
    } catch (error) {
      console.error('Liste güncelleme hatası:', error);
      window.alert(`Liste güncelleme hatası: ${error.message}`);
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
          
          <div className="tvshow-rating">
            <span className="rating-star">★</span> 
            <span>
              {userRatings.loading ? "Loading..." : 
               userRatings.error ? "Error loading ratings" :
               userRatings.count > 0 ? userRatings.average : "No ratings yet"}
            </span>
            <span className="rating-scale">
              {userRatings.count > 0 ? "/5" : ""}
            </span>
            <span className="rating-source">
              {userRatings.count > 0 ? `(${userRatings.count}) ReelWeave users` : "ReelWeave users"}
            </span>
          </div>
          
          <div className="tvshow-actions">
            <button 
              className={`list-button ${isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHLIST) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHLIST)}
              disabled={listLoading}
            >
              {isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHLIST) 
                ? <><span className="list-icon">✓</span> In Watchlist</> 
                : <><span className="list-icon">+</span> Add to Watchlist</>}
            </button>
            
            <button 
              className={`list-button ${isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHED) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHED)}
              disabled={listLoading}
            >
              {isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHED) 
                ? <><span className="list-icon">✓</span> Watched</> 
                : <><span className="list-icon">👁</span> Mark as Watched</>}
            </button>
            
            <button 
              className={`list-button ${isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.FAVORITES) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.FAVORITES)}
              disabled={listLoading}
            >
              {isItemInList(tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop(), LIST_TYPES.FAVORITES) 
                ? <><span className="list-icon">★</span> Favorite</> 
                : <><span className="list-icon">☆</span> Add to Favorites</>}
            </button>
          </div>
          
          <div className="tvshow-description">
            <h2>About</h2>
            <p>{tvshow.plot || "An acclaimed television series that has captivated audiences worldwide."}</p>
          </div>
        </div>
      </div>

      <div className="tvshow-additional-info">
        <h2>Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Year</span>
            <span className="info-value">{tvshow.year || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Episodes</span>
            <span className="info-value">{tvshow.episodes || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Age Rating</span>
            <span className="info-value">{tvshow.ageRating || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">IMDB Rating</span>
            <span className="info-value">
              {tvshow.rating ? `${tvshow.rating}/10` : "Not available"}
            </span>
          </div>
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
        </div>
      </div>
      
      {/* Yorum bileşeni - URL'den alınan ID'yi kullanalım */}
      <CommentList 
        itemId={tvshow?.id || tvshow?.hash || window.location.pathname.split('/').pop()} 
        itemType={CONTENT_TYPES.TV_SHOW} 
      />
    </div>
  );
};

export default TvShowDetails;