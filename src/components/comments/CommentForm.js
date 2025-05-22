import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { WalletContext } from '../../contexts/WalletContext';
import { UserContext } from '../../contexts/UserContext';
import { NotificationContext } from '../../contexts/NotificationContext';
import { arweave, switchToNextGateway, getCurrentGateway } from '../../services/arweave/config';
import { sendTransaction, retryOnFailure } from '../../services/arweave/client';
import { APP_NAME, APP_VERSION, TX_TAGS, ACTIONS } from '../../utils/constants';
import Loading from '../common/Loading';

const CommentForm = ({ videoId, parentId = null, onCommentSubmitted, onCancel }) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { wallet, isConnected } = useContext(WalletContext);
  const { user } = useContext(UserContext);
  const { showNotification } = useContext(NotificationContext);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      showNotification('error', t('comments.error.empty'));
      return;
    }
    
    if (!isConnected || !wallet) {
      showNotification('error', t('comments.error.notConnected'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Yorum verilerini hazırla
      const commentData = {
        video: videoId,
        parent: parentId,
        comment: comment.trim(),
        timestamp: Date.now(),
        version: APP_VERSION
      };
      
      // Yorumu Arweave'e gönder
      await submitComment(commentData);
      
      // Formu temizle ve başarılı bildirimi göster
      setComment('');
      showNotification('success', t('comments.successMessage'));
      
      // Callback fonksiyonunu çağır
      if (typeof onCommentSubmitted === 'function') {
        onCommentSubmitted();
      }
    } catch (error) {
      console.error('Yorum gönderilirken hata oluştu:', error);
      showNotification('error', `${t('comments.error.submitError')}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Yorumu Arweave'e gönder
  const submitComment = async (commentData) => {
    return retryOnFailure(async () => {
      try {
        // İşlemi oluştur
        const tx = await arweave.createTransaction({ data: JSON.stringify(commentData) });
        
        // Etiketleri ekle
        tx.addTag(TX_TAGS.APP_NAME, APP_NAME);
        tx.addTag(TX_TAGS.APP_VERSION, APP_VERSION);
        tx.addTag(TX_TAGS.CONTENT_TYPE, 'application/json');
        tx.addTag(TX_TAGS.ACTION, ACTIONS.COMMENT);
        tx.addTag('Video-Id', videoId);
        
        if (parentId) {
          tx.addTag('Parent-Id', parentId);
        }
        
        // UserID etiketini ekle
        if (user && user.address) {
          tx.addTag('User-Id', user.address);
        }
        
        // Aktif gateway'i etiketlere ekle
        tx.addTag('Gateway', getCurrentGateway());
        
        // İşlemi imzala ve gönder
        await arweave.transactions.sign(tx, wallet);
        const result = await arweave.transactions.post(tx);
        
        if (result.status !== 200 && result.status !== 202) {
          console.error('İşlem gönderme hatası:', result);
          
          // Gateway değiştir
          await handleGatewaySwitch();
          
          throw new Error(t('comments.error.transactionError', { status: result.statusText }));
        }
        
        console.log('Yorum işlemi gönderildi:', tx.id);
        return tx.id;
      } catch (error) {
        // Hata durumunda gateway değiştirmeyi dene
        if (error.message.includes('timeout') || 
            error.message.includes('network') ||
            error.message.includes('connection')) {
          
          await handleGatewaySwitch();
        }
        
        throw error;
      }
    }, 2); // Maximum 2 kez dene
  };
  
  // Gateway değiştirme işleyicisi
  const handleGatewaySwitch = async () => {
    try {
      const currentGateway = getCurrentGateway();
      const switchResult = await switchToNextGateway();
      
      if (switchResult.success) {
        showNotification('info', t('gateway.switchSuccess', { from: currentGateway, to: switchResult.gateway }));
        return true;
      } else {
        showNotification('error', t('gateway.switchError'));
        return false;
      }
    } catch (error) {
      console.error('Gateway değiştirme hatası:', error);
      return false;
    }
  };

  return (
    <div className="comment-form">
      <form onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          placeholder={parentId ? t('comments.replyPlaceholder') : t('comments.commentPlaceholder')}
          disabled={isSubmitting || !isConnected}
          rows={parentId ? 2 : 3}
        />
        <div className="comment-form-actions">
          {parentId && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="cancel-button"
              disabled={isSubmitting}
            >
              {t('reviews.cancel')}
            </button>
          )}
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting || !isConnected || !comment.trim()}
          >
            {isSubmitting ? <Loading size="small" /> : (parentId ? t('comments.reply') : t('comments.comment'))}
          </button>
        </div>
      </form>
      {!isConnected && (
        <p className="comment-form-notice">
          {t('reviews.loginToReview')}
        </p>
      )}
    </div>
  );
};

export default CommentForm; 