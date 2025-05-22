import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TvShowCard = ({ tvshow, onAddToList, isInList }) => {
  const { t } = useTranslation();
  const { hash, title, year, rating, seasons, ageRating, imagePath } = tvshow;

  return (
    <div className="tvshow-card">
      <Link to={`/tvshows/${hash}`} className="tvshow-card-link">
        <div className="tvshow-card-image">
          <img 
            src={`https://${imagePath}`} 
            alt={title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-tvshow.png';
            }}
          />
          <div className="tvshow-card-overlay">
            <div className="tvshow-rating">
              <span className="star">★</span> {rating}
            </div>
          </div>
        </div>
        
        <div className="tvshow-card-content">
          <h3 className="tvshow-title">{title}</h3>
          <div className="tvshow-info">
            <span className="tvshow-year">{year}</span>
            <span className="tvshow-seasons">{seasons} {seasons !== 1 ? t('content.seasons') : t('content.season')}</span>
            {ageRating && <span className="tvshow-age-rating">{ageRating}</span>}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TvShowCard;