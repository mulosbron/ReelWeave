const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { queryWatchlists, getWatchlistById, storeWatchlist, updateWatchlist } = require('../services/arweaveService');

// Get all watchlists for a user
router.get('/user/:walletAddress', async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 10 } = req.query;
    
    // Build tags array for GraphQL query
    const tags = [
      { name: 'App-Name', values: ['ArweaveIMDB'] },
      { name: 'Type', values: ['watchlist'] },
      { name: 'Owner', values: [walletAddress] }
    ];
    
    const watchlists = await queryWatchlists(req.app.locals.gqlClient, tags, parseInt(limit));
    res.json(watchlists);
  } catch (error) {
    logger.error(`Error fetching watchlists for user ${req.params.walletAddress}: ${error.message}`);
    next(error);
  }
});

// Get watchlist by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const watchlist = await getWatchlistById(req.app.locals.arweave, req.app.locals.gqlClient, id);
    
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }
    
    res.json(watchlist);
  } catch (error) {
    logger.error(`Error fetching watchlist ${req.params.id}: ${error.message}`);
    next(error);
  }
});

// Create a new watchlist
router.post('/', async (req, res, next) => {
  try {
    const { walletAddress, name, description, isPublic = true } = req.body;
    
    // Validate required fields
    if (!walletAddress || !name) {
      return res.status(400).json({ error: 'Wallet address and name are required' });
    }
    
    // Verify that the request is signed by the wallet owner
    // In a real app, you would verify the signature here
    // For simplicity, we're skipping this step in this implementation
    
    // Generate unique ID
    const watchlistId = uuidv4();
    
    // Prepare watchlist data
    const watchlistData = {
      id: watchlistId,
      name,
      description: description || '',
      isPublic,
      movies: [],
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now()
    };
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'watchlist' },
      { name: 'Watchlist-ID', value: watchlistId },
      { name: 'Owner', value: walletAddress },
      { name: 'Name', value: name },
      { name: 'Is-Public', value: isPublic.toString() }
    ];
    
    // Store watchlist on Arweave
    const txId = await storeWatchlist(req.app.locals.arweave, watchlistData, tags);
    
    res.status(201).json({ 
      message: 'Watchlist created successfully',
      id: watchlistId,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error creating watchlist: ${error.message}`);
    next(error);
  }
});

// Add movie to watchlist
router.post('/:id/movies', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { walletAddress, movieId, status = 'want-to-watch', personalNotes = '' } = req.body;
    
    // Validate required fields
    if (!walletAddress || !movieId) {
      return res.status(400).json({ error: 'Wallet address and movie ID are required' });
    }
    
    // Get current watchlist
    const watchlist = await getWatchlistById(req.app.locals.arweave, req.app.locals.gqlClient, id);
    
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }
    
    // Verify ownership
    if (watchlist.owner !== walletAddress) {
      return res.status(403).json({ error: 'Not authorized to modify this watchlist' });
    }
    
    // Check if movie already exists in watchlist
    const existingMovieIndex = watchlist.movies.findIndex(movie => movie.movieId === movieId);
    
    if (existingMovieIndex >= 0) {
      // Update existing movie entry
      watchlist.movies[existingMovieIndex] = {
        movieId,
        addedTimestamp: watchlist.movies[existingMovieIndex].addedTimestamp,
        status,
        personalNotes
      };
    } else {
      // Add new movie entry
      watchlist.movies.push({
        movieId,
        addedTimestamp: Date.now(),
        status,
        personalNotes
      });
    }
    
    // Update timestamp
    watchlist.updatedTimestamp = Date.now();
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'watchlist' },
      { name: 'Watchlist-ID', value: id },
      { name: 'Owner', value: walletAddress },
      { name: 'Name', value: watchlist.name },
      { name: 'Is-Public', value: watchlist.isPublic.toString() },
      { name: 'Update-Type', value: 'add-movie' }
    ];
    
    // Store updated watchlist on Arweave
    const txId = await updateWatchlist(req.app.locals.arweave, watchlist, tags);
    
    res.json({ 
      message: 'Movie added to watchlist successfully',
      watchlistId: id,
      movieId,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error adding movie to watchlist ${req.params.id}: ${error.message}`);
    next(error);
  }
});

// Remove movie from watchlist
router.delete('/:id/movies/:movieId', async (req, res, next) => {
  try {
    const { id, movieId } = req.params;
    const { walletAddress } = req.body;
    
    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Get current watchlist
    const watchlist = await getWatchlistById(req.app.locals.arweave, req.app.locals.gqlClient, id);
    
    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }
    
    // Verify ownership
    if (watchlist.owner !== walletAddress) {
      return res.status(403).json({ error: 'Not authorized to modify this watchlist' });
    }
    
    // Remove movie from watchlist
    watchlist.movies = watchlist.movies.filter(movie => movie.movieId !== movieId);
    
    // Update timestamp
    watchlist.updatedTimestamp = Date.now();
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'watchlist' },
      { name: 'Watchlist-ID', value: id },
      { name: 'Owner', value: walletAddress },
      { name: 'Name', value: watchlist.name },
      { name: 'Is-Public', value: watchlist.isPublic.toString() },
      { name: 'Update-Type', value: 'remove-movie' }
    ];
    
    // Store updated watchlist on Arweave
    const txId = await updateWatchlist(req.app.locals.arweave, watchlist, tags);
    
    res.json({ 
      message: 'Movie removed from watchlist successfully',
      watchlistId: id,
      movieId,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error removing movie from watchlist ${req.params.id}: ${error.message}`);
    next(error);
  }
});

module.exports = router;
