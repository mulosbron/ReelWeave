import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useLists from '../hooks/useLists';
import UserList from '../components/lists/UserList';
import Loading from '../components/common/Loading';
import { LIST_TYPES } from '../utils/constants';

const MyListsPage = () => {
  const { isConnected, isLoading: authLoading } = useAuth();
  const { fetchUserLists, loading: listsLoading } = useLists();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, authLoading, navigate]);

  useEffect(() => {
    if (isConnected) {
      fetchUserLists();
    }
  }, [isConnected, fetchUserLists]);

  if (authLoading || listsLoading) {
    return <Loading message="Loading your lists..." fullScreen />;
  }

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Please Connect Your Wallet</h2>
        <p>You need to connect your ArConnect wallet to view your lists.</p>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-primary"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="my-lists-page">
      <div className="page-header">
        <h1>My Lists</h1>
        <p>Manage your movie and TV show collections</p>
      </div>

      <div className="lists-container">
        <section className="list-section">
          <UserList 
            listType={LIST_TYPES.WATCHLIST} 
            title="My Watchlist" 
          />
        </section>

        <section className="list-section">
          <UserList 
            listType={LIST_TYPES.WATCHED} 
            title="Watched" 
          />
        </section>

        <section className="list-section">
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