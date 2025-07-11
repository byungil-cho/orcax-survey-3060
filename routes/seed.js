const express = require('express');
const router = express.Router();
const Seed = require('../models/Seed');

router.get('/seed/price', async (req, res) => {
  const seeds = await Seed.find({});
  res.json(seeds);
});

router.get('/seed/status', async (req, res) => {
  const seeds = await Seed.find({});
  const status = {};
  seeds.forEach(seed => {
    status[seed.name] = seed.quantity;
  });
  res.json(status);
});

module.exports = router;
