const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { queryUserProfile, storeUserProfile } = require('../services/arweaveService');

// Get user profile by wallet address
router.get('/:walletAddress', async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    
    // Query user profile from Arweave
    const userProfile = await queryUserProfile(req.app.locals.gqlClient, walletAddress);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    res.json(userProfile);
  } catch (error) {
    logger.error(`Error fetching user profile for ${req.params.walletAddress}: ${error.message}`);
    next(error);
  }
});

// Create or update user profile
router.post('/', async (req, res, next) => {
  try {
    const { walletAddress, username, bio, avatarUrl, preferences } = req.body;
    
    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    
    // Verify that the request is signed by the wallet owner
    // In a real app, you would verify the signature here
    // For simplicity, we're skipping this step in this implementation
    
    // Prepare user profile data
    const userProfileData = {
      username: username || 'Anonymous',
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      preferences: preferences || {
        favoriteGenres: [],
        contentLanguages: ['English'],
        emailNotifications: false,
        privacySettings: {
          showWatchlist: true,
          showRatings: true
        }
      },
      joinedTimestamp: Date.now()
    };
    
    // Prepare tags for Arweave transaction
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'ArweaveIMDB' },
      { name: 'Type', value: 'user-profile' },
      { name: 'Owner', value: walletAddress },
      { name: 'Username', value: userProfileData.username }
    ];
    
    // Store user profile on Arweave
    const txId = await storeUserProfile(req.app.locals.arweave, userProfileData, tags);
    
    res.status(201).json({ 
      message: 'User profile stored successfully',
      walletAddress,
      transactionId: txId
    });
  } catch (error) {
    logger.error(`Error storing user profile: ${error.message}`);
    next(error);
  }
});

// Verify wallet connection
router.post('/verify', async (req, res, next) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    // Validate required fields
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, and message are required' });
    }
    
    // In a real app, verify the signature here
    // For simplicity, we're returning success without verification
    
    res.json({ 
      verified: true,
      walletAddress
    });
  } catch (error) {
    logger.error(`Error verifying wallet: ${error.message}`);
    next(error);
  }
});

module.exports = router;
