import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TvShowList from '../components/tvshows/TvShowList';
import TvShowSearch from '../components/tvshows/TvShowSearch';
import useTvShows from '../hooks/useTvShows';
import { filterBySearchTerm, filterTvShows } from '../utils/helpers';

const TvShowsPage = () => {
  const { t } = useTranslation();
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
        <h1>{t('pages.tvShows.title')}</h1>
        <p>{t('pages.tvShows.subtitle')}</p>
      </div>
      
      <TvShowSearch onSearch={handleSearch} onFilter={handleFilter} />
      
      <TvShowList 
        tvShows={filteredTvShows}
        loading={loading}
        error={error}
        emptyMessage={searchTerm || Object.values(filters).some(v => v) ? 
          t('pages.tvShows.noShowsFound') : 
          t('pages.tvShows.noShowsFound')}
      />
    </div>
  );
};

export default TvShowsPage;