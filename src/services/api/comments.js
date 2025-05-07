import { arweaveClient } from '../arweave/client';
import graphql from '../arweave/graphql';
import { APP_NAME, TX_TAGS, ACTIONS } from '../../utils/constants';

class CommentsService {
  // Yorum ekle veya güncelle
  async addOrUpdateComment(itemId, itemType, content, rating, walletAddress) {
    try {
      // Önce kullanıcının bu öğe için zaten yorumu var mı kontrol et
      const existingComment = await this.getUserCommentForItem(walletAddress, itemId, itemType);
      
      const data = JSON.stringify({
        itemId,
        itemType,
        content,
        rating,
        author: walletAddress,
        createdAt: existingComment ? existingComment.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdit: !!existingComment
      });

      const tags = [
        { name: TX_TAGS.CONTENT_TYPE, value: 'application/json' },
        { name: TX_TAGS.ACTION, value: existingComment ? ACTIONS.UPDATE_COMMENT : ACTIONS.ADD_COMMENT },
        { name: TX_TAGS.ITEM_ID, value: itemId },
        { name: TX_TAGS.ITEM_TYPE, value: itemType },
        { name: TX_TAGS.USER_ADDRESS, value: walletAddress },
        { name: 'Rating', value: rating.toString() }
      ];
      
      // Eğer bu bir düzenleme ise, orijinal işleme referans ekleyin
      if (existingComment) {
        tags.push({ name: 'Original-TX-ID', value: existingComment.id });
      }

      const transaction = await arweaveClient.createTransaction(data, tags);
      await arweaveClient.signTransaction(transaction);
      const txId = await arweaveClient.submitTransaction(transaction);

      return { 
        success: true, 
        txId,
        isEdit: !!existingComment 
      };
    } catch (error) {
      console.error('Error adding/updating comment:', error);
      return { success: false, error: error.message };
    }
  }

