const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// 설정값
const PORT = 3060;
const MONGO_URI = "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/orcax?retryWrites=true&w=majority"; // 데이터베이스 이름을 orcax로 고정

// 미들웨어
app.use(cors());
app.use(express.json());

// 사용자 모델 정의
const mongooseUserSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  token: Number,
  water: Number,
  fertilizer: Number,
  potatoCount: Number,
  barleyCount: Number,
});
const OrcaUser = mongoose.model("User", mongooseUserSchema, "users"); // 컬렉션: orcax.users

// 사용자 정보 라우터 연결 (기존)
const userdataRoutes = require("./routes/userdata");
app.use("/api/userdata", userdataRoutes);

// 신규 통합 사용자 정보 라우터 연결
const userdataNewRouter = require("express").Router();

// GET /api/userdata-new/:nickname
userdataNewRouter.get("/:nickname", async (req, res) => {
  const nickname = req.params.nickname;
  try {
    const user = await OrcaUser.findOne({ nickname });
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: "사용자 없음" });
    }
  } catch (err) {
    console.error("❌ 사용자 조회 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});
app.use("/api/userdata-new", userdataNewRouter);

// 서버 정상작동 확인 라우터
app.get("/", (req, res) => {
  res.send("✅ 감자 서버 정상 작동 중");
});

// 몽고디비 연결 및 서버 시작
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(PORT, () => {
      console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err.message);
  });
