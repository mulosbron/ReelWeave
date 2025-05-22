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
    if (!transactions || !transactions.length) {
      console.log('No transactions to process');
      return [];
    }
    
    console.log(`Processing ${transactions.length} transactions`);
    
    // Track all comments directly
    const allComments = [];
    
    // Process each transaction
    for (const edge of transactions) {
      try {
        const node = edge.node;
        
        // Convert tags to an object (case insensitive)
        const tags = {};
        node.tags.forEach(tag => {
          tags[tag.name.toLowerCase()] = tag.value;
        });
        
        // Check for various tag naming formats
        const itemId = 
          tags['item-id'] || 
          tags['itemid'] || 
          tags['content-id'] || 
          tags['contentid'] || 
          tags['video-id'] || 
          tags['videoid'];
          
        const itemType = 
          tags['item-type'] || 
          tags['itemtype'] || 
          tags['content-type'] || 
          tags['contenttype'] || 
          tags['type'];
          
        const action = 
          (tags['action'] || '').toLowerCase();
          
        const userAddress = 
          tags['user-address'] || 
          tags['useraddress'] || 
          tags['user-id'] || 
          tags['userid'] || 
          tags['wallet-address'] || 
          tags['walletaddress'];
          
        const rating = 
          tags['rating'] ? parseInt(tags['rating']) : null;
        
        // Debug log
        console.log(`Processing transaction ${node.id}: Action=${action}, ItemId=${itemId}, ItemType=${itemType}, User=${userAddress}`);
        
        // Check if this is a comment action (be more inclusive with action types)
        const isCommentAction = 
          action === 'add-comment' || 
          action === 'update-comment' || 
          action === 'comment' || 
          action === 'add_comment' || 
          action === 'update_comment';
          
        if (!isCommentAction) {
          console.log(`Skipping transaction ${node.id} - not a comment action (${action})`);
          continue;
        }
        
        // Skip if missing required tags
        if (!itemId || !userAddress) {
          console.log(`Skipping transaction ${node.id} - missing required tags: ItemId=${itemId}, User=${userAddress}`);
          continue;
        }
        
        // Create a basic comment from tags
        const timestamp = node.block?.timestamp || Math.floor(Date.now() / 1000);
        const comment = {
          id: node.id,
          content: 'No content available',
          author: userAddress,
          itemId: itemId,
          itemType: itemType || 'unknown', // Provide a default value
          rating: rating,
          createdAt: new Date(timestamp * 1000).toISOString(),
          updatedAt: new Date(timestamp * 1000).toISOString(),
          timestamp: timestamp,
          blockHeight: node.block?.height || 0,
          txId: node.id
        };
        
        try {
          // Try to get transaction data
          const data = await arweaveClient.getTransactionData(node.id);
          
          // If data exists, try to parse it
          if (data) {
            try {
              const parsedData = typeof data === 'object' && data !== null ? data : JSON.parse(data);
              
              // Update comment with parsed data
              if (parsedData.content) {
                comment.content = parsedData.content;
              }
              if (parsedData.rating && !isNaN(parsedData.rating)) {
                comment.rating = parseInt(parsedData.rating);
              }
              if (parsedData.itemType && !comment.itemType) {
                comment.itemType = parsedData.itemType;
              }
              if (parsedData.createdAt) {
                comment.createdAt = parsedData.createdAt;
              }
              if (parsedData.updatedAt) {
                comment.updatedAt = parsedData.updatedAt;
              }
            } catch (parseError) {
              console.error(`JSON parse error for ${node.id}:`, parseError);
              // Continue with the basic comment from tags
            }
          }
        } catch (dataError) {
          console.error(`Error getting transaction data (${node.id}):`, dataError);
          // Continue with the basic comment from tags
        }
        
        // Add to comments array
        allComments.push(comment);
        console.log(`Added comment from ${userAddress} for ${comment.itemType} ${itemId}`);
        
      } catch (error) {
        console.error('Error processing transaction:', error);
        continue;
      }
    }
    
    console.log(`Processed ${allComments.length} comments from all users`);
    
    // Find the latest comment for each user+item combination
    const latestCommentsByUserAndItem = new Map();
    
    for (const comment of allComments) {
      const userItemKey = `${comment.author}-${comment.itemId}-${comment.itemType}`;
      
      // Check if we already have a comment for this user+item
      const existingComment = latestCommentsByUserAndItem.get(userItemKey);
      
      // Determine which is newer using timestamp
      if (!existingComment || (comment.timestamp > existingComment.timestamp)) {
        latestCommentsByUserAndItem.set(userItemKey, comment);
      }
    }
    
    // Convert map to array and return comments
    const uniqueComments = Array.from(latestCommentsByUserAndItem.values());
    console.log(`Returning ${uniqueComments.length} unique comments`);
    
    return uniqueComments;
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
        // Eğer data zaten bir nesne ise, JSON.parse etmeye gerek yok
        const parsedData = typeof data === 'object' && data !== null ? data : JSON.parse(data);
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
        
        // Parse hatası durumunda tag'lerden bir yorum oluşturmayı dene
        if (data === '[object Object]' || parseError instanceof SyntaxError) {
          console.log(`JSON parse hatası, tag'lerden yorum oluşturuluyor: ${latestCommentNode.id}`);
          
          // Tag'leri bir objeye dönüştür
          const tags = latestCommentNode.tags.reduce((acc, tag) => {
            acc[tag.name] = tag.value;
            return acc;
          }, {});
          
          // Sadece tag'lerdeki bilgilerle yorum oluştur
          const comment = {
            id: latestCommentNode.id,
            content: tags['Content'] || '',
            author: tags['User-Address'],
            itemId: tags['Item-Id'],
            itemType: tags['Item-Type'],
            rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
            timestamp: latestCommentNode.block?.timestamp,
            blockHeight: latestCommentNode.block?.height,
            txId: latestCommentNode.id,
            action: tags['Action']
          };
          
          console.log(`Tag'lerden yorum oluşturuldu:`, comment);
          return comment;
        }
        
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
      
      // Tag'leri bir objeye dönüştür
      const tags = transaction.tags.reduce((acc, tag) => {
        acc[tag.name] = tag.value;
        return acc;
      }, {});
      
      try {
        // Eğer data zaten bir nesne ise, JSON.parse etmeye gerek yok
        const parsedData = typeof data === 'object' && data !== null ? data : JSON.parse(data);
        
        return {
          id: txId,
          ...parsedData,
          rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
          timestamp: transaction.block?.timestamp,
          blockHeight: transaction.block?.height
        };
      } catch (parseError) {
        console.error(`İşlem verisi ayrıştırılırken hata oluştu: ${txId}`, parseError);
        
        // Parse hatası durumunda tag'lerden bir yorum oluşturmayı dene
        if (data === '[object Object]' || parseError instanceof SyntaxError) {
          return {
            id: txId,
            content: tags['Content'] || '',
            rating: tags['Rating'] ? parseInt(tags['Rating']) : null,
            timestamp: transaction.block?.timestamp,
            blockHeight: transaction.block?.height
          };
        }
        
        return null;
      }
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

  // Tüm yorumları getir
  async getAllComments() {
    try {
      console.log('Tüm yorumlar getiriliyor...');
      
      // Daha geniş bir sorgu yapalım - sadece Content-Type tagini dahil edelim
      const queryString = `
        query {
          transactions(
            tags: [
              { name: "App-Name", values: ["${APP_NAME}"] },
              { name: "Content-Type", values: ["application/json"] }
            ]
            sort: HEIGHT_DESC
            first: 200
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
      console.log("GraphQL result for all comments:", result);
      
      if (!result?.transactions?.edges) {
        console.log("No transactions found");
        return [];
      }
      
      // Tüm işlemleri al ve sonradan filtrele
      const allTransactions = result.transactions.edges;
      console.log(`Found ${allTransactions.length} total transactions`);
      
      // İşlemleri işle
      const processedComments = await this.processCommentsWithUpdates(allTransactions);
      
      // Sadece yorum işlemlerini filtrele
      const commentActions = processedComments.filter(comment => 
        comment.content && comment.author && comment.itemId && comment.itemType
      );
      
      console.log(`Found ${commentActions.length} comment actions`);
      return commentActions;
    } catch (error) {
      console.error('Error fetching all comments:', error);
      return [];
    }
  }
}

export const commentsService = new CommentsService();