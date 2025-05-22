const express = require('express');
const router = express.Router();
const axios = require('axios');

// Gateway kontrolü için proxy endpoint'i
router.head('/gateway-check/:gateway', async (req, res) => {
  const { gateway } = req.params;
  
  try {
    // Gateway'in /info endpoint'ine istek at
    const response = await axios.head(`https://${gateway}/info`, {
      timeout: 5000
    });
    
    // Gateway yanıt veriyorsa başarılı
    if (response.status >= 200 && response.status < 300) {
      return res.status(200).end();
    }
    
    // Gateway yanıt vermiyorsa hata
    return res.status(503).end();
  } catch (error) {
    console.error(`Gateway kontrol hatası (${gateway}):`, error.message);
    return res.status(503).end();
  }
});

module.exports = router; 