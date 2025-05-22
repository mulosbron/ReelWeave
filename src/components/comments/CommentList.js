import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useComments from '../../hooks/useComments';
import Loading from '../common/Loading';
import CommentItem from './CommentItem';
import DirectCommentForm from './DirectCommentForm';
import useAuth from '../../hooks/useAuth';

const CommentList = ({ itemId, itemType }) => {
  const { t } = useTranslation();
  const { 
    comments, 
    loading, 
    error, 
    fetchComments, 
    userComment,
    isEditing
  } = useComments(itemId, itemType);
  
  const { walletAddress } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Bileşen yüklendiğinde ve bağımlılıklar değiştiğinde yorumları getir
  useEffect(() => {
    if (itemId && itemType) {
      console.log(`CommentList useEffect: Fetching comments for ${itemType} with ID: ${itemId}`);
      fetchComments();
    }
  }, [fetchComments, refreshTrigger, itemId, itemType]);

  const handleCommentAdded = () => {
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 2000);
  };

  // Debug log - mevcut durumu kontrol et
  console.log('CommentList DEBUG:', {
    userComment: userComment ? `Mevcut (${userComment.content?.substring(0, 20)}...)` : 'Yok',
    comments: comments?.length || 0,
    itemId,
    itemType,
    isEditing,
    walletAddress
  });
  
  // Sadece geçerli öğe ID'sine göre filtrelenmiş yorumları göster
  const filteredComments = comments.filter(comment => {
    return comment.itemId === itemId && comment.itemType === itemType;
  });

  return (
    <div className="community-section">
      <h2>{t('reviews.communityReviews')}</h2>

      {/* DirectCommentForm'a tüm gerekli props'ları geçiyoruz */}
      <DirectCommentForm
        itemId={itemId}
        itemType={itemType}
        onCommentAdded={handleCommentAdded}
      />

      <div className="comments-container">
        <h3>{t('reviews.userReviews')} ({filteredComments.length})</h3>

        {loading ? (
          <Loading message={t('reviews.loading')} />
        ) : error ? (
          <div className="error-message">
            <p>{t('reviews.error')}: {error}</p>
          </div>
        ) : filteredComments && filteredComments.length > 0 ? (
          <div className="comments-list">
            {filteredComments.map(comment => {
              console.log(`Yorum: ${comment.author} vs Kullanıcı: ${walletAddress}`);
              const isUserOwnComment = walletAddress && comment.author && 
                comment.author.toLowerCase() === walletAddress.toLowerCase();
              return (
                <CommentItem 
                  key={comment.id || Math.random().toString()} 
                  comment={comment}
                  isUserComment={isUserOwnComment}
                />
              );
            })}
          </div>
        ) : (
          <p className="no-comments">{t('reviews.noReviews')}</p>
        )}
      </div>
    </div>
  );
};

export default CommentList;