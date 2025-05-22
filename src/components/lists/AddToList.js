import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useLists from '../../hooks/useLists';
import useAuth from '../../hooks/useAuth';
import { LIST_TYPES } from '../../utils/constants';

const AddToList = ({ itemId, itemType, itemDetails, onSuccess, onError }) => {
  const { t } = useTranslation();
  const { isConnected } = useAuth();
  const { addToList, removeFromList, isItemInList, loading } = useLists();
  const [selectedList, setSelectedList] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [listStatus, setListStatus] = useState({});

  // Check item status in all lists
  useEffect(() => {
    const status = {
      watchlist: isItemInList(itemId, LIST_TYPES.WATCHLIST),
      watched: isItemInList(itemId, LIST_TYPES.WATCHED),
      favorites: isItemInList(itemId, LIST_TYPES.FAVORITES)
    };
    setListStatus(status);
  }, [itemId, isItemInList]);

  const handleListAction = async (listType) => {
    if (!isConnected) {
      if (onError) onError(t('auth.connectWalletFirst'));
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedList(listType);

      let result;
      if (listStatus[listType]) {
        // Remove from list
        result = await removeFromList(itemId, listType);
      } else {
        // Add to list
        result = await addToList(itemId, itemType, listType, itemDetails);
      }

      if (result.success) {
        if (onSuccess) onSuccess(`${listStatus[listType] ? t('lists.removedFrom') : t('lists.addedTo')} ${t(`lists.${listType}`)}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (onError) onError(error.message);
    } finally {
      setIsProcessing(false);
      setSelectedList(null);
    }
  };

  const handleQuickAdd = (e, listType) => {
    e.preventDefault();
    e.stopPropagation();
    handleListAction(listType);
  };

  const ListButton = ({ listType, icon, label }) => {
    const isInList = listStatus[listType];
    const isLoading = isProcessing && selectedList === listType;

    return (
      <button
        onClick={(e) => handleQuickAdd(e, listType)}
        className={`list-button ${isInList ? 'in-list' : ''} ${isLoading ? 'loading' : ''}`}
        disabled={loading || isProcessing}
        title={isInList ? t('lists.removeFrom', { list: t(`lists.${listType}`) }) : t('lists.addTo', { list: t(`lists.${listType}`) })}
      >
        {isLoading ? (
          <span className="spinner"></span>
        ) : (
          <>
            <span className="icon">{icon}</span>
            <span className="label">{isInList ? t('lists.in') + ' ' : ''}{t(`lists.${listType}`)}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="add-to-list">
      <div className="quick-actions">
        <ListButton 
          listType={LIST_TYPES.WATCHLIST} 
          icon="📋" 
          label={t('lists.watchlist')} 
        />
        <ListButton 
          listType={LIST_TYPES.WATCHED} 
          icon="✓" 
          label={t('lists.watched')} 
        />
        <ListButton 
          listType={LIST_TYPES.FAVORITES} 
          icon="❤️" 
          label={t('lists.favorites')} 
        />
      </div>

      <button 
        className="btn btn-manage"
        onClick={() => setShowModal(true)}
      >
        {t('lists.manageLists')}
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('lists.manageLists')}</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="list-options">
                {Object.values(LIST_TYPES).map(listType => (
                  <div key={listType} className="list-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={listStatus[listType]}
                        onChange={() => handleListAction(listType)}
                        disabled={loading || isProcessing}
                      />
                      <span>{t(`lists.${listType}`)}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToList;