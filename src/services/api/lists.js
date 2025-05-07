import { arweaveClient } from '../arweave/client';
import graphql from '../arweave/graphql';
import { APP_NAME, TX_TAGS, LIST_TYPES, ACTIONS } from '../../utils/constants';

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
      const data = JSON.stringify({
        itemId,
        itemType,
        listType,
        itemDetails,
        addedAt: new Date().toISOString(),
        action: 'ADD'
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: ACTIONS.ADD_TO_LIST },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: itemId },
        { name: TX_TAGS.ITEM_TYPE, value: itemType },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress }
      ];

      const transaction = await arweaveClient.createTransaction(data, tags);
      const txId = await arweaveClient.submitTransaction(transaction);

      return { success: true, txId };
    } catch (error) {
      console.error('Error adding to list:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove item from list
  async removeFromList(itemId, listType, walletAddress) {
    try {
      const data = JSON.stringify({
        itemId,
        listType,
        removedAt: new Date().toISOString(),
        action: 'REMOVE'
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: ACTIONS.REMOVE_FROM_LIST },
        { name: TX_TAGS.LIST_TYPE, value: listType },
        { name: TX_TAGS.ITEM_ID, value: itemId },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress }
      ];

      const transaction = await arweaveClient.createTransaction(data, tags);
      const txId = await arweaveClient.submitTransaction(transaction);

      return { success: true, txId };
    } catch (error) {
      console.error('Error removing from list:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's lists
  async getUserLists(walletAddress) {
    try {
      const tags = [
        { name: 'App-Name', value: APP_NAME },
        { name: 'User-Address', value: walletAddress }
      ];

      const transactions = await graphql.findTransactionsByTags(tags);

      // Process transactions to build current state of lists
      const lists = await this.processListTransactions(transactions);
      return lists;
    } catch (error) {
      console.error('Error fetching user lists:', error);
      throw error;
    }
  }

  // Process list transactions to get current state
  async processListTransactions(transactions) {
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
      // Tag'leri bir objeye dönüştür
      const tags = transaction.tags.reduce((acc, tag) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});

      const action = tags['Action'];
      const listType = tags['List-Type'];
      const itemId = tags['Item-Id'];

      if (action === ACTIONS.ADD_TO_LIST && listType && itemId) {
        // Get transaction data
        try {
          const data = await arweaveClient.getTransactionData(transaction.id);
          const parsedData = JSON.parse(data);
          
          // Add item to list if not already present
          if (!lists[listType].find(item => item.itemId === itemId)) {
            lists[listType].push({
              ...parsedData,
              txId: transaction.id,
              addedAt: parsedData.addedAt
            });
          }
        } catch (error) {
          console.error('Error parsing transaction data:', error);
        }
      } else if (action === ACTIONS.REMOVE_FROM_LIST && listType && itemId) {
        // Remove item from list
        lists[listType] = lists[listType].filter(item => item.itemId !== itemId);
      }
    }

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
}

export const listsService = new ListsService();