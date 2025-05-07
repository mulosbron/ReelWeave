import React from 'react';
import { Link } from 'react-router-dom';
import AddToList from '../lists/AddToList';
import { CONTENT_TYPES } from '../../utils/constants';

const RecommendationCard = ({ item, contentType, score }) => {
  const isMovie = contentType === CONTENT_TYPES.MOVIE;
  const linkPath = isMovie ? `/movies/${item.hash}` : `/tvshows/${item.hash}`;
  
  const itemDetails = {
    title: item.title,
    year: item.year,
    rating: item.rating,
    imagePath: item.imagePath,
    ...(isMovie ? 
      { duration: item.duration, ageRating: item.ageRating } : 
      { episodes: item.episodes, ageRating: item.ageRating }
    )
  };

  const getMatchPercentage = () => {
    return Math.round(score * 100);
  };

  const getRecommendationReason = () => {
    if (score >= 0.8) return "Highly recommended based on your favorites";
    if (score >= 0.6) return "Similar to what you've watched";
    if (score >= 0.4) return "You might enjoy this";
    return "Based on your preferences";
  };

  return (
    <div className="recommendation-card">
      <Link to={linkPath} className="recommendation-link">
        <div className="recommendation-image">
          <img 
            src={`https://${item.imagePath}`} 
            alt={item.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `/placeholder-${contentType}.png`;
            }}
          />
          <div className="recommendation-overlay">
            <div className="match-score">
              {getMatchPercentage()}% Match
            </div>
          </div>
        </div>
        
        <div className="recommendation-content">
          <h3 className="recommendation-title">{item.title}</h3>
          <div className="recommendation-meta">
            <span className="year">{item.year}</span>
            <span className="separator">•</span>
            <span className="rating">★ {item.rating}</span>
            {isMovie ? 
              <span className="duration"> • {item.duration}</span> : 
              <span className="episodes"> • {item.episodes}</span>
            }
          </div>
          <p className="recommendation-reason">{getRecommendationReason()}</p>
        </div>
      </Link>
      
      <div className="recommendation-actions">
        <AddToList
          itemId={item.hash}
          itemType={contentType}
          itemDetails={itemDetails}
        />
      </div>
    </div>
  );
};

export default RecommendationCard;