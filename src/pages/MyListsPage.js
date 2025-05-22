import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import useLists from '../hooks/useLists';
import UserList from '../components/lists/UserList';
import Loading from '../components/common/Loading';
import { LIST_TYPES } from '../utils/constants';

const MyListsPage = () => {
  const { t } = useTranslation();
  const { isConnected, isLoading: authLoading } = useAuth();
  const { 
    lists, 
    loading: listsLoading, 
    error,
    lastUpdated,
    refreshLists,
    initializeUserLists,
    initialized
  } = useLists();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Redirect to home if wallet is not connected
  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, authLoading, navigate]);

  // Only fetch lists when page first loads
  useEffect(() => {
    if (isConnected && !listsLoading && !initialized) {
      // Will only run once - when page first loads
      console.log('MyListsPage: Loading lists for the first time');
      initializeUserLists();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, listsLoading, initialized]); // Not adding initializeUserLists as dependency

  // Manual refresh function
  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshLists();
      console.log('Lists refreshed successfully');
    } catch (err) {
      console.error('Error refreshing lists:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate list counts
  const getCounts = () => {
    return {
      watchlist: lists.watchlist?.length || 0,
      watched: lists.watched?.length || 0,
      favorites: lists.favorites?.length || 0
    };
  };

  const counts = getCounts();

  if (authLoading || (listsLoading && !initialized)) {
    return <Loading message={t('pages.myLists.loading')} fullScreen />;
  }

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>{t('pages.myLists.connectWalletTitle')}</h2>
        <p>{t('pages.myLists.connectWalletPrompt')}</p>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-primary"
        >
          {t('pages.notFound.backToHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="my-lists-page">
      <div className="page-header">
        <h1>{t('pages.myLists.title')}</h1>
        <p>{t('pages.myLists.subtitle')}</p>
        
        <div className="content-type-badges">
          <div className="content-type-badge">{t('content.movie')}</div>
          <div className="content-type-badge">{t('content.tvShow')}</div>
        </div>

        <div className="list-stats">
          <div className="stat-item highlight">
            <span className="stat-label">{t('pages.myLists.watchlist')}</span>
            <span className="stat-value">{counts.watchlist}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">{t('pages.myLists.watched')}</span>
            <span className="stat-value">{counts.watched}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">{t('pages.myLists.favorites')}</span>
            <span className="stat-value">{counts.favorites}</span>
          </div>
        </div>
        
        <div className="refresh-section">
          {lastUpdated && (
            <div className="last-updated">
              {t('pages.myLists.lastUpdated')}: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
          
          <button 
            onClick={handleRefresh} 
            className="btn-manual-refresh" 
            disabled={refreshing}
            title={t('pages.myLists.refreshTooltip')}
          >
            {refreshing ? t('pages.myLists.refreshing') : t('pages.myLists.refreshLists')}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{t('pages.myLists.error')}: {error}</p>
            <button 
              onClick={handleRefresh}
              className="btn btn-primary"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}
      </div>

      <div className="lists-container">
        <section className="list-section">
          <h2>
            <span className="list-icon">📋</span> {t('pages.myLists.watchlist')}
            <span className="item-count">{counts.watchlist}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.WATCHLIST} 
            title={t('pages.myLists.watchlist')} 
          />
        </section>

        <section className="list-section">
          <h2>
            <span className="list-icon">✓</span> {t('pages.myLists.watched')}
            <span className="item-count">{counts.watched}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.WATCHED} 
            title={t('pages.myLists.watched')} 
          />
        </section>

        <section className="list-section">
          <h2>
            <span className="list-icon">❤️</span> {t('pages.myLists.favorites')}
            <span className="item-count">{counts.favorites}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.FAVORITES} 
            title={t('pages.myLists.favorites')} 
          />
        </section>
      </div>
    </div>
  );
};

export default MyListsPage;