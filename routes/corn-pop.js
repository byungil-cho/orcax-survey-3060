'use strict';
const express = require('express');
const router = express.Router();

const User = require('../models/user');           // 기존 유저 스키마 그대로 사용
const CornData = require('../models/CornData');   // 기존 파일 유지, 참조만

// 등급별 토큰 테이블
const TOKEN_TABLE = {
  A: [1000, 900, 800],
  B: [800, 700, 600],
  C: [600, 500, 400],
  D: [400, 300, 200],
  E: [200, 100, 50],
  F: [100, 50, 10],
};

function pickToken(grade = 'F') {
  const arr = TOKEN_TABLE[grade] || TOKEN_TABLE.F;
  return arr[Math.floor(Math.random() * arr.length)];
}

function popcornBonusByQty(qty) {
  if (qty === 9) return 2;
  if (qty === 7) return 1;
  if (qty === 5) return 1;
  return 0;
}

// 헬스 체크(현황 보기)
router.get('/status', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId;
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

    const user = await User.findOne({ kakaoId });
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });

    const ready = (corn.corn || []).filter(c => c.status === 'harvest_ready').length;

    return res.json({
      ok: true,
      user: {
        orcx: Number(user?.orcx ?? user?.wallet?.orcx ?? 0),
        fertilizer: Number(user?.inventory?.fertilizer ?? 0),
      },
      corn: {
        readyCount: ready,
        additives: {
          salt: Number(corn.additives?.salt ?? 0),
          sugar: Number(corn.additives?.sugar ?? 0),
        },
        popcorn: Number(corn.popcorn ?? 0),
        loan: {
          amount: Number(corn.loan?.amount ?? 0),
          interest: Number(corn.loan?.interest ?? 0.30),
        },
      }
    });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

// 뻥튀기: harvest_ready 아이템 qty(5|7|9)개를 한 번에 처리
router.post('/pop', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    const qty = Number(req.body?.qty || 0);
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    if (![5,7,9].includes(qty)) return res.status(400).json({ ok:false, error:'qty must be 5 or 7 or 9' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ ok:false, error:'user not found' });

    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });

    // harvest_ready 아이템 수집
    const readyIdx = [];
    (corn.corn || []).forEach((item, idx) => {
      if (item?.status === 'harvest_ready') readyIdx.push(idx);
    });
    if (readyIdx.length < qty) {
      return res.status(400).json({ ok:false, error:`harvest_ready < ${qty}` });
    }

    // 첨가물 체크
    const salt = Number(corn.additives?.salt ?? 0);
    const sugar = Number(corn.additives?.sugar ?? 0);
    if (salt < qty || sugar < qty) return res.status(400).json({ ok:false, error:'salt/sugar not enough' });

    // 첨가물 소모
    corn.additives.salt = salt - qty;
    corn.additives.sugar = sugar - qty;

    let tokenSum = 0;
    let deducted30Sum = 0;

    // 선택된 수확물 각각 1알씩 뻥튀기 처리
    for (let i = 0; i < qty; i++) {
      const idx = readyIdx[i];
      const item = corn.corn[idx];            // CornItemSchema
      const grade = (item?.grade ?? 'F');     // A..F
      const color = (item?.color ?? 'yellow');// yellow|red|black

      let t = pickToken(grade);

      // 붉/검: 30% 즉시 공제
      if (color === 'red' || color === 'black') {
        const interestRate = Number(corn.loan?.interest ?? 0.30);
        const ded = Math.floor(t * interestRate);
        t -= ded;
        deducted30Sum += ded;
      }

      tokenSum += t;

      // 아이템 소진(가공 완료 → finished)
      item.status = 'finished';
      item.endedAt = new Date();
    }

    // 공제 누계는 loan.amount에 적립(이자 수납 장부)
    corn.loan.amount = Number(corn.loan?.amount ?? 0) + deducted30Sum;

    // 토큰 지급(유저 지갑)
    const prev = Number(user.orcx ?? user.wallet?.orcx ?? 0);
    const next = prev + tokenSum;
    if (typeof user.orcx !== 'undefined') user.orcx = next;
    else {
      user.wallet = user.wallet || {};
      user.wallet.orcx = next;
    }

    // 팝콘(꽝) 보너스 고정 드롭
    const bonusPop = popcornBonusByQty(qty);
    corn.popcorn = Number(corn.popcorn ?? 0) + bonusPop;

    await user.save();
    await corn.save();

    return res.json({
      ok: true,
      processed: qty,
      tokenAdded: tokenSum,
      deducted30: deducted30Sum,
      popcornAdded: bonusPop,
      balances: {
        orcx: next,
        popcorn: corn.popcorn,
        salt: corn.additives.salt,
        sugar: corn.additives.sugar
      }
    });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

// 팝콘 -> 비료(1:1)
router.post('/exchange', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    const qty = Number(req.body?.qty || 0);
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });
    if (!(qty > 0)) return res.status(400).json({ ok:false, error:'qty>0 required' });

    const user = await User.findOne({ kakaoId });
    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });

    if ((corn.popcorn ?? 0) < qty) return res.status(400).json({ ok:false, error:'popcorn not enough' });

    corn.popcorn -= qty;
    user.inventory = user.inventory || {};
    user.inventory.fertilizer = Number(user.inventory.fertilizer ?? 0) + qty;

    await user.save();
    await corn.save();

    return res.json({ ok:true, qty, balances:{ popcorn: corn.popcorn, fertilizer: user.inventory.fertilizer } });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

// 팝콘 1000 → NFT 교환권 1
router.post('/exchange-nft', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    const qty = Number(req.body?.qty || 1); // 교환권 장수
    if (!kakaoId) return res.status(400).json({ ok:false, error:'kakaoId required' });

    const corn = await CornData.findOne({ kakaoId }) || await CornData.create({ kakaoId });
    const need = 1000 * qty;

    if ((corn.popcorn ?? 0) < need) return res.status(400).json({ ok:false, error:`need ${need} popcorn` });

    corn.popcorn -= need;
    // 스키마에 nftTickets 없음 → 장부로만 기록하려면 loan.amount 음수/로그 등 선택
    // 여기서는 popcorn 차감까지만 처리(권장: 추후 corn_data에 nftTickets 필드 추가)
    await corn.save();

    return res.json({ ok:true, qty, popcornSpent: need, popcorn: corn.popcorn });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

module.exports = router;
