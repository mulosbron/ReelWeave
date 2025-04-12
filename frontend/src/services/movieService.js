import axios from 'axios';

// API base URL - would be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get top rated movies
export const getTopMovies = async (limit = 24) => {
  try {
    const response = await axios.get(`${API_URL}/movies?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching top movies:', error);
    throw error;
  }
};

// Get movie by ID
export const getMovieById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/movies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie ${id}:`, error);
    throw error;
  }
};

// Search movies with optional filters
export const searchMovies = async (query, filters = {}) => {
  try {
    let url = `${API_URL}/movies/search/${encodeURIComponent(query)}`;
    
    // Add filters as query parameters
    const queryParams = [];
    if (filters.genre) queryParams.push(`genre=${encodeURIComponent(filters.genre)}`);
    if (filters.year) queryParams.push(`year=${filters.year}`);
    if (filters.rating) queryParams.push(`rating=${filters.rating}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

// Store a new movie (admin only)
export const storeMovie = async (movieData) => {
  try {
    const response = await axios.post(`${API_URL}/movies`, movieData);
    return response.data;
  } catch (error) {
    console.error('Error storing movie:', error);
    throw error;
  }
};
