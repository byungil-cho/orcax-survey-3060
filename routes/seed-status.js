const express = require('express');
const router = express.Router();

const seedStatus = {
  감자: 100,
  보리: 100
};

router.get('/', (req, res) => {
  res.json(seedStatus);
});

module.exports = router;
