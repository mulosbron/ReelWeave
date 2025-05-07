import Arweave from 'arweave';

// Varsayılan Arweave konfigürasyonu
const ARWEAVE_CONFIG = {
  host: process.env.REACT_APP_ARWEAVE_HOST || 'arweave.net',
  port: process.env.REACT_APP_ARWEAVE_PORT || 443,
  protocol: process.env.REACT_APP_ARWEAVE_PROTOCOL || 'https',
  timeout: 20000,
  logging: false,
};

// Yedek gateway listesi - çok sayıda gateway yerine en güvenilir birkaç tanesi yeterli
const FALLBACK_GATEWAY_LIST = [
  'arweave.net',         // Varsayılan gateway
  'arweave.dev',         // Arweave Dev gateway
  'g8way.io',            // G8way gateway
  'ar-io.dev'            // AR.IO resmi gateway
];

// Aktif gateway listesi
let GATEWAY_LIST = [...FALLBACK_GATEWAY_LIST];
let currentGatewayIndex = 0;

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
    const testArweave = createArweaveInstance(gateway);
    const networkInfo = await testArweave.network.getInfo();
    console.log(`Gateway ${gateway} is online:`, networkInfo);
    return true;
  } catch (error) {
    console.error(`Gateway ${gateway} is offline:`, error);
    return false;
  }
};

// Bir sonraki kullanılabilir gateway'e geç
export const switchToNextGateway = async () => {
  let attemptCount = 0;
  const maxAttempts = GATEWAY_LIST.length;
  
  while (attemptCount < maxAttempts) {
    // Bir sonraki gateway'e geç
    currentGatewayIndex = (currentGatewayIndex + 1) % GATEWAY_LIST.length;
    const newGateway = GATEWAY_LIST[currentGatewayIndex];
    
    console.log(`Gateway değiştiriliyor: ${newGateway}`);
    
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
  return {
    success: false,
    gateway: GATEWAY_LIST[currentGatewayIndex]
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
  return GATEWAY_LIST[currentGatewayIndex];
};

// Belirli bir gateway'e geç
export const switchToGateway = async (gatewayHost) => {
  // Gateway listede var mı kontrol et
  const gatewayIndex = GATEWAY_LIST.indexOf(gatewayHost);
  if (gatewayIndex === -1) {
    console.error(`Gateway ${gatewayHost} onaylı listede yok`);
    return {
      success: false,
      gateway: GATEWAY_LIST[currentGatewayIndex]
    };
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
    gateway: GATEWAY_LIST[currentGatewayIndex]
  };
};

// Başlangıçta Arweave bağlantısını kontrol et, hata varsa başka gateway'e geç
checkArweaveConnection();