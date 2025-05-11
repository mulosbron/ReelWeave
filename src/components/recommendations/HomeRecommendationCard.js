import React from 'react';
import { Link } from 'react-router-dom';
import { CONTENT_TYPES } from '../../utils/constants';

const HomeRecommendationCard = ({ item, contentType, score }) => {
  const isMovie = contentType === CONTENT_TYPES.MOVIE;
  const linkPath = isMovie ? `/movies/${item.hash}` : `/tvshows/${item.hash}`;

  return (
    <div className="recommendation-card">
      <Link to={linkPath} className="recommendation-link">
        <div className="recommendation-image">
          <img 
            src={item.imagePath ? `https://${item.imagePath}` : `/placeholder-${contentType}.png`}
            alt={item.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `/placeholder-${contentType}.png`;
            }}
          />
          <div className="recommendation-overlay">
            <div className="match-score">
              {Math.round(score * 100)}% Match
            </div>
          </div>
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
            {isMovie && item.duration && (
              <span className="duration"> • {item.duration}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HomeRecommendationCard; 