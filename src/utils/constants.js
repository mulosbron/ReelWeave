// Application Constants
export const APP_NAME = process.env.REACT_APP_NAME || 'ReelWeave';
export const APP_VERSION = process.env.REACT_APP_VERSION || '0.1.0';

// Arweave Configuration
export const ARWEAVE_CONFIG = {
  host: process.env.REACT_APP_ARWEAVE_HOST || 'arweave.net',
  port: process.env.REACT_APP_ARWEAVE_PORT || 443,
  protocol: process.env.REACT_APP_ARWEAVE_PROTOCOL || 'https',
  timeout: 20000,
  logging: false,
};

// API Endpoints
export const API_ENDPOINTS = {
  MOVIES: process.env.REACT_APP_MOVIES_DATA_URL,
  TV_SHOWS: process.env.REACT_APP_TVSHOWS_DATA_URL,
  GRAPHQL: process.env.REACT_APP_ARWEAVE_GRAPHQL || 'https://arweave.net/graphql',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'reelweave_wallet_address',
  USER_LISTS: 'reelweave_user_lists',
  FAVORITES: 'reelweave_favorites',
  WATCH_HISTORY: 'reelweave_watch_history',
};

// List Types
export const LIST_TYPES = {
  WATCHED: 'watched',
  WATCHLIST: 'watchlist',
  FAVORITES: 'favorites',
};

// Content Types
export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV_SHOW: 'tvshow',
};

// Transaction Tags
export const TX_TAGS = {
  APP_NAME: 'App-Name',
  APP_VERSION: 'App-Version',
  CONTENT_TYPE: 'Content-Type',
  ACTION: 'Action',
  USER_ADDRESS: 'User-Address',
  LIST_TYPE: 'List-Type',
  ITEM_ID: 'Item-Id',
  ITEM_TYPE: 'Item-Type',
};

// Actions
export const ACTIONS = {
  CREATE_LIST: 'Create-List',
  ADD_TO_LIST: 'Add-To-List',
  REMOVE_FROM_LIST: 'Remove-From-List',
  UPDATE_LIST: 'Update-List',
  ADD_COMMENT: 'Add-Comment',
  UPDATE_COMMENT: 'Update-Comment',
  ADD_RATING: 'Add-Rating',
};