// routes/init-user.js
const mongoose = require('mongoose');

function getUserModel() {
  if (mongoose.models.User) return mongoose.models.User;
  const UserSchema = new mongoose.Schema({
    kakaoId: { type: String, unique: true, index: true },
    nickname: { type: String, default: 'Guest' },
    orcx: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    fertilizer: { type: Number, default: 0 },
    seedPotato: { type: Number, default: 0 },
    seedBarley: { type: Number, default: 0 },
    storage: {
      gamja: { type: Number, default: 0 },
      bori:  { type: Number, default: 0 },
    },
    products: { type: Object, default: {} },
    growth:   { type: Object, default: {} },
    lastLogin: Date,
  }, { collection: 'users' });
  return mongoose.model('User', UserSchema);
}

function getCornDataModel() {
  if (mongoose.models.CornData) return mongoose.models.CornData;
  const CornSchema = new mongoose.Schema({
    kakaoId: { type: String, unique: true, index: true },
    corn:    { type: Number, default: 0 },
    popcorn: { type: Number, default: 0 },
    seed:    { type: Number, default: 0 },
    seeds:   { type: Number, default: 0 },
    additives: {
      salt:  { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },
  }, { collection: 'corn_data' });
  return mongoose.model('CornData', CornSchema);
}

module.exports = function initUserAPI(app) {
  const User = getUserModel();
  const CornData = getCornDataModel();

  async function upsertAll(kakaoId, nickname) {
    // users upsert
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = await User.create({ kakaoId, nickname, lastLogin: new Date() });
    } else {
      if (nickname && user.nickname !== nickname) user.nickname = nickname;
      user.lastLogin = new Date();
      await user.save();
    }
    // corn_data upsert
    let corn = await CornData.findOne({ kakaoId });
    if (!corn) { try { await CornData.create({ kakaoId }); } catch {} }
    return { kakaoId: user.kakaoId, nickname: user.nickname };
  }

  // GET (레거시 프론트 대응)
  app.get('/api/init-user', async (req, res) => {
    try {
      const kakaoId  = req.query.kakaoId || req.body?.kakaoId;
      const nickname = req.query.nickname || req.body?.nickname || 'Guest';
      if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
      const r = await upsertAll(kakaoId, nickname);
      res.json({ success:true, ...r });
    } catch (e) {
      console.error('[GET /api/init-user]', e);
      res.status(500).json({ success:false });
    }
  });

  // POST (신규 프론트/툴 호출)
  app.post('/api/init-user', async (req, res) => {
    try {
      const { kakaoId, nickname='Guest' } = req.body || {};
      if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId required' });
      const r = await upsertAll(kakaoId, nickname);
      res.json({ success:true, ...r });
    } catch (e) {
      console.error('[POST /api/init-user]', e);
      res.status(500).json({ success:false });
    }
  });
};
