import React, { useState, useEffect } from 'react';
import { useArweaveWallet } from 'arweave-wallet-kit';
import MovieCard from '../movies/MovieCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getUserWatchlists } from '../../services/watchlistService';
import './Watchlist.css';

const Watchlist = () => {
  const { connected, address } = useArweaveWallet();
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [wantToWatchMovies, setWantToWatchMovies] = useState([]);
  const [activeTab, setActiveTab] = useState('want-to-watch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWatchlists = async () => {
      if (!connected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const watchlists = await getUserWatchlists(address);
        
        // Separate movies by status
        const watched = [];
        const wantToWatch = [];
        
        watchlists.forEach(watchlist => {
          watchlist.movies.forEach(movie => {
            if (movie.status === 'watched') {
              watched.push(movie);
            } else if (movie.status === 'want-to-watch') {
              wantToWatch.push(movie);
            }
          });
        });
        
        setWatchedMovies(watched);
        setWantToWatchMovies(wantToWatch);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching watchlists:', err);
        setError('Failed to load watchlists. Please try again later.');
        setLoading(false);
      }
    };

    fetchWatchlists();
  }, [connected, address]);

  if (!connected) {
    return (
      <div className="watchlist-container">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your ArConnect wallet to view and manage your watchlists.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const activeMovies = activeTab === 'watched' ? watchedMovies : wantToWatchMovies;

  return (
    <div className="watchlist-container">
      <h1>My Watchlists</h1>
      
      <div className="watchlist-tabs">
        <button 
          className={`tab-button ${activeTab === 'want-to-watch' ? 'active' : ''}`}
          onClick={() => setActiveTab('want-to-watch')}
        >
          Want to Watch ({wantToWatchMovies.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'watched' ? 'active' : ''}`}
          onClick={() => setActiveTab('watched')}
        >
          Watched ({watchedMovies.length})
        </button>
      </div>
      
      <div className="watchlist-content">
        {activeMovies.length === 0 ? (
          <div className="empty-watchlist">
            <p>No movies in this list yet.</p>
            {activeTab === 'want-to-watch' ? (
              <p>Browse movies and add them to your "Want to Watch" list.</p>
            ) : (
              <p>Mark movies as "Watched" to see them here.</p>
            )}
          </div>
        ) : (
          <div className="movie-grid">
            {activeMovies.map(movie => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
