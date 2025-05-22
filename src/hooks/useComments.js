import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { commentsService } from '../services/api/comments';
import useAuth from './useAuth';

const useComments = (itemId, itemType) => {
  const { t } = useTranslation();
  const { walletAddress, isConnected } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [userComment, setUserComment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Auth durumunu loglayalım
  console.log('useComments AUTH STATE:', { isConnected, walletAddress });

  // Bu işlev, belirli bir öğe için yorumları getirir
  const fetchComments = useCallback(async (forceRefresh = false) => {
    // itemId ve itemType kontrolü - bunlar yoksa işlem yapma
    if (!itemId || !itemType) {
      setComments([]);
      setAverageRating(null);
      setUserComment(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`${itemType} ${itemId} için yorumlar getiriliyor...`);
      
      // Bu öğe için yorumları getir
      const fetchedComments = await commentsService.getComments(itemId, itemType);
      console.log(`${fetchedComments.length} yorum alındı`);
      setComments(fetchedComments);

      // Kullanıcının bu öğe için yorumu var mı kontrol et
      if (isConnected && walletAddress) {
        console.log(`Kullanıcı ${walletAddress} için yorum kontrol ediliyor...`);
        
        // Yorumlar arasından kullanıcının yorumunu bul
        const existingComment = fetchedComments.find(
          comment => comment.author === walletAddress && 
                    comment.itemId === itemId && 
                    comment.itemType === itemType
        );
        
        console.log(`Kullanıcı yorumu bulundu mu?`, !!existingComment, existingComment);
        
        // userComment durumunu güncelle, ancak düzenleme modunda değilse
        if (!isEditing || forceRefresh) {
          console.log(`Kullanıcı yorumu güncelleniyor:`, existingComment);
          setUserComment(existingComment || null);
        }
        
        // Eğer kullanıcının yorumu yoksa düzenleme modunu kapat
        if (!existingComment && isEditing) {
          setIsEditing(false);
        }
      } else {
        console.log('Kullanıcı giriş yapmamış veya wallet adresi yok');
        setUserComment(null);
        setIsEditing(false);
      }

      // Bu öğe için ortalama puanı hesapla
      const avgRating = await commentsService.getAverageRating(itemId, itemType);
      console.log(`Ortalama puan:`, avgRating);
      setAverageRating(avgRating);
      
      // Son güncelleme zamanını kaydet
      setLastUpdateTime(Date.now());
    } catch (err) {
      setError(err.message);
      console.error('Yorumlar getirilirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType, walletAddress, isConnected, isEditing]);

  // itemId, itemType veya walletAddress değiştiğinde yorumları yeniden getir
  useEffect(() => {
    fetchComments();
  }, [fetchComments, itemId, itemType, walletAddress]);

  // Kullanıcının bu öğe için yorumu var mı kontrol et
  const checkUserHasCommented = useCallback(async () => {
    if (!isConnected || !walletAddress || !itemId || !itemType) {
      return false;
    }
    
    try {
      console.log(`Kullanıcı yorumu kontrolü: ${walletAddress} için ${itemType} ${itemId}`);
      // Önce mevcut yorumları kontrol et
      const userReview = comments.find(
        comment => comment.author === walletAddress && 
                  comment.itemId === itemId && 
                  comment.itemType === itemType
      );
      
      if (userReview) {
        console.log(`Kullanıcı yorumu yerel state'de bulundu:`, userReview);
        setUserComment(userReview);
        return true;
      }
      
      // Yerel state'de bulamazsan API'den dene
      const existingComment = await commentsService.getUserCommentForItem(walletAddress, itemId, itemType);
      
      if (existingComment) {
        console.log(`Kullanıcı yorumu API'den bulundu:`, existingComment);
        setUserComment(existingComment);
        return true;
      } else {
        console.log(`Kullanıcı yorumu bulunamadı`);
        setUserComment(null);
        return false;
      }
    } catch (err) {
      console.error('Kullanıcı yorumu kontrol edilirken hata oluştu:', err);
      return false;
    }
  }, [isConnected, walletAddress, itemId, itemType, comments]);

  // Cüzdan değiştiğinde kullanıcının yorumunu yeniden kontrol et
  useEffect(() => {
    if (walletAddress) {
      console.log('Wallet değişti, yorum kontrol ediliyor:', walletAddress);
      checkUserHasCommented();
    } else {
      console.log('Wallet adresi yok, yorum null yapılıyor');
      setUserComment(null);
    }
  }, [walletAddress, checkUserHasCommented]);

  // Hook'un sonunda, return değerini her zaman logla
  useEffect(() => {
    console.log('useComments hook return values:', { 
      userComment: userComment ? 'Mevcut' : 'Yok',
      isEditing,
      walletAddress
    });
  }, [userComment, isEditing, walletAddress]);

  // Yorum ekle veya güncelle
  const addOrUpdateComment = useCallback(async (content, rating) => {
    if (!isConnected || !walletAddress) {
      throw new Error(t('comments.error.notConnected'));
    }
    
    if (!itemId || !itemType) {
      throw new Error(t('comments.error.missingItemInfo'));
    }
    
    if (!content.trim()) {
      throw new Error(t('comments.error.empty'));
    }
    
    if (!rating || rating <= 0) {
      throw new Error(t('comments.error.noRating'));
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Yorum gönderiliyor: ${itemType} ${itemId} için ${rating} yıldız`);
      
      const result = await commentsService.addOrUpdateComment(
        itemId,
        itemType,
        content,
        rating,
        walletAddress
      );

      if (result.success) {
        console.log(`Yorum başarıyla gönderildi, TX ID: ${result.txId}`);
        
        // İyimser güncelleme
        const newComment = {
          id: result.txId,
          content,
          rating,
          author: walletAddress,
          itemId: itemId,
          itemType: itemType,
          createdAt: userComment ? userComment.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdit: result.isEdit,
          txId: result.txId
        };

        if (result.isEdit) {
          console.log(`Mevcut yorum güncelleniyor`);
          // Mevcut yorumu güncelle
          setComments(prev => 
            prev.map(comment => 
              (comment.author === walletAddress && 
               comment.itemId === itemId && 
               comment.itemType === itemType) ? newComment : comment
            )
          );
          
          // userComment durumunu da güncelle
          setUserComment(newComment);
        } else {
          console.log(`Yeni yorum ekleniyor`);
          // Yeni yorum ekle
          setComments(prev => [newComment, ...prev]);
          setUserComment(newComment);
        }

        setIsEditing(false);

        // Daha kısa bir süre sonra yeniden yükle (5sn)
        setTimeout(() => fetchComments(true), 5000);
        
        // 30 saniye sonra tekrar yeniden yükle (Arweave ağı yavaş olabilir)
        setTimeout(() => fetchComments(true), 30000);
        
        return result;
      } else {
        throw new Error(result.error || t('comments.error.submitFailed'));
      }
    } catch (err) {
      setError(err.message);
      console.error("addOrUpdateComment hook'unda hata:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType, walletAddress, isConnected, fetchComments, userComment, t]);

  return {
    comments,
    loading,
    error,
    averageRating,
    userComment,
    isEditing,
    setIsEditing,
    fetchComments,
    refreshComments: useCallback(() => {
      console.log("Yorumlar yeniden yükleniyor...");
      fetchComments(true);
    }, [fetchComments]),
    addOrUpdateComment,
    checkUserHasCommented,
    lastUpdateTime,
    itemId,
    itemType
  };
};

export default useComments;