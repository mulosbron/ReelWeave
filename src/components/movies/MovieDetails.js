import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import { LIST_TYPES, CONTENT_TYPES } from '../../utils/constants';
import CommentList from '../comments/CommentList';
import { commentsService } from '../../services/api/comments';

const MovieDetails = ({ movie }) => {
  const navigate = useNavigate();
  const { isConnected } = useAuth();
  const { 
    addToList, 
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
      const movieId = movie?.id || movie?.hash || window.location.pathname.split('/').pop();
      if (!movieId) return;
      
      try {
        setUserRatings(prev => ({
          ...prev,
          loading: true,
          error: null
        }));
        
        const ratingData = await commentsService.getAverageRating(
          movieId, 
          CONTENT_TYPES.MOVIE
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
  }, [movie]);

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

  // Debug bilgisi olarak film nesnesini göster
  useEffect(() => {
    console.log("Film detayları:", movie);
  }, [movie]);

  // Handle list actions
  const handleAddToList = async (listType) => {
    if (!isConnected) {
      console.log("Cüzdan bağlı değil, ana sayfaya yönlendiriliyor");
      window.alert("Bu işlemi gerçekleştirmek için cüzdanınızı bağlamanız gerekiyor.");
      navigate('/');
      return;
    }

    const movieId = movie?.id || movie?.hash || window.location.pathname.split('/').pop();
    
    if (!movieId) {
      console.error("Film ID'si bulunamadı", movie);
      window.alert("Film ID'si bulunamadı, işlem yapılamıyor");
      return;
    }

    try {
      console.log(`Liste işlemi başlatılıyor: ${listType}`, movieId);
      const inList = isItemInList(movieId, listType);
      
      if (inList) {
        console.log(`Filmden kaldırılıyor: ${movieId}, liste tipi: ${listType}`);
        await removeFromList(movieId, listType);
      } else {
        console.log(`Filme ekleniyor: ${movieId}, liste tipi: ${listType}`);
        
        // İçerik detaylarını hazırla, eksik alanları kontrol et
        const movieDetails = { 
          title: movie.title || "Bilinmeyen Film", 
          year: movie.year || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null), 
          poster: movie.imagePath || movie.poster || movie.posterPath,
          rating: movie.rating || movie.voteAverage
        };
        
        // Poster URL formatını kontrol et
        if (movieDetails.poster && movieDetails.poster.startsWith('http')) {
          // HTTP URL ise, arweave.net domain'ini kaldır
          const urlParts = movieDetails.poster.replace('https://', '').replace('http://', '').split('/');
          if (urlParts[0] === 'arweave.net') {
            movieDetails.poster = urlParts.slice(1).join('/');
          }
        }
        
        console.log("İçerik detayları:", movieDetails);
        
        const result = await addToList(
          movieId,
          CONTENT_TYPES.MOVIE,
          listType,
          movieDetails
        );
        console.log("Liste ekleme sonucu:", result);
      }
    } catch (error) {
      console.error('Liste güncelleme hatası:', error);
      window.alert(`Liste güncelleme hatası: ${error.message}`);
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
          
          <div className="movie-rating">
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
          
          <div className="movie-actions">
            <button 
              className={`list-button ${isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHLIST) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHLIST)}
              disabled={listLoading}
            >
              {isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHLIST) 
                ? <><span className="list-icon">✓</span> In Watchlist</> 
                : <><span className="list-icon">+</span> Add to Watchlist</>}
            </button>
            
            <button 
              className={`list-button ${isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHED) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.WATCHED)}
              disabled={listLoading}
            >
              {isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.WATCHED) 
                ? <><span className="list-icon">✓</span> Watched</> 
                : <><span className="list-icon">👁</span> Mark as Watched</>}
            </button>
            
            <button 
              className={`list-button ${isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.FAVORITES) ? 'in-list' : ''}`}
              onClick={() => handleAddToList(LIST_TYPES.FAVORITES)}
              disabled={listLoading}
            >
              {isItemInList(movie.id || movie.hash || window.location.pathname.split('/').pop(), LIST_TYPES.FAVORITES) 
                ? <><span className="list-icon">★</span> Favorite</> 
                : <><span className="list-icon">☆</span> Add to Favorites</>}
            </button>
          </div>
          
          <div className="movie-description">
            <h2>About</h2>
            <p>{movie.plot || "A classic film that has captivated audiences for generations."}</p>
          </div>
        </div>
      </div>

      <div className="movie-additional-info">
        <h2>Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Year</span>
            <span className="info-value">{movie.year || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Duration</span>
            <span className="info-value">{movie.duration || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Age Rating</span>
            <span className="info-value">{movie.ageRating || "Not available"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">IMDB Rating</span>
            <span className="info-value">{movie.rating ? `${movie.rating}/10` : "Not available"}</span>
          </div>
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
        </div>
      </div>
      
      {/* Yorum bileşeni - URL'den alınan ID'yi kullanalım */}
      <CommentList 
        itemId={movie?.id || movie?.hash || window.location.pathname.split('/').pop()} 
        itemType={CONTENT_TYPES.MOVIE} 
      />
    </div>
  );
};

export default MovieDetails;