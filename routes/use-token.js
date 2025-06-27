const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { nickname, amount } = req.body;
    console.log("🐾 POST /api/use-token endpoint 호출됨 , body:", req.body);

    // 기본 유효성 검사
    if (!nickname || !amount) {
      console.warn("⚠️ 닉네임 또는 수량이 없음");
      return res.status(400).json({ success: false, message: '닉네임과 수량이 필요합니다.' });
    }

    // 씨감자/씨보리는 서버 저장 없이 클라이언트에서만 처리
    console.log(`🪴 ${nickname} 님의 로컬 씨감자/씨보리 ${amount}개 사용 처리`);

    // 응답 반환 (서버에서는 차감/저장 X)
    return res.status(200).json({
      success: true,
      message: '로컬 차감 완료 (서버 저장 안함)',
    });

  } catch (error) {
    console.error("❌ /api/use-token 처리 중 오류:", error);
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류 발생',
    });
  }
});

module.exports = router;
