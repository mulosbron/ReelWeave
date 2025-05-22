import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useMovies from '../../hooks/useMovies';
import useTvShows from '../../hooks/useTvShows';
import { getCurrentGateway } from '../../services/arweave/config';
import { useNavigate } from 'react-router-dom';

const CommunityReviewItem = ({ review, onContentClick }) => {
  const { t, i18n } = useTranslation();
  const [contentInfo, setContentInfo] = useState(null);
  const { movies } = useMovies();
  const { tvShows } = useTvShows();
  const navigate = useNavigate();
  
  // Yorum yapılan içeriğin bilgilerini bul
  useEffect(() => {
    if (!review || !review.itemId) return;
    
    const isMovie = review.itemType === 'movie';
    const content = isMovie 
      ? movies.find(movie => movie.hash === review.itemId)
      : tvShows.find(tv => tv.hash === review.itemId);
    
    if (content) {
      // ÖNEMLİ: itemId'nin kendisi posterUrl olarak kullanılabilir
      // Bazı durumlarda txId direkt olarak resim olarak kullanılıyor
      const posterTxId = content.posterUrl || content.poster || content.poster_path || review.itemId;
      
      setContentInfo({
        title: content.title,
        year: content.year || content.releaseDate || t('content.unknown'),
        posterTxId: posterTxId, // Transaction ID olarak sakla
        posterUrl: createPosterUrl(posterTxId), // Tam URL oluştur
        type: isMovie ? t('content.movie') : t('content.tvShow'),
        itemId: review.itemId // İçerik ID'sini sakla
      });
    } else {
      // İçerik bulunamasa bile, itemId'yi poster olarak kullanmayı dene
      setContentInfo({
        title: t('content.unknown'),
        year: '',
        posterTxId: review.itemId,
        posterUrl: createPosterUrl(review.itemId), // itemId'yi direkt URL olarak kullan
        type: isMovie ? t('content.movie') : t('content.tvShow'),
        itemId: review.itemId
      });
    }
  }, [review, movies, tvShows, t]);
  
  // Transaction ID'den poster URL'si oluştur
  const createPosterUrl = (txId) => {
    if (!txId) return null;
    
    // Seçilen gateway'i al
    const gateway = getCurrentGateway();
    
    // Eğer zaten tam URL ise olduğu gibi kullan
    if (txId.startsWith('http')) return txId;
    
    // URL'deki özel karakterleri temizle
    let cleanTxId = txId;
    
    // Arweave.net/ veya gateway/ ile başlıyorsa temizle
    if (cleanTxId.includes('arweave.net/')) {
      cleanTxId = cleanTxId.split('arweave.net/')[1];
    } else if (cleanTxId.includes('/raw/')) {
      cleanTxId = cleanTxId.split('/raw/')[1];
    }
    
    // Temizlenmiş transaction ID'yi kullanarak tam URL döndür
    cleanTxId = cleanTxId.trim();
    
    // Transaction ID kontrolü yap - alfanumerik, kısa çizgi, alt çizgi veya nokta içerebilir
    if (!/^[a-zA-Z0-9_\-.]+$/.test(cleanTxId)) {
      console.error('Geçersiz transaction ID:', txId);
      return null;
    }
    
    return `https://${gateway}/raw/${cleanTxId}`;
  };
  
  // Kullanıcı adresini formatla
  const formatAddress = (address) => {
    if (!address) return t('reviews.anonymous');
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Tarihi formatla
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (isNaN(date.getTime())) {
        return 'invalid date';
      }

      if (diffInDays === 0) {
        return t('reviews.today');
      } else if (diffInDays === 1) {
        return t('reviews.yesterday');
      } else if (diffInDays < 7) {
        return t('reviews.daysAgo', { count: diffInDays });
      } else if (diffInDays < 30) {
        return t('reviews.weeksAgo', { count: Math.floor(diffInDays / 7) });
      } else {
        // Aktif dile göre tarih formatını ayarla
        return date.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
      }
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return t('reviews.today');
    }
  };
  
  // Yıldız değerlendirmesini göster
  const renderStars = (rating) => {
    const numRating = Number(rating);
    return (
      <div className="review-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= numRating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  // İçerik kartına tıklandığında ilgili sayfaya yönlendir
  const handleContentClick = () => {
    if (!review || !review.itemId) return;
    
    // İçerik türüne göre yönlendirme yap
    const path = review.itemType === 'movie' ? 'movies' : 'tvshows';
    navigate(`/${path}/${review.itemId}`);
  };
  
  if (!contentInfo) {
    return <div className="community-review-item-loading">{t('reviews.loading')}</div>;
  }
  
  return (
    <div className="community-review-item">
      <div className="review-content-info" onClick={handleContentClick}>
        <div className="content-poster">
          {contentInfo.posterUrl ? (
            <img 
              src={contentInfo.posterUrl}
              alt={contentInfo.title}
              onError={(e) => {
                // Görsel yüklenemezse placeholder göster
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<div class="placeholder-poster"><span>${contentInfo.title.substring(0, 1)}</span></div>`;
              }}
            />
          ) : (
            <div className="placeholder-poster">
              <span>{contentInfo.title.substring(0, 1)}</span>
            </div>
          )}
        </div>
        <div className="content-details">
          <h4>{contentInfo.title}</h4>
          <div className="content-meta">
            <span className="content-year">{contentInfo.year}</span>
            <span className="content-type">{contentInfo.type}</span>
          </div>
        </div>
      </div>
      
      <div className="review-details">
        <div className="review-header">
          <div className="review-author">
            <div className="author-info">
              <span className="author-address">{formatAddress(review.author)}</span>
            </div>
            {renderStars(review.rating || 0)}
          </div>
          <div className="review-date">
            {review.updatedAt && review.updatedAt !== review.createdAt
              ? `${t('reviews.edited')}: ${formatDate(review.updatedAt)}`
              : formatDate(review.createdAt)}
          </div>
        </div>
        
        <div className="review-text">
          <p>{review.content}</p>
        </div>
        
        {review.txId && (
          <div className="transaction-info">
            <a 
              href={`https://viewblock.io/arweave/tx/${review.txId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="transaction-link"
            >
              <span className="tx-label">TX:</span> {review.txId.slice(0, 6)}...{review.txId.slice(-6)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityReviewItem; 