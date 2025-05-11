import axios from 'axios';
import { getCurrentGateway, updateGraphQLEndpoint } from './config';

let endpoint = `https://${getCurrentGateway() || 'arweave.net'}/graphql`;

// GraphQL sorgusu göndermek için kullanılan ana fonksiyon
const query = async (queryString, variables = {}) => {
  try {
    const response = await axios.post(
      endpoint,
      {
        query: queryString,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 saniye timeout
      }
    );

    // Hata kontrolü
    if (response.data.errors) {
      console.error('GraphQL sorgu hatası:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    // Hata yakalama ve işleme
    console.error('GraphQL API hatası:', error);
    
    // Bağlantı hatası kontrolü - endpoint güncellemesi için
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || 
        error.message.includes('Network Error') || error.response?.status >= 500) {
      console.log('GraphQL endpoint bağlantı hatası, endpoint güncellenecek');
      
      // Endpoint'i güncellemeyi dene ve tekrar sorguyu çalıştır
      await updateEndpoint();
      
      // Tekrar dene, ama sonsuz döngüye girmemek için bayrak ekliyoruz
      return retryQuery(queryString, variables);
    }
    
    throw error;
  }
};

// Endpoint güncelleme fonksiyonu
export const updateEndpoint = () => {
  const gateway = getCurrentGateway();
  endpoint = updateGraphQLEndpoint(gateway);
  console.log(`GraphQL endpoint güncellendi: ${endpoint}`);
  return endpoint;
};

// Sorgu tekrar deneme fonksiyonu (sonsuz döngüye girmemek için)
const retryQuery = async (queryString, variables) => {
  try {
    const response = await axios.post(
      endpoint,
      {
        query: queryString,
        variables
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.errors) {
      console.error('Tekrar deneme - GraphQL sorgu hatası:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    console.error('Tekrar deneme - GraphQL API hatası:', error);
    throw error;
  }
};

// Etiketlere göre işlem bul
export const findTransactionsByTags = async (tags = []) => {
  // GraphQL sorgu metnini hazırla
  const queryString = `
    query($tags: [TagFilter!]!) {
      transactions(
        tags: $tags,
        first: 100,
        sort: HEIGHT_DESC
      ) {
        edges {
          node {
            id
            owner {
              address
            }
            data {
              size
            }
            tags {
              name
              value
            }
            block {
              height
              timestamp
            }
          }
        }
      }
    }
  `;

  // GraphQL sorgu değişkenlerini normalize et
  const normalizedTags = tags.map(tag => {
    return {
      name: tag.name,
      values: Array.isArray(tag.values) ? tag.values : [tag.value || tag.values]
    };
  });

  // GraphQL sorgu değişkenleri
  const variables = {
    tags: normalizedTags
  };

  console.log('Normalize edilmiş tag değişkenleri:', variables);

  try {
    const data = await query(queryString, variables);
    
    // Hiç sonuç yoksa boş array döndür
    if (!data || !data.transactions || !data.transactions.edges) {
      console.log('Hiç transaction bulunamadı');
      return [];
    }
    
    return data.transactions.edges.map(edge => edge.node);
  } catch (error) {
    console.error('İşlem arama hatası:', error);
    
    // Alternatif bir sorgu şeması deneyelim
    if (error.message && error.message.includes('400')) {
      try {
        console.log('Alternatif sorgu şeması deneniyor...');
        // Alternatif sorgu - tek bir etiket üzerinden
        const altQueryString = `
          query {
            transactions(
              tags: [
                { name: "${tags[0].name}", values: ${JSON.stringify(Array.isArray(tags[0].values) ? tags[0].values : [tags[0].value || tags[0].values])} }
              ],
              first: 100, 
              sort: HEIGHT_DESC
            ) {
              edges {
                node {
                  id
                  owner {
                    address
                  }
                  data {
                    size
                  }
                  tags {
                    name
                    value
                  }
                  block {
                    height
                    timestamp
                  }
                }
              }
            }
          }
        `;
        
        const altData = await query(altQueryString);
        
        if (!altData || !altData.transactions || !altData.transactions.edges) {
          console.log('Alternatif sorguda da hiç transaction bulunamadı');
          return [];
        }
        
        return altData.transactions.edges.map(edge => edge.node);
      } catch (altError) {
        console.error('Alternatif işlem arama hatası:', altError);
        return [];
      }
    }
    
    return [];
  }
};

// Özel ID'ye göre işlem bul
export const findTransactionById = async (id) => {
  const queryString = `
    query($id: ID!) {
      transaction(id: $id) {
        id
        owner {
          address
        }
        data {
          size
        }
        tags {
          name
          value
        }
        block {
          height
          timestamp
        }
      }
    }
  `;

  const variables = {
    id
  };

  try {
    const data = await query(queryString, variables);
    return data.transaction;
  } catch (error) {
    console.error('İşlem ID arama hatası:', error);
    throw error;
  }
};

// Adrese göre işlem bul
export const findTransactionsByOwner = async (owner, first = 100) => {
  const queryString = `
    query($owner: String!, $first: Int!) {
      transactions(
        owners: [$owner],
        first: $first,
        sort: HEIGHT_DESC
      ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
            block {
              height
              timestamp
            }
          }
        }
      }
    }
  `;

  const variables = {
    owner,
    first
  };

  try {
    const data = await query(queryString, variables);
    return data.transactions.edges.map(edge => edge.node);
  } catch (error) {
    console.error('Adrese göre işlem arama hatası:', error);
    throw error;
  }
};

// Modülü dışa aktar
const graphqlService = {
  query,
  findTransactionsByTags,
  findTransactionById,
  findTransactionsByOwner,
  updateEndpoint,
  get endpoint() { return endpoint; }
};

export default graphqlService;