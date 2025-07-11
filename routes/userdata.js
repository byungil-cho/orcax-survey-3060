router.post('/', async (req, res) => {
  try {
    console.log("🔍 Received POST /api/userdata body:", req.body);

    const { kakaoId } = req.body;

    if (!kakaoId) {
      return res.status(400).json({ success: false, message: 'kakaoId is missing' });
    }

    const user = await User.findOne({ kakaoId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('❌ Error in /api/userdata:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});
