const express = require('express');
const router = express.Router();

const seedPrice = {
  감자: 10,
  보리: 15
};

router.get('/', (req, res) => {
  res.json(seedPrice);
});

module.exports = router;
