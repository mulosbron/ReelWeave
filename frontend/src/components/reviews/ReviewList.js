import React from 'react';
import { Link } from 'react-router-dom';
import './ReviewList.css';

const ReviewList = ({ reviews = [] }) => {
  if (reviews.length === 0) {
    return (
      <div className="no-reviews">
        <p>No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return 'Anonymous';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="review-list">
      {reviews.map((review, index) => (
        <div key={review.id || index} className="review-card">
          <div className="review-header">
            <div className="review-rating">
              <span className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`star ${i < Math.round(review.rating) ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </span>
              <span className="rating-value">{review.rating}/5</span>
            </div>
            
            {review.title && (
              <h3 className="review-title">{review.title}</h3>
            )}
          </div>
          
          <div className="review-content">
            {review.containsSpoilers && (
              <div className="spoiler-warning">
                Contains Spoilers
              </div>
            )}
            <p>{review.content}</p>
          </div>
          
          <div className="review-footer">
            <div className="review-author">
              {review.owner ? (
                <Link to={`/profile/${review.owner}`}>
                  {formatAddress(review.owner)}
                </Link>
              ) : (
                'Anonymous'
              )}
            </div>
            <div className="review-date">
              {formatDate(review.createdTimestamp)}
            </div>
            <div className="review-likes">
              <button className="like-button">
                <span className="like-icon">👍</span>
                <span className="like-count">{review.likes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
