import React, { createContext, useState, useEffect, useCallback } from 'react';
import { arweaveClient } from '../services/arweave/client';

// Create context with default value
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkInstalled = () => {
        return typeof window !== 'undefined' && !!window.arweaveWallet;
    };

    const connect = useCallback(async () => {
        if (!checkInstalled()) {
            setError('ArConnect not installed.');
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            const address = await arweaveClient.connectWallet();
            setWalletAddress(address);
            setIsConnected(true);
            localStorage.setItem('arweaveWalletConnected', 'true');
        } catch (err) {
            console.error("Connection failed:", err);
            setError(err.message || 'Failed to connect wallet.');
            setIsConnected(false);
            setWalletAddress(null);
            localStorage.removeItem('arweaveWalletConnected');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        setError(null);
        try {
            await arweaveClient.disconnectWallet();
        } catch (err) {
            console.error("Disconnection failed:", err);
        } finally {
            setIsConnected(false);
            setWalletAddress(null);
            localStorage.removeItem('arweaveWalletConnected');
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkConnection = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setError(null);
            const wasConnected = localStorage.getItem('arweaveWalletConnected') === 'true';

            if (checkInstalled() && wasConnected) {
                try {
                    const address = await arweaveClient.getWalletAddress();
                    if (address && isMounted) {
                        setWalletAddress(address);
                        setIsConnected(true);
                    } else if (isMounted) {
                        setIsConnected(false);
                        setWalletAddress(null);
                        localStorage.removeItem('arweaveWalletConnected');
                    }
                } catch (err) {
                    if (isMounted) {
                        console.warn("Error checking initial connection:", err);
                        setIsConnected(false);
                        setWalletAddress(null);
                        localStorage.removeItem('arweaveWalletConnected');
                    }
                }
            } else if (isMounted) {
                setIsConnected(false);
                setWalletAddress(null);
            }
            if (isMounted) {
                setIsLoading(false);
            }
        };

        checkConnection();

        const handleWalletChange = () => {
            console.log("ArConnect wallet or permissions changed.");
            checkConnection();
        };

        const handleArweaveWalletLoaded = () => {
            console.log("ArConnect loaded.");
            checkConnection();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('walletSwitch', handleWalletChange);
            window.addEventListener('arweaveWalletLoaded', handleArweaveWalletLoaded);
        }

        return () => {
            isMounted = false;
            if (typeof window !== 'undefined') {
                window.removeEventListener('walletSwitch', handleWalletChange);
                window.removeEventListener('arweaveWalletLoaded', handleArweaveWalletLoaded);
            }
        };
    }, []);

    const value = {
        isConnected,
        walletAddress,
        isLoading,
        error,
        connect,
        disconnect,
        checkInstalled
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;