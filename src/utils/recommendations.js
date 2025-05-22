// Yeni öneri algoritması: Kullanıcı geçmişi, topluluk popülerliği ve kullanıcıya özel istatistikler
// Not: Topluluk popülerliği ve puanlar async olarak dışarıdan alınmalı (örn. listsService.getCommunityFavorites, commentsService.getAverageRating)

/**
 * @param {Array} allItems - Tüm içerikler (film/dizi)
 * @param {Array} userWatched - Kullanıcının izledikleri (itemId/hash)
 * @param {Array} userFavorites - Kullanıcının favorileri (itemId/hash)
 * @param {Array} userRatings - Kullanıcının puanladıkları [{itemId/hash, rating}]
 * @param {Object} communityStats - { [hash]: { favoriteCount, avgRating } }
 * @param {Object} [options]
 * @returns {Array} - Skora göre sıralı öneriler
 */
export function getRecommendations(
  allItems,
  userWatched = [],
  userFavorites = [],
  userRatings = [],
  communityStats = {},
  options = {}
) {
  if (!allItems || allItems.length === 0) return [];

  // Kullanıcının izlediği, favoriye eklediği ve puanladığı içeriklerin hash'lerini topla
  const watchedSet = new Set(userWatched.map(i => i.hash || i.itemId));
  const favoriteSet = new Set(userFavorites.map(i => i.hash || i.itemId));
  const ratedSet = new Set(userRatings.map(i => i.hash || i.itemId));
  const excluded = new Set([...watchedSet, ...favoriteSet, ...ratedSet]);

  // Kullanıcıya özel istatistikler
  const userAll = [...userWatched, ...userFavorites, ...userRatings];
  const userRatingsOnly = userRatings.filter(r => typeof r.rating === 'number');
  const userAvgRating = userRatingsOnly.length > 0 ?
    userRatingsOnly.reduce((sum, r) => sum + r.rating, 0) / userRatingsOnly.length : null;
  const userFavAgeRatings = userAll.map(i => i.ageRating).filter(Boolean);
  const userFavYears = userAll.map(i => parseInt(i.year)).filter(y => !isNaN(y));
  const userFavAgeRating = userFavAgeRatings.length > 0 ? mostCommon(userFavAgeRatings) : null;
  const userFavYear = userFavYears.length > 0 ? Math.round(userFavYears.reduce((a, b) => a + b, 0) / userFavYears.length) : null;

  // Skor ağırlıkları
  const WEIGHTS = {
    YEAR: 0.25,
    AGE_RATING: 0.15,
    USER_RATING: 0.25,
    COMMUNITY_POP: 0.2,
    COMMUNITY_RATING: 0.15
  };

  // Her içerik için skor hesapla
  const recommendations = allItems
    .filter(item => !excluded.has(item.hash))
    .map(item => {
      let score = 0;
      // Yıl yakınlığı
      if (userFavYear && item.year) {
        const yearNum = parseInt(item.year);
        if (!isNaN(yearNum)) {
          const yearDiff = Math.abs(yearNum - userFavYear);
          score += Math.max(0, 1 - (yearDiff / 20)) * WEIGHTS.YEAR;
        }
      }
      // Age rating uyumu
      if (userFavAgeRating && item.ageRating && item.ageRating === userFavAgeRating) {
        score += WEIGHTS.AGE_RATING;
      }
      // Kullanıcı ortalama puanına yakınlık
      if (userAvgRating && item.rating) {
        const ratingDiff = Math.abs(parseFloat(item.rating) - userAvgRating);
        score += Math.max(0, 1 - (ratingDiff / 4)) * WEIGHTS.USER_RATING;
      }
      // Topluluk popülerliği (favorilere eklenme sayısı)
      if (communityStats[item.hash] && communityStats[item.hash].favoriteCount) {
        // 10+ favori = tam puan, daha azsa orantılı
        const popScore = Math.min(communityStats[item.hash].favoriteCount / 10, 1);
        score += popScore * WEIGHTS.COMMUNITY_POP;
      }
      // Topluluk ortalama puanı
      if (communityStats[item.hash] && communityStats[item.hash].avgRating) {
        const commRating = communityStats[item.hash].avgRating;
        score += Math.max(0, (commRating - 6) / 4) * WEIGHTS.COMMUNITY_RATING; // 6-10 arası normalize
      }
      return { ...item, score };
    })
    .filter(item => item.score > 0.1)
    .sort((a, b) => b.score - a.score);

  // Sonuçları döndür (opsiyonel limit)
  return typeof options.limit === 'number' ? recommendations.slice(0, options.limit) : recommendations;
}

