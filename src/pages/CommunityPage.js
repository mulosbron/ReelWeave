import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useMovies from '../hooks/useMovies';
import useTvShows from '../hooks/useTvShows';
import { commentsService } from '../services/api/comments';
import Loading from '../components/common/Loading';
import CommentItem from '../components/comments/CommentItem';
import MovieCard from '../components/movies/MovieCard';
import TvShowCard from '../components/tvshows/TvShowCard';
import { CONTENT_TYPES } from '../utils/constants';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { isConnected } = useAuth();
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const [activeTab, setActiveTab] = useState('recent-reviews');
  const [recentComments, setRecentComments] = useState([]);
  const [topRatedItems, setTopRatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, we'll fetch recent comments from movies and TV shows
        // In a real app, you'd have a more efficient way to get all recent comments
        const allItems = [...movies, ...tvShows];
        const recentCommentsData = [];
        
        // Get top rated items
        const sortedItems = allItems
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          .slice(0, 10)
          .map(item => ({
            ...item,
            type: item.duration ? CONTENT_TYPES.MOVIE : CONTENT_TYPES.TV_SHOW
          }));
        
        setTopRatedItems(sortedItems);
        setRecentComments(recentCommentsData);
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community data');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [movies, tvShows]);

  if (loading) {
    return <Loading message="Loading community data..." />;
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'recent-reviews':
        return (
          <div className="recent-reviews">
            <h2>Recent Reviews</h2>
            {!isConnected ? (
              <div className="auth-prompt">
                <p>Connect your wallet to see recent community reviews.</p>
                <button 
                  onClick={() => navigate('/')} 
                  className="btn btn-primary"
                >
                  Connect Wallet
                </button>
              </div>
            ) : recentComments.length > 0 ? (
              <div className="comments-list">
                {recentComments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <p>No recent reviews yet. Be the first to review!</p>
            )}
          </div>
        );

      case 'top-rated':
        return (
          <div className="top-rated">
            <h2>Top Rated</h2>
            <div className="items-grid">
              {topRatedItems.map(item => (
                item.type === CONTENT_TYPES.MOVIE ? (
                  <MovieCard key={item.hash} movie={item} />
                ) : (
                  <TvShowCard key={item.hash} tvShow={item} />
                )
              ))}
            </div>
          </div>
        );

      case 'trending':
        return (
          <div className="trending">
            <h2>Trending Now</h2>
            <div className="items-grid">
              {topRatedItems.slice(0, 6).map(item => (
                item.type === CONTENT_TYPES.MOVIE ? (
                  <MovieCard key={item.hash} movie={item} />
                ) : (
                  <TvShowCard key={item.hash} tvShow={item} />
                )
              ))}
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="statistics">
            <h2>Community Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Movies</h3>
                <div className="stat-value">{movies.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total TV Shows</h3>
                <div className="stat-value">{tvShows.length}</div>
              </div>
              <div className="stat-card">
                <h3>Total Reviews</h3>
                <div className="stat-value">{recentComments.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Users</h3>
                <div className="stat-value">Growing!</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="community-page">
      <div className="page-header">
        <h1>Community</h1>
        <p>Connect with other movie and TV show enthusiasts</p>
      </div>

      <div className="community-tabs">
        <button
          className={`tab-button ${activeTab === 'recent-reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent-reviews')}
        >
          Recent Reviews
        </button>
        <button
          className={`tab-button ${activeTab === 'top-rated' ? 'active' : ''}`}
          onClick={() => setActiveTab('top-rated')}
        >
          Top Rated
        </button>
        <button
          className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          Trending
        </button>
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
      </div>

      <div className="community-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default CommunityPage;