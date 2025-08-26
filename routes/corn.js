// routes/corn.js
const express = require('express');
const router = express.Router();

const {
  isSleep, nowPhase, activeHoursBetween,
  SEGMENT_HOURS, DAY_SEGMENTS, isHarvestWindow, isReserveWindow, atTime, addDays
} = require('../utils/farmTime');

const User = require('../models/User');
const CornData = require('../models/CornData');

// --------- 내부 헬퍼 ---------
function getCurrentItem(doc) {
  if (!doc?.corn?.length) return null;
  const last = doc.corn[doc.corn.length - 1];
  return last && !last.endedAt ? last : null;
}
function pushNewItem(doc, item) {
  doc.corn.push(item);
  return getCurrentItem(doc);
}
function endCurrentItem(doc, status = 'finished', grade = null, now = new Date()) {
  const cur = getCurrentItem(doc);
  if (!cur) return;
  cur.status = status;
  cur.endedAt = now;
  if (grade) cur.grade = grade;
}

function summarizeCorn(doc) {
  const cur = getCurrentItem(doc);
  const count = Array.isArray(doc.corn) ? doc.corn.length : 0;
  const yellow = doc.corn.filter(c => c.color==='yellow').length;
  const red    = doc.corn.filter(c => c.color==='red').length;
  const black  = doc.corn.filter(c => c.color==='black').length;
  return { count, yellow, red, black, cur };
}

// 예약 자동 활성화(다음날 08:00), 1구간 자동충족(물3/거름1) → 2구간으로
async function maybeAutoActivateReservation(doc, now = new Date()) {
  if (doc.status !== 'reserved') return;
  if (!doc.reservation?.scheduledAt) return;

  if (now >= doc.reservation.scheduledAt) {
    // 진행 중이 없어야 함
    const cur = getCurrentItem(doc);
    if (!cur) {
      pushNewItem(doc, {
        color: (doc.loan?.amount ?? 0) > 0 ? 'black' : 'yellow',
        status: 'active',
        plantedAt: now,
        day: 1, segment: 2, // 1구간 자동 완료 → 2구간 진입
        waterBuffer: 0,
        fertBuffer: 0,
        growthAccum: 0,
        debtHours: 0,
        lastTickAt: now
      });
    } else {
      // 예외적으로 진행중이면 예약 무시
    }
    // 예약 해제 + 상태 active
    doc.reservation = { scheduledAt: null, createdAt: null };
    doc.status = 'active';
    await doc.save();
  }
}

// 시간 경과에 따라 버퍼/진행/빚 갱신 (요약형 시뮬레이션)
function syncProgress(cur, now = new Date()) {
  if (!cur || cur.status !== 'active') return;
  if (!cur.lastTickAt) { cur.lastTickAt = now; return; }

  // 휴면시간은 진행 없음(enter 시점에만 불림 → 이미 활성 구간)
  const elapsed = activeHoursBetween(cur.lastTickAt, now);
  if (elapsed <= 0) { cur.lastTickAt = now; return; }

  let remain = elapsed;
  while (remain > 0) {
    const effective = Math.min(remain, cur.waterBuffer, cur.fertBuffer);
    if (effective > 0) {
      cur.waterBuffer -= effective;
      cur.fertBuffer  -= effective;
      cur.growthAccum += effective;
      remain          -= effective;

      while (cur.growthAccum >= SEGMENT_HOURS) {
        cur.growthAccum -= SEGMENT_HOURS;
        cur.segment += 1;
        if (cur.segment > DAY_SEGMENTS) {
          cur.segment = 1;
          cur.day += 1;
        }
        if (cur.day > 10) { // 11일차 진입 → 폐농
          cur.status = 'failed';
          return;
        }
      }
    } else {
      // 자원 0 상태로 활성시간 흘림 → 빚
      cur.debtHours += remain;
      remain = 0;
      // 6시간 초과 빚은 그날 실패로 간주 → 등급 하락은 수확시 totalDays로 반영
    }
  }
  cur.lastTickAt = now;
}

