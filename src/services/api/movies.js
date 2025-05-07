import { arweaveClient } from '../arweave/client';
import { API_ENDPOINTS, CONTENT_TYPES, TX_TAGS } from '../../utils/constants';

class MoviesService {
  // Fetch all movies from Arweave
  async getAllMovies() {
    try {
      const response = await fetch(API_ENDPOINTS.MOVIES);
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const movies = await response.json();
      return movies;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  }

  // Get movie by ID/hash
  async getMovieById(movieId) {
    try {
      const movies = await this.getAllMovies();
      const movie = movies.find(m => m.hash === movieId);
      if (!movie) {
        throw new Error('Movie not found');
      }
      return movie;
    } catch (error) {
      console.error('Error fetching movie by ID:', error);
      throw error;
    }
  }

  // Search movies by title
  async searchMovies(query) {
    try {
      const movies = await this.getAllMovies();
      const searchResults = movies.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
      );
      return searchResults;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  // Filter movies by criteria
  async filterMovies(filters) {
    try {
      const movies = await this.getAllMovies();
      let filteredMovies = movies;

      if (filters.year) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.year === filters.year
        );
      }

      if (filters.minRating) {
        filteredMovies = filteredMovies.filter(movie => 
          parseFloat(movie.rating) >= filters.minRating
        );
      }

      if (filters.ageRating) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.ageRating === filters.ageRating
        );
      }

      return filteredMovies;
    } catch (error) {
      console.error('Error filtering movies:', error);
      throw error;
    }
  }

  // Add movie to user's list (Arweave transaction)
  async addMovieToList(movieId, listType, walletAddress) {
    try {
      const movie = await this.getMovieById(movieId);
      
      const data = JSON.stringify({
        movieId: movie.hash,
        movieTitle: movie.title,
        listType: listType,
        timestamp: new Date().toISOString(),
        action: 'ADD'
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: 'Add-To-List' },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: movie.hash },
        { name: TX_TAGS.ITEM_TYPE, value: CONTENT_TYPES.MOVIE },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress }
      ];

      const transaction = await arweaveClient.createTransaction(data, tags);
      const txId = await arweaveClient.submitTransaction(transaction);

      return txId;
    } catch (error) {
      console.error('Error adding movie to list:', error);
      throw error;
    }
  }

  // Get user's movie lists from Arweave
  async getUserMovieLists(walletAddress) {
    try {
      const query = `
        query {
          transactions(
            owners: ["${walletAddress}"],
            tags: [
              { name: "App-Name", values: ["ReelWeave"] },
              { name: "Item-Type", values: ["movie"] },
              { name: "Action", values: ["Add-To-List"] }
            ]
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
              }
            }
          }
        }
      `;

      const response = await fetch(API_ENDPOINTS.GRAPHQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      return result.data.transactions.edges;
    } catch (error) {
      console.error('Error fetching user movie lists:', error);
      throw error;
    }
  }
}

export const moviesService = new MoviesService();