import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLists from '../../hooks/useLists';
import Loading from '../common/Loading';
import { CONTENT_TYPES } from '../../utils/constants';

const UserList = ({ listType, title }) => {
  const { t } = useTranslation();
  const { getListByType, removeFromList, loading } = useLists();
  const [removingItems, setRemovingItems] = useState({});
  const items = getListByType(listType);

  const handleRemove = async (itemId) => {
    if (removingItems[itemId]) return;
    
    try {
      setRemovingItems(prev => ({ ...prev, [itemId]: true }));
      console.log(`Removing item '${itemId}' from list '${listType}'`);
      await removeFromList(itemId, listType);
    } catch (err) {
      console.error('Error removing item:', err);
    } finally {
      setRemovingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Fix poster URL and make it a full URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If already starts with http, don't change
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If starts with arweave.net, add 'https://'
    if (imagePath.startsWith('arweave.net')) {
      return `https://${imagePath}`;
    }
    
    // Orijinal arweave URL'i
    return `https://arweave.net/${imagePath}`;
  };

  // Create correct redirect URL based on content type
  const getContentUrl = (item) => {
    const type = item.itemType?.toLowerCase();
    if (type === CONTENT_TYPES.MOVIE?.toLowerCase()) {
      return `/movies/${item.itemId}`;
    } else if (type === CONTENT_TYPES.TV_SHOW?.toLowerCase()) {
      return `/tvshows/${item.itemId}`;
    } else {
      // Default redirect for unknown types
      return `/content/${item.itemId}`;
  }
  };

  // Check for missing content information
  const hasRequiredDetails = (item) => {
    if (!item.itemDetails) return false;
    return item.itemDetails.title && item.itemDetails.title !== 'Unknown Title';
  };

  // Filter items with missing content information
  const validItems = items.filter(hasRequiredDetails);

  if (loading && items.length === 0) {
    return <Loading message={t('pages.myLists.loading')} />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="empty-list">
        <p>{t('pages.myLists.noListsFound')}</p>
        <div className="empty-actions">
        <Link to="/movies" className="btn btn-primary">
            {t('community.browseMovies')}
          </Link>
          <Link to="/tvshows" className="btn btn-primary">
            {t('community.browseTvShows')}
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="list-grid">
        {validItems.map((item) => (
          <div key={item.itemId || item.txId} className="list-item">
            <Link 
              to={getContentUrl(item)}
              className="item-link"
            >
              <div className="item-image">
                <img 
                  src={item.itemDetails?.poster 
                    ? getFullImageUrl(item.itemDetails.poster)
                    : `/placeholder-${item.itemType || 'content'}.png`
                  }
                  alt={item.itemDetails?.title || t('content.unknown')}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/placeholder-${item.itemType || 'content'}.png`;
                  }}
                />
                {item.itemType && (
                  <div className="content-type-badge">
                    {item.itemType === CONTENT_TYPES.MOVIE ? t('content.movie') : t('content.tvShow')}
                  </div>
                )}
              </div>
              <div className="item-info">
                <h3>{item.itemDetails?.title}</h3>
                <p className="item-year">{item.itemDetails?.year || '?'}</p>
                {item.itemDetails?.rating && (
                  <p className="item-rating">⭐ {item.itemDetails.rating}</p>
                )}
                <p className="added-date">
                  {t('pages.myLists.lastUpdated')}: {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '?'}
                </p>
              </div>
            </Link>
            <button
              className="btn-remove"
              onClick={() => handleRemove(item.itemId)}
              title={t('lists.removeFromList')}
              disabled={removingItems[item.itemId]}
            >
              {removingItems[item.itemId] ? '...' : '×'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;