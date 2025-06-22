const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3060;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || "your-mongodb-uri", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공"))
.catch(err => console.error("❌ MongoDB 연결 실패:", err));

// 모델 import
const User = require("./models/User");

// 기본 상태 확인 라우터
app.get("/", (req, res) => {
  res.send("✅ OrcaX 감자 서버가 작동 중입니다!");
});

// ✅ 최초 로그인 시 농자재 지급 (auth.js 통합)
app.post("/api/login", async (req, res) => {
  const { nickname } = req.body;

  try {
    let user = await User.findOne({ nickname });

    if (!user) {
      user = new User({
        nickname,
        token: 0,
        potatoCount: 0,
        barleyCount: 0,
        water: 10,
        fertilizer: 10,
        inventory: [
          { name: "씨감자", count: 2 },
          { name: "씨보리", count: 2 },
          { name: "물", count: 10 },
          { name: "거름", count: 10 }
        ]
      });

      await user.save();
      return res.json({ success: true, firstTime: true, user });
    } else {
      return res.json({ success: true, firstTime: false, user });
    }

  } catch (error) {
    console.error("❌ 로그인 에러:", error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 전체 유저 데이터 불러오기 (기존 유지)
app.get("/api/userdata", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
