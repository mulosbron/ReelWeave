// components/comments/CommentList.js
import React, { useState, useEffect } from 'react';
import useComments from '../../hooks/useComments';
import Loading from '../common/Loading';
import CommentItem from './CommentItem';
import DirectCommentForm from './DirectCommentForm';
import useAuth from '../../hooks/useAuth';

const CommentList = ({ itemId, itemType }) => {
  const { 
    comments, 
    loading, 
    error, 
    fetchComments, 
    userComment
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
    walletAddress
  });
  
  // Sadece geçerli öğe ID'sine göre filtrelenmiş yorumları göster
  const filteredComments = comments.filter(comment => {
    return comment.itemId === itemId && comment.itemType === itemType;
  });

  return (
    <div className="community-section">
      <h2>Community Reviews</h2>

      {/* DirectCommentForm'a tüm gerekli props'ları geçiyoruz */}
      <DirectCommentForm
        itemId={itemId}
        itemType={itemType}
        onCommentAdded={handleCommentAdded}
      />

      <div className="comments-container">
        <h3>User Reviews ({filteredComments.length})</h3>

        {loading ? (
          <Loading message="Loading reviews..." />
        ) : error ? (
          <div className="error-message">
            <p>Error loading reviews: {error}</p>
          </div>
        ) : filteredComments && filteredComments.length > 0 ? (
          <div className="comments-list">
            {filteredComments.map(comment => {
              console.log(`Comment: ${comment.author} vs User: ${walletAddress}`);
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
          <p className="no-comments">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
};

export default CommentList;