import axios from 'axios';

// API base URL - would be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get all watchlists for a user
export const getUserWatchlists = async (walletAddress) => {
  try {
    const response = await axios.get(`${API_URL}/watchlists/user/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching watchlists for user ${walletAddress}:`, error);
    throw error;
  }
};

// Get watchlist by ID
export const getWatchlistById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/watchlists/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching watchlist ${id}:`, error);
    throw error;
  }
};

// Create a new watchlist
export const createWatchlist = async (walletAddress, name, description, isPublic = true) => {
  try {
    const response = await axios.post(`${API_URL}/watchlists`, {
      walletAddress,
      name,
      description,
      isPublic
    });
    return response.data;
  } catch (error) {
    console.error('Error creating watchlist:', error);
    throw error;
  }
};

// Add movie to watchlist
export const addToWatchlist = async (walletAddress, movieId, status = 'want-to-watch', personalNotes = '') => {
  try {
    // First, get user's watchlists
    const watchlists = await getUserWatchlists(walletAddress);
    
    // Find or create appropriate watchlist based on status
    let watchlistId;
    
    if (watchlists.length > 0) {
      // Use first watchlist for simplicity
      watchlistId = watchlists[0].id;
    } else {
      // Create a new watchlist if none exists
      const listName = status === 'watched' ? 'Watched Movies' : 'Want to Watch';
      const newWatchlist = await createWatchlist(walletAddress, listName, '', true);
      watchlistId = newWatchlist.id;
    }
    
    // Add movie to the watchlist
    const response = await axios.post(`${API_URL}/watchlists/${watchlistId}/movies`, {
      walletAddress,
      movieId,
      status,
      personalNotes
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error adding movie ${movieId} to watchlist:`, error);
    throw error;
  }
};

// Remove movie from watchlist
export const removeFromWatchlist = async (walletAddress, watchlistId, movieId) => {
  try {
    const response = await axios.delete(`${API_URL}/watchlists/${watchlistId}/movies/${movieId}`, {
      data: { walletAddress }
    });
    return response.data;
  } catch (error) {
    console.error(`Error removing movie ${movieId} from watchlist ${watchlistId}:`, error);
    throw error;
  }
};
