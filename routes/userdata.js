router.get('/', async (req, res) => {
  try {
    const kakaoId = req.query.kakaoId; // ✅ 정확한 키로 수정
    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId 없음' });
    }

    const user = await User.findOne({ kakaoId: kakaoId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('데이터 불러오기 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});
