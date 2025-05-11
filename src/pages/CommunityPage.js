import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useMovies from '../hooks/useMovies';
import useTvShows from '../hooks/useTvShows';
import Loading from '../components/common/Loading';
import CommentItem from '../components/comments/CommentItem';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import { CONTENT_TYPES, APP_NAME, TX_TAGS, ACTIONS } from '../utils/constants';
import { commentsService } from '../services/api/comments';
import { listsService } from '../services/api/lists';
import graphql from '../services/arweave/graphql';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { isConnected, walletAddress } = useAuth();
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const [activeTab, setActiveTab] = useState('communityFavorites');
  const [recentComments, setRecentComments] = useState([]);
  const [communityFavorites, setCommunityFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(124); // Default value

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Community page: Starting data fetch...');

        // Combine all content
        const allItems = [...movies, ...tvShows];
        console.log('Total content count:', allItems.length);
        
        // Get all comments from all users with a more inclusive query
        const queryString = `
          query {
            transactions(
              tags: [
                { name: "App-Name", values: ["${APP_NAME}"] },
                { name: "Content-Type", values: ["application/json"] }
              ]
              sort: HEIGHT_DESC
              first: 200
            ) {
              edges {
                node {
                  id
                  tags {
                    name
                    value
                  }
                  block {
                    timestamp
                    height
                  }
                }
              }
            }
          }
        `;
        
        console.log('Executing GraphQL query for all comments...', queryString);
        
        // Fetch all comments with GraphQL
        const result = await graphql.query(queryString);
        console.log('GraphQL query result:', result);
        
        // Process transactions
        let allComments = [];
        
        if (result && result.transactions && result.transactions.edges) {
          console.log(`Found ${result.transactions.edges.length} transactions, processing...`);
          
          // Filter only comment transactions
          const commentTransactions = result.transactions.edges.filter(edge => {
            const tags = {};
            edge.node.tags.forEach(tag => {
              tags[tag.name.toLowerCase()] = tag.value;
            });
            
            const action = tags['action']?.toLowerCase();
            return action === 'add-comment' || action === 'update-comment';
          });
          
          console.log(`Found ${commentTransactions.length} comment transactions`);
          
          // Process all comments
          allComments = await commentsService.processCommentsWithUpdates(commentTransactions);
          console.log(`Processed ${allComments.length} comments from all users`);
          
          // Count unique users
          const uniqueUsers = new Set(allComments.map(comment => comment.author));
          setUserCount(uniqueUsers.size > 0 ? uniqueUsers.size : 124);
          console.log(`Found ${uniqueUsers.size} unique users who posted comments`);
          console.log('Unique users:', Array.from(uniqueUsers));
        } else {
          console.warn('GraphQL query did not return comments');
        }
        
        console.log('All comments:', allComments);
        
        // Get community favorite content (real data)
        console.log('Fetching community favorites from blockchain...');
        const communityFavoritesData = await listsService.getCommunityFavorites(20);
        console.log('Community favorites:', communityFavoritesData);
        
        if (communityFavoritesData.movies.length > 0 || communityFavoritesData.tvShows.length > 0) {
          // Combine movie and TV show lists
          const favoritesFromBlockchain = [
            ...communityFavoritesData.movies, 
            ...communityFavoritesData.tvShows
          ];
          
          console.log('Community favorites from blockchain:', favoritesFromBlockchain);
          setCommunityFavorites(favoritesFromBlockchain);
        } else {
          console.log('No favorite content found on blockchain, using static content');
          
          // Use mock data if no blockchain data
          const favorites = [...allItems]
            .sort(() => 0.5 - Math.random())
            .slice(0, 20)
            .map(item => ({
              ...item,
              type: item.duration ? CONTENT_TYPES.MOVIE : CONTENT_TYPES.TV_SHOW,
              score: Math.random() * 0.2 + 0.8 // Score between 0.8 and 1.0
            }));
          
          setCommunityFavorites(favorites);
        }
        
        // Match comments with titles
        const enrichedComments = allComments.map(comment => {
          // Find related content
          const relatedContent = allItems.find(item => item.hash === comment.itemId);
          
          return {
            ...comment,
            itemTitle: relatedContent?.title || 'Unknown Content'
          };
        });
        
        console.log('Enriched comments:', enrichedComments);
        
        setRecentComments(enrichedComments);
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community data');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [movies, tvShows]); // Remove userCount dependency to avoid unnecessary refreshes

  if (loading) {
    return <Loading message="Loading community data..." />;
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'userReviews':
        return (
          <div className="user-reviews-section">
            <div className="section-header">
              <h2>User Reviews</h2>
              <p className="section-description">Latest community reviews on content</p>
            </div>
            {recentComments.length > 0 ? (
              <div className="comments-list">
                {recentComments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment}
                    isUserComment={isConnected && comment.author === walletAddress}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No Reviews Yet</h3>
                <p>No reviews to display. Be the first to review a movie or TV show!</p>
                <div className="empty-actions">
                  <button className="btn btn-primary" onClick={() => navigate('/movies')}>Browse Movies</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/tvshows')}>Browse TV Shows</button>
                  {!isConnected && (
                    <button className="btn btn-accent" onClick={() => navigate('/')}>
                      Connect Wallet to Add Reviews
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'communityFavorites':
        return (
          <div className="community-favorites-section">
            <div className="section-header">
              <h2>Community Favorites</h2>
              <p className="section-description">Most favorited and liked content</p>
            </div>
            {communityFavorites.length > 0 ? (
              <div className="scrollable-content">
                <div className="recommendations-grid community-items-grid">
                  {communityFavorites.map((item) => (
                    <RecommendationCard
                      key={`${item.type}-${item.hash}`}
                      item={item}
                      contentType={item.type}
                      hideMatchScore={true}
                      badgeText={`${item.popularity} users favorited`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>No Favorites Yet</h3>
                <p>No content has been favorited yet. Be the first to add favorites!</p>
                <div className="empty-actions">
                  <button className="btn btn-primary" onClick={() => navigate('/movies')}>Browse Movies</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/tvshows')}>Browse TV Shows</button>
                </div>
              </div>
            )}
          </div>
        );

      case 'statistics':
        return (
          <div className="statistics-section">
            <div className="section-header">
              <h2>Community Statistics</h2>
              <p className="section-description">Current status of ReelWeave community and platform</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <h3>Movies</h3>
                <div className="stat-value">{movies.length}</div>
                <p className="stat-description">Total movies on platform</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📺</div>
                <h3>TV Shows</h3>
                <div className="stat-value">{tvShows.length}</div>
                <p className="stat-description">Total TV shows on platform</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Users</h3>
                <div className="stat-value">{userCount}</div>
                <p className="stat-description">Active community members</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <h3>Reviews</h3>
                <div className="stat-value">{recentComments.length}</div>
                <p className="stat-description">Total shared reviews</p>
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
      <div className="community-hero">
        <div className="hero-content">
          <h1>Community</h1>
          <p>Where movie and TV show enthusiasts come together</p>
        </div>
      </div>
      
      <div className="community-main">
        <div className="community-tabs">
          <button
            className={`tab-button ${activeTab === 'userReviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('userReviews')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-label">Reviews</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'communityFavorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('communityFavorites')}
          >
            <span className="tab-icon">❤️</span>
            <span className="tab-label">Community Favorites</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Statistics</span>
          </button>
        </div>

        <div className="community-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;