
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const app = express();  // ✅ Move this up before app.use
const port = 3060;

const registerRoute = require('./routes/register');
const farmRoutes = require("./api/farm");
app.use('/api', registerRoute);
app.use("/api/farm", farmRoutes);
app.use("/api/farm", require("./api/farm"));

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB 연결 성공!"))
.catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// 유저 모델
const userSchema = new mongoose.Schema({
  userId: String,
  nickname: String,
  token: Number,
  potatoCount: Number,
  barleyCount: Number,
  water: Number,
  fertilizer: Number,
  inventory: [{ name: String, count: Number }]
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

// 미들웨어: JWT 인증
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "토큰 없음" });
  }

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "토큰 검증 실패" });
  }
}

// ✅ 서버 상태 확인
app.get("/", (req, res) => {
  res.send("✅ OrcaX 감자 서버 작동 중!");
});

// ✅ 로그인 및 최초 자원 지급
app.post("/api/login", async (req, res) => {
  const { nickname, userId } = req.body;

  try {
    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        nickname,
        token: 10,
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
    }

    const accessToken = jwt.sign({ userId }, "SECRET_KEY", { expiresIn: "1h" });

    return res.json({ success: true, accessToken });
  } catch (error) {
    console.error("❌ 로그인 에러:", error);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// ✅ 로그인된 유저 정보 불러오기
app.get("/api/user/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });
    if (!user) return res.status(404).json({ success: false, message: "유저 없음" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "유저 조회 실패" });
  }
});

// ✅ 유저 자재 정보 (인벤토리)
app.get("/api/user/inventory", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId });
    if (!user) return res.status(404).json({ success: false });
    res.json({ success: true, inventory: user.inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: "자재 불러오기 실패" });
  }
});

// ✅ 전체 유저 리스트 (디버깅용)
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
