// routes/corn.js
const express = require('express');
const router = express.Router();

const User = require('../models/User');         // users 컬렉션 (물/거름/토큰 등)
const CornData = require('../models/CornData'); // corn_data 컬렉션 (옥수수 전용)

// --- 게임 상수 (너희 룰에 맞춤) ---
const LOAN_POP_DEDUCTION = 0.30;   // 붉은/검정: 뻥튀기 수령 시 30% 공제
const DAILY_PENALTY_RATE = 0.05;   // 검정: 미상환 매일 5% 추가 패널티 (loan.amount 기준)

// 유틸: 일수 계산 (UTC 자정 기준 아님, 단순 일수)
const daysBetween = (from, to) => Math.max(0, Math.floor((to - from) / (24*60*60*1000)));

// 유틸: corn 배열 요약
function summarizeCorn(cornDoc) {
  const count = Array.isArray(cornDoc?.corn) ? cornDoc.corn.length : 0;
  const yellow = cornDoc?.corn?.filter(c => c.color === 'yellow').length || 0;
  const red    = cornDoc?.corn?.filter(c => c.color === 'red').length    || 0;
  const black  = cornDoc?.corn?.filter(c => c.color === 'black').length  || 0;
  return { count, yellow, red, black };
}

/**
 * 옥수수밭 입장
 * - users는 이미 로그인으로 존재해야 함
 * - corn_data 없으면 생성(기본 0들)
 * - 응답: users 자원 + corn 요약(숫자만)
 */
