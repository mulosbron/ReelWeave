import React, { useState, useEffect } from 'react';
import TvShowList from '../components/tvshows/TvShowList';
import TvShowSearch from '../components/tvshows/TvShowSearch';
import useTvShows from '../hooks/useTvShows';
import { filterBySearchTerm, filterTvShows } from '../utils/helpers';

const TvShowsPage = () => {
  const { tvShows, loading, error, fetchTvShows } = useTvShows();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    year: '',
    minRating: '',
    ageRating: ''
  });
  const [filteredTvShows, setFilteredTvShows] = useState([]);

  useEffect(() => {
    fetchTvShows();
  }, [fetchTvShows]);

  useEffect(() => {
    let result = tvShows;
    
    // Apply search
    if (searchTerm) {
      result = filterBySearchTerm(result, searchTerm);
    }
    
    // Apply filters
    result = filterTvShows(result, filters);
    
    setFilteredTvShows(result);
  }, [tvShows, searchTerm, filters]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="tvshows-page">
      <div className="page-header">
        <h1>TV Shows</h1>
        <p>Browse our collection of top-rated TV shows</p>
      </div>
      
      <TvShowSearch onSearch={handleSearch} onFilter={handleFilter} />
      
      <TvShowList 
        tvShows={filteredTvShows}
        loading={loading}
        error={error}
        emptyMessage={searchTerm || Object.values(filters).some(v => v) ? 
          "No TV shows match your search criteria" : 
          "No TV shows available"}
      />
    </div>
  );
};

export default TvShowsPage;