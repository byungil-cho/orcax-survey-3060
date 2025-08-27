// routes/corn-grow.js
const express = require('express');
const router = express.Router();
const CornData = require('../models/cornData');   // 이미 서버에 있는 모델 사용

// 🌱 성장 계산 함수
function calcGrowth(startAt) {
  if (!startAt) return { progress:0, stage:"IDLE", bg:"farm_idle.png" };
  const elapsedH = Math.floor((Date.now() - startAt) / 3600000);
  let progress = Math.min(100, elapsedH * 5);   // 시간당 5% 성장
  let stage = "SEED", bg = "farm_spring.png";
  if (elapsedH >= 24) { stage="LEAF"; bg="farm_summer.png"; }
  if (elapsedH >= 48) { stage="FLOWER"; bg="farm_autumn.png"; }
  if (elapsedH >= 72) { stage="READY"; bg="farm_ready.png"; }
  return { progress, stage, bg };
}

// 🌱 씨앗 심기
router.post('/plant', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ error:'kakaoId 필요' });

    let corn = await CornData.findOne({ kakaoId });
    if (!corn) corn = await CornData.create({ kakaoId });

    if (corn.phase === 'GROW') {
      return res.status(400).json({ error:'이미 심어진 옥수수 있음' });
    }
    if (corn.agri.seed <= 0) {
      return res.status(400).json({ error:'씨앗 부족' });
    }

    corn.agri.seed -= 1;   // 살아있는 씨앗 감소
    corn.phase = 'GROW';
    corn.startAt = Date.now();
    await corn.save();

    res.json({ ok:true, phase:corn.phase, startAt:corn.startAt, seeds:corn.agri.seed });
  } catch(e){
    console.error('[corn/plant]', e);
    res.status(500).json({ error:'server error' });
  }
});

// 🌱 성장 상태 요약
router.get('/summary', async (req,res) => {
  try {
    const kakaoId = req.query.kakaoId;
    let corn = await CornData.findOne({ kakaoId });
    if (!corn) corn = await CornData.create({ kakaoId });

    const g = calcGrowth(corn.startAt);
    res.json({
      ok:true,
      phase: corn.phase || 'IDLE',
      seeds: corn.agri.seed || 0,
      corn: corn.agri.corn || 0,
      progress: g.progress,
      growthStage: g.stage,
      bgImage: g.bg
    });
  } catch(e){
    console.error('[corn/summary]', e);
    res.status(500).json({ error:'server error' });
  }
});

module.exports = router;
