class ArConnectService {
  // Check if ArConnect is installed
  isInstalled() {
    return window.arweaveWallet !== undefined;
  }

  // Connect wallet with required permissions
  async connect() {
    try {
      if (!this.isInstalled()) {
        throw new Error('ArConnect is not installed. Please install the ArConnect extension.');
      }

      // ArConnect'in doğru izinlerini belirtelim
      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'DISPATCH'
      ]);
      
      const address = await window.arweaveWallet.getActiveAddress();
      return { success: true, address };
    } catch (error) {
      console.error('ArConnect connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Disconnect wallet
  async disconnect() {
    try {
      await window.arweaveWallet.disconnect();
      return { success: true };
    } catch (error) {
      console.error('ArConnect disconnection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get wallet address
  async getAddress() {
    try {
      const address = await window.arweaveWallet.getActiveAddress();
      return address;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  // Check if wallet is connected
  async isConnected() {
    try {
      const address = await window.arweaveWallet.getActiveAddress();
      return !!address;
    } catch {
      return false;
    }
  }

  // Get wallet instance
  async getWallet() {
    return window.arweaveWallet;
  }
}

export const arConnectService = new ArConnectService();