import { useState, useEffect, useCallback } from 'react';
import { moviesService } from '../services/api/movies';

const useMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all movies
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moviesService.getAllMovies();
      setMovies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search movies
  const searchMovies = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      const results = await moviesService.searchMovies(query);
      setMovies(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter movies
  const filterMovies = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);
      const results = await moviesService.filterMovies(filters);
      setMovies(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add movie to list
  const addMovieToList = useCallback(async (movieId, listType, walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const txId = await moviesService.addMovieToList(movieId, listType, walletAddress);
      return txId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user movie lists
  const getUserMovieLists = useCallback(async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const lists = await moviesService.getUserMovieLists(walletAddress);
      return lists;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return {
    movies,
    loading,
    error,
    fetchMovies,
    searchMovies,
    filterMovies,
    addMovieToList,
    getUserMovieLists
  };
};

export default useMovies;