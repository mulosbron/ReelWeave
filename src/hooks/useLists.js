import { useState, useCallback, useEffect } from 'react';
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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Geçersiz içerikleri filtrele
  const filterInvalidItems = useCallback((userLists) => {
    const filtered = { ...userLists };
    
    // Tüm liste türleri için filtre uygula
    Object.keys(filtered).forEach(listType => {
      if (Array.isArray(filtered[listType])) {
        filtered[listType] = filtered[listType].filter(item => {
          // ItemId veya itemDetails eksikse ya da başlık yoksa geçersiz olarak işaretle
          const isValid = item && 
                         item.itemId && 
                         item.itemDetails && 
                         item.itemDetails.title;
          
          if (!isValid) {
            console.log(`Geçersiz liste öğesi filtrelendi:`, item);
          }
          
          return isValid;
        });
      }
    });
    
    return filtered;
  }, []);

  // Fetch user lists
  const fetchUserLists = useCallback(async (force = false) => {
    if (!isConnected || !walletAddress) return;
    
    // Eğer force parametresi true değilse ve listelerde veri varsa, yeniden çekme
    if (!force && initialized && (lists.watchlist.length > 0 || lists.watched.length > 0 || lists.favorites.length > 0)) {
      console.log('Listeler zaten yüklü, yenilenme atlanıyor');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Listeler getiriliyor, wallet:', walletAddress);
      
      const userLists = await listsService.getUserLists(walletAddress);
      console.log('Ham getirilen listeler:', userLists);
      
      // Geçersiz içerikleri filtrele
      const filteredLists = filterInvalidItems(userLists);
      console.log('Filtrelenmiş listeler:', filteredLists);
      
      setLists(filteredLists);
      setLastUpdated(new Date().toISOString());
      setInitialized(true);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user lists:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected, filterInvalidItems, lists, initialized]);

  // Sayfanın ilk yüklenişinde listeleri getir (sadece bir kez)
  const initializeUserLists = useCallback(() => {
    if (!initialized && isConnected && walletAddress) {
      console.log('Listeler ilk kez yükleniyor');
      fetchUserLists(true); // force parametresi ile listeleri kesinlikle getir
    }
  }, [fetchUserLists, initialized, isConnected, walletAddress]);

  // Kullanıcı cüzdanı bağlanınca veya değişince listeleri yükle (sadece bir kez)
  useEffect(() => {
    if (isConnected && walletAddress && !initialized) {
      console.log('Cüzdan bağlandı/değişti, listeler ilk kez yükleniyor');
      fetchUserLists(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, walletAddress]); // initialized değişkenini buraya eklemedik çünkü sonsuz döngü oluşturabilir

  // Add item to list
  const addToList = useCallback(async (itemId, itemType, listType, itemDetails) => {
    if (!isConnected || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    // İçerik başlığı zorunlu
    if (!itemDetails || !itemDetails.title) {
      throw new Error('İçerik detayları eksik - başlık gereklidir');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Liste ekleniyor: ${itemId} -> ${listType}`, itemDetails);
      
      const result = await listsService.addToList(
        itemId,
        itemType,
        listType,
        walletAddress,
        itemDetails
      );

      if (result.success) {
        console.log('Liste ekleme başarılı:', result);
        
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

        // No automatic refresh after adding
        setLastUpdated(new Date().toISOString());
      } else {
        console.error('Liste ekleme hatası:', result.error);
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      console.error('Liste ekleme exception:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected]);

  // Remove item from list
  const removeFromList = useCallback(async (itemId, listType) => {
    if (!isConnected || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Listeden kaldırılıyor: ${itemId} -> ${listType}`);
      
      const result = await listsService.removeFromList(
        itemId,
        listType,
        walletAddress
      );

      if (result.success) {
        console.log('Listeden kaldırma başarılı:', result);
        
        // Optimistically update the local state
        setLists(prevLists => ({
          ...prevLists,
          [listType]: prevLists[listType].filter(item => item.itemId !== itemId)
        }));

        // No automatic refresh after removing
        setLastUpdated(new Date().toISOString());
      } else {
        console.error('Listeden kaldırma hatası:', result.error);
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      console.error('Listeden kaldırma exception:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isConnected]);

  // Check if item is in list
  const isItemInList = useCallback((itemId, listType) => {
    if (!lists[listType]) return false;
    return lists[listType].some(item => item.itemId === itemId) || false;
  }, [lists]);

  // Get list by type
  const getListByType = useCallback((listType) => {
    return lists[listType] || [];
  }, [lists]);

  // Get all lists
  const getAllLists = useCallback(() => {
    return lists;
  }, [lists]);

  // Manuel olarak listeleri yenileme fonksiyonu
  const refreshLists = useCallback(() => {
    return fetchUserLists(true); // force parametresi ile zorla yenile
  }, [fetchUserLists]);

  return {
    lists,
    loading,
    error,
    lastUpdated,
    fetchUserLists,
    initializeUserLists,
    addToList,
    removeFromList,
    isItemInList,
    getListByType,
    getAllLists,
    refreshLists,
    initialized
  };
};

export default useLists;