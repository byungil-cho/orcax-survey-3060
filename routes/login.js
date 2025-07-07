const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { kakaoId } = req.body;

  if (!kakaoId) {
    return res.status(400).json({ error: '카카오 ID가 필요합니다.' });
  }

  // 여기서 실제 로그인 처리나 DB 조회를 해야 함
  res.json({ message: `${kakaoId} 로그인 완료`, success: true });
});

module.exports = router;
