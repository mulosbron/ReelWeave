import axios from 'axios';

// API base URL - would be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get all reviews for a movie
export const getReviewsByMovie = async (movieId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for movie ${movieId}:`, error);
    throw error;
  }
};

// Get all reviews by a user
export const getUserReviews = async (walletAddress) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/user/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews by user ${walletAddress}:`, error);
    throw error;
  }
};

// Get review by ID
export const getReviewById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching review ${id}:`, error);
    throw error;
  }
};

// Submit a new review
export const submitReview = async (reviewData) => {
  try {
    const response = await axios.post(`${API_URL}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

// Like a review
export const likeReview = async (walletAddress, reviewId, action = 'like') => {
  try {
    const response = await axios.post(`${API_URL}/reviews/${reviewId}/like`, {
      walletAddress,
      action
    });
    return response.data;
  } catch (error) {
    console.error(`Error ${action === 'like' ? 'liking' : 'unliking'} review ${reviewId}:`, error);
    throw error;
  }
};