// Yardımcı: En sık geçen değeri bul
function mostCommon(arr) {
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Score weights for different factors
const WEIGHTS = {
    RATING: 0.3,
    GENRE: 0.25,
    YEAR: 0.2,
    USER_RATING: 0.15,
    AGE_RATING: 0.1
  };
  
  // Calculate similarity between two items based on various factors
  export const calculateSimilarity = (item1, item2) => {
    let score = 0;
  
    // Rating similarity (higher rated items get bonus)
    const ratingDiff = Math.abs(parseFloat(item1.rating) - parseFloat(item2.rating));
    const ratingScore = Math.max(0, 1 - (ratingDiff / 10)) * WEIGHTS.RATING;
    score += ratingScore;
  
    // Year similarity (closer years get higher scores)
    const year1 = parseInt(item1.year);
    const year2 = parseInt(item2.year);
    if (!isNaN(year1) && !isNaN(year2)) {
      const yearDiff = Math.abs(year1 - year2);
      const yearScore = Math.max(0, 1 - (yearDiff / 50)) * WEIGHTS.YEAR;
      score += yearScore;
    }
  
    // Age rating similarity
    if (item1.ageRating === item2.ageRating) {
      score += WEIGHTS.AGE_RATING;
    }
  
    // Genre similarity (would need genre data, using rating as proxy)
    if (Math.abs(parseFloat(item1.rating) - parseFloat(item2.rating)) < 1) {
      score += WEIGHTS.GENRE;
    }
  
    return score;
  };
  
  // Generate recommendations based on user's watching history
  export const generateRecommendations = (
    allItems,
    userItems,
    contentType,
    limit = 100
  ) => {
    if (!userItems.length || !allItems.length) {
      return [];
    }
  
    // Extract user's watched item IDs
    const watchedIds = new Set(userItems.map(item => item.itemId));
  
    // Calculate average rating of user's watched items
    const userAverageRating = userItems.reduce((sum, item) => 
      sum + parseFloat(item.itemDetails.rating), 0) / userItems.length;
  
    // Calculate recommendation scores for all items
    const recommendations = allItems
      .filter(item => !watchedIds.has(item.hash)) // Exclude already watched
      .map(item => {
        let totalScore = 0;
        let matchCount = 0;
  
        // Compare with each watched item
        userItems.forEach(userItem => {
          const similarity = calculateSimilarity(item, userItem.itemDetails);
          totalScore += similarity;
          matchCount++;
        });
  
        // Average similarity score
        const averageScore = matchCount > 0 ? totalScore / matchCount : 0;
  
        // Boost score for items with rating above user's average
        let finalScore = averageScore;
        if (parseFloat(item.rating) > userAverageRating) {
          finalScore *= 1.1;
        }
  
        return {
          ...item,
          score: finalScore,
          type: contentType
        };
      })
      .filter(item => item.score > 0.15) // Daha fazla öneri için eşik değerini daha da düşürdük (0.2 -> 0.15)
      .sort((a, b) => b.score - a.score) // Sort by score
      .slice(0, limit); // Limit results
  
    return recommendations;
  };
  
  // Get genre-based recommendations (simplified without actual genre data)
  export const getGenreBasedRecommendations = (allItems, userItems, limit = 30) => {
    // Group user items by rating brackets
    const ratingBrackets = {
      high: userItems.filter(item => parseFloat(item.itemDetails.rating) >= 8.5),
      medium: userItems.filter(item => 
        parseFloat(item.itemDetails.rating) >= 7.5 && 
        parseFloat(item.itemDetails.rating) < 8.5
      ),
      low: userItems.filter(item => parseFloat(item.itemDetails.rating) < 7.5)
    };
  
    // Find similar items based on rating brackets
    const recommendations = [];
    const watchedIds = new Set(userItems.map(item => item.itemId));
  
    // Get items from same rating brackets
    Object.entries(ratingBrackets).forEach(([bracket, items]) => {
      if (items.length > 0) {
        const averageRating = items.reduce((sum, item) => 
          sum + parseFloat(item.itemDetails.rating), 0) / items.length;
  
        const bracketRecommendations = allItems
          .filter(item => 
            !watchedIds.has(item.hash) &&
            Math.abs(parseFloat(item.rating) - averageRating) < 1.0 // Daha fazla öneri için eşik değerini artırdık (0.7 -> 1.0)
          )
          .slice(0, Math.ceil(limit / 3));
  
        recommendations.push(...bracketRecommendations);
      }
    });
  
    return recommendations.slice(0, limit);
  };
  
  // Get trending recommendations (highest rated unwatched items)
  export const getTrendingRecommendations = (allItems, userItems, limit = 15) => {
    const watchedIds = new Set(userItems.map(item => item.itemId));
    
    return allItems
      .filter(item => !watchedIds.has(item.hash))
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, limit);
  };
  
  // Combine different recommendation strategies
  export const getHybridRecommendations = (
    allItems,
    userItems,
    contentType,
    limit = 50
  ) => {
    // Get recommendations from different strategies
    const similarityBased = generateRecommendations(allItems, userItems, contentType, limit);
    const genreBased = getGenreBasedRecommendations(allItems, userItems, limit);
    const trending = getTrendingRecommendations(allItems, userItems, limit);
  
    // Combine and deduplicate
    const combined = new Map();
    
    // Add similarity-based with higher weight
    similarityBased.forEach(item => {
      combined.set(item.hash, { ...item, score: item.score * 1.2 });
    });
    
    // Add genre-based
    genreBased.forEach(item => {
      if (!combined.has(item.hash)) {
        combined.set(item.hash, { ...item, score: 0.7, type: contentType });
      }
    });
    
    // Add trending
    trending.forEach(item => {
      if (!combined.has(item.hash)) {
        combined.set(item.hash, { ...item, score: 0.5, type: contentType });
      }
    });
  
    // Convert to array and sort by score
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  };