import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from '../../utils/helpers';

const TvShowSearch = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    year: '',
    minRating: '',
    ageRating: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useCallback(
    debounce((value) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = {
      ...filters,
      [name]: value
    };
    setFilters(updatedFilters);
    onFilter(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      year: '',
      minRating: '',
      ageRating: ''
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const ratings = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  // Updated age ratings for TV Shows
  const ageRatings = ['TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA', 'Not Rated'];

  return (
    <div className="search-filter-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search TV shows..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg
            className="filter-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          <span>Filters</span>
        </button>
      </div>

      {showFilters && (
        <div className="filter-container">
          <div className="filter-group">
            <label className="filter-label" htmlFor="year">Year</label>
            <select
              id="year"
              name="year"
              className="filter-select"
              value={filters.year}
              onChange={handleFilterChange}
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="minRating">Minimum Rating</label>
            <select
              id="minRating"
              name="minRating"
              className="filter-select"
              value={filters.minRating}
              onChange={handleFilterChange}
            >
              <option value="">Any Rating</option>
              {ratings.map(rating => (
                <option key={rating} value={rating}>{rating}+ ★</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="ageRating">Age Rating</label>
            <select
              id="ageRating"
              name="ageRating"
              className="filter-select"
              value={filters.ageRating}
              onChange={handleFilterChange}
            >
              <option value="">All Ratings</option>
              {ageRatings.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button
              className="btn-clear-filters"
              onClick={clearFilters}
              disabled={!filters.year && !filters.minRating && !filters.ageRating}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TvShowSearch;