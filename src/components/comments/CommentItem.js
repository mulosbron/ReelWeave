// components/comments/CommentItem.js
import React from 'react';

const CommentItem = ({ comment, isUserComment }) => {
  const formatAddress = (address) => {
    if (!address) return 'Anonim';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (isNaN(date.getTime())) {
        return 'geçersiz tarih';
      }

      if (diffInDays === 0) {
        return 'Bugün';
      } else if (diffInDays === 1) {
        return 'Dün';
      } else if (diffInDays < 7) {
        return `${diffInDays} gün önce`;
      } else if (diffInDays < 30) {
        return `${Math.floor(diffInDays / 7)} hafta önce`;
      } else {
        return date.toLocaleDateString('tr-TR');
      }
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Yakın zamanda';
    }
  };

  const renderStars = (rating) => {
    const numRating = Number(rating);
    return (
      <div className="comment-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= numRating ? 'filled' : 'empty'}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={star <= numRating ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              width="16"
              height="16"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`comment-item ${isUserComment ? 'user-comment' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-address">
            {formatAddress(comment.author)}
            {isUserComment && <span className="user-badge">Siz</span>}
          </div>
          {renderStars(comment.rating || 0)}
        </div>
        <div className="comment-date">
          {comment.updatedAt && comment.updatedAt !== comment.createdAt
            ? `Güncellendi: ${formatDate(comment.updatedAt)}`
            : formatDate(comment.createdAt)}
        </div>
      </div>
      <div className="comment-content">
        <p>{comment.content}</p>
      </div>
    </div>
  );
};

export default CommentItem;