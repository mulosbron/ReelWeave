import React, { useState, useEffect } from 'react';
import useComments from '../../hooks/useComments';
import useAuth from '../../hooks/useAuth';

const DirectCommentForm = ({ itemId, itemType, onCommentAdded }) => {
  // Custom hook'ları kullan
  const { 
    userComment, 
    isEditing, 
    setIsEditing, 
    addOrUpdateComment, 
    refreshComments
  } = useComments(itemId, itemType);
  
  const { isConnected, walletAddress } = useAuth();
  
  // Form durumları
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  
  // Debug logları
  console.log("DirectCommentForm DEBUG:", { 
    isConnected, 
    walletAddress,
    userComment: userComment ? `Mevcut (${userComment.content?.substring(0, 20)}...)` : 'Yok', 
    isEditing 
  });
  
  // Kullanıcının mevcut yorumu varsa, forma doldur
  useEffect(() => {
    if (userComment) {
      setComment(userComment.content || '');
      setRating(userComment.rating || 0);
    } else {
      setComment('');
      setRating(0);
    }
  }, [userComment]);
  
  // Yorum gönderildiğinde çağrılır
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isConnected) {
      setError('Lütfen cüzdanınızı bağlayın');
      return;
    }
    
    if (!comment.trim()) {
      setError('Lütfen bir yorum yazın');
      return;
    }
    
    if (rating === 0) {
      setError('Lütfen bir puan verin (1-5 yıldız)');
      return;
    }
    
    setLoadingSubmit(true);
    
    try {
      // API'yi çağır
      const result = await addOrUpdateComment(comment, rating);
      
      if (result.success) {
        // Düzenleme modunu kapat
        setIsEditing(false);
        
        // Yorumu yenileme işlemini başlat
        setTimeout(() => refreshComments(), 3000);
        
        // Yorum eklendiğini ana bileşene bildir
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        throw new Error(result.error || 'Yorum gönderilemedi');
      }
    } catch (error) {
      setError(`Yorum gönderilirken hata oluştu: ${error.message}`);
      console.error('Yorum gönderme hatası:', error);
    } finally {
      setLoadingSubmit(false);
    }
  };
  
  // Düzenleme modunu aç/kapat
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Tarih formatı
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' 
    });
  };

  // Kullanıcı bağlı değilse veya yorumu yoksa normal formu göster
  if (!isConnected) {
    return (
      <div className="comment-form-container">
        <h3>Yorum Yapın</h3>
        <div className="not-connected-message">
          Yorum yapmak için cüzdanınızı bağlamanız gerekiyor.
        </div>
      </div>
    );
  }
  
  // Kullanıcının yorumu yoksa normal formu göster
  if (!userComment) {
    return (
      <div className="comment-form-container">
        <h3>Yorum Yapın</h3>
        
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}
        
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Değerlendirmeniz:</label>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => {
                const ratingValue = i + 1;
                return (
                  <button
                    type="button"
                    key={i}
                    className={`star-button ${ratingValue <= (hoveredRating || rating) ? "active" : ""}`}
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHoveredRating(ratingValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="form-group">
            <label>Yorumunuz:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bu içerik hakkında düşüncelerinizi paylaşın..."
              rows={5}
              disabled={loadingSubmit}
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-submit-review"
              disabled={!comment.trim() || rating === 0 || loadingSubmit}
            >
              {loadingSubmit ? "Gönderiliyor..." : "Yorum Gönder"}
            </button>
          </div>
        </form>
      </div>
    );
  }
  
  // Kullanıcının yorumu varsa ve düzenleme modunda değilse, sadece yorum bilgilerini göster
  return (
    <div className="comment-form-container">
      <h3>Yorumunuz</h3>
      
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      {!isEditing ? (
        <div className="user-comment-preview">
          <div className="review-info">
            <div className="review-date">
              {formatDate(userComment.updatedAt || userComment.createdAt)}
              {userComment.isEdit && " (düzenlendi)"}
            </div>
          </div>
          
          <div className="rating-stars read-only">
            {[...Array(5)].map((_, i) => {
              const ratingValue = i + 1;
              return (
                <span
                  key={i}
                  className={`star-button ${ratingValue <= userComment.rating ? "active" : ""}`}
                >
                  ★
                </span>
              );
            })}
          </div>
          
          <div className="review-content">
            <p>{userComment.content}</p>
          </div>
          
          <button 
            type="button"
            className="edit-comment-btn"
            onClick={toggleEditMode}
          >
            Yorumu Düzenle
          </button>
        </div>
      ) : (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Değerlendirmeniz:</label>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => {
                const ratingValue = i + 1;
                return (
                  <button
                    type="button"
                    key={i}
                    className={`star-button ${ratingValue <= (hoveredRating || rating) ? "active" : ""}`}
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHoveredRating(ratingValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="form-group">
            <label>Yorumunuz:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bu içerik hakkında düşüncelerinizi paylaşın..."
              rows={5}
              disabled={loadingSubmit}
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={toggleEditMode}
              disabled={loadingSubmit}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn-submit-review"
              disabled={!comment.trim() || rating === 0 || loadingSubmit}
            >
              {loadingSubmit ? "Gönderiliyor..." : "Yorumu Güncelle"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DirectCommentForm;