// UI 플래그 구성
function buildUI(doc, now = new Date()) {
  const sleep = isSleep(now);
  let ui = { showReserveButton: false, banner: null };
  if (sleep) { ui.banner = '휴면'; }

  if (doc.status === 'fallow') {
    ui.banner = '휴농';
    ui.showReserveButton = isReserveWindow(now, doc.fallowSince);
  } else if (doc.status === 'reserved') {
    ui.banner = '예약';
    ui.showReserveButton = false;
  } else if (doc.status === 'failed') {
    ui.banner = '폐농';
  } else if (doc.status === 'harvest_ready') {
    ui.banner = '수확가능';
  } else {
    ui.banner = ui.banner || '활성';
  }
  return { sleep, ui };
}

// --------- 라우트 ---------

// 1) 입장: corn_data 보장 + 상태/자원 합본
router.post('/api/corn-enter', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const [user, doc0] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found (login first)' });
    let doc = doc0;
    if (!doc) {
      doc = await CornData.create({
        kakaoId, status: 'fallow', corn: [],
        popcorn: 0, seed: 0, seeds: 0,
        additives: { salt: 0, sugar: 0 },
        loan: { amount: 0, interest: 0.30, createdAt: null }
      });
    }

    const now = new Date();
    await maybeAutoActivateReservation(doc, now);

    // 진행 중이면 동기화(휴면 시간은 서버가 자동 차단)
    const cur = getCurrentItem(doc);
    if (cur && !isSleep(now) && cur.status === 'active') {
      syncProgress(cur, now);
      // 수확 가능 상태 진입 체크(5일차 5구간 완료 시점에 21~23시에만 수확 버튼)
      if (cur.day >= 5 && cur.segment === 5 && isHarvestWindow(now)) {
        doc.status = 'harvest_ready';
      } else if (doc.status !== 'reserved' && doc.status !== 'fallow' && cur.status === 'active') {
        doc.status = 'active';
      }
      await doc.save();
    }

    const sum = summarizeCorn(doc);
    const { sleep, ui } = buildUI(doc, now);

    return res.json({
      ok: true,
      kakaoId,
      nickname: user.nickname ?? nickname ?? '',
      // users 자원
      water: user.water ?? 0,
      fertilizer: user.fertilizer ?? 0,
      tokens: user.tokens ?? user.orcx ?? 0,
      // corn_data 요약(숫자만)
      cornCount: sum.count,
      cornYellow: sum.yellow,
      cornRed: sum.red,
      cornBlack: sum.black,
      popcorn: doc.popcorn ?? 0,
      seed: (doc.seed ?? 0) + (doc.seeds ?? 0),
      salt: doc.additives?.salt ?? 0,
      sugar: doc.additives?.sugar ?? 0,
      // 상태/창구
      status: doc.status,
      fallowSince: doc.fallowSince,
      reservationAt: doc?.reservation?.scheduledAt ?? null,
      sleep,
      ui
    });
  } catch (e) {
    console.error('[POST /api/corn-enter] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 2) 씨 심기: normal | loan | reserve
router.post('/api/corn-plant', async (req, res) => {
  try {
    const { kakaoId, mode = 'normal', loanAmount = 0 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const now = new Date();
    if (isSleep(now)) return res.status(403).json({ ok: false, message: 'sleep time' });

    const [user, doc] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found (enter corn farm first)' });

    // 진행/예약 중이면 차단
    if (doc.status === 'active' || doc.status === 'reserved' || getCurrentItem(doc)) {
      return res.status(409).json({ ok: false, message: 'already planting (active/reserved)' });
    }

    if (mode === 'reserve') {
      // 씨앗 즉시 소모
      const totalSeed = (doc.seed ?? 0) + (doc.seeds ?? 0);
      if (totalSeed <= 0) return res.status(400).json({ ok: false, message: 'no seed' });
      if (doc.seed > 0) doc.seed -= 1; else doc.seeds = Math.max(0, (doc.seeds || 0) - 1);
      // 예약: 다음날 08:00
      const tomorrow8 = atTime(addDays(now, 1), 8);
      doc.reservation = { scheduledAt: tomorrow8, createdAt: now };
      doc.status = 'reserved';
      await doc.save();
      return res.json({ ok: true, status: doc.status, reservationAt: doc.reservation.scheduledAt, seed: (doc.seed ?? 0) + (doc.seeds ?? 0) });
    }

    // 즉시 심기 (normal / loan)
    let color = (doc.loan?.amount ?? 0) > 0 ? 'black' : 'yellow';
    if (mode === 'loan') {
      if (!loanAmount || loanAmount <= 0) return res.status(400).json({ ok: false, message: 'loanAmount required' });
      doc.loan = doc.loan || { amount: 0, interest: 0.30, createdAt: now };
      doc.loan.amount = (doc.loan.amount || 0) + loanAmount;
      if (!doc.loan.createdAt) doc.loan.createdAt = now;
      color = 'red';
    } else {
      // normal: 씨앗 1개 필요
      const totalSeed = (doc.seed ?? 0) + (doc.seeds ?? 0);
      if (totalSeed <= 0) return res.status(400).json({ ok: false, message: 'no seed' });
      if (doc.seed > 0) doc.seed -= 1; else doc.seeds = Math.max(0, (doc.seeds || 0) - 1);
    }

    pushNewItem(doc, {
      color, status: 'active', plantedAt: now,
      day: 1, segment: 1, waterBuffer: 0, fertBuffer: 0, growthAccum: 0, debtHours: 0, lastTickAt: now
    });
    doc.status = 'active';
    await doc.save();

    return res.json({ ok: true, status: doc.status, color, seed: (doc.seed ?? 0) + (doc.seeds ?? 0) });
  } catch (e) {
    console.error('[POST /api/corn-plant] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 3) 물/거름 (버퍼 채우기 + 진행 동기화)
router.post('/api/corn/water', async (req, res) => {
  try {
    const { kakaoId, amount = 1 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    const now = new Date();
    if (isSleep(now)) return res.status(403).json({ ok: false, message: 'sleep time' });

    const [user, doc] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    const cur = getCurrentItem(doc);
    if (!cur || cur.status !== 'active') return res.status(400).json({ ok: false, message: 'no active crop' });

    const give = Math.max(0, Math.min(amount, user.water ?? 0));
    if (give <= 0) return res.status(400).json({ ok: false, message: 'no water' });

    user.water -= give;
    cur.waterBuffer += give; // 1개 = 1시간
    syncProgress(cur, now);

    await Promise.all([user.save(), doc.save()]);
    return res.json({ ok: true, day: cur.day, segment: cur.segment, waterBuffer: cur.waterBuffer, fertBuffer: cur.fertBuffer, water: user.water });
  } catch (e) {
    console.error('[POST /api/corn/water] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.post('/api/corn/fertilize', async (req, res) => {
  try {
    const { kakaoId, amount = 1 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    const now = new Date();
    if (isSleep(now)) return res.status(403).json({ ok: false, message: 'sleep time' });

    const [user, doc] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    const cur = getCurrentItem(doc);
    if (!cur || cur.status !== 'active') return res.status(400).json({ ok: false, message: 'no active crop' });

    const give = Math.max(0, Math.min(amount, user.fertilizer ?? 0));
    if (give <= 0) return res.status(400).json({ ok: false, message: 'no fertilizer' });

    user.fertilizer -= give;
    cur.fertBuffer += (give * SEGMENT_HOURS); // 1개 비료 = 3시간 커버
    syncProgress(cur, now);

    await Promise.all([user.save(), doc.save()]);
    return res.json({ ok: true, day: cur.day, segment: cur.segment, waterBuffer: cur.waterBuffer, fertBuffer: cur.fertBuffer, fertilizer: user.fertilizer });
  } catch (e) {
    console.error('[POST /api/corn/fertilize] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 4) 수확
router.post('/api/corn-harvest', async (req, res) => {
  try {
    const { kakaoId } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    const now = new Date();
    if (isSleep(now)) return res.status(403).json({ ok: false, message: 'sleep time' });
    if (!isHarvestWindow(now)) return res.status(400).json({ ok: false, message: 'not harvest window' });

    const doc = await CornData.findOne({ kakaoId });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    const cur = getCurrentItem(doc);
    if (!cur || cur.status === 'finished' || cur.status === 'failed') {
      return res.status(400).json({ ok: false, message: 'no harvestable crop' });
    }

    // 최신 진행 반영
    syncProgress(cur, now);
    // 5일차(또는 지연)에서 수확
    const totalActiveHours = activeHoursBetween(cur.plantedAt, now);
    const totalDays = Math.ceil(totalActiveHours / (DAY_SEGMENTS * SEGMENT_HOURS));
    const grade = (totalDays > 10) ? '폐농' : (totalDays < 5 ? 'A' : (['A','B','C','D','E','F'][Math.min(5, totalDays-5)]));

    endCurrentItem(doc, grade === '폐농' ? 'failed' : 'finished', grade, now);
    doc.status = 'fallow';
    doc.fallowSince = now;

    await doc.save();
    return res.json({ ok: true, grade, status: doc.status, fallowSince: doc.fallowSince });
  } catch (e) {
    console.error('[POST /api/corn-harvest] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 5) 뻥튀기 / 대출
const LOAN_POP_DEDUCTION = 0.30;
const DAILY_PENALTY_RATE = 0.05;

function daysBetweenUTC(a, b) {
  const A = new Date(Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()));
  const B = new Date(Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()));
  return Math.max(0, Math.round((B - A)/86400000));
}

router.post('/api/corn-pop', async (req, res) => {
  try {
    const { kakaoId, amount = 0, colorRule = 'yellow' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    if (!amount || amount <= 0) return res.status(400).json({ ok: false, message: 'amount required' });

    const [user, doc] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    if ((doc.popcorn ?? 0) < amount) return res.status(400).json({ ok: false, message: 'not enough popcorn' });

    let payout = amount;
    let deduction = 0;
    let penalty = 0;

    if (colorRule === 'red' || colorRule === 'black') {
      deduction = Math.floor(amount * LOAN_POP_DEDUCTION);
      payout -= deduction;
    }
    if (colorRule === 'black') {
      const loanAmt = doc?.loan?.amount ?? 0;
      if (loanAmt > 0 && doc.loan?.createdAt) {
        const days = daysBetweenUTC(new Date(doc.loan.createdAt), new Date());
        penalty = Math.floor(loanAmt * DAILY_PENALTY_RATE * days);
        payout = Math.max(0, payout - penalty);
      }
    }

    doc.popcorn = (doc.popcorn || 0) - amount;
    user.tokens = (user.tokens || user.orcx || 0) + payout;

    await Promise.all([user.save(), doc.save()]);
    return res.json({ ok: true, tokensAdded: payout, deduction30: deduction, blackPenalty: penalty, tokens: user.tokens, popcorn: doc.popcorn });
  } catch (e) {
    console.error('[POST /api/corn-pop] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

router.post('/api/corn-repay', async (req, res) => {
  try {
    const { kakaoId, payAmount = 0 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    if (!payAmount || payAmount <= 0) return res.status(400).json({ ok: false, message: 'payAmount required' });

    const [user, doc] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!doc) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    if ((user.tokens ?? user.orcx ?? 0) < payAmount) {
      return res.status(400).json({ ok: false, message: 'not enough tokens' });
    }

    user.tokens = (user.tokens || user.orcx || 0) - payAmount;
    doc.loan = doc.loan || { amount: 0, interest: 0.30, createdAt: new Date() };
    doc.loan.amount = Math.max(0, (doc.loan.amount || 0) - payAmount);

    await Promise.all([user.save(), doc.save()]);
    return res.json({ ok: true, tokens: user.tokens, loanAmount: doc.loan.amount });
  } catch (e) {
    console.error('[POST /api/corn-repay] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/*===여기부터 추가한 사항임=====*/

/* ====== 가격보드 읽기 (없으면 기본값) ====== */
async function getPriceboard() {
  try {
    const doc = await CornSettings.findOne();
    const pb = doc?.priceboard || {};
    return {
      seed: Number(pb.seed ?? 30),
      salt: Number(pb.salt ?? 10),
      sugar: Number(pb.sugar ?? 20),
      currency: String(pb.currency || 'ORCX'),
    };
  } catch {
    return { seed: 30, salt: 10, sugar: 20, currency: 'ORCX' };
  }
}

/* ====== 유저 ORCX 읽고/쓰기 (스키마 차이 흡수) ====== */
function readOrcx(user) {
  if (!user) return 0;
  if (user.wallet && typeof user.wallet.orcx === 'number') return user.wallet.orcx;
  if (typeof user.orcx === 'number') return user.orcx;
  if (typeof user.token === 'number') return user.token;
  return 0;
}
function writeOrcx(user, value) {
  if (user.wallet && typeof user.wallet.orcx === 'number') { user.wallet.orcx = value; return; }
  if (typeof user.orcx === 'number') { user.orcx = value; return; }
  if (typeof user.token === 'number') { user.token = value; return; }
  // 위 필드가 아예 없으면 wallet.orcx로 저장
  if (!user.wallet) user.wallet = {};
  user.wallet.orcx = value;
}

/* ====== 구매 처리 ====== */
router.post('/purchase', async (req, res) => {
  try {
    const { kakaoId, item, qty } = req.body || {};
    const safeItem = String(item || '').toLowerCase();
    const safeQty  = Math.max(1, Number(qty || 1));

    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId 누락' });
    if (!['seed','salt','sugar'].includes(safeItem)) {
      return res.status(400).json({ success:false, message:'구매 항목 오류' });
    }

    const prices = await getPriceboard();
    const pricePer = prices[safeItem]; // seed/salt/sugar
    const totalCost = pricePer * safeQty;

    const session = await mongoose.startSession();
    session.startTransaction();

    const user = await User.findOne({ kakaoId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success:false, message:'유저를 찾을 수 없음' });
    }

    const beforeOrcx = readOrcx(user);
    if (beforeOrcx < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({ success:false, message:`토큰 부족 (${prices.currency} ${totalCost} 필요)` });
    }

    // 유저 토큰 차감
    writeOrcx(user, beforeOrcx - totalCost);
    await user.save({ session });

    // 옥수수 재고 증가 (upsert)
    const corn = await CornData.findOneAndUpdate(
      { kakaoId },
      { $inc: { [safeItem]: safeQty } },
      { new: true, upsert: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: `구매 완료: ${safeItem} x ${safeQty} (-${prices.currency} ${totalCost})`,
      currency: prices.currency,
      user: { orcx: readOrcx(user) },
      corn: { seed: corn.seed || 0, salt: corn.salt || 0, sugar: corn.sugar || 0 },
    });
  } catch (e) {
    console.error('purchase error:', e);
    return res.status(500).json({ success:false, message:'서버 오류' });
  }
});

/* ====== 요약 조회 (UI 갱신용) ====== */
router.get('/summary', async (req, res) => {
  try {
    const kakaoId = String(req.query.kakaoId || '');
    if (!kakaoId) return res.status(400).json({ success:false, message:'kakaoId 누락' });

    const [user, corn] = await Promise.all([
      User.findOne({ kakaoId }).lean(),
      CornData.findOne({ kakaoId }).lean(),
    ]);

    return res.json({
      success: true,
      user: {
        orcx: readOrcx(user),
        water: user?.inventory?.water ?? 0,
        fertilizer: user?.inventory?.fertilizer ?? 0,
      },
      corn: {
        seed: corn?.seed ?? 0,
        salt: corn?.salt ?? 0,
        sugar: corn?.sugar ?? 0,
      }
    });
  } catch (e) {
    console.error('summary error:', e);
    return res.status(500).json({ success:false, message:'서버 오류' });
  }
});

module.exports = router;


