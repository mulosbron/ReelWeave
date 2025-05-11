// components/comments/CommentItem.js
import React from 'react';
import { Link } from 'react-router-dom';

const CommentItem = ({ comment, isUserComment }) => {
  const formatAddress = (address) => {
    if (!address) return 'Anonymous';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (isNaN(date.getTime())) {
        return 'invalid date';
      }

      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        return `${Math.floor(diffInDays / 7)} weeks ago`;
      } else {
        return date.toLocaleDateString('en-US');
      }
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Recently';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="comment-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Get content URL based on type
  const getContentUrl = () => {
    if (!comment.itemId) return '#';
    if (comment.itemType?.toLowerCase() === 'movie') {
      return `/movie/${comment.itemId}`;
    } else if (comment.itemType?.toLowerCase() === 'tvshow') {
      return `/tvshow/${comment.itemId}`;
    }
    return '#';
  };

  return (
    <div className={`comment-item ${isUserComment ? 'user-comment' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-info">
            <span className="wallet-address">{formatAddress(comment.author)}</span>
            {isUserComment && <span className="user-badge">You</span>}
          </div>
          {renderStars(comment.rating || 0)}
        </div>
        <div className="comment-date">
          {comment.updatedAt && comment.updatedAt !== comment.createdAt
            ? `Updated: ${formatDate(comment.updatedAt)}`
            : formatDate(comment.createdAt)}
        </div>
      </div>
      
      {comment.itemTitle && (
        <div className="comment-item-content">
          <Link to={getContentUrl()} className="content-link">
            <div className="content-type-badge">{comment.itemType === 'movie' ? 'Movie' : 'TV Show'}</div>
            <span className="content-title">{comment.itemTitle}</span>
          </Link>
        </div>
      )}
      
      <div className="comment-content">
        <p>{comment.content}</p>
      </div>
      
      {comment.txId && (
        <div className="transaction-info">
          <a 
            href={`https://viewblock.io/arweave/tx/${comment.txId}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="transaction-link"
          >
            <span className="tx-label">TX:</span> {comment.txId.slice(0, 6)}...{comment.txId.slice(-6)}
          </a>
        </div>
      )}
    </div>
  );
};

export default CommentItem;