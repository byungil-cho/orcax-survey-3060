'use strict';
const express = require('express');
const router = express.Router();

// ✅ 누락됐던 모델 임포트
const User = require('../models/user');           // 경로는 프로젝트 구조에 맞게
const CornData = require('../models/CornData');

// 🔐 CORS & 캐시(간단 설정; 필요시 전역 CORS 미들웨어 사용)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 운영 시 특정 도메인으로 제한 권장
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-kakao-id');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache'); res.set('Expires', '0');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ✅ 카카오ID 표준화 미들웨어 (헤더/바디/쿼리 모두 허용)
router.use((req, res, next) => {
  const kid = (req.headers['x-kakao-id'] ||
               (req.body && req.body.kakaoId) ||
               req.query.kakaoId);
  if (!kid) return res.status(401).json({ ok:false, error:'kakaoId missing' });
  req.kakaoId = String(kid);
  next();
});

// ====== 상수/유틸 ======
const HOUR = 3600 * 1000;
const SEG_MS = 3 * HOUR;          // 3시간 = 1구간
const DAY_SEGMENTS = 5;           // 하루 5구간
const TOTAL_SEGMENTS = 25;        // 정상 수확 필요 구간(5일 × 5구간)
const DAY_MS = 24 * HOUR;

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
function gradeFromDays(daysSpent) {
  if (daysSpent <= 5) return 'A';
  if (daysSpent === 6) return 'B';
  if (daysSpent === 7) return 'C';
  if (daysSpent === 8) return 'D';
  if (daysSpent === 9) return 'E';
  return 'F';
}

async function ensureCornDoc(kakaoId) {
  let doc = await CornData.findOne({ kakaoId });
  if (!doc) doc = await CornData.create({ kakaoId });
  return doc;
}

// ====== 핵심: 성장 틱(게으른 평가; 호출 시점에 따라 진행) ======
async function advanceGrowthForUser(kakaoId, opts = {}) {
  const now = opts.now || new Date();

  const user = await User.findOne({ kakaoId });
  const corn = await ensureCornDoc(kakaoId);

  // 안전가드
  user.inventory = user.inventory || {};
  user.inventory.water = Number(user.inventory.water || 0);
  user.inventory.fertilizer = Number(user.inventory.fertilizer || 0);

  corn.corn = Array.isArray(corn.corn) ? corn.corn : [];

  let progressed = 0, readied = 0, consumedWater = 0, consumedFert = 0;

  for (const item of corn.corn) {
    if (item?.status !== 'active') continue;

    // 기준 시간
    const plantedAt = item.plantedAt ? new Date(item.plantedAt) : now;
    let last = item.lastTickAt ? new Date(item.lastTickAt) : plantedAt;

    // 경과 구간(3시간 단위)
    let segs = Math.floor((now - last) / SEG_MS);
    if (segs <= 0) { item.lastTickAt = now; continue; }

    // 아이템 기본 필드 보정
    item.day = Number(item.day || 1);
    item.segment = Number(item.segment || 1);
    item.growthAccum = Number(item.growthAccum || 0);
    item.debthours = Number(item.debthours || 0);

    while (segs > 0) {
      // 구간 1회 진행에 필요한 자원: 물 3, 거름 1
      if (user.inventory.water >= 3 && user.inventory.fertilizer >= 1) {
        user.inventory.water -= 3;
        user.inventory.fertilizer -= 1;
        consumedWater += 3; consumedFert += 1;

        // 구간 진행
        item.segment += 1;
        item.growthAccum += 1;
        progressed += 1;

        if (item.segment > DAY_SEGMENTS) {
          item.segment = 1;
          item.day += 1;
        }

        // 수확 가능 판정(필요 구간 25회 달성)
        if (item.growthAccum >= TOTAL_SEGMENTS) {
          const daysSpent = Math.max(1, Math.floor((now - plantedAt) / DAY_MS) + 1);
          item.grade = gradeFromDays(Math.min(10, daysSpent));
          item.status = 'harvest_ready';
          item.endedAt = now;
          readied += 1;
          break; // 이 알은 끝
        }
      } else {
        // 자원 부족: 시간만 흐름(감점 기록)
        item.debthours += 3;
      }

      // 다음 구간의 기준 시간 이동
      last = new Date(last.getTime() + SEG_MS);
      segs -= 1;
    }

    item.lastTickAt = now;
  }

  await user.save();
  await corn.save();

  return {
    progressed, readied,
    waterLeft: user.inventory.water,
    fertLeft: user.inventory.fertilizer,
    consumedWater, consumedFert
  };
}

