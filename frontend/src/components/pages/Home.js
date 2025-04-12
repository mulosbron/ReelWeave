import React, { useState, useEffect } from 'react';
import { useArweaveWallet } from 'arweave-wallet-kit';
import MovieCard from '../movies/MovieCard';
import FeaturedMovie from '../movies/FeaturedMovie';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getTopMovies } from '../../services/movieService';
import './Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { connected } = useArweaveWallet();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const data = await getTopMovies();
        setMovies(data);
        
        // Select a random movie from top 10 as featured
        if (data.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(10, data.length));
          setFeaturedMovie(data[randomIndex]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-container">
      {featuredMovie && (
        <FeaturedMovie movie={featuredMovie} />
      )}

      <section className="welcome-section">
        <h1>Welcome to ArweaveIMDB</h1>
        <p>A decentralized movie database built on Arweave blockchain</p>
        {!connected && (
          <div className="connect-prompt">
            <p>Connect your ArConnect wallet to create watchlists and rate movies</p>
          </div>
        )}
      </section>

      <section className="movie-section">
        <h2>Top Rated Movies</h2>
        <div className="movie-grid">
          {movies.slice(0, 12).map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="movie-section">
        <h2>Recently Added</h2>
        <div className="movie-grid">
          {movies.slice(12, 24).map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
