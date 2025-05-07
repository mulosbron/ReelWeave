import { useState, useEffect, useCallback } from 'react';
import { tvShowsService } from '../services/api/tvshows';

const useTvShows = () => {
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all TV shows
  const fetchTvShows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tvShowsService.getAllTvShows();
      setTvShows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search TV shows
  const searchTvShows = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      const results = await tvShowsService.searchTvShows(query);
      setTvShows(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter TV shows
  const filterTvShows = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);
      const results = await tvShowsService.filterTvShows(filters);
      setTvShows(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add TV show to list
  const addTvShowToList = useCallback(async (tvShowId, listType, walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const txId = await tvShowsService.addTvShowToList(tvShowId, listType, walletAddress);
      return txId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user TV show lists
  const getUserTvShowLists = useCallback(async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const lists = await tvShowsService.getUserTvShowLists(walletAddress);
      return lists;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTvShows();
  }, [fetchTvShows]);

  return {
    tvShows,
    loading,
    error,
    fetchTvShows,
    searchTvShows,
    filterTvShows,
    addTvShowToList,
    getUserTvShowLists
  };
};

export default useTvShows;