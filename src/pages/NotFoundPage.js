import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <p>It might have been moved or deleted.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Go to Homepage
          </Link>
          <Link to="/movies" className="btn btn-secondary">
            Browse Movies
          </Link>
          <Link to="/tvshows" className="btn btn-secondary">
            Browse TV Shows
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;