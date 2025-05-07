import React, { useState, useEffect } from 'react';
import MovieList from '../components/movies/MovieList';
import MovieSearch from '../components/movies/MovieSearch';
import useMovies from '../hooks/useMovies';
import { filterBySearchTerm, filterMovies } from '../utils/helpers';

const MoviesPage = () => {
  const { movies, loading, error, fetchMovies } = useMovies();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    year: '',
    minRating: '',
    ageRating: ''
  });
  const [filteredMovies, setFilteredMovies] = useState([]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    let result = movies;
    
    // Apply search
    if (searchTerm) {
      result = filterBySearchTerm(result, searchTerm);
    }
    
    // Apply filters
    result = filterMovies(result, filters);
    
    setFilteredMovies(result);
  }, [movies, searchTerm, filters]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="movies-page">
      <div className="page-header">
        <h1>Movies</h1>
        <p>Browse our collection of top-rated movies</p>
      </div>
      
      <MovieSearch onSearch={handleSearch} onFilter={handleFilter} />
      
      <MovieList 
        movies={filteredMovies}
        loading={loading}
        error={error}
        emptyMessage={searchTerm || Object.values(filters).some(v => v) ? 
          "No movies match your search criteria" : 
          "No movies available"}
      />
    </div>
  );
};

export default MoviesPage;