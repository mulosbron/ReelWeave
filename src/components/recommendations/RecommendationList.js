import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import HomeRecommendationCard from './HomeRecommendationCard';
import Loading from '../common/Loading';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import useMovies from '../../hooks/useMovies';
import useTvShows from '../../hooks/useTvShows';
import { generateRecommendations } from '../../utils/recommendations';
import { CONTENT_TYPES, LIST_TYPES } from '../../utils/constants';

const RecommendationList = ({ contentType = null, limit = 100 }) => {
  const { t } = useTranslation();
  const { isConnected } = useAuth();
  const { getAllLists } = useLists();
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const getRecommendations = async () => {
      if (!isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's lists
        const userLists = getAllLists();
        
        // Extract watched and watchlist items
        const watchedItems = [
          ...userLists[LIST_TYPES.WATCHED] || [],
          ...userLists[LIST_TYPES.FAVORITES] || []
        ];

        // Generate recommendations based on content type
        let recommendedItems = [];
        
        if (!contentType || contentType === CONTENT_TYPES.MOVIE) {
          const movieRecommendations = generateRecommendations(
            movies,
            watchedItems.filter(item => item.itemType === CONTENT_TYPES.MOVIE),
            CONTENT_TYPES.MOVIE,
            Math.max(limit, 30)
          );
          recommendedItems = [...recommendedItems, ...movieRecommendations];
        }
        
        if (!contentType || contentType === CONTENT_TYPES.TV_SHOW) {
          const tvShowRecommendations = generateRecommendations(
            tvShows,
            watchedItems.filter(item => item.itemType === CONTENT_TYPES.TV_SHOW),
            CONTENT_TYPES.TV_SHOW,
            Math.max(limit, 30)
          );
          recommendedItems = [...recommendedItems, ...tvShowRecommendations];
        }

        // Shuffle and limit if both types are included
        if (!contentType) {
          recommendedItems = recommendedItems
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.max(limit, 40));
        }

        setRecommendations(recommendedItems);
      } catch (err) {
        console.error('Error generating recommendations:', err);
        setError(t('recommendations.error'));
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [isConnected, contentType, limit, getAllLists, movies, tvShows, t]);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!isConnected) {
    return (
      <div className="recommendations-auth">
        <h2>{t('recommendations.title')}</h2>
        <p>{t('recommendations.connectWallet')}</p>
      </div>
    );
  }

  if (loading) {
    return <Loading message={t('recommendations.loading')} />;
  }

  if (error) {
    return (
      <div className="recommendations-error">
        <p>{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-empty">
        <h2>{t('recommendations.title')}</h2>
        <p>{t('recommendations.startWatching')}</p>
      </div>
    );
  }

  return (
    <div className="recommendation-list">
      <h2>{t('recommendations.title')}</h2>
      
      <button
        className="recommendation-scroll-btn recommendation-scroll-left"
        onClick={() => handleScroll('left')}
        aria-label={t('recommendations.scrollLeft')}
      />
      
      <div className="recommendations-grid" ref={scrollContainerRef}>
        {recommendations.slice(0, Math.min(recommendations.length, 20)).map((item) => (
          <HomeRecommendationCard
            key={`${item.type}-${item.hash}`}
            item={item}
            contentType={item.type}
            score={item.score}
          />
        ))}
      </div>
      
      <button
        className="recommendation-scroll-btn recommendation-scroll-right"
        onClick={() => handleScroll('right')}
        aria-label={t('recommendations.scrollRight')}
      />
    </div>
  );
};

export default RecommendationList;