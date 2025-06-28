
// api/userdata.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

router.get('/', async (req, res) => {
  const { kakaoId } = req.query;
  if (!kakaoId) return res.status(400).json({ success:false });

  const user = await User.findOne({ kakaoId })
    .select('orcx seedPotato seedBarley water fertilizer potato inventory');
  if (!user) return res.status(404).json({ success:false });

  res.json({ success:true, users:[user] });
});

module.exports = router;
