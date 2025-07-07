// routes/seed-status.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    seed: 0,
    sprout: 0
  });
});

module.exports = router;
