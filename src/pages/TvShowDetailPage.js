import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TvShowDetails from '../components/tvshows/TvShowDetails';
import Loading from '../components/common/Loading';
import { tvShowsService } from '../services/api/tvshows';

const TvShowDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tvShow, setTvShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTvShowDetails = async () => {
      try {
        setLoading(true);
        const tvShowData = await tvShowsService.getTvShowById(id);
        setTvShow(tvShowData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTvShowDetails();
    }
  }, [id]);

  if (loading) {
    return <Loading message="Loading TV show details..." fullScreen />;
  }

  if (error || !tvShow) {
    return (
      <div className="error-page">
        <h2>TV Show Not Found</h2>
        <p>{error || 'The requested TV show could not be found.'}</p>
        <button 
          onClick={() => navigate('/tvshows')} 
          className="btn btn-primary"
        >
          Back to TV Shows
        </button>
      </div>
    );
  }

  return (
    <div className="tvshow-detail-page">
      <TvShowDetails tvshow={tvShow} />
    </div>
  );
};

export default TvShowDetailPage;