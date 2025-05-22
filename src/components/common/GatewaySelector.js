import React, { useState, useEffect, useRef } from 'react';
import { getCurrentGateway, switchToGateway, refreshGatewayList } from '../../services/arweave/config';

const GatewaySelector = () => {
  const [currentGateway, setCurrentGateway] = useState(getCurrentGateway());
  const [gateways, setGateways] = useState([]);
  const [filteredGateways, setFilteredGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadGateways();
    
    // Dropdown dışına tıklandığında menüyü kapatma
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Body scroll'u durdur (mobil için)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGateways(gateways);
    } else {
      const filtered = gateways.filter(gateway => 
        gateway.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGateways(filtered);
    }
  }, [searchTerm, gateways]);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const gatewayList = await refreshGatewayList();
      setGateways(gatewayList);
      setFilteredGateways(gatewayList);
    } catch (error) {
      console.error('Error loading gateway list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayChange = async (gateway) => {
    setIsLoading(true);
    try {
      const result = await switchToGateway(gateway);
      if (result.success) {
        setCurrentGateway(gateway);
        setIsOpen(false);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Error switching gateway:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Arka plana tıklandığında menüyü kapat
  const handleBackdropClick = () => {
    setIsOpen(false);
  };

  // Öne çıkan gatewayler - değiştirilenler
  const getPopularGateways = () => {
    const preferredGateways = [
      'permagate.io', 
      'mulosbron.xyz',
      'ario.oceanprotocol.com',
      'arweave.developerdao.com',
      'ario.apus.network',
      'ar.io',
      'permadao.io',
      'arnode.xyz'
    ];
    
    // Tercih edilen gateway'leri buluyoruz
    const result = [];
    
    preferredGateways.forEach(preferred => {
      const matches = filteredGateways.filter(gateway => 
        gateway.includes(preferred)
      );
      
      // Eşleşen ilk 2 gateway'i ekliyoruz
      if (matches.length > 0) {
        result.push(...matches.slice(0, 1));
      }
    });
    
    // En fazla 6 gateway gösteriyoruz
    return result.slice(0, 6);
  };

  return (
    <div className="gateway-selector" ref={dropdownRef}>
      <button 
        className="gateway-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        {isLoading ? 'Yükleniyor...' : currentGateway}
      </button>
      
      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={handleBackdropClick}></div>
          <div className="gateway-dropdown">
            <div className="gateway-search">
              <input
                type="text"
                placeholder="Gateway ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            
            {searchTerm === '' && (
              <div className="gateway-category">
                <div className="gateway-category-title">Popüler Gatewayler</div>
                {getPopularGateways().map((gateway) => (
                  <button
                    key={gateway}
                    className={`gateway-option ${gateway === currentGateway ? 'active' : ''}`}
                    onClick={() => handleGatewayChange(gateway)}
                    disabled={isLoading}
                  >
                    {gateway}
                  </button>
                ))}
              </div>
            )}
            
            <div className="gateway-category">
              <div className="gateway-category-title">{searchTerm ? 'Arama Sonuçları' : 'Tüm Gatewayler'}</div>
              <div className="gateway-list">
                {filteredGateways.length > 0 ? (
                  filteredGateways.map((gateway) => (
                    <button
                      key={gateway}
                      className={`gateway-option ${gateway === currentGateway ? 'active' : ''}`}
                      onClick={() => handleGatewayChange(gateway)}
                      disabled={isLoading}
                    >
                      {gateway}
                    </button>
                  ))
                ) : (
                  <div className="gateway-empty">Sonuç bulunamadı</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GatewaySelector; 