// routes/userdata.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({
    nickname: '범고래X',
    gamja: 0,
    water: 10,
    fertilizer: 10,
    orcx: 10,
    seed: 0,
    sprout: 0,
    inventory: []
  });
});

module.exports = router;
