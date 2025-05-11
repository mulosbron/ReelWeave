import Arweave from 'arweave';
import axios from 'axios';
import { ARIO } from '@ar.io/sdk/web';

// Varsayılan Arweave konfigürasyonu
const ARWEAVE_CONFIG = {
  host: process.env.REACT_APP_ARWEAVE_HOST || 'arweave.net',
  port: process.env.REACT_APP_ARWEAVE_PORT || 443,
  protocol: process.env.REACT_APP_ARWEAVE_PROTOCOL || 'https',
  timeout: 20000,
  logging: false,
};

// AR.IO istemcisi
const ario = ARIO.mainnet();

// Aktif gateway listesi (bu liste dinamik olarak güncellenecek)
let GATEWAY_LIST = [];
let currentGatewayIndex = 0;

// Gateway listesini AR.IO'dan al ve güncelle
export const refreshGatewayList = async () => {
  try {
    console.log('AR.IO ağından gateway listesi alınıyor...');
    
    // AR.IO'dan aktif gateway'leri al
    const gatewaysResponse = await ario.getGateways({
      limit: 400,
      sortBy: 'weights.compositeWeight', // En iyi performans gösteren gateway'ler
      sortOrder: 'desc'
    });
    
    // Debug: Tüm gateway verilerini yazdır
    console.log('AR.IO Gateway Detayları:', JSON.stringify(gatewaysResponse.items, null, 2));
    
    // Gateway listesini oluştur (HTTP/HTTPS olanları ve performansı %95+ olanları filtrele)
    const newGateways = gatewaysResponse.items
      .filter(gw =>
        gw.settings &&
        gw.settings.fqdn &&
        gw.status === 'joined' &&
        gw.weights &&
        gw.weights.gatewayPerformanceRatio >= 0.95 // %95 ve üzeri performans
      )
      .map(gw => gw.settings.fqdn);
    
    if (newGateways.length > 0) {
      // Sadece AR.IO'dan alınan gateway'leri kullan
      GATEWAY_LIST = [...new Set(newGateways)];
      console.log('Gateway listesi güncellendi:', GATEWAY_LIST);
      return GATEWAY_LIST;
    } else {
      console.warn('AR.IO ağından gateway listesi alınamadı, varsayılan gateway kullanılıyor');
      // Varsayılan gateway kullan
      GATEWAY_LIST = ['arweave.net'];
      return GATEWAY_LIST;
    }
  } catch (error) {
    console.error('Gateway listesi güncellenirken hata oluştu:', error);
    // Hata durumunda varsayılan gateway kullan
    GATEWAY_LIST = ['arweave.net'];
    return GATEWAY_LIST;
  }
};

// Arweave istemcisini oluştur
export const createArweaveInstance = (gatewayHost = ARWEAVE_CONFIG.host) => {
  return Arweave.init({
    host: gatewayHost,
    port: ARWEAVE_CONFIG.port,
    protocol: ARWEAVE_CONFIG.protocol,
    timeout: ARWEAVE_CONFIG.timeout,
    logging: ARWEAVE_CONFIG.logging,
  });
};

// Varsayılan arweave istemcisi
export const arweave = createArweaveInstance();

// Gateway durumunu kontrol et
export const checkGatewayConnection = async (gateway) => {
  try {
    console.log(`Gateway ${gateway} bağlantısı test ediliyor...`);
    // Önce basit bir HTTP isteği ile hızlı kontrol
    const healthCheck = await axios.head(`https://${gateway}/info`, { 
      timeout: 5000 
    });
    
    if (healthCheck.status >= 200 && healthCheck.status < 300) {
      console.log(`Gateway ${gateway} çevrimiçi`);
      return true;
    }
    
    // HTTP kontrolü başarısız olursa tam Arweave kontrolü yap
    const testArweave = createArweaveInstance(gateway);
    const networkInfo = await testArweave.network.getInfo();
    console.log(`Gateway ${gateway} çevrimiçi:`, networkInfo);
    return true;
  } catch (error) {
    console.error(`Gateway ${gateway} çevrimdışı:`, error.message);
    return false;
  }
};

