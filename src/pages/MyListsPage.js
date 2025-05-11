import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useLists from '../hooks/useLists';
import UserList from '../components/lists/UserList';
import Loading from '../components/common/Loading';
import { LIST_TYPES } from '../utils/constants';

const MyListsPage = () => {
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
    return <Loading message="Loading your lists..." fullScreen />;
  }

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Connect Your Wallet</h2>
        <p>You need to connect your ArConnect wallet to view your lists.</p>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-primary"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="my-lists-page">
      <div className="page-header">
        <h1>My Lists</h1>
        <p>Manage your movie and TV show collections</p>
        
        <div className="content-type-badges">
          <div className="content-type-badge">Movie</div>
          <div className="content-type-badge">TV Show</div>
        </div>

        <div className="list-stats">
          <div className="stat-item highlight">
            <span className="stat-label">Watchlist</span>
            <span className="stat-value">{counts.watchlist}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">Watched</span>
            <span className="stat-value">{counts.watched}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">Favorites</span>
            <span className="stat-value">{counts.favorites}</span>
          </div>
        </div>
        
        <div className="refresh-section">
          {lastUpdated && (
            <div className="last-updated">
              Last Updated: {new Date(lastUpdated).toLocaleString('en-US')}
            </div>
          )}
          
          <button 
            onClick={handleRefresh} 
            className="btn-manual-refresh" 
            disabled={refreshing}
            title="Refresh your lists"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Lists'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <p>Error loading lists: {error}</p>
            <button 
              onClick={handleRefresh}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <div className="lists-container">
        <section className="list-section">
          <h2>
            <span className="list-icon">📋</span> My Watchlist
            <span className="item-count">{counts.watchlist}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.WATCHLIST} 
            title="My Watchlist" 
          />
        </section>

        <section className="list-section">
          <h2>
            <span className="list-icon">✓</span> Watched
            <span className="item-count">{counts.watched}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.WATCHED} 
            title="Watched" 
          />
        </section>

        <section className="list-section">
          <h2>
            <span className="list-icon">❤️</span> My Favorites
            <span className="item-count">{counts.favorites}</span>
          </h2>
          <UserList 
            listType={LIST_TYPES.FAVORITES} 
            title="My Favorites" 
          />
        </section>
      </div>
    </div>
  );
};

export default MyListsPage;