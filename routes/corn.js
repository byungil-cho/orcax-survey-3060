const express = require('express');

module.exports = function(db) {
  const router = express.Router();

  router.post('/summary', async (req, res) => {
    const { kakaoId } = req.body;
    try {
      const cornData = await db.collection('corn_data').findOne({ kakaoId });
      res.json(cornData || {});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // 다른 corn 관련 라우트들 추가...
  
  return router;
};
