import { arweaveClient } from '../arweave/client';
import { API_ENDPOINTS, CONTENT_TYPES, TX_TAGS, ARWEAVE_GATEWAYS } from '../../utils/constants';

class TvShowsService {
  // Fetch all TV shows from Arweave
  async getAllTvShows() {
    try {
      const response = await fetch(API_ENDPOINTS.TV_SHOWS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid content type');
      }
      
      const tvShows = await response.json();
      return tvShows;
    } catch (error) {
      console.error('Error fetching TV shows:', error);
      throw error;
    }
  }

  // Get TV show by ID/hash
  async getTvShowById(tvShowId) {
    try {
      const tvShows = await this.getAllTvShows();
      const tvShow = tvShows.find(show => show.hash === tvShowId);
      if (!tvShow) {
        throw new Error('TV show not found');
      }
      return tvShow;
    } catch (error) {
      console.error('Error fetching TV show by ID:', error);
      throw error;
    }
  }

  // Search TV shows by title
  async searchTvShows(query) {
    try {
      const tvShows = await this.getAllTvShows();
      const searchResults = tvShows.filter(show => 
        show.title.toLowerCase().includes(query.toLowerCase())
      );
      return searchResults;
    } catch (error) {
      console.error('Error searching TV shows:', error);
      throw error;
    }
  }

  // Filter TV shows by criteria
  async filterTvShows(filters) {
    try {
      const tvShows = await this.getAllTvShows();
      let filteredShows = tvShows;

      if (filters.year) {
        filteredShows = filteredShows.filter(show => 
          show.year.includes(filters.year)
        );
      }

      if (filters.minRating) {
        filteredShows = filteredShows.filter(show => 
          parseFloat(show.rating) >= filters.minRating
        );
      }

      if (filters.ageRating) {
        filteredShows = filteredShows.filter(show => 
          show.ageRating === filters.ageRating
        );
      }

      return filteredShows;
    } catch (error) {
      console.error('Error filtering TV shows:', error);
      throw error;
    }
  }

  // Add TV show to user's list (Arweave transaction)
  async addTvShowToList(tvShowId, listType, walletAddress) {
    try {
      const tvShow = await this.getTvShowById(tvShowId);
      
      const data = JSON.stringify({
        tvShowId: tvShow.hash,
        tvShowTitle: tvShow.title,
        listType: listType,
        timestamp: new Date().toISOString(),
        action: 'ADD'
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: 'Add-To-List' },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: tvShow.hash },
        { name: TX_TAGS.ITEM_TYPE, value: CONTENT_TYPES.TV_SHOW },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress }
      ];

      const transaction = await arweaveClient.createTransaction(data, tags);
      const txId = await arweaveClient.submitTransaction(transaction);

      return txId;
    } catch (error) {
      console.error('Error adding TV show to list:', error);
      throw error;
    }
  }

  // Get user's TV show lists from Arweave
  async getUserTvShowLists(walletAddress) {
    try {
      const query = `
        query {
          transactions(
            owners: ["${walletAddress}"],
            tags: [
              { name: "App-Name", values: ["ReelWeave"] },
              { name: "Item-Type", values: ["tvshow"] },
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
      console.error('Error fetching user TV show lists:', error);
      throw error;
    }
  }
}

export const tvShowsService = new TvShowsService();