// Bir sonraki kullanılabilir gateway'e geç
export const switchToNextGateway = async () => {
  // Gateway listesi boşsa, ilk önce gateway listesini al
  if (GATEWAY_LIST.length === 0) {
    await refreshGatewayList();
  }
  
  let attemptCount = 0;
  const maxAttempts = GATEWAY_LIST.length;
  
  console.log(`Gateway değiştirme işlemi başlatılıyor. Mevcut gateway: ${GATEWAY_LIST[currentGatewayIndex]}`);
  
  while (attemptCount < maxAttempts) {
    // Bir sonraki gateway'e geç
    currentGatewayIndex = (currentGatewayIndex + 1) % GATEWAY_LIST.length;
    const newGateway = GATEWAY_LIST[currentGatewayIndex];
    
    console.log(`Gateway değiştiriliyor: ${newGateway} (${attemptCount + 1}/${maxAttempts})`);
    
    // Gateway'i test et
    const isConnected = await checkGatewayConnection(newGateway);
    if (isConnected) {
      // Yeni arweave istemcisi oluştur
      const newArweave = createArweaveInstance(newGateway);
      
      // Global arweave değişkenini güncelle
      Object.assign(arweave, newArweave);
      
      // GraphQL endpoint'i de güncelle
      updateGraphQLEndpoint(newGateway);
      
      console.log(`Gateway başarıyla değiştirildi: ${newGateway}`);
      return {
        success: true,
        gateway: newGateway
      };
    }
    
    attemptCount++;
  }
  
  console.error("Tüm gateway'ler denendi ancak hiçbiri çalışmıyor");
  
  // Tüm gateway'ler çalışmıyorsa listeyi yenile ve tekrar dene
  await refreshGatewayList();
  
  return {
    success: false,
    gateway: GATEWAY_LIST[currentGatewayIndex] || 'arweave.net'
  };
};

// GraphQL endpoint'ini güncelle
export const updateGraphQLEndpoint = (gateway) => {
  // Bu işlev API_ENDPOINTS içindeki GRAPHQL değerini günceller
  // utils/constants.js içinde tanımlanmış olmalıdır
  // Bu işlev src/services/arweave/graphql.js içinden çağrılmalıdır
  
  // Eğer global bir API_ENDPOINTS değişkeni varsa güncelle
  if (typeof window !== 'undefined' && window.API_ENDPOINTS) {
    window.API_ENDPOINTS.GRAPHQL = `https://${gateway}/graphql`;
  }
  
  return `https://${gateway}/graphql`;
};

// Arweave bağlantısını kontrol et - Bağlantı başarısız olursa otomatik olarak diğer gateway'e geç
export const checkArweaveConnection = async () => {
  try {
    const networkInfo = await arweave.network.getInfo();
    console.log('Connected to Arweave network:', networkInfo);
    return true;
  } catch (error) {
    console.error('Failed to connect to Arweave network:', error);
    console.log("Farklı bir gateway'e geçiliyor...");
    
    // Otomatik olarak diğer gateway'e geç
    const switchResult = await switchToNextGateway();
    return switchResult.success;
  }
};

// Aktif gateway'i getir
export const getCurrentGateway = () => {
  return GATEWAY_LIST[currentGatewayIndex] || 'arweave.net';
};

// Belirli bir gateway'e geç
export const switchToGateway = async (gatewayHost) => {
  // Gateway listede var mı kontrol et, yoksa listeye ekle
  let gatewayIndex = GATEWAY_LIST.indexOf(gatewayHost);
  if (gatewayIndex === -1) {
    GATEWAY_LIST.push(gatewayHost);
    gatewayIndex = GATEWAY_LIST.length - 1;
    console.log(`Gateway ${gatewayHost} listeye eklendi`);
  }
  
  // Gateway'i test et
  const isConnected = await checkGatewayConnection(gatewayHost);
  if (isConnected) {
    // Yeni arweave istemcisi oluştur
    const newArweave = createArweaveInstance(gatewayHost);
    
    // Global arweave değişkenini güncelle
    Object.assign(arweave, newArweave);
    
    // GraphQL endpoint'i güncelle
    updateGraphQLEndpoint(gatewayHost);
    
    // Mevcut gateway index'ini güncelle
    currentGatewayIndex = gatewayIndex;
    
    console.log(`Gateway başarıyla değiştirildi: ${gatewayHost}`);
    return {
      success: true,
      gateway: gatewayHost
    };
  }
  
  console.error(`Gateway'e bağlanılamadı: ${gatewayHost}`);
  return {
    success: false,
    gateway: GATEWAY_LIST[currentGatewayIndex] || 'arweave.net'
  };
};

// Uygulamanın başlangıcında gateway listesini al
refreshGatewayList().then(() => {
  console.log('Gateway listesi başarıyla yüklendi, bağlantı kontrol ediliyor...');
  // Başlangıçta Arweave bağlantısını kontrol et, hata varsa başka gateway'e geç
  checkArweaveConnection();
}).catch(error => {
  console.error('Gateway listesi yüklenirken hata oluştu:', error);
  // Yine de bağlantı kontrolü yap
  checkArweaveConnection();
});