import React from 'react';
import { Link } from 'react-router-dom';
import { CONTENT_TYPES } from '../../utils/constants';

const RecommendationCard = ({ item, contentType, score, hideMatchScore, badgeText }) => {
  const isMovie = contentType === CONTENT_TYPES.MOVIE;
  const linkPath = isMovie ? `/movies/${item.hash}` : `/tvshows/${item.hash}`;

  return (
    <div className="recommendation-card">
      <Link to={linkPath} className="recommendation-link">
        <div className="recommendation-image">
          <img 
            src={item.poster_path || `/placeholder-${contentType}.png`}
            alt={item.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `/placeholder-${contentType}.png`;
            }}
          />
          {badgeText && (
            <div className="recommendation-overlay">
              <div className="badge-text">
                {badgeText}
              </div>
            </div>
          )}
        </div>
        
        <div className="recommendation-content">
          <h3 className="recommendation-title">{item.title}</h3>
          <div className="recommendation-meta">
            {item.year && <span className="year">{item.year}</span>}
            {item.rating && (
              <>
                <span className="separator">•</span>
                <span className="rating">★ {item.rating}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RecommendationCard;