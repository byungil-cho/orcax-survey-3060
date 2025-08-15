// routes/corn.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CornData = require('../models/CornData');

// 감자(users)에서 물/거름/토큰 조회용
async function getUserBasics(kakaoId){
  const users = mongoose.connection.collection('users');
  const u = await users.findOne({ kakaoId: String(kakaoId) }) || {};
  const inv = u.inventory || {};
  const wallet = u.wallet || {};
  return {
    water:      Number(u.water ?? inv.water ?? 0),
    fertilizer: Number(u.fertilizer ?? inv.fertilizer ?? 0),
    tokens:     Number(u.orcx ?? wallet.tokens ?? 0),
    nickname:   u.nickname || u.name || ''
  };
}

// 생성 보장(없으면 upsert)
async function ensureCorn(kakaoId, nickname=''){
  const doc = await CornData.findOneAndUpdate(
    { kakaoId: String(kakaoId) },
    { $setOnInsert: { kakaoId: String(kakaoId), nickname } },
    { new: true, upsert: true }
  );
  return doc;
}

router.post('/upsert', async (req,res)=>{
  try{
    const { kakaoId, nickname='' } = req.body || {};
    if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const doc = await ensureCorn(kakaoId, nickname);
    res.json({ ok:true, data:doc });
  }catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

router.get('/status', async (req,res)=>{
  try{
    const { kakaoId } = req.query || {};
    if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const doc = await CornData.findOne({ kakaoId: String(kakaoId) });
    res.json({ ok:true, data: doc || null });
  }catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

router.get('/overview', async (req,res)=>{
  try{
    const { kakaoId } = req.query || {};
    if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const [corn, basics] = await Promise.all([
      CornData.findOne({ kakaoId: String(kakaoId) }),
      getUserBasics(kakaoId)
    ]);
    res.json({ ok:true, data:{ corn, basics } });
  }catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

const INC_ALLOWED = new Set([
  'corn','popcorn','seeds',
  'additives.salt','additives.sugar',
  'g'
]);

router.post('/update', async (req,res)=>{
  try{
    const { kakaoId, inc = {}, set = {} } = req.body || {};
    if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

    const $inc = {};
    for(const [k,v] of Object.entries(inc)){
      if(INC_ALLOWED.has(k) && Number(v)) $inc[k] = Number(v);
    }
    const $set = {};
    if(typeof set.nickname === 'string') $set.nickname = set.nickname;
    if(typeof set.phase === 'string')    $set.phase = set.phase;
    if(Object.keys($inc).length === 0 && Object.keys($set).length === 0)
      return res.status(400).json({ ok:false, error:'no valid fields' });

    const doc = await CornData.findOneAndUpdate(
      { kakaoId: String(kakaoId) },
      { ...(Object.keys($inc).length?{ $inc }:{}), ...(Object.keys($set).length?{ $set }:{}) },
      { new:true, upsert:true }
    );
    res.json({ ok:true, data:doc });
  }catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

router.post('/reset-additives', async (req,res)=>{
  try{
    const { kakaoId } = req.body || {};
    if(!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    const doc = await CornData.findOneAndUpdate(
      { kakaoId: String(kakaoId) },
      { $set: { additives:{ salt:0, sugar:0 } } },
      { new:true, upsert:true }
    );
    res.json({ ok:true, data:doc });
  }catch(e){ res.status(500).json({ ok:false, error:e.message }); }
});

module.exports = router;
