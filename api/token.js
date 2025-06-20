// api/token.js
const express = require('express');
const router = express.Router();

// 유저 토큰 잔액 조회 및 출금 요청 처리용 메모리 저장소
let userTokens = {};
let withdrawRequests = [];

// 토큰 잔액 조회
router.get('/:nickname', (req, res) => {
  const { nickname } = req.params;
  res.json({ tokens: userTokens[nickname] || 0 });
});

// 출금 요청
router.post('/withdraw', (req, res) => {
  const { nickname, email, name, phone, phantomAddress, network, amount } = req.body;

  if (!nickname || !phantomAddress || !amount) {
    return res.status(400).json({ error: '필수 정보 누락' });
  }

  if ((userTokens[nickname] || 0) < amount) {
    return res.status(400).json({ error: '잔액 부족' });
  }

  userTokens[nickname] -= amount;

  const request = {
    nickname,
    email,
    name,
    phone,
    phantomAddress,
    network,
    amount,
    requestedAt: new Date(),
  };

  withdrawRequests.push(request);
  res.json({ success: true, message: '출금 요청 완료', request });
});

// 관리자용 출금 요청 목록 조회
router.get('/requests/all', (req, res) => {
  res.json(withdrawRequests);
});

// 관리자용 유저 토큰 수동 지급 (예: 회원가입 보너스)
router.post('/grant', (req, res) => {
  const { nickname, amount } = req.body;
  userTokens[nickname] = (userTokens[nickname] || 0) + amount;
  res.json({ success: true, tokens: userTokens[nickname] });
});

module.exports = router;
