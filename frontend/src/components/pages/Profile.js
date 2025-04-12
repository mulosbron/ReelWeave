import React, { useState, useEffect } from 'react';
import { useArweaveWallet } from 'arweave-wallet-kit';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { getUserReviews } from '../../services/reviewService';
import ReviewList from '../reviews/ReviewList';
import LoadingSpinner from '../ui/LoadingSpinner';
import './Profile.css';

const Profile = () => {
  const { connected, address } = useArweaveWallet();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    favoriteGenres: []
  });

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      if (!connected || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user profile
        const profileData = await getUserProfile(address);
        setProfile(profileData);
        
        // Initialize form data with profile data
        if (profileData) {
          setFormData({
            username: profileData.username || '',
            bio: profileData.bio || '',
            favoriteGenres: profileData.preferences?.favoriteGenres || []
          });
        }
        
        // Fetch user reviews
        const reviewsData = await getUserReviews(address);
        setReviews(reviewsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    fetchProfileAndReviews();
  }, [connected, address]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleGenreToggle = (genre) => {
    const updatedGenres = [...formData.favoriteGenres];
    
    if (updatedGenres.includes(genre)) {
      // Remove genre if already selected
      const index = updatedGenres.indexOf(genre);
      updatedGenres.splice(index, 1);
    } else {
      // Add genre if not selected
      updatedGenres.push(genre);
    }
    
    setFormData({
      ...formData,
      favoriteGenres: updatedGenres
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const updatedProfile = await updateUserProfile(address, {
        username: formData.username,
        bio: formData.bio,
        preferences: {
          ...profile?.preferences,
          favoriteGenres: formData.favoriteGenres
        }
      });
      
      setProfile(updatedProfile);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again later.');
    }
  };

  if (!connected) {
    return (
      <div className="profile-container">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your ArConnect wallet to view and manage your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Available genres for selection
  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
  ];

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      
      <div className="profile-content">
        <div className="profile-section">
          <div className="profile-header">
            <h2>Profile Information</h2>
            {!editing && (
              <button 
                className="btn btn-secondary"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          
          {editing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Favorite Genres</label>
                <div className="genre-selection">
                  {availableGenres.map(genre => (
                    <div 
                      key={genre} 
                      className={`genre-tag ${formData.favoriteGenres.includes(genre) ? 'selected' : ''}`}
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-field">
                <h3>Username</h3>
                <p>{profile?.username || 'Anonymous'}</p>
              </div>
              
              <div className="profile-field">
                <h3>Wallet Address</h3>
                <p className="wallet-address">{address}</p>
              </div>
              
              <div className="profile-field">
                <h3>Bio</h3>
                <p>{profile?.bio || 'No bio provided'}</p>
              </div>
              
              <div className="profile-field">
                <h3>Favorite Genres</h3>
                <div className="genre-tags">
                  {profile?.preferences?.favoriteGenres?.length > 0 ? (
                    profile.preferences.favoriteGenres.map((genre, index) => (
                      <span key={index} className="genre-tag">{genre}</span>
                    ))
                  ) : (
                    <p>No favorite genres selected</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="profile-section">
          <h2>My Reviews</h2>
          {reviews.length > 0 ? (
            <ReviewList reviews={reviews} />
          ) : (
            <div className="empty-reviews">
              <p>You haven't written any reviews yet.</p>
              <p>Start rating and reviewing movies to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
