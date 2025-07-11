router.post('/userdata', async (req, res) => {
  const { kakaoId } = req.body;
  console.log('🔍 받은 요청 req.body:', req.body);

  try {
    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

