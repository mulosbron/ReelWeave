const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { queryMovies, getMovieById, storeMovie } = require('../services/arweaveService');

// Get all movies with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const { title, year, genre, limit = 10 } = req.query;
    
    // Build tags array for GraphQL query
    const tags = [
      { name: 'App-Name', values: ['ArweaveIMDB'] },
      { name: 'Type', values: ['movie'] }
    ];
    
    if (title) {
      tags.push({ name: 'Title', values: [title] });
    }
    
    if (year) {
      tags.push({ name: 'Year', values: [year] });
    }
    
    if (genre) {
      tags.push({ name: 'Genres', values: [genre] });
    }
    
    const movies = await queryMovies(req.app.locals.gqlClient, tags, parseInt(limit));
    res.json(movies);
  } catch (error) {
    logger.error(`Error fetching movies: ${error.message}`);
    next(error);
  }
});

// Get movie by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const movie = await getMovieById(req.app.locals.arweave, req.app.locals.gqlClient, id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    logger.error(`Error fetching movie ${req.params.id}: ${error.message}`);
    next(error);
  }
});

// Store a new movie (admin only)
router.post('/', async (req, res, next) => {
  try {
    // In a real app, verify admin permissions here
    
    const movieData = req.body;
    
    // Validate required fields
    if (!movieData.title || !movieData.year) {
      return res.status(400).json({ error: 'Title and year are required' });
    }
    
    // Generate unique ID if not provided
    if (!movieData.id) {
      movieData.id = uuidv4();
    }
    
    // Add timestamp
    movieData.timestamp = Date.now();
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'movie' },
      { name: 'Movie-ID', value: movieData.id },
      { name: 'Title', value: movieData.title },
      { name: 'Year', value: movieData.year.toString() }
    ];
    
    // Add genres to tags if available
    if (movieData.genres && movieData.genres.length > 0) {
      tags.push({ name: 'Genres', value: movieData.genres.join(',') });
    }
    
    // Add IMDb rating to tags if available
    if (movieData.imdbRating) {
      tags.push({ name: 'IMDb-Rating', value: movieData.imdbRating.toString() });
    }
    
    // Store movie data on Arweave
    const txId = await storeMovie(req.app.locals.arweave, movieData, tags);
    
    res.status(201).json({ 
      message: 'Movie stored successfully',
      id: movieData.id,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error storing movie: ${error.message}`);
    next(error);
  }
});

// Search movies
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    // Build tags array for GraphQL query
    // This is a simple implementation - in a real app, you might want to use
    // a more sophisticated search mechanism or a dedicated search service
    const tags = [
      { name: 'App-Name', values: ['ArweaveIMDB'] },
      { name: 'Type', values: ['movie'] },
      { name: 'Title', values: [query] } // Simple title search
    ];
    
    const movies = await queryMovies(req.app.locals.gqlClient, tags, parseInt(limit));
    res.json(movies);
  } catch (error) {
    logger.error(`Error searching movies: ${error.message}`);
    next(error);
  }
});

module.exports = router;
