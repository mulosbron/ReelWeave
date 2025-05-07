// Debounce function to limit API calls
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Format wallet address
  export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  // Format date
  export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format timestamp
  export const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Filter movies/shows based on search term
  export const filterBySearchTerm = (items, searchTerm) => {
    if (!searchTerm) return items;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(lowerSearchTerm)
    );
  };
  
  // Filter movies by criteria
  export const filterMovies = (movies, filters) => {
    let filteredMovies = [...movies];
  
    if (filters.year) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.year === filters.year
      );
    }
  
    if (filters.minRating) {
      filteredMovies = filteredMovies.filter(movie => 
        parseFloat(movie.rating) >= parseFloat(filters.minRating)
      );
    }
  
    if (filters.ageRating) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.ageRating === filters.ageRating
      );
    }
  
    return filteredMovies;
  };
  
  // Filter TV shows by criteria
  export const filterTvShows = (tvShows, filters) => {
    let filteredShows = [...tvShows];
  
    if (filters.year) {
      filteredShows = filteredShows.filter(show => 
        show.year.includes(filters.year)
      );
    }
  
    if (filters.minRating) {
      filteredShows = filteredShows.filter(show => 
        parseFloat(show.rating) >= parseFloat(filters.minRating)
      );
    }
  
    if (filters.ageRating) {
      filteredShows = filteredShows.filter(show => 
        show.ageRating === filters.ageRating
      );
    }
  
    return filteredShows;
  };
  
  // Sort movies/shows
  export const sortItems = (items, sortBy) => {
    const sortedItems = [...items];
    
    switch (sortBy) {
      case 'rating_desc':
        return sortedItems.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      case 'rating_asc':
        return sortedItems.sort((a, b) => parseFloat(a.rating) - parseFloat(b.rating));
      case 'year_desc':
        return sortedItems.sort((a, b) => parseInt(b.year) - parseInt(a.year));
      case 'year_asc':
        return sortedItems.sort((a, b) => parseInt(a.year) - parseInt(b.year));
      case 'title_asc':
        return sortedItems.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sortedItems.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sortedItems;
    }
  };
  
  // Parse TV show year range
  export const parseTvShowYear = (yearString) => {
    if (!yearString) return null;
    
    // Handle formats like "2008-2013" or "2020-"
    const years = yearString.split('–').map(y => y.trim());
    return {
      startYear: parseInt(years[0]),
      endYear: years[1] ? parseInt(years[1]) : null
    };
  };
  
  // Check if TV show was airing in a specific year
  export const isTvShowInYear = (yearString, targetYear) => {
    const parsed = parseTvShowYear(yearString);
    if (!parsed) return false;
    
    const target = parseInt(targetYear);
    if (parsed.endYear === null) {
      // Still running
      return parsed.startYear <= target;
    }
    
    return parsed.startYear <= target && target <= parsed.endYear;
  };
  
  // Generate a unique color based on string (for avatars)
  export const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  // Calculate average rating from comments
  export const calculateAverageRating = (comments) => {
    const ratedComments = comments.filter(comment => comment.rating);
    if (ratedComments.length === 0) return null;
    
    const sum = ratedComments.reduce((acc, comment) => acc + comment.rating, 0);
    return (sum / ratedComments.length).toFixed(1);
  };
  
  // Truncate text
  export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };
  
  // Validate Arweave address
  export const isValidArweaveAddress = (address) => {
    return /^[a-z0-9_-]{43}$/i.test(address);
  };
  
  // Get image URL with fallback
  export const getImageUrl = (imagePath, type = 'movie') => {
    if (!imagePath) return `/placeholder-${type}.png`;
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's an Arweave path
    if (imagePath.startsWith('arweave.net/')) {
      return `https://${imagePath}`;
    }
    
    // Default fallback
    return `/placeholder-${type}.png`;
  };