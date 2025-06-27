
// ✅ 완전 수정된 server.js - 감자밭 에러 제거 버전

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = 3060;

// ✅ 라우터들 require (정상 라우터 객체들)
const registerRoute = require("./routes/register");
// const farmRoutes = require("./api/farm"); // ❌ 제거됨
const useTokenRoute = require("./routes/use-token");

// ✅ 모델 통일
const User = require("./models/User");

// ✅ 미들웨어
app.use(cors());
app.use(express.json());

// ✅ 라우터 연결
app.use("/api/use-token", useTokenRoute);
app.use("/api", registerRoute);
// app.use("/api/farm", farmRoutes); // ❌ 제거됨

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공!"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ JWT 인증 미들웨어
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

// ✅ 상태 확인
app.get("/", (req, res) => {
  res.send("✅ OrcaX 감자 서버 작동 중!");
});

// ✅ 로그인 및 최초 자원 지급
app.post("/api/login", async (req, res) => {
  const { nickname, kakaoId } = req.body;

  try {
    let user = await User.findOne({ kakaoId });

    if (!user) {
      user = new User({
        kakaoId,
        nickname,
        seedPotato: 2,
        seedBarley: 2,
        water: 10,
        fertilizer: 10,
        token: 10,
        growthPoint: 0,
        potatoCount: 0,
        harvestCount: 0,
        farmingCount: 0,
      });
      await user.save();
    }

    const accessToken = jwt.sign({ userId: kakaoId }, "SECRET_KEY", {
      expiresIn: "1h",
    });

    return res.json({ success: true, accessToken });
  } catch (error) {
    console.error("❌ 로그인 에러:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 유저 정보
app.get("/api/user/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ kakaoId: req.userId });
    if (!user)
      return res.status(404).json({ success: false, message: "유저 없음" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "유저 조회 실패" });
  }
});

// ✅ 디버깅용 유저 리스트
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
