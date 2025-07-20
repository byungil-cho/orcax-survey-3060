const express = require('express');
const router = express.Router();
const User = require('../models/users');
const SeedStock = require('../models/SeedStock');

// cropType("seedBarley"|"seedPotato") → DB type("bori"|"gamja")
function getDbSeedType(cropType) {
  if (cropType === "seedBarley") return "bori";
  if (cropType === "seedPotato") return "gamja";
  return cropType;
}

// 수확 라우터 (운영자 보관소도 reward만큼 증가)
router.post('/harvest', async (req, res) => {
  try {
    const { kakaoId, cropType } = req.body;
    const user = await User.findOne({ kakaoId });
    if (!user) return res.json({ success: false, message: "유저 없음" });

    // 성장 포인트 확인 (5 이상이어야 수확 가능)
    const growthField = cropType === "seedPotato" ? "potato" : "barley";
    const storageField = cropType === "seedPotato" ? "gamja" : "bori";
    if (!user.growth) user.growth = {};
    if ((user.growth[growthField] || 0) < 5)
      return res.json({ success: false, message: "성장포인트 부족" });

    // 씨앗 개수 체크
    if ((user[cropType] || 0) < 1)
      return res.json({ success: false, message: "씨앗이 없습니다" });

    user[cropType] -= 1; // 씨앗 차감

    // 수확량 랜덤 보상 (3, 5, 7 중 택1)
    const rewardOptions = [3, 5, 7];
    const reward = rewardOptions[Math.floor(Math.random() * rewardOptions.length)];

    // 유저 보관함에 수확량 누적
    if (!user.storage) user.storage = {};
    user.storage[storageField] = (user.storage[storageField] || 0) + reward;
    user.growth[growthField] = 0; // 성장 포인트 초기화

    // 운영자(SeedStock) 보관소에도 수확량만큼 증가
    const dbSeedType = getDbSeedType(cropType);
    const adminStock = await SeedStock.findOneAndUpdate(
      { type: dbSeedType },
      { $inc: { stock: reward } },
      { upsert: true, new: true }
    );

    await user.save();

    res.json({
      success: true,
      message: '수확 성공',
      reward,
      cropType,
      cropAmount: user.storage[storageField],
      storage: user.storage,
      adminSeed: adminStock?.stock,
      userSeed: user[cropType]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
