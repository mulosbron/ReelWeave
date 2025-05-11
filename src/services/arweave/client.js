import { arweave, switchToNextGateway, checkArweaveConnection } from './config';
import { APP_NAME, APP_VERSION, TX_TAGS } from '../../utils/constants';
import graphql from './graphql';

class ArweaveClient {
  constructor() {
    this.arweave = arweave;
    this.maxRetries = 3;
  }

  // Arweave ile ilgili işlemleri tekrar deneme mekanizması
  async retryOnFailure(operation, maxRetries = this.maxRetries) {
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Ağ hatası veya hız sınırı hatası durumunda gateway değiştir
        if (error.message.includes('network') || 
            error.message.includes('timeout') ||
            error.message.includes('rate limit') ||
            error.message.includes('429') ||
            error.message.includes('5') ||  // 5xx hatalar
            error.message.includes('Failed to fetch')) {
          
          console.log(`Arweave işlemi başarısız oldu, gateway değiştiriliyor (deneme: ${retryCount + 1}/${maxRetries + 1})`, error.message);
          
          const switchResult = await switchToNextGateway();
          if (switchResult.success) {
            // Arweave nesnesini güncelle
            this.arweave = arweave;
            retryCount++;
            continue;
          }
        }
        
        // Diğer hatalar için direkt olarak hatayı fırlat
        console.error(`Arweave işlemi başarısız oldu ve yeniden denenemedi:`, error);
        throw error;
      }
    }
    
    // Maksimum deneme sayısına ulaşıldıysa son hatayı fırlat
    console.error(`Maksimum deneme sayısına (${maxRetries + 1}) ulaşıldı. İşlem başarısız oldu.`);
    throw lastError;
  }

  async connectWallet() {
    return await this.retryOnFailure(async () => {
      if (!window.arweaveWallet) {
        throw new Error('ArConnect not found! Please install ArConnect extension.');
      }

      // Request all needed permissions at once
      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'ACCESS_PUBLIC_KEY',
        'SIGN_TRANSACTION',
        'DISPATCH'
      ]);

      const address = await window.arweaveWallet.getActiveAddress();
      return address;
    });
  }

  async disconnectWallet() {
    try {
      if (window.arweaveWallet) {
        await window.arweaveWallet.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting from ArConnect:', error);
    }
  }

  async getWalletAddress() {
    try {
      if (!window.arweaveWallet) {
        return null;
      }
      const address = await window.arweaveWallet.getActiveAddress();
      return address;
    } catch (error) {
      console.warn('Could not get wallet address:', error.message);
      return null;
    }
  }

  async createTransaction(data, tags = []) {
    return await this.retryOnFailure(async () => {
      // Ensure ArConnect is available
      if (!window.arweaveWallet) {
        throw new Error('ArConnect not found!');
      }

      // Ensure we have permission
      try {
        await window.arweaveWallet.getPermissions();
      } catch (err) {
        console.log("Need to reconnect for permissions...");
        await window.arweaveWallet.connect([
          'ACCESS_ADDRESS', 
          'SIGN_TRANSACTION', 
          'DISPATCH'
        ]);
      }

      // Convert data to string if needed
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Create transaction with arweave.js
      const transaction = await this.arweave.createTransaction({
        data: dataString
      });

      // Add standard tags
      transaction.addTag(TX_TAGS.APP_NAME, APP_NAME);
      transaction.addTag(TX_TAGS.APP_VERSION, APP_VERSION);

      // Add custom tags
      tags.forEach(tag => {
        transaction.addTag(tag.name, tag.value);
      });

      return transaction;
    });
  }

  async signTransaction(transaction) {
    return await this.retryOnFailure(async () => {
      // Check ArConnect
      if (!window.arweaveWallet) {
        throw new Error('ArConnect not found!');
      }

      console.log("Signing transaction with ArConnect...");
      
      // Sign with ArConnect
      await window.arweaveWallet.sign(transaction);
      
      // ArConnect modifies the transaction object directly
      console.log("Transaction signed:", transaction.id);
      
      return transaction;
    });
  }

  async submitTransaction(transaction) {
    return await this.retryOnFailure(async () => {
      // Check ArConnect
      if (!window.arweaveWallet) {
        throw new Error('ArConnect not found!');
      }

      console.log("Dispatching transaction with ArConnect...");
      
      // Use ArConnect's dispatch method
      const response = await window.arweaveWallet.dispatch(transaction);
      
      console.log("Dispatch response:", response);
      
      if (!response || !response.id) {
        throw new Error("Dispatch did not return a valid transaction ID");
      }
      
      return response.id;
    });
  }

  async getTransactionData(txId) {
    return await this.retryOnFailure(async () => {
      try {
        // Direkt olarak raw endpoint'i kullanalım
        const gateway = this.arweave.api.config.host;
        const protocol = this.arweave.api.config.protocol;
        const rawUrl = `${protocol}://${gateway}/raw/${txId}`;
        
        const response = await fetch(rawUrl);
        if (!response.ok) {
          throw new Error(`Raw endpoint yanıt vermedi: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.text();
        try {
          // JSON olarak parse etmeyi dene
          return JSON.parse(data);
        } catch (e) {
          // Eğer veri zaten bir nesne ise doğrudan döndür
          if (typeof data === 'object' && data !== null) {
            return data;
          }
          // JSON değilse ve '[object Object]' şeklindeyse, bu muhtemelen toString() ile dönüştürülmüş bir nesne
          if (data === '[object Object]') {
            console.warn(`Transaction verisi [object Object] olarak döndü: ${txId}`);
            // Boş bir nesne döndür, daha sonra tag'lerden bilgi tamamlanabilir
            return {};
          }
          // Diğer string verileri olduğu gibi döndür
          return data;
        }
      } catch (error) {
        console.error('Transaction verisi alınamadı:', error);
        throw error;
      }
    });
  }

  async getTransactionStatus(txId) {
    return await this.retryOnFailure(async () => {
      const status = await this.arweave.transactions.getStatus(txId);
      return status;
    });
  }

  async getTransactionTags(txId) {
    return await this.retryOnFailure(async () => {
      const tx = await this.arweave.transactions.get(txId);
      const tags = {};
      
      tx.get('tags').forEach(tag => {
        const key = tag.get('name', { decode: true, string: true });
        const value = tag.get('value', { decode: true, string: true });
        tags[key] = value;
      });
      
      return tags;
    });
  }
}

export const arweaveClient = new ArweaveClient();

// İşlem gönderme işlemi için yeniden deneme fonksiyonu
export const retryOnFailure = async (operationFn, maxRetries = 3) => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // İşlemi gerçekleştirmeyi dene
      return await operationFn();
    } catch (error) {
      console.error(`İşlem hatası (deneme ${retries + 1}/${maxRetries + 1}):`, error);
      
      // Son denemeyi de geçtiyse hatayı fırlat
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Bağlantı hatası olup olmadığını kontrol et
      if (error.message.includes('timeout') || 
          error.message.includes('connection') || 
          error.message.includes('network') ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT') {
        
        console.log('Bağlantı hatası tespit edildi, gateway değiştiriliyor...');
        
        // Gateway değiştir
        const switchResult = await switchToNextGateway();
        if (!switchResult.success) {
          console.error('Tüm gateway\'ler denendi, işlem başarısız oldu.');
          throw new Error('Arweave ağına bağlanılamıyor: Tüm gateway\'ler denendi.');
        }
        
        // GraphQL endpoint'i güncelle
        graphql.updateEndpoint();
      }
      
      // Yeniden deneme sayacını artır
      const currentRetries = retries; // ESLint uyarısını önlemek için değeri kopyala
      retries++;
      
      // Kısa bir bekleme süresi ekle
      await new Promise(resolve => setTimeout(resolve, 1000 * (currentRetries + 1)));
    }
  }
};

// İşlem göndermek için fonksiyon - yeniden deneme mekanizması ile
export const sendTransaction = async (transaction, jwk) => {
  return retryOnFailure(async () => {
    // İşlemi imzala
    await arweave.transactions.sign(transaction, jwk);
    
    // İşlemi doğrula
    const isValid = await arweave.transactions.verify(transaction);
    if (!isValid) {
      throw new Error('İşlem geçerli değil: İmzalama hatalı.');
    }
    
    // İşlemi gönder
    const response = await arweave.transactions.post(transaction);
    
    // Yanıtı kontrol et
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`İşlem gönderme hatası: ${response.statusText}`);
    }
    
    return {
      id: transaction.id,
      status: response.status,
      statusText: response.statusText
    };
  });
};

// İşlem durumunu kontrol et
export const getTransactionStatus = async (txId) => {
  return retryOnFailure(async () => {
    const status = await arweave.transactions.getStatus(txId);
    
    return {
      id: txId,
      status: status.status,
      confirmed: status.confirmed,
      ...status
    };
  });
};

// İşlem verilerini getir
export const getTransactionData = async (txId) => {
  return retryOnFailure(async () => {
    try {
      // Önce standart yöntemle deneyelim
      const data = await arweave.transactions.getData(txId, {
        decode: true,
        string: true
      });
      
      // Eğer veri '[object Object]' şeklindeyse, raw endpoint ile tekrar deneyelim
      if (data === '[object Object]') {
        console.warn(`Standart yöntemle veri [object Object] olarak alındı: ${txId}, raw endpoint deneniyor...`);
        throw new Error('Veri [object Object] formatında, raw endpoint ile deneniyor');
      }
      
      return data;
    } catch (error) {
      console.log(`Standart yöntemle veri alınamadı: ${txId}, raw endpoint deneniyor...`);
      
      // Raw endpoint'i deneyelim (arweave.net/raw/TX_ID formatında)
      const gateway = arweave.api.config.host;
      const protocol = arweave.api.config.protocol;
      const rawUrl = `${protocol}://${gateway}/raw/${txId}`;
      
      try {
        const response = await fetch(rawUrl);
        if (!response.ok) {
          throw new Error(`Raw endpoint yanıt vermedi: ${response.status} ${response.statusText}`);
        }
        
        // İçerik türünü kontrol et
        const contentType = response.headers.get('content-type');
        
        // Response içeriğini al
        const responseText = await response.text();
        
        // Veri '[object Object]' şeklindeyse boş bir nesne döndür
        if (responseText === '[object Object]') {
          console.warn(`Raw endpoint verisi [object Object] olarak alındı: ${txId}`);
          return {};
        }
        
        // JSON parse etmeyi dene
        if (contentType && contentType.includes('application/json')) {
          try {
            return JSON.parse(responseText);
          } catch (parseError) {
            console.warn(`JSON parse hatası: ${parseError.message}`);
            return responseText;
          }
        } else {
          // Diğer formatlar için metin olarak dön
          return responseText;
        }
      } catch (rawError) {
        console.error(`Raw endpoint başarısız oldu: ${rawError.message}`);
        throw error; // Orijinal hatayı fırlat
      }
    }
  });
};

// Yeni bir işlem oluştur
export const createTransaction = async (data, tags = [], target = '', quantity = '0') => {
  return retryOnFailure(async () => {
    let tx;
    
    // Veri türünü kontrol et
    if (typeof data === 'string') {
      // Metin verisi için
      tx = await arweave.createTransaction({ 
        data,
        target,
        quantity
      });
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Ikilik veri için
      tx = await arweave.createTransaction({ 
        data: data,
        target,
        quantity
      });
    } else {
      // Nesne ise JSON olarak çevir
      tx = await arweave.createTransaction({ 
        data: JSON.stringify(data),
        target,
        quantity
      });
    }
    
    // Etiketleri ekle
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        tx.addTag(tag.name, tag.value);
      }
    }
    
    return tx;
  });
};

// İşlemi cüzdanla imzala
export const signTransaction = async (tx, jwk) => {
  return retryOnFailure(async () => {
    await arweave.transactions.sign(tx, jwk);
    return tx;
  });
};

// Cüzdan bakiyesini getir
export const getWalletBalance = async (address) => {
  return retryOnFailure(async () => {
    const winston = await arweave.wallets.getBalance(address);
    const ar = arweave.ar.winstonToAr(winston);
    
    return {
      winston,
      ar
    };
  });
};

// Bağlantı durumunu kontrol et
export const checkConnection = async () => {
  try {
    return await checkArweaveConnection();
  } catch (error) {
    console.error('Bağlantı kontrolü hatası:', error);
    return false;
  }
};

// default export için nesneyi önce bir değişkene ata
const arweaveExports = {
  arweave,
  retryOnFailure,
  sendTransaction,
  getTransactionStatus,
  getTransactionData,
  createTransaction,
  signTransaction,
  getWalletBalance,
  checkConnection
};

export default arweaveExports;