import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ArweaveWalletKit } from 'arweave-wallet-kit';
import './App.css';

// Import components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './components/pages/Home';
import MovieDetails from './components/pages/MovieDetails';
import Watchlist from './components/pages/Watchlist';
import Profile from './components/pages/Profile';
import Search from './components/pages/Search';
import NotFound from './components/pages/NotFound';

function App() {
  return (
    <ArweaveWalletKit
      config={{
        permissions: [
          'ACCESS_ADDRESS',
          'ACCESS_PUBLIC_KEY',
          'SIGN_TRANSACTION',
          'DISPATCH'
        ],
        ensurePermissions: true,
        appInfo: {
          name: 'Arweave IMDB',
          logo: '/logo192.png'
        }
      }}
    >
      <Router>
        <div className="App">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ArweaveWalletKit>
  );
}

export default App;
