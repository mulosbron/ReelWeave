import { useState, useCallback } from 'react';
import { listsService } from '../services/api/lists';
import useAuth from './useAuth';

const useLists = () => {
  const { walletAddress, isConnected } = useAuth();
  const [lists, setLists] = useState({
    watchlist: [],
    watched: [],
    favorites: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user lists
  const fetchUserLists = useCallback(async () => {
    if (!isConnected || !walletAddress) return;

    try {
      setLoading(true);
      setError(null);
      const userLists = await listsService.getUserLists(walletAddress);
      setLists(userLists);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user lists:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected]);

  // Add item to list
  const addToList = useCallback(async (itemId, itemType, listType, itemDetails) => {
    if (!isConnected || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await listsService.addToList(
        itemId,
        itemType,
        listType,
        walletAddress,
        itemDetails
      );

      if (result.success) {
        // Optimistically update the local state
        setLists(prevLists => ({
          ...prevLists,
          [listType]: [
            ...prevLists[listType],
            {
              itemId,
              itemType,
              listType,
              itemDetails,
              addedAt: new Date().toISOString(),
              txId: result.txId
            }
          ]
        }));

        // Refresh lists to ensure accuracy
        await fetchUserLists();
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected, fetchUserLists]);

  // Remove item from list
  const removeFromList = useCallback(async (itemId, listType) => {
    if (!isConnected || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await listsService.removeFromList(
        itemId,
        listType,
        walletAddress
      );

      if (result.success) {
        // Optimistically update the local state
        setLists(prevLists => ({
          ...prevLists,
          [listType]: prevLists[listType].filter(item => item.itemId !== itemId)
        }));

        // Refresh lists to ensure accuracy
        await fetchUserLists();
      } else {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected, fetchUserLists]);

  // Check if item is in list
  const isItemInList = useCallback((itemId, listType) => {
    return lists[listType]?.some(item => item.itemId === itemId) || false;
  }, [lists]);

  // Get list by type
  const getListByType = useCallback((listType) => {
    return lists[listType] || [];
  }, [lists]);

  // Get all lists
  const getAllLists = useCallback(() => {
    return lists;
  }, [lists]);

  return {
    lists,
    loading,
    error,
    fetchUserLists,
    addToList,
    removeFromList,
    isItemInList,
    getListByType,
    getAllLists
  };
};

export default useLists;