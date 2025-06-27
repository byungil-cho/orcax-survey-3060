const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const User = require('../models/User');

const LOCAL_DIR = path.join(__dirname, '../local-data');
const LOCAL_DATA_FILE = path.join(LOCAL_DIR, 'token-items.json');

// 폴더 및 파일 존재 확인 및 생성
function ensureLocalDataFile() {
  if (!fs.existsSync(LOCAL_DIR)) {
    fs.mkdirSync(LOCAL_DIR);
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, '{}');
  }
}

// 로컬 데이터 불러오기
function loadLocalData() {
  ensureLocalDataFile();
  const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// 로컬 데이터 저장
function saveLocalData(data) {
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/use-token
router.post('/api/use-token', async (req, res) => {
  const { nickname, amount } = req.body;
  console.log("🧩 POST /api/use-token endpoint 호출됨 , body:", req.body);

  if (!nickname || !amount) {
    return res.status(400).json({ success: false, message: "nickname 또는 amount 누락" });
  }

  try {
    const user = await User.findOne({ nickname });

    if (!user || user.token < amount) {
      return res.status(400).json({ success: false, message: "토큰 부족 또는 사용자 없음" });
    }

    // 토큰 차감
    user.token -= amount;
    await user.save();

    // 로컬에 씨감자 저장
    const localData = loadLocalData();
    if (!localData[nickname]) {
      localData[nickname] = { seedPotato: 0, seedBarley: 0 };
    }

    const gainedSeedPotato = Math.floor(amount / 2);
    localData[nickname].seedPotato += gainedSeedPotato;
    saveLocalData(localData);

    return res.json({
      success: true,
      message: `씨감자 ${gainedSeedPotato}개 획득`,
      currentSeedPotato: localData[nickname].seedPotato,
      remainingToken: user.token
    });

  } catch (err) {
    console.error('❌ 서버 오류:', err);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
