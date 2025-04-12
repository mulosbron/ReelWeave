import React, { useState } from 'react';
import { useArweaveWallet } from 'arweave-wallet-kit';
import './ReviewForm.css';

const ReviewForm = ({ onSubmit, initialRating = 0, initialContent = '' }) => {
  const { connected } = useArweaveWallet();
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected) {
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter review content');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await onSubmit({
        rating,
        title,
        content,
        containsSpoilers
      });
      
      // Reset form after successful submission
      setRating(0);
      setTitle('');
      setContent('');
      setContainsSpoilers(false);
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again later.');
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''}`}
          onClick={() => setRating(i)}
        >
          ★
        </span>
      );
    }
    
    return stars;
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="review-form-container">
      <h3>Write a Review</h3>
      
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating</label>
          <div className="rating-stars">
            {renderStars()}
            <span className="rating-text">{rating > 0 ? `${rating}/5` : 'Select a rating'}</span>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="review-title">Review Title (Optional)</label>
          <input
            type="text"
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your thoughts"
            maxLength={100}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="review-content">Your Review</label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you think of this movie?"
            rows={5}
            required
          />
        </div>
        
        <div className="form-group spoiler-checkbox">
          <input
            type="checkbox"
            id="contains-spoilers"
            checked={containsSpoilers}
            onChange={(e) => setContainsSpoilers(e.target.checked)}
          />
          <label htmlFor="contains-spoilers">This review contains spoilers</label>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
