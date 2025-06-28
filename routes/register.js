const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 루트 테스트용 기본 핸들러
router.get('/', (req, res) => {
  res.send('✅ register 라우터 정상 연결됨');
});

// 최초 로그인 시 자동 지급
router.post('/register', async (req, res) => {
  const { kakaoId, nickname } = req.body;

  try {
    const existingUser = await User.findOne({ kakaoId });

    if (existingUser) {
      return res.status(200).json({ message: '이미 등록된 유저입니다.', user: existingUser });
    }

    const newUser = new User({
      kakaoId,
      nickname,
      자원: {
        물: 10,
        거름: 10
      },
      토큰: {
        오크: 5
      },
      씨앗: [
        '씨감자 2개',
        '씨보리 2개'
      ],
      목록: [],
      감자_개수: 0,
      보리_개수: 0
    });

    await newUser.save();

    res.status(201).json({ message: '신규 유저 등록 완료 및 자산 지급', user: newUser });
  } catch (error) {
    console.error('등록 오류:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

module.exports = router;
