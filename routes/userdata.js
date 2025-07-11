router.post('/userdata', async (req, res) => {
  const { kakaoId } = req.body;
  console.log('💬 요청받은 kakaoId:', kakaoId);

  try {
    const user = await User.findOne({ kakaoId: String(kakaoId) });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ 찾은 사용자:', user);
    res.status(200).json({ success: true, data: user });

  } catch (error) {
    console.error('❌ 서버 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});


