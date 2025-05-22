import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Loading from '../common/Loading';
import { commentsService } from '../../services/api/comments';
import CommunityReviewItem from './CommunityReviewItem';

const CommunityReviews = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'movies', 'tvshows'

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        setLoading(true);
        
        // Tüm yorumları al
        const allCommentsRaw = await commentsService.getAllComments();
        console.log('Tüm yorumlar alındı:', allCommentsRaw.length);
        
        // Her kullanıcının her içerik için en son yorumunu al
        const userItemMap = new Map();
        
        // Önce yorumları tarihe göre sırala (en yeniler önce)
        const sortedComments = [...allCommentsRaw].sort((a, b) => {
          const timestampA = a.timestamp || new Date(a.updatedAt || a.createdAt || 0).getTime() / 1000;
          const timestampB = b.timestamp || new Date(b.updatedAt || b.createdAt || 0).getTime() / 1000;
          return timestampB - timestampA;
        });
        
        // Her kullanıcının her içerik için sadece en son yorumunu al
        for (const comment of sortedComments) {
          if (!comment.author || !comment.itemId || !comment.itemType) continue;
          
          const key = `${comment.author}-${comment.itemId}`;
          
          if (!userItemMap.has(key)) {
            userItemMap.set(key, comment);
          }
        }
        
        const uniqueComments = Array.from(userItemMap.values());
        
        const sortedUniqueComments = uniqueComments.sort((a, b) => {
          const timestampA = a.timestamp || new Date(a.updatedAt || a.createdAt || 0).getTime() / 1000;
          const timestampB = b.timestamp || new Date(b.updatedAt || b.createdAt || 0).getTime() / 1000;
          return timestampB - timestampA;
        });
        
        setAllReviews(sortedUniqueComments);
        setFilteredReviews(sortedUniqueComments);
      } catch (err) {
        console.error('Yorumlar alınırken hata oluştu:', err);
        setError(t('reviews.error') + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllReviews();
  }, [t]);
  
  // Filtre değiştiğinde yorumları filtrele
  useEffect(() => {
    if (filter === 'all') {
      setFilteredReviews(allReviews);
    } else {
      const filtered = allReviews.filter(review => 
        review.itemType && review.itemType.toLowerCase() === filter
      );
      setFilteredReviews(filtered);
    }
  }, [filter, allReviews]);

  return (
    <div className="community-reviews-section">
      <div className="section-header">
        <h2>{t('reviews.communityReviews')}</h2>
        <p className="section-description">{t('community.reviewsDescription')}</p>
      </div>
      
      <div className="filter-tabs">
        <button 
          className={`filter-button ${filter === 'all' ? 'active' : ''}`} 
          onClick={() => setFilter('all')}
        >
          {t('header.all')}
        </button>
        <button 
          className={`filter-button ${filter === 'movie' ? 'active' : ''}`} 
          onClick={() => setFilter('movie')}
        >
          {t('header.movies')}
        </button>
        <button 
          className={`filter-button ${filter === 'tvshow' ? 'active' : ''}`} 
          onClick={() => setFilter('tvshow')}
        >
          {t('header.tvShows')}
        </button>
      </div>
      
      {loading ? (
        <Loading message={t('reviews.loading')} />
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            {t('tryAgain')}
          </button>
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="community-reviews-grid">
          {filteredReviews.map(review => (
            <CommunityReviewItem 
              key={review.id} 
              review={review}
              onContentClick={(itemId, itemType) => {
                const path = itemType.toLowerCase() === 'movie' 
                  ? `/movies/${itemId}` 
                  : `/tvshows/${itemId}`;
                navigate(path);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>{t('reviews.noReviews')}</h3>
          <p>{t('community.noFavoritesDescription')}</p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => navigate('/movies')}>
              {t('community.browseMovies')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/tvshows')}>
              {t('community.browseTvShows')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityReviews; 