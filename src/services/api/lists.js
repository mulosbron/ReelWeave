import { arweaveClient } from '../arweave/client';
import graphql from '../arweave/graphql';
import { APP_NAME, TX_TAGS, ACTIONS } from '../../utils/constants';

class ListsService {
  // Create a new list
  async createList(listName, listType, walletAddress) {
    try {
      const data = JSON.stringify({
        name: listName,
        type: listType,
        createdAt: new Date().toISOString(),
        items: []
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: ACTIONS.CREATE_LIST },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress },
        { name: 'List-Name', value: listName }
      ];

      const transaction = await arweaveClient.createTransaction(data, tags);
      const txId = await arweaveClient.submitTransaction(transaction);

      return { success: true, txId };
    } catch (error) {
      console.error('Error creating list:', error);
      return { success: false, error: error.message };
    }
  }

  // Add item to list
  async addToList(itemId, itemType, listType, walletAddress, itemDetails) {
    try {
      console.log(`Starting list addition:`, { itemId, itemType, listType });
      
      if (!itemId) {
        console.error("Item ID is missing!");
        return { success: false, error: "Item ID is required" };
      }
      
      if (!walletAddress) {
        console.error("Wallet address is missing!");
        return { success: false, error: "Wallet not connected" };
      }
      
      // Check if poster exists in itemDetails and format it
      if (itemDetails && itemDetails.poster) {
        // Normalize poster URL
        if (itemDetails.poster.startsWith('http')) {
          // If it's an HTTP URL, remove arweave.net domain
          const urlParts = itemDetails.poster.replace('https://', '').replace('http://', '').split('/');
          if (urlParts[0] === 'arweave.net') {
            itemDetails.poster = urlParts.slice(1).join('/');
          }
        }
      }
      
      const data = JSON.stringify({
        itemId,
        itemType,
        listType,
        itemDetails,
        addedAt: new Date().toISOString(),
        action: 'ADD'
      });

      console.log(`List operation data created:`, data);

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: ACTIONS.ADD_TO_LIST },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: itemId },
        { name: TX_TAGS.ITEM_TYPE, value: itemType },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress },
        { name: TX_TAGS.APP_NAME, value: APP_NAME }
      ];
      
      // Add item details as tags - so basic info is in tags even if transaction data is missing
      if (itemDetails) {
        if (itemDetails.title) tags.push({ name: 'Item-Title', value: itemDetails.title });
        if (itemDetails.year) tags.push({ name: 'Item-Year', value: String(itemDetails.year) });
        if (itemDetails.poster) tags.push({ name: 'Item-Poster', value: itemDetails.poster });
        if (itemDetails.rating) tags.push({ name: 'Item-Rating', value: String(itemDetails.rating) });
      }

      console.log(`Transaction tags prepared:`, tags);

      const transaction = await arweaveClient.createTransaction(data, tags);
      console.log(`Transaction created, ID:`, transaction.id);
      
      console.log(`Sending transaction...`);
      const txId = await arweaveClient.submitTransaction(transaction);
      console.log(`Transaction sent successfully, TX ID:`, txId);

      return { success: true, txId };
    } catch (error) {
      console.error('Error adding to list:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove item from list
  async removeFromList(itemId, listType, walletAddress) {
    try {
      console.log(`Starting list removal:`, { itemId, listType });
      
      if (!itemId) {
        console.error("Item ID is missing!");
        return { success: false, error: "Item ID is required" };
      }
      
      if (!walletAddress) {
        console.error("Wallet address is missing!");
        return { success: false, error: "Wallet not connected" };
      }
      
      const data = JSON.stringify({
        itemId,
        listType,
        removedAt: new Date().toISOString(),
        action: 'REMOVE'
      });

      console.log(`List removal data created:`, data);

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: ACTIONS.REMOVE_FROM_LIST },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: itemId },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress },
        { name: TX_TAGS.APP_NAME, value: APP_NAME }
      ];

      console.log(`Transaction tags prepared:`, tags);

      const transaction = await arweaveClient.createTransaction(data, tags);
      console.log(`Transaction created, ID:`, transaction.id);
      
      console.log(`Sending transaction...`);
      const txId = await arweaveClient.submitTransaction(transaction);
      console.log(`Transaction sent successfully, TX ID:`, txId);

      return { success: true, txId };
    } catch (error) {
      console.error('Error removing from list:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's lists
  async getUserLists(walletAddress) {
    try {
      console.log('getUserLists called, wallet:', walletAddress);
      
      // Use a simpler query to solve the issue
      const tagsQuery = [
        { name: 'App-Name', values: [APP_NAME] }
      ];
      
      // Add wallet address if available
      if (walletAddress) {
        tagsQuery.push({ name: 'User-Address', values: [walletAddress] });
      }

      console.log('Tags used for Arweave query:', tagsQuery);
      
      try {
        const transactions = await graphql.findTransactionsByTags(tagsQuery);
        console.log('Found transactions:', transactions);

        // Process transactions to build current state of lists
        const lists = await this.processListTransactions(transactions);
        console.log('Processed lists:', lists);
        return lists;
      } catch (error) {
        console.error('GraphQL query error, trying alternative query:', error);
        
        // Alternative query - query only by App-Name
        const altTagsQuery = [
          { name: 'App-Name', values: [APP_NAME] }
        ];
        
        const transactions = await graphql.findTransactionsByTags(altTagsQuery);
        console.log('Alternative query results:', transactions);
        
        // Now manually filter by wallet address
        const filteredTransactions = transactions.filter(tx => {
          const userAddressTag = tx.tags.find(tag => 
            tag.name === 'User-Address' || tag.name === 'user-address'
          );
          return userAddressTag && userAddressTag.value === walletAddress;
        });
        
        console.log('Filtered transactions:', filteredTransactions);
        
        // Process transactions to build current state of lists
        const lists = await this.processListTransactions(filteredTransactions);
        console.log('Processed lists:', lists);
        return lists;
      }
    } catch (error) {
      console.error('Error fetching user lists:', error);
      // Return empty lists on error
      return {
        watchlist: [],
        watched: [],
        favorites: []
      };
    }
  }

  // Process list transactions to get current state
  async processListTransactions(transactions) {
    console.log('processListTransactions started, transaction count:', transactions.length);
    
    const lists = {
      watchlist: [],
      watched: [],
      favorites: []
    };

    // Sort transactions by block height (chronological order)
    const sortedTransactions = transactions.sort((a, b) => 
      (a.block?.height || 0) - (b.block?.height || 0)
    );

    for (const transaction of sortedTransactions) {
      console.log('\nProcessing transaction:', transaction.id);
      
      // Convert tags to an object
      const tags = transaction.tags.reduce((acc, tag) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});
      
      console.log('Transaction tags:', tags);

      const action = tags['Action'] || tags['action'];
      const listType = tags['List-Type'] || tags['list-type'];
      const itemId = tags['Item-Id'] || tags['item-id'];
      const itemType = tags['Item-Type'] || tags['item-type'];

      console.log('Operation details:', { action, listType, itemId, itemType });

      if ((action === ACTIONS.ADD_TO_LIST || action === 'Add-To-List') && listType && itemId) {
        // Get transaction data
        try {
          const data = await arweaveClient.getTransactionData(transaction.id);
          console.log('Transaction data retrieved:', data);
          
          // If no data or error, try to use tag data
          if (!data || data.includes('status":"error') || data.includes('status":"pending')) {
            console.warn(`Transaction data issue ${transaction.id}, using tag data instead`);
            
            // Create an itemDetails object from tag data
            const itemDetails = {
              title: tags['Item-Title'] || tags['item-title'] || null,
              year: tags['Item-Year'] || tags['item-year'] || null,
              poster: tags['Item-Poster'] || tags['item-poster'] || null,
              rating: tags['Item-Rating'] || tags['item-rating'] || null
            };
            
            // Add to list if at least title exists
            if (itemDetails.title) {
              // If this item is not already in the list, add it with tag data
              if (!lists[listType.toLowerCase()].find(item => item.itemId === itemId)) {
                const newItem = {
                  itemId,
                  itemType,
                  listType: listType.toLowerCase(),
                  txId: transaction.id,
                  addedAt: new Date(transaction.block?.timestamp * 1000).toISOString(),
                  itemDetails
                };
                console.log(`Created new item from tag data:`, newItem);
                lists[listType.toLowerCase()].push(newItem);
              }
            } else {
              console.log(`Not enough tag data for item ${itemId}, skipping`);
            }
            continue;
          }
          
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('Transaction data parsed:', parsedData);
          } catch (parseError) {
            console.error(`Error parsing transaction data for ${transaction.id}:`, parseError);
            continue;
          }
          
          // Check for valid itemDetails
          if (!parsedData.itemDetails || !parsedData.itemDetails.title) {
            console.log(`Missing or invalid itemDetails for ${itemId}, trying to complete from tags`);
            
            // If itemDetails is missing or has no title, try to complete from tags
            parsedData.itemDetails = parsedData.itemDetails || {};
            parsedData.itemDetails.title = parsedData.itemDetails.title || tags['Item-Title'] || tags['item-title'] || null;
            parsedData.itemDetails.year = parsedData.itemDetails.year || tags['Item-Year'] || tags['item-year'] || null;
            parsedData.itemDetails.poster = parsedData.itemDetails.poster || tags['Item-Poster'] || tags['item-poster'] || null;
            parsedData.itemDetails.rating = parsedData.itemDetails.rating || tags['Item-Rating'] || tags['item-rating'] || null;
            
            // Skip if still no title
            if (!parsedData.itemDetails.title) {
              console.log(`Could not find title for item ${itemId}, skipping`);
              continue;
            }
          }
          
          // Fix poster URL
          if (parsedData.itemDetails && parsedData.itemDetails.poster) {
            if (parsedData.itemDetails.poster.includes('arweave.net/')) {
              parsedData.itemDetails.poster = parsedData.itemDetails.poster.replace('https://', '').replace('http://', '');
              console.log('Fixed poster URL:', parsedData.itemDetails.poster);
            }
          }
          
          // Add item to list if not already present
          if (!lists[listType.toLowerCase()].find(item => item.itemId === itemId)) {
            const newItem = {
              ...parsedData,
              txId: transaction.id,
              addedAt: parsedData.addedAt || new Date(transaction.block?.timestamp * 1000).toISOString()
            };
            console.log(`Adding new item to list:`, newItem);
            lists[listType.toLowerCase()].push(newItem);
          }
        } catch (error) {
          console.error(`Error processing transaction ${transaction.id}:`, error);
          // Try using tag data on error
          const itemDetails = {
            title: tags['Item-Title'] || tags['item-title'] || null,
            year: tags['Item-Year'] || tags['item-year'] || null,
            poster: tags['Item-Poster'] || tags['item-poster'] || null,
            rating: tags['Item-Rating'] || tags['item-rating'] || null
          };
          
          // Add to list if at least title exists
          if (itemDetails.title && !lists[listType.toLowerCase()].find(item => item.itemId === itemId)) {
            const newItem = {
              itemId,
              itemType,
              listType: listType.toLowerCase(),
              txId: transaction.id,
              addedAt: new Date(transaction.block?.timestamp * 1000).toISOString(),
              itemDetails
            };
            console.log(`Created new item from tag data after error:`, newItem);
            lists[listType.toLowerCase()].push(newItem);
          }
        }
      } else if ((action === ACTIONS.REMOVE_FROM_LIST || action === 'Remove-From-List') && listType && itemId) {
        console.log(`Removing item from list:`, { listType, itemId });
        // Remove item from list
        lists[listType.toLowerCase()] = lists[listType.toLowerCase()].filter(item => item.itemId !== itemId);
      }
    }

    console.log('\nAll lists processed, final state:', lists);
    return lists;
  }

  // Get list by type
  async getListByType(walletAddress, listType) {
    try {
      const lists = await this.getUserLists(walletAddress);
      return lists[listType] || [];
    } catch (error) {
      console.error('Error fetching list by type:', error);
      throw error;
    }
  }

  // Check if item is in list
  async isItemInList(walletAddress, itemId, listType) {
    try {
      const list = await this.getListByType(walletAddress, listType);
      return list.some(item => item.itemId === itemId);
    } catch (error) {
      console.error('Error checking if item is in list:', error);
      return false;
    }
  }

  // Get community favorite items (most popular items across all users)
  async getCommunityFavorites(limit = 10) {
    try {
      console.log('Fetching community favorites...');
      
      // First get all favorite operations (add and remove)
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "${TX_TAGS.APP_NAME}", values: ["${APP_NAME}"] },
              { name: "${TX_TAGS.LIST_TYPE}", values: ["favorites"] }
            ]
            sort: HEIGHT_DESC
            first: 500
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }
      `;
      
      console.log('Executing GraphQL query for community favorites...');
      const result = await graphql.query(queryString);
      
      if (!result?.transactions?.edges || result.transactions.edges.length === 0) {
        console.log('No community favorites found');
        return { movies: [], tvShows: [] };
      }
      
      console.log(`Found ${result.transactions.edges.length} favorite operations, processing...`);
      
      // Track active favorites for each user
      const userFavorites = new Map(); // userAddress -> Set(itemIds)
      // Store content details
      const itemDetailsMap = {};
      
      // Process transactions in chronological order (old to new)
      const sortedTransactions = result.transactions.edges
        .sort((a, b) => (a.node.block?.height || 0) - (b.node.block?.height || 0));
      
      // Process transactions
      for (const edge of sortedTransactions) {
        const node = edge.node;
        
        // Convert tags to object (case insensitive)
        const tags = node.tags.reduce((acc, tag) => {
          acc[tag.name.toLowerCase()] = tag.value;
          return acc;
        }, {});
        
        const action = tags['action']?.toLowerCase();
        const userAddress = tags['user-address'];
        const itemId = tags['item-id'];
        const itemType = tags['item-type']?.toLowerCase();
        
        if (!userAddress || !itemId) continue;
        
        // Get or create user's favorite set
        if (!userFavorites.has(userAddress)) {
          userFavorites.set(userAddress, new Set());
        }
        const userFavoriteSet = userFavorites.get(userAddress);
        
        if (action === 'add-to-list') {
          // Add to favorites
          userFavoriteSet.add(itemId);
          
          // Store item details (if not already stored)
          if (!itemDetailsMap[itemId]) {
            const poster = tags['item-poster'];
            let posterUrl = null;
            
            if (poster) {
              // Create full URL - use mulosbron.xyz/raw gateway
              posterUrl = poster.startsWith('http') ? poster :
                         poster.startsWith('arweave.net/') ? `https://mulosbron.xyz/raw/${poster.replace('arweave.net/', '')}` :
                         `https://mulosbron.xyz/raw/${poster}`;
            }
            
            itemDetailsMap[itemId] = {
              itemId,
              itemType,
              title: tags['item-title'],
              year: tags['item-year'],
              poster: posterUrl,
              rating: tags['item-rating'] ? parseFloat(tags['item-rating']) : null
            };
          }
        } else if (action === 'remove-from-list') {
          // Remove from favorites
          userFavoriteSet.delete(itemId);
        }
      }
      
      // Count active favorites
      const popularityMap = {};
      for (const userFavoriteSet of userFavorites.values()) {
        for (const itemId of userFavoriteSet) {
          popularityMap[itemId] = (popularityMap[itemId] || 0) + 1;
        }
      }
      
      // Get only items still in favorites and sort by popularity
      const sortedItems = Object.entries(popularityMap)
        .filter(([_, count]) => count > 0) // Only items favorited by at least 1 user
        .map(([itemId, count]) => ({
          ...itemDetailsMap[itemId],
          popularity: count
        }))
        .filter(item => item.title && item.itemType) // Only items with valid title and type
        .sort((a, b) => b.popularity - a.popularity);
      
      console.log(`Found ${sortedItems.length} unique active favorite items`);
      
      // Separate movies and TV shows
      const movies = sortedItems
        .filter(item => item.itemType === 'movie')
        .slice(0, limit)
        .map(item => ({
          ...item,
          type: 'movie',
          hash: item.itemId,
          poster_path: item.poster,
          title: item.title,
          duration: 120
        }));
      
      const tvShows = sortedItems
        .filter(item => item.itemType === 'tvshow')
        .slice(0, limit)
        .map(item => ({
          ...item,
          type: 'tvshow',
          hash: item.itemId,
          poster_path: item.poster,
          title: item.title,
          seasons: 1
        }));
      
      console.log(`Found ${movies.length} most popular movies and ${tvShows.length} TV shows`);
      return { movies, tvShows };
    } catch (error) {
      console.error('Error fetching community favorites:', error);
      return { movies: [], tvShows: [] };
    }
  }
}

export const listsService = new ListsService();