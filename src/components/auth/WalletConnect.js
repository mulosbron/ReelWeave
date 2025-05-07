import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';

const WalletConnect = () => {
  const { 
    isConnected, 
    walletAddress, 
    isLoading, 
    error, 
    connect, 
    disconnect, 
    checkInstalled 
  } = useAuth();
  
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    if (!checkInstalled()) {
      setShowModal(true);
      return;
    }
    
    await connect();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="wallet-connect">
        <button className="btn btn-loading" disabled>
          Connecting...
        </button>
      </div>
    );
  }

  if (isConnected && walletAddress) {
    return (
      <div className="wallet-connect connected">
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(walletAddress)}</span>
          <button 
            onClick={disconnect} 
            className="btn btn-disconnect"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button 
        onClick={handleConnect} 
        className="btn btn-connect"
      >
        Connect Wallet
      </button>
      
      {error && (
        <div className="wallet-error">
          <p>{error}</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ArConnect Not Detected</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>ArConnect wallet extension is not installed in your browser.</p>
              <p>Please install ArConnect to connect your Arweave wallet.</p>
              <div className="modal-actions">
                <a 
                  href="https://www.arconnect.io/download" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Install ArConnect
                </a>
                <button 
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;