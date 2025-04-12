import axios from 'axios';

// API base URL - would be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get user profile by wallet address
export const getUserProfile = async (walletAddress) => {
  try {
    const response = await axios.get(`${API_URL}/users/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user profile for ${walletAddress}:`, error);
    // If 404, return null instead of throwing error
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

// Create or update user profile
export const updateUserProfile = async (walletAddress, profileData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, {
      walletAddress,
      ...profileData
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Verify wallet connection
export const verifyWallet = async (walletAddress, signature, message) => {
  try {
    const response = await axios.post(`${API_URL}/users/verify`, {
      walletAddress,
      signature,
      message
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying wallet:', error);
    throw error;
  }
};