  // services/api/comments.js içinde getComments fonksiyonu
  async getComments(itemId, itemType) {
    try {
      console.log(`Fetching comments for ${itemType} with ID: ${itemId}`);
      
      // Daha geniş bir sorgu yapalım - sadece Content-Type tagini dahil edelim
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["${APP_NAME}"] },
              { name: "Content-Type", values: ["application/json"] }
            ]
            sort: HEIGHT_DESC
            first: 100
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }
      `;

      const result = await graphql.query(queryString);
      console.log("GraphQL result:", result);
      
      if (!result?.transactions?.edges) {
        console.log("No transactions found");
        return [];
      }
      
      // Tüm işlemleri al ve sonradan filtrele
      const allTransactions = result.transactions.edges;
      console.log(`Found ${allTransactions.length} total transactions`);
      
      // İşlemleri işle
      const processedComments = await this.processCommentsWithUpdates(allTransactions);
      
      // İlgili itemId ve itemType'a göre filtrele
      const filteredComments = processedComments.filter(comment => {
        const matchesItem = comment.itemId === itemId && comment.itemType === itemType;
        console.log(`Comment ${comment.id}: itemId=${comment.itemId}, itemType=${comment.itemType}, matches=${matchesItem}`);
        return matchesItem;
      });
      
      console.log(`Found ${filteredComments.length} comments for ${itemType} ${itemId}`);
      return filteredComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async processCommentsWithUpdates(transactions) {
    if (!transactions || !transactions.length) return [];
    
    console.log(`${transactions.length} işlem işleniyor`);
    
    // Her kullanıcının her öğe için en son yorumunu takip et - kullanıcı+öğe anahtarı
    const latestCommentsByUserAndItem = new Map();
    
    for (const edge of transactions) {
      try {
        const node = edge.node;
        
        // Tag'leri bir objeye dönüştür
        const tags = node.tags.reduce((acc, tag) => {
          acc[tag.name] = tag.value;
          return acc;
        }, {});
        
        // Öğe kimliklerini kontrol et
        const itemId = tags['Item-Id'];
        const itemType = tags['Item-Type'];
        const action = tags['Action'];
        const userAddress = tags['User-Address'];
        
        // Debug için yazdır
        console.log(`İşlem ${node.id}: Action=${action}, ItemId=${itemId}, ItemType=${itemType}, User=${userAddress}`);
        
        // Yorum olmayan eylemleri atla
        if (![ACTIONS.ADD_COMMENT, ACTIONS.UPDATE_COMMENT].includes(action)) {
          console.log(`İşlem atlanıyor ${node.id} - yorum işlemi değil`);
          continue;
        }
        
        // İtemId, ItemType veya UserAddress eksikse atla
        if (!itemId || !itemType || !userAddress) {
          console.log(`İşlem atlanıyor ${node.id} - gerekli etiketler eksik`);
          continue;
        }
  
        // Benzersiz bir kullanıcı+öğe anahtarı oluştur
        const userItemKey = `${userAddress}-${itemId}-${itemType}`;
        
        // Mevcut bir yorum var mı kontrol et
        const existingComment = latestCommentsByUserAndItem.get(userItemKey);
        
        // Timestamp veya block height kontrolü ile en yenisini belirle
        // Eğer mevcut yorumun timestamp'i daha büyükse, bu işlemi atla (daha eski demektir)
        if (existingComment) {
          const existingTimestamp = existingComment.timestamp || 0;
          const currentTimestamp = node.block?.timestamp || 0;
          
          if (existingTimestamp > currentTimestamp) {
            console.log(`İşlem atlanıyor ${node.id} - daha yeni bir yorum zaten var`);
            continue;
          }
        }
        
        try {
          // İşlem verisini getir
          const data = await arweaveClient.getTransactionData(node.id);
          if (!data) {
            console.log(`İşlem atlanıyor ${node.id} - veri yok`);
            continue;
          }
          
          try {
            const parsedData = JSON.parse(data);
            console.log(`İşlem ${node.id} verisi:`, parsedData);
            
            // Bu yorumu, bu kullanıcının bu öğe için en son yorumu olarak sakla
            latestCommentsByUserAndItem.set(userItemKey, {
              id: node.id,
              ...parsedData,
              author: userAddress,
              itemId: itemId,
              itemType: itemType,
              rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
              timestamp: node.block?.timestamp,
              blockHeight: node.block?.height || 0,
              txId: node.id,
              action: action
            });
            
            console.log(`Yorum güncellendi/eklendi: ${userItemKey}`);
          } catch (parseError) {
            console.error(`İşlem verisi ayrıştırılırken hata oluştu: ${node.id}:`, parseError);
          }
        } catch (dataError) {
          console.error(`İşlem verisi getirilirken hata oluştu: ${node.id}:`, dataError);
        }
      } catch (error) {
        console.error(`İşlem işlenirken hata oluştu ${edge?.node?.id}:`, error);
      }
    }
    
    // Haritayı diziye dönüştür ve zaman damgasına göre sırala (en yenisi en üstte)
    const comments = Array.from(latestCommentsByUserAndItem.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    console.log(`${comments.length} yorum işlendi ve döndürüldü`);
    return comments;
  }

  // Kullanıcının belirli bir öğe için yorumu var mı kontrol et
  async getUserCommentForItem(walletAddress, itemId, itemType) {
    try {
      console.log(`Kullanıcı yorumu aranıyor: ${walletAddress} için ${itemType} ${itemId}`);
      
      // Doğrudan UPDATE_COMMENT ve ADD_COMMENT eylemlerini içeren bir sorgu yapalım
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["${APP_NAME}"] },
              { name: "User-Address", values: ["${walletAddress}"] },
              { name: "Item-Id", values: ["${itemId}"] },
              { name: "Item-Type", values: ["${itemType}"] },
              { name: "Action", values: ["ADD_COMMENT", "UPDATE_COMMENT"] }
            ]
            sort: HEIGHT_DESC
            first: 10
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }
      `;

      const result = await graphql.query(queryString);
      
      if (!result?.transactions?.edges || result.transactions.edges.length === 0) {
        console.log(`Kullanıcının bu öğe için yorumu bulunamadı: ${walletAddress}`);
        return null;
      }
      
      console.log(`Kullanıcı için ${result.transactions.edges.length} yorum işlemi bulundu`);
      
      // En son yorum işlemini al (HEIGHT_DESC sıralaması ile ilk sonuç en yenisi olacak)
      const latestCommentNode = result.transactions.edges[0].node;
      console.log(`En son yorum işlemi: ${latestCommentNode.id}`);
      
      // İşlem verilerini getir
      const data = await arweaveClient.getTransactionData(latestCommentNode.id);
      if (!data) {
        console.log(`İşlem verisi alınamadı: ${latestCommentNode.id}`);
        return null;
      }
      
      // Verileri ayrıştır
      try {
        const parsedData = JSON.parse(data);
        console.log(`İşlem verisi ayrıştırıldı:`, parsedData);
        
        // Tag'leri bir objeye dönüştür
        const tags = latestCommentNode.tags.reduce((acc, tag) => {
          acc[tag.name] = tag.value;
          return acc;
        }, {});
        
        // Yorum nesnesini oluştur ve döndür
        const comment = {
          id: latestCommentNode.id,
          ...parsedData,
          author: tags['User-Address'],
          itemId: tags['Item-Id'],
          itemType: tags['Item-Type'],
          rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
          timestamp: latestCommentNode.block?.timestamp,
          blockHeight: latestCommentNode.block?.height,
          txId: latestCommentNode.id,
          action: tags['Action']
        };
        
        console.log(`Kullanıcı yorumu bulundu:`, comment);
        return comment;
      } catch (parseError) {
        console.error(`İşlem verisi ayrıştırılırken hata oluştu: ${latestCommentNode.id}`, parseError);
        return null;
      }
    } catch (error) {
      console.error('Kullanıcı yorumu getirilirken hata oluştu:', error);
      return null;
    }
  }

  // Ortalama puanı hesapla
  async getAverageRating(itemId, itemType) {
    try {
      // Yorumları getir
      const comments = await this.getComments(itemId, itemType);
      
      // Sadece puanlama içeren yorumları filtrele
      const ratedComments = comments.filter(comment => comment.rating != null);
      
      if (ratedComments.length === 0) {
        return { average: 0, count: 0 };
      }
      
      // Ortalama puanı hesapla
      const sum = ratedComments.reduce((acc, comment) => acc + comment.rating, 0);
      const average = sum / ratedComments.length;
      
      return {
        average: parseFloat(average.toFixed(1)),
        count: ratedComments.length
      };
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return { average: 0, count: 0 };
    }
  }

  // Kullanıcının tüm yorumlarını getir
  async getUserComments(walletAddress) {
    try {
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["${APP_NAME}"] },
              { name: "User-Address", values: ["${walletAddress}"] },
              { name: "Action", values: ["ADD_COMMENT", "UPDATE_COMMENT"] }
            ]
            sort: HEIGHT_DESC
            first: 100
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }
      `;

      const result = await graphql.query(queryString);
      
      if (!result?.transactions?.edges) {
        return [];
      }
      
      // İşlemleri işle
      return await this.processCommentsWithUpdates(result.transactions.edges);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      return [];
    }
  }

  // Yorum sayısını getir
  async getCommentCount(itemId, itemType) {
    try {
      const comments = await this.getComments(itemId, itemType);
      return comments.length;
    } catch (error) {
      console.error('Error getting comment count:', error);
      return 0;
    }
  }

  // İşlem ID'sine göre yorumu getir
  async getCommentByTxId(txId) {
    try {
      const transaction = await graphql.findTransactionById(txId);
      
      if (!transaction) {
        return null;
      }
      
      // İşlem verilerini getir
      const data = await arweaveClient.getTransactionData(txId);
      if (!data) {
        return null;
      }
      
      const parsedData = JSON.parse(data);
      
      // Tag'leri bir objeye dönüştür
      const tags = transaction.tags.reduce((acc, tag) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});
      
      return {
        id: txId,
        ...parsedData,
        rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
        timestamp: transaction.block?.timestamp,
        blockHeight: transaction.block?.height
      };
    } catch (error) {
      console.error('Error fetching comment by txId:', error);
      return null;
    }
  }

  // En çok puanlanan öğeleri getir
  async getMostRatedItems(itemType, limit = 10) {
    try {
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["${APP_NAME}"] },
              { name: "Item-Type", values: ["${itemType}"] },
              { name: "Action", values: ["ADD_COMMENT", "UPDATE_COMMENT"] }
            ]
            sort: HEIGHT_DESC
            first: 100
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                  height
                }
              }
            }
          }
        }
      `;

      const result = await graphql.query(queryString);
      
      if (!result?.transactions?.edges) {
        return [];
      }
      
      // İşlemleri işle
      const allComments = await this.processCommentsWithUpdates(result.transactions.edges);
      
      // Yorumları öğe kimliğine göre grupla
      const commentsByItem = allComments.reduce((acc, comment) => {
        if (!acc[comment.itemId]) {
          acc[comment.itemId] = [];
        }
        acc[comment.itemId].push(comment);
        return acc;
      }, {});
      
      // Her öğe için ortalama puanı hesapla
      const itemRatings = Object.entries(commentsByItem).map(([itemId, comments]) => {
        const ratedComments = comments.filter(comment => comment.rating != null);
        if (ratedComments.length === 0) {
          return { itemId, average: 0, count: 0 };
        }
        
        const sum = ratedComments.reduce((acc, comment) => acc + comment.rating, 0);
        const average = sum / ratedComments.length;
        
        return {
          itemId,
          average: parseFloat(average.toFixed(1)),
          count: ratedComments.length
        };
      });
      
      // Puanı olmayan öğeleri filtrele, ortalama puana göre sırala
      return itemRatings
        .filter(item => item.count > 0)
        .sort((a, b) => b.average - a.average || b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching most rated items:', error);
      return [];
    }
  }
}

export const commentsService = new CommentsService();