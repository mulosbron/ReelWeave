import React, { useState, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';
import Loading from '../common/Loading';
import useAuth from '../../hooks/useAuth';
import useLists from '../../hooks/useLists';
import useMovies from '../../hooks/useMovies';
import useTvShows from '../../hooks/useTvShows';
import { generateRecommendations } from '../../utils/recommendations';
import { CONTENT_TYPES, LIST_TYPES } from '../../utils/constants';

const RecommendationList = ({ contentType = null, limit = 10 }) => {
  const { isConnected } = useAuth();
  const { getAllLists } = useLists();
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            limit
          );
          recommendedItems = [...recommendedItems, ...movieRecommendations];
        }
        
        if (!contentType || contentType === CONTENT_TYPES.TV_SHOW) {
          const tvShowRecommendations = generateRecommendations(
            tvShows,
            watchedItems.filter(item => item.itemType === CONTENT_TYPES.TV_SHOW),
            CONTENT_TYPES.TV_SHOW,
            limit
          );
          recommendedItems = [...recommendedItems, ...tvShowRecommendations];
        }

        // Shuffle and limit if both types are included
        if (!contentType) {
          recommendedItems = recommendedItems
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
        }

        setRecommendations(recommendedItems);
      } catch (err) {
        console.error('Error generating recommendations:', err);
        setError('Failed to generate recommendations');
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [isConnected, contentType, limit, getAllLists, movies, tvShows]);

  if (!isConnected) {
    return (
      <div className="recommendations-auth">
        <h2>Personalized Recommendations</h2>
        <p>Connect your wallet to get personalized movie and TV show recommendations based on your viewing history.</p>
      </div>
    );
  }

  if (loading) {
    return <Loading message="Generating recommendations..." />;
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
        <h2>No Recommendations Yet</h2>
        <p>Start watching and rating movies or TV shows to get personalized recommendations!</p>
      </div>
    );
  }

  return (
    <div className="recommendation-list">
      <h2>Recommended for You</h2>
      <div className="recommendations-grid">
        {recommendations.map((item) => (
          <RecommendationCard
            key={`${item.type}-${item.hash}`}
            item={item}
            contentType={item.type}
            score={item.score}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendationList;