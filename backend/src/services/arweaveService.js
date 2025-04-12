const { gql } = require('graphql-request');
const logger = require('../utils/logger');

// Query movies with optional filtering
async function queryMovies(gqlClient, tags, limit = 10) {
  try {
    const query = gql`
      query {
        transactions(
          tags: ${JSON.stringify(tags)},
          first: ${limit}
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
    
    const data = await gqlClient.request(query);
    
    // Process and return movie data
    const movies = await Promise.all(
      data.transactions.edges.map(async edge => {
        const { id, tags } = edge.node;
        
        // Extract movie ID from tags
        const movieIdTag = tags.find(tag => tag.name === 'Movie-ID');
        const movieId = movieIdTag ? movieIdTag.value : id;
        
        // Get full movie data
        try {
          const response = await fetch(`https://arweave.net/${id}`);
          const movieData = await response.json();
          return movieData;
        } catch (error) {
          logger.error(`Error fetching movie data for transaction ${id}: ${error.message}`);
          
          // Return basic movie info from tags if full data can't be fetched
          const title = tags.find(tag => tag.name === 'Title')?.value || 'Unknown';
          const year = tags.find(tag => tag.name === 'Year')?.value || 'Unknown';
          const genres = tags.find(tag => tag.name === 'Genres')?.value?.split(',') || [];
          const rating = tags.find(tag => tag.name === 'IMDb-Rating')?.value || 'Unknown';
          
          return {
            id: movieId,
            title,
            year,
            genres,
            imdbRating: rating,
            transactionId: id
          };
        }
      })
    );
    
    return movies;
  } catch (error) {
    logger.error(`Error querying movies: ${error.message}`);
    throw error;
  }
}

// Get movie by ID
async function getMovieById(arweave, gqlClient, movieId) {
  try {
    const query = gql`
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["ArweaveIMDB"] },
            { name: "Type", values: ["movie"] },
            { name: "Movie-ID", values: ["${movieId}"] }
          ],
          first: 1
        ) {
          edges {
            node {
              id
            }
          }
        }
      }
    `;
    
    const data = await gqlClient.request(query);
    
    if (data.transactions.edges.length === 0) {
      return null;
    }
    
    const txId = data.transactions.edges[0].node.id;
    
    // Fetch movie data from transaction
    const response = await fetch(`https://arweave.net/${txId}`);
    const movieData = await response.json();
    
    return movieData;
  } catch (error) {
    logger.error(`Error getting movie by ID ${movieId}: ${error.message}`);
    throw error;
  }
}

// Store movie data on Arweave
async function storeMovie(arweave, movieData, tags) {
  try {
    // In a real implementation, you would use a wallet key file to sign transactions
    // For this example, we'll just log what would happen
    
    logger.info(`Storing movie data for "${movieData.title}" on Arweave`);
    logger.info(`Tags: ${JSON.stringify(tags)}`);
    
    // Create transaction
    const tx = await arweave.createTransaction({
      data: JSON.stringify(movieData)
    });
    
    // Add tags
    tags.forEach(tag => {
      tx.addTag(tag.name, tag.value);
    });
    
    // In a real implementation, you would sign and post the transaction:
    // await arweave.transactions.sign(tx, wallet);
    // const response = await arweave.transactions.post(tx);
    
    // For this example, return a mock transaction ID
    return `mock_tx_id_${Date.now()}`;
  } catch (error) {
    logger.error(`Error storing movie data: ${error.message}`);
    throw error;
  }
}

// Query user profile
async function queryUserProfile(gqlClient, walletAddress) {
  try {
    const query = gql`
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["ArweaveIMDB"] },
            { name: "Type", values: ["user-profile"] },
            { name: "Owner", values: ["${walletAddress}"] }
          ],
          first: 1
        ) {
          edges {
            node {
              id
            }
          }
        }
      }
    `;
    
    const data = await gqlClient.request(query);
    
    if (data.transactions.edges.length === 0) {
      return null;
    }
    
    const txId = data.transactions.edges[0].node.id;
    
    // Fetch user profile data from transaction
    const response = await fetch(`https://arweave.net/${txId}`);
    const profileData = await response.json();
    
    return {
      ...profileData,
      walletAddress,
      transactionId: txId
    };
  } catch (error) {
    logger.error(`Error querying user profile for ${walletAddress}: ${error.message}`);
    throw error;
  }
}

// Store user profile on Arweave
async function storeUserProfile(arweave, profileData, tags) {
  try {
    // In a real implementation, you would use a wallet key file to sign transactions
    // For this example, we'll just log what would happen
    
    logger.info(`Storing user profile for "${tags.find(tag => tag.name === 'Owner').value}" on Arweave`);
    logger.info(`Tags: ${JSON.stringify(tags)}`);
    
    // Create transaction
    const tx = await arweave.createTransaction({
      data: JSON.stringify(profileData)
    });
    
    // Add tags
    tags.forEach(tag => {
      tx.addTag(tag.name, tag.value);
    });
    
    // In a real implementation, you would sign and post the transaction:
    // await arweave.transactions.sign(tx, wallet);
    // const response = await arweave.transactions.post(tx);
    
    // For this example, return a mock transaction ID
    return `mock_tx_id_${Date.now()}`;
  } catch (error) {
    logger.error(`Error storing user profile: ${error.message}`);
    throw error;
  }
}

// Query watchlists
async function queryWatchlists(gqlClient, tags, limit = 10) {
  try {
    const query = gql`
      query {
        transactions(
          tags: ${JSON.stringify(tags)},
          first: ${limit}
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
    
    const data = await gqlClient.request(query);
    
    // Process and return watchlist data
    const watchlists = await Promise.all(
      data.transactions.edges.map(async edge => {
        const { id, tags } = edge.node;
        
        // Get full watchlist data
        try {
          const response = await fetch(`https://arweave.net/${id}`);
          const watchlistData = await response.json();
          
          // Add owner from tags
          const ownerTag = tags.find(tag => tag.name === 'Owner');
          if (ownerTag) {
            watchlistData.owner = ownerTag.value;
          }
          
          return watchlistData;
        } catch (error) {
          logger.error(`Error fetching watchlist data for transaction ${id}: ${error.message}`);
          
          // Return basic watchlist info from tags if full data can't be fetched
          const watchlistId = tags.find(tag => tag.name === 'Watchlist-ID')?.value || id;
          const name = tags.find(tag => tag.name === 'Name')?.value || 'Unknown';
          const owner = tags.find(tag => tag.name === 'Owner')?.value || 'Unknown';
          const isPublic = tags.find(tag => tag.name === 'Is-Public')?.value === 'true';
          
          return {
            id: watchlistId,
            name,
            owner,
            isPublic,
            movies: [],
            transactionId: id
          };
        }
      })
    );
    
    return watchlists;
  } catch (error) {
    logger.error(`Error querying watchlists: ${error.message}`);
    throw error;
  }
}

// Get watchlist by ID
async function getWatchlistById(arweave, gqlClient, watchlistId) {
  try {
    const query = gql`
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["ArweaveIMDB"] },
            { name: "Type", values: ["watchlist"] },
            { name: "Watchlist-ID", values: ["${watchlistId}"] }
          ],
          first: 1
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
    
    const data = await gqlClient.request(query);
    
    if (data.transactions.edges.length === 0) {
      return null;
    }
    
    const { id, tags } = data.transactions.edges[0].node;
    
    // Fetch watchlist data from transaction
    const response = await fetch(`https://arweave.net/${id}`);
    const watchlistData = await response.json();
    
    // Add owner from tags
    const ownerTag = tags.find(tag => tag.name === 'Owner');
    if (ownerTag) {
      watchlistData.owner = ownerTag.value;
    }
    
    return watchlistData;
  } catch (error) {
    logger.error(`Error getting watchlist by ID ${watchlistId}: ${error.message}`);
    throw error;
  }
}

// Store watchlist on Arweave
async function storeWatchlist(arweave, watchlistData, tags) {
  try {
    // In a real implementation, you would use a wallet key file to sign transactions
    // For this example, we'll just log what would happen
    
    logger.info(`Storing watchlist "${watchlistData.name}" on Arweave`);
    logger.info(`Tags: ${JSON.stringify(tags)}`);
    
    // Create transaction
    const tx = await arweave.createTransaction({
      data: JSON.stringify(watchlistData)
    });
    
    // Add tags
    tags.forEach(tag => {
      tx.addTag(tag.name, tag.value);
    });
    
    // In a real implementation, you would sign and post the transaction:
    // await arweave.transactions.sign(tx, wallet);
    // const response = await arweave.transactions.post(tx);
    
    // For this example, return a mock transaction ID
    return `mock_tx_id_${Date.now()}`;
  } catch (error) {
    logger.error(`Error storing watchlist: ${error.message}`);
    throw error;
  }
}

// Update watchlist on Arweave
async function updateWatchlist(arweave, watchlistData, tags) {
  // Since Arweave is immutable, updating is the same as storing a new version
  return storeWatchlist(arweave, watchlistData, tags);
}

// Query reviews
async function queryReviews(gqlClient, tags, limit = 10) {
  try {
    const query = gql`
      query {
        transactions(
          tags: ${JSON.stringify(tags)},
          first: ${limit}
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
    
    const data = await gqlClient.request(query);
    
    // Process and return review data
    const reviews = await Promise.all(
      data.transactions.edges.map(async edge => {
        const { id, tags } = edge.node;
        
        // Get full review data
        try {
          const response = await fetch(`https://arweave.net/${id}`);
          const reviewData = await response.json();
          
          // Add owner from tags
          const ownerTag = tags.find(tag => tag.name === 'Owner');
          if (ownerTag) {
            reviewData.owner = ownerTag.value;
          }
          
          return reviewData;
        } catch (error) {
          logger.error(`Error fetching review data for transaction ${id}: ${error.message}`);
          
          // Return basic review info from tags if full data can't be fetched
          const reviewId = tags.find(tag => tag.name === 'Review-ID')?.value || id;
          const movieId = tags.find(tag => tag.name === 'Movie-ID')?.value || 'Unknown';
          const owner = tags.find(tag => tag.name === 'Owner')?.value || 'Unknown';
          const rating = parseFloat(tags.find(tag => tag.name === 'Rating')?.value || '0');
          
          return {
            id: reviewId,
            movieId,
            owner,
            rating,
            title: '',
            content: '',
            transactionId: id
          };
        }
      })
    );
    
    return reviews;
  } catch (error) {
    logger.error(`Error querying reviews: ${error.message}`);
    throw error;
  }
}

// Get review by ID
async function getReviewById(arweave, gqlClient, reviewId) {
  try {
    const query = gql`
      query {
        transactions(
          tags: [
            { name: "App-Name", values: ["ArweaveIMDB"] },
            { name: "Type", values: ["review"] },
            { name: "Review-ID", values: ["${reviewId}"] }
          ],
          first: 1
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
    
    const data = await gqlClient.request(query);
    
    if (data.transactions.edges.length === 0) {
      return null;
    }
    
    const { id, tags } = data.transactions.edges[0].node;
    
    // Fetch review data from transaction
    const response = await fetch(`https://arweave.net/${id}`);
    const reviewData = await response.json();
    
    // Add owner from tags
    const ownerTag = tags.find(tag => tag.name === 'Owner');
    if (ownerTag) {
      reviewData.owner = ownerTag.value;
    }
    
    return reviewData;
  } catch (error) {
    logger.error(`Error getting review by ID ${reviewId}: ${error.message}`);
    throw error;
  }
}

// Store review on Arweave
async function storeReview(arweave, reviewData, tags) {
  try {
    // In a real implementation, you would use a wallet key file to sign transactions
    // For this example, we'll just log what would happen
    
    logger.info(`Storing review for movie ${reviewData.movieId} on Arweave`);
    logger.info(`Tags: ${JSON.stringify(tags)}`);
    
    // Create transaction
    const tx = await arweave.createTransaction({
      data: JSON.stringify(reviewData)
    });
    
    // Add tags
    tags.forEach(tag => {
      tx.addTag(tag.name, tag.value);
    });
    
    // In a real implementation, you would sign and post the transaction:
    // await arweave.transactions.sign(tx, wallet);
    // const response = await arweave.transactions.post(tx);
    
    // For this example, return a mock transaction ID
    return `mock_tx_id_${Date.now()}`;
  } catch (error) {
    logger.error(`Error storing review: ${error.message}`);
    throw error;
  }
}

// Like a review on Arweave
async function likeReview(arweave, likeData, tags) {
  try {
    // In a real implementation, you would use a wallet key file to sign transactions
    // For this example, we'll just log what would happen
    
    logger.info(`${likeData.action === 'like' ? 'Liking' : 'Unliking'} review ${likeData.reviewId} on Arweave`);
    logger.info(`Tags: ${JSON.stringify(tags)}`);
    
    // Create transaction
    const tx = await arweave.createTransaction({
      data: JSON.stringify(likeData)
    });
    
    // Add tags
    tags.forEach(tag => {
      tx.addTag(tag.name, tag.value);
    });
    
    // In a real implementation, you would sign and post the transaction:
    // await arweave.transactions.sign(tx, wallet);
    // const response = await arweave.transactions.post(tx);
    
    // For this example, return a mock transaction ID
    return `mock_tx_id_${Date.now()}`;
  } catch (error) {
    logger.error(`Error ${likeData.action === 'like' ? 'liking' : 'unliking'} review: ${error.message}`);
    throw error;
  }
}

module.exports = {
  queryMovies,
  getMovieById,
  storeMovie,
  queryUserProfile,
  storeUserProfile,
  queryWatchlists,
  getWatchlistById,
  storeWatchlist,
  updateWatchlist,
  queryReviews,
  getReviewById,
  storeReview,
  likeReview
};
