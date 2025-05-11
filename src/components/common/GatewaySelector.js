import React, { useState, useEffect } from 'react';
import { getCurrentGateway, switchToGateway, refreshGatewayList } from '../../services/arweave/config';

const GatewaySelector = () => {
  const [currentGateway, setCurrentGateway] = useState(getCurrentGateway());
  const [gateways, setGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const gatewayList = await refreshGatewayList();
      setGateways(gatewayList);
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
      }
    } catch (error) {
      console.error('Error switching gateway:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gateway-selector">
      <button 
        className="gateway-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : currentGateway}
      </button>
      
      {isOpen && (
        <div className="gateway-dropdown">
          {gateways.map((gateway) => (
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
    </div>
  );
};

export default GatewaySelector; 