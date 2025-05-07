import React from 'react';
import { Link } from 'react-router-dom';
import useLists from '../../hooks/useLists';
import Loading from '../common/Loading';
import { CONTENT_TYPES } from '../../utils/constants';

const UserList = ({ listType, title }) => {
  const { getListByType, removeFromList, loading, error } = useLists();
  const items = getListByType(listType);

  const handleRemove = async (itemId) => {
    try {
      await removeFromList(itemId, listType);
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  if (loading) {
    return <Loading message={`Loading ${title}...`} />;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>Error loading {title}: {error}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="empty-list">
        <p>Your {title} is empty</p>
        <Link to="/movies" className="btn btn-primary">
          Browse Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="user-list">
      <h2>{title}</h2>
      <div className="list-grid">
        {items.map((item) => (
          <div key={item.itemId} className="list-item">
            <Link 
              to={`/${item.itemType === CONTENT_TYPES.MOVIE ? 'movies' : 'tvshows'}/${item.itemId}`}
              className="item-link"
            >
              <div className="item-image">
                <img 
                  src={`https://${item.itemDetails.imagePath}`} 
                  alt={item.itemDetails.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/placeholder-${item.itemType}.png`;
                  }}
                />
              </div>
              <div className="item-info">
                <h3>{item.itemDetails.title}</h3>
                <p className="item-year">{item.itemDetails.year}</p>
                <p className="item-rating">⭐ {item.itemDetails.rating}</p>
                <p className="added-date">
                  Added: {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
            <button
              className="btn btn-remove"
              onClick={() => handleRemove(item.itemId)}
              title="Remove from list"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;