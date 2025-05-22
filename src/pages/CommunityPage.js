import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMovies from '../hooks/useMovies';
import useTvShows from '../hooks/useTvShows';
import Loading from '../components/common/Loading';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import { CONTENT_TYPES } from '../utils/constants';
import { listsService } from '../services/api/lists';
import { commentsService } from '../services/api/comments';
import CommunityReviews from '../components/community/CommunityReviews';
import { getCurrentGateway } from '../services/arweave/config';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const [activeTab, setActiveTab] = useState('communityFavorites');
  const [communityFavorites, setCommunityFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeReviewers: 0,
    totalReviews: 0
  });
  const [gatewayUrl, setGatewayUrl] = useState('');
  
  // Arweave banner görselinin transaction ID'si
  const BANNER_TX_ID = '3BLYmXdV4QnIIQbGN-E8vtEZ4KL5B1xcy6pLbP0WQsI';
  
  // Gateway değişikliklerini dinlemek için bir useEffect ekleyin
  useEffect(() => {
    // Banner için kullanılan görsel URL'sini gateway ile birlikte oluştur
    const gateway = getCurrentGateway();
    setGatewayUrl(`https://${gateway}/${BANNER_TX_ID}`);
    
    // Gateway değişikliklerini izlemek için bir olay dinleyicisi oluşturun
    const updateBannerUrl = () => {
      const currentGateway = getCurrentGateway();
      setGatewayUrl(`https://${currentGateway}/${BANNER_TX_ID}`);
    };
    
    // Burada bir custom event listener ekleyebiliriz (gateway değiştiğinde tetiklenecek)
    window.addEventListener('gatewayChanged', updateBannerUrl);
    
    return () => {
      window.removeEventListener('gatewayChanged', updateBannerUrl);
    };
  }, []);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Community page: Starting data fetch...');

        // Combine all content
        const allItems = [...movies, ...tvShows];
        console.log('Total content count:', allItems.length);
        
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

        // İstatistikleri al
        const allComments = await commentsService.getAllComments();
        console.log('Tüm yorumlar alındı:', allComments.length);
        
        // Benzersiz kullanıcıları bul
        const uniqueUsers = new Set(allComments.map(comment => comment.author));
        
        // Son 30 gün içinde yorum yapan kullanıcıları bul
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeUsers = new Set(
          allComments
            .filter(comment => {
              const commentDate = new Date(comment.createdAt || comment.timestamp);
              return commentDate >= thirtyDaysAgo;
            })
            .map(comment => comment.author)
        );

        // İstatistikleri güncelle
        setStats({
          totalUsers: uniqueUsers.size,
          activeReviewers: activeUsers.size,
          totalReviews: allComments.length
        });

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
    return <Loading message={t('reviews.loading')} />;
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
      case 'communityFavorites':
        return (
          <div className="community-favorites-section">
            <div className="section-header">
              <h2>{t('community.favorites')}</h2>
              <p className="section-description">{t('community.favoritesDescription')}</p>
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
                      badgeText={`${item.popularity} ${t('content.usersFavorited')}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>{t('community.noFavorites')}</h3>
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

      case 'statistics':
        return (
          <div className="statistics-section">
            <div className="section-header">
              <h2>{t('community.statistics')}</h2>
              <p className="section-description">{t('community.statisticsDescription')}</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎬</div>
                <h3>{t('community.movies')}</h3>
                <div className="stat-value">{movies.length}</div>
                <p className="stat-description">{t('community.totalMovies')}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📺</div>
                <h3>{t('community.tvShows')}</h3>
                <div className="stat-value">{tvShows.length}</div>
                <p className="stat-description">{t('community.totalTvShows')}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>{t('community.totalUsers')}</h3>
                <div className="stat-value">{stats.totalUsers}</div>
                <p className="stat-description">{t('community.totalUsersDescription')}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✍️</div>
                <h3>{t('community.activeReviewers')}</h3>
                <div className="stat-value">{stats.activeReviewers}</div>
                <p className="stat-description">{t('community.activeReviewersDescription')}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <h3>{t('community.totalReviews')}</h3>
                <div className="stat-value">{stats.totalReviews}</div>
                <p className="stat-description">{t('community.totalReviewsDescription')}</p>
              </div>
            </div>
          </div>
        );

      case 'reviews':
        return <CommunityReviews />;

      default:
        return null;
    }
  };

  return (
    <div className="community-page">
      <div 
        className="community-hero" 
        style={{
          backgroundImage: gatewayUrl ? `url(${gatewayUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="hero-content">
          <h1 style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>{t('community.title')}</h1>
          <p style={{ maxWidth: '90%', margin: '0 auto' }}>{t('community.subtitle')}</p>
        </div>
      </div>
      
      <div className="community-main">
        <div className="community-tabs">
          <button
            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <span className="tab-icon">✍️</span>
            <span className="tab-label">{t('community.reviews')}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'communityFavorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('communityFavorites')}
          >
            <span className="tab-icon">❤️</span>
            <span className="tab-label">{t('community.favorites')}</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">{t('community.statistics')}</span>
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