router.post('/api/corn-enter', async (req, res) => {
  try {
    const { kakaoId, nickname = '' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).json({ ok: false, message: 'user not found (login first)' });

    const corn = await CornData.findOneAndUpdate(
      { kakaoId },
      { $setOnInsert: {
          kakaoId,
          corn: [],
          popcorn: 0,
          seed: 0,
          additives: { salt: 0, sugar: 0 },
          loan: { amount: 0, interest: 0, createdAt: new Date() }
        }
      },
      { new: true, upsert: true }
    );

    const sum = summarizeCorn(corn);

    res.json({
      ok: true,
      kakaoId,
      nickname: user.nickname ?? nickname ?? '',
      // users 자원
      water: user.water ?? 0,
      fertilizer: user.fertilizer ?? 0,
      tokens: user.tokens ?? user.orcx ?? 0,
      // corn_data 자원
      cornCount: sum.count,
      cornYellow: sum.yellow,
      cornRed: sum.red,
      cornBlack: sum.black,
      popcorn: corn.popcorn ?? 0,
      seed: corn.seed ?? 0,
      salt: corn.additives?.salt ?? 0,
      sugar: corn.additives?.sugar ?? 0,
      // 대출 상태
      loanAmount: corn.loan?.amount ?? 0,
      loanSince: corn.loan?.createdAt ?? null
    });
  } catch (e) {
    console.error('[POST /api/corn-enter] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * 씨 심기
 * - mode: 'normal' | 'loan'
 * - normal: seed 1 감소, yellow 생성
 * - loan: loan.amount += loanAmount, red 생성 (loanAmount 필수)
 * - (검정은 "미상환 상태로 다시 심을 때" red 대신 black으로 처리)
 */
router.post('/api/corn-plant', async (req, res) => {
  try {
    const { kakaoId, mode = 'normal', loanAmount = 0 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });

    const corn = await CornData.findOne({ kakaoId });
    if (!corn) return res.status(404).json({ ok: false, message: 'corn_data not found (enter corn farm first)' });

    if (mode === 'normal') {
      // 씨앗 1개 필요
      if ((corn.seed ?? 0) <= 0) return res.status(400).json({ ok: false, message: 'no seed' });
      corn.seed = (corn.seed || 0) - 1;

      // 미상환 대출이 있으면 검정, 없으면 노란
      const hasUnpaidLoan = (corn.loan?.amount ?? 0) > 0;
      const color = hasUnpaidLoan ? 'black' : 'yellow';
      corn.corn.push({ color, grade: 'F', plantedAt: new Date() });
    } else if (mode === 'loan') {
      if (!loanAmount || loanAmount <= 0) {
        return res.status(400).json({ ok: false, message: 'loanAmount required' });
      }
      // 대출 발생/추가
      corn.loan = corn.loan || { amount: 0, interest: 0, createdAt: new Date() };
      corn.loan.amount = (corn.loan.amount || 0) + loanAmount;
      // 대출로 심으면 붉은
      corn.corn.push({ color: 'red', grade: 'F', plantedAt: new Date() });
      // 씨앗을 "구매"했다고 간주하고 seed 증가시켜도 되고 말고는 게임 규칙에 따라
      // 여기선 대출로 바로 심으니 seed 변동 없음
    } else {
      return res.status(400).json({ ok: false, message: 'invalid mode' });
    }

    await corn.save();

    const sum = summarizeCorn(corn);
    res.json({ ok: true, cornCount: sum.count, cornYellow: sum.yellow, cornRed: sum.red, cornBlack: sum.black, seed: corn.seed });
  } catch (e) {
    console.error('[POST /api/corn-plant] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * 뻥튀기 수령 (popcorn → tokens)
 * - amount: 이번에 토큰으로 환전할 popcorn 수량(또는 환산된 토큰 금액)
 * - colorRule: 'yellow' | 'red' | 'black'
 *    yellow: 100% 지급
 *    red:    70% 지급 (30% 공제)
 *    black:  70% 지급 + 미상환 기간(일수)*5%*loan.amount 패널티 추가 차감
 * - popcorn 차감은 게임 규칙에 맞게 처리(여기선 단순 차감으로 가정)
 */
router.post('/api/corn-pop', async (req, res) => {
  try {
    const { kakaoId, amount = 0, colorRule = 'yellow' } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    if (!amount || amount <= 0) return res.status(400).json({ ok: false, message: 'amount required' });

    const [user, corn] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!corn) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    // popcorn 재고 확인 (없으면 실패)
    if ((corn.popcorn ?? 0) < amount) {
      return res.status(400).json({ ok: false, message: 'not enough popcorn' });
    }

    let payout = amount; // 기본 1:1
    let deduction = 0;
    let penalty = 0;

    if (colorRule === 'red' || colorRule === 'black') {
      deduction = Math.floor(amount * LOAN_POP_DEDUCTION); // 30% 공제
      payout -= deduction;
    }
    if (colorRule === 'black') {
      const loanAmt = corn?.loan?.amount ?? 0;
      if (loanAmt > 0) {
        const days = daysBetween(new Date(corn.loan.createdAt), new Date());
        penalty = Math.floor(loanAmt * DAILY_PENALTY_RATE * days); // 누적 패널티(단순 산식)
        payout = Math.max(0, payout - penalty);
      }
    }

    // 상태 반영: popcorn 감소, 유저 토큰 증가
    corn.popcorn = (corn.popcorn || 0) - amount;
    user.tokens = (user.tokens || user.orcx || 0) + payout;

    await Promise.all([corn.save(), user.save()]);

    res.json({
      ok: true,
      tokensAdded: payout,
      deduction30: deduction,
      blackPenalty: penalty,
      tokens: user.tokens,
      popcorn: corn.popcorn
    });
  } catch (e) {
    console.error('[POST /api/corn-pop] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * 대출 상환
 * - payAmount 만큼 유저 토큰에서 차감하여 loan.amount 감소
 * - 0 이하로 떨어지면 0으로 고정
 */
router.post('/api/corn-repay', async (req, res) => {
  try {
    const { kakaoId, payAmount = 0 } = req.body || {};
    if (!kakaoId) return res.status(400).json({ ok: false, message: 'kakaoId required' });
    if (!payAmount || payAmount <= 0) return res.status(400).json({ ok: false, message: 'payAmount required' });

    const [user, corn] = await Promise.all([
      User.findOne({ kakaoId }),
      CornData.findOne({ kakaoId })
    ]);
    if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
    if (!corn) return res.status(404).json({ ok: false, message: 'corn_data not found' });

    if ((user.tokens ?? user.orcx ?? 0) < payAmount) {
      return res.status(400).json({ ok: false, message: 'not enough tokens' });
    }

    user.tokens = (user.tokens || user.orcx || 0) - payAmount;
    corn.loan = corn.loan || { amount: 0, interest: 0, createdAt: new Date() };
    corn.loan.amount = Math.max(0, (corn.loan.amount || 0) - payAmount);

    await Promise.all([user.save(), corn.save()]);

    res.json({
      ok: true,
      tokens: user.tokens,
      loanAmount: corn.loan.amount
    });
  } catch (e) {
    console.error('[POST /api/corn-repay] error:', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

module.exports = router;
