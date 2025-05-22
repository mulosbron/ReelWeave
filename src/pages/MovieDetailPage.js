import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MovieDetails from '../components/movies/MovieDetails';
import Loading from '../components/common/Loading';
import { moviesService } from '../services/api/movies';

const MovieDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const movieData = await moviesService.getMovieById(id);
        setMovie(movieData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  if (loading) {
    return <Loading message={t('movieDetail.loading')} fullScreen />;
  }

  if (error || !movie) {
    return (
      <div className="error-page">
        <h2>{t('movieDetail.notFound')}</h2>
        <p>{error || t('movieDetail.notFoundMessage')}</p>
        <button 
          onClick={() => navigate('/movies')} 
          className="btn btn-primary"
        >
          {t('movieDetail.backToMovies')}
        </button>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <MovieDetails movie={movie} />
    </div>
  );
};

export default MovieDetailPage;