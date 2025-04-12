import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MovieCard from '../movies/MovieCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { searchMovies } from '../../services/movieService';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    rating: ''
  });
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Update URL with search query
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      
      const results = await searchMovies(searchQuery, filters);
      setSearchResults(results);
      setSearched(true);
      setLoading(false);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies. Please try again later.');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Available genres for filtering
  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
  ];

  // Available years for filtering (current year down to 1900)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="search-container">
      <h1>Search Movies</h1>
      
      <div className="search-form-container">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </div>
          
          <div className="search-filters">
            <div className="filter-group">
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                value={filters.genre}
                onChange={handleFilterChange}
              >
                <option value="">All Genres</option>
                {availableGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="year">Year</label>
              <select
                id="year"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
              >
                <option value="">All Years</option>
                {availableYears.slice(0, 30).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="rating">Min Rating</label>
              <select
                id="rating"
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
              >
                <option value="">Any Rating</option>
                <option value="9">9+</option>
                <option value="8">8+</option>
                <option value="7">7+</option>
                <option value="6">6+</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      
      <div className="search-results-container">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : searched ? (
          searchResults.length > 0 ? (
            <>
              <h2>Search Results</h2>
              <div className="movie-grid">
                {searchResults.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <h2>No Results Found</h2>
              <p>Try adjusting your search terms or filters.</p>
            </div>
          )
        ) : (
          <div className="search-instructions">
            <h2>Search for Movies</h2>
            <p>Enter a movie title, actor, director, or keyword to find movies.</p>
            <p>Use the filters to narrow down your search results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
