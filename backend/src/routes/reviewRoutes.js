const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { queryReviews, getReviewById, storeReview, likeReview } = require('../services/arweaveService');

// Get all reviews for a movie
router.get('/movie/:movieId', async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { limit = 10 } = req.query;
    
    // Build tags array for GraphQL query
    const tags = [
      { name: 'App-Name', values: ['ArweaveIMDB'] },
      { name: 'Type', values: ['review'] },
      { name: 'Movie-ID', values: [movieId] }
    ];
    
    const reviews = await queryReviews(req.app.locals.gqlClient, tags, parseInt(limit));
    res.json(reviews);
  } catch (error) {
    logger.error(`Error fetching reviews for movie ${req.params.movieId}: ${error.message}`);
    next(error);
  }
});

// Get all reviews by a user
router.get('/user/:walletAddress', async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 10 } = req.query;
    
    // Build tags array for GraphQL query
    const tags = [
      { name: 'App-Name', values: ['ArweaveIMDB'] },
      { name: 'Type', values: ['review'] },
      { name: 'Owner', values: [walletAddress] }
    ];
    
    const reviews = await queryReviews(req.app.locals.gqlClient, tags, parseInt(limit));
    res.json(reviews);
  } catch (error) {
    logger.error(`Error fetching reviews by user ${req.params.walletAddress}: ${error.message}`);
    next(error);
  }
});

// Get review by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await getReviewById(req.app.locals.arweave, req.app.locals.gqlClient, id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.json(review);
  } catch (error) {
    logger.error(`Error fetching review ${req.params.id}: ${error.message}`);
    next(error);
  }
});

// Create a new review
router.post('/', async (req, res, next) => {
  try {
    const { walletAddress, movieId, rating, title, content, containsSpoilers = false } = req.body;
    
    // Validate required fields
    if (!walletAddress || !movieId || !rating || !content) {
      return res.status(400).json({ error: 'Wallet address, movie ID, rating, and content are required' });
    }
    
    // Verify that the request is signed by the wallet owner
    // In a real app, you would verify the signature here
    // For simplicity, we're skipping this step in this implementation
    
    // Generate unique ID
    const reviewId = uuidv4();
    
    // Prepare review data
    const reviewData = {
      id: reviewId,
      movieId,
      rating: parseFloat(rating),
      title: title || '',
      content,
      containsSpoilers,
      likes: 0,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now()
    };
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'review' },
      { name: 'Review-ID', value: reviewId },
      { name: 'Movie-ID', value: movieId },
      { name: 'Owner', value: walletAddress },
      { name: 'Rating', value: rating.toString() }
    ];
    
    // Store review on Arweave
    const txId = await storeReview(req.app.locals.arweave, reviewData, tags);
    
    res.status(201).json({ 
      message: 'Review created successfully',
      id: reviewId,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error creating review: ${error.message}`);
    next(error);
  }
});

// Like a review
router.post('/:id/like', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { walletAddress, action = 'like' } = req.body;
    
    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Verify that the request is signed by the wallet owner
    // In a real app, you would verify the signature here
    // For simplicity, we're skipping this step in this implementation
    
    // Prepare like data
    const likeData = {
      reviewId: id,
      action: action === 'unlike' ? 'unlike' : 'like',
      timestamp: Date.now()
    };
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'review-like' },
      { name: 'Review-ID', value: id },
      { name: 'Owner', value: walletAddress },
      { name: 'Action', value: likeData.action }
    ];
    
    // Store like on Arweave
    const txId = await likeReview(req.app.locals.arweave, likeData, tags);
    
    res.json({ 
      message: `Review ${likeData.action === 'like' ? 'liked' : 'unliked'} successfully`,
      reviewId: id,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error liking review ${req.params.id}: ${error.message}`);
    next(error);
  }
});

module.exports = router;