// ====== 상태 ======
router.get('/status', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;

    // 상태 조회 시에도 자연 성장 반영(게으른 평가)
    await advanceGrowthForUser(kakaoId);

    const user = await User.findOne({ kakaoId });
    const corn = await ensureCornDoc(kakaoId);

    // readyCount 계산
    const items = Array.isArray(corn.corn) ? corn.corn : [];
    const readyItems = items.filter(x => x?.status === 'harvest_ready');
    const readyCount = readyItems.length;

    // 대표 색/등급(가장 최근 active 또는 ready 우선)
    const rep = readyItems[0] || items.find(x => x?.status === 'active') || items[0] || {};
    const repColor = rep.color || corn.seedType || 'yellow';
    const repGrade = rep.grade || corn.grade || 'F';

    return res.json({
      ok: true,
      user: {
        orcx: Number(user?.orcx ?? user?.wallet?.orcx ?? 0),
        inventory: {
          water: Number(user?.inventory?.water ?? 0),
          fertilizer: Number(user?.inventory?.fertilizer ?? 0),
        },
        // 하위호환
        water: Number(user?.inventory?.water ?? 0),
        fertilizer: Number(user?.inventory?.fertilizer ?? 0),
      },
      corn: {
        readyCount,
        seedType: repColor,
        grade: repGrade,
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

// ====== 심기(자리 생성) ======
router.post('/plant', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;
    const n = Number(req.body?.qty ?? 5);
    const color = (req.body?.color || 'yellow');
    if (![1,5,7,9].includes(n)) return res.status(400).json({ ok:false, error:'qty must be 1 or 5|7|9' });

    const corn = await ensureCornDoc(kakaoId);
    corn.corn = Array.isArray(corn.corn) ? corn.corn : [];

    const now = new Date();
    for (let i = 0; i < n; i++) {
      corn.corn.push({
        color, grade: null,
        day: 1, segment: 1,
        waterBuffer: 0, fertBuffer: 0,
        growthAccum: 0, debthours: 0,
        status: 'active',
        plantedAt: now,
        lastTickAt: now,
        endedAt: null
      });
    }
    await corn.save();

    return res.json({ ok:true, planted:n, active: corn.corn.filter(x=>x.status==='active').length });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

// ====== 강제 성장 틱(개발/동기화용) ======
router.post('/tick', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;
    const result = await advanceGrowthForUser(kakaoId);
    return res.json({ ok:true, ...result });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

// ====== 뻥튀기: harvest_ready 아이템 qty(5|7|9)개를 한 번에 처리 ======
router.post('/pop', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;
    const qty = Number(req.body?.qty || 0);
    if (![5,7,9].includes(qty)) return res.status(400).json({ ok:false, error:'qty must be 5 or 7 or 9' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ ok:false, error:'user not found' });

    const corn = await ensureCornDoc(kakaoId);

    // 뻥튀기는 "수확 준비(ready)"된 알만 사용
    const items = Array.isArray(corn.corn) ? corn.corn : [];
    const readyIdx = [];
    items.forEach((item, idx) => { if (item?.status === 'harvest_ready') readyIdx.push(idx); });

    if (readyIdx.length < qty) {
      return res.status(400).json({ ok:false, error:`harvest_ready < ${qty}` });
    }

    // 첨가물 체크/소모
    const salt = Number(corn.additives?.salt ?? 0);
    const sugar = Number(corn.additives?.sugar ?? 0);
    if (salt < qty || sugar < qty) return res.status(400).json({ ok:false, error:'salt/sugar not enough' });
    corn.additives.salt  = salt  - qty;
    corn.additives.sugar = sugar - qty;

    let tokenSum = 0;
    let deducted30Sum = 0;

    for (let i = 0; i < qty; i++) {
      const idx = readyIdx[i];
      const item = items[idx];                 // { color, grade, status:'harvest_ready', ... }
      const grade = (item?.grade ?? 'F');      // A..F
      const color = (item?.color ?? 'yellow'); // yellow|red|black

      let t = pickToken(grade);

      // 붉/검: 30% 즉시 공제
      if (color === 'red' || color === 'black') {
        const interestRate = Number(corn.loan?.interest ?? 0.30);
        const ded = Math.floor(t * interestRate);
        t -= ded;
        deducted30Sum += ded;
      }

      tokenSum += t;

      // 아이템 소진(완료)
      item.status = 'finished';
      item.endedAt = new Date();
    }

    // 공제 누계는 loan.amount에 적립(이자 수납 장부)
    corn.loan = corn.loan || {};
    corn.loan.amount = Number(corn.loan.amount ?? 0) + deducted30Sum;

    // 토큰 지급(유저 지갑)
    const prev = Number(user?.orcx ?? user?.wallet?.orcx ?? 0);
    const next = prev + tokenSum;
    if (typeof user.orcx !== 'undefined') user.orcx = next;
    else { user.wallet = user.wallet || {}; user.wallet.orcx = next; }

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

// ====== 교환: 팝콘 -> 비료(1:1) ======
router.post('/exchange', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;
    const qty = Number(req.body?.qty || 0);
    if (!(qty > 0)) return res.status(400).json({ ok:false, error:'qty>0 required' });

    const user = await User.findOne({ kakaoId });
    const corn = await ensureCornDoc(kakaoId);

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

// ====== 교환: 팝콘 1000 → NFT 교환권 1 ======
router.post('/exchange-nft', async (req, res) => {
  try {
    const kakaoId = req.kakaoId;
    const qty = Number(req.body?.qty || 1);
    const corn = await ensureCornDoc(kakaoId);
    const need = 1000 * qty;

    if ((corn.popcorn ?? 0) < need) return res.status(400).json({ ok:false, error:`need ${need} popcorn` });

    corn.popcorn -= need;
    await corn.save();

    return res.json({ ok:true, qty, popcornSpent: need, popcorn: corn.popcorn });
  } catch (e) {
    res.status(500).json({ ok:false, error:e.message });
  }
});

module.exports = router;
