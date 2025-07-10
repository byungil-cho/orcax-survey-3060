const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 완료"))
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// ✅ 사용자 스키마
const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: String,
  farmName: String,
  orcx: { type: Number, default: 10 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 },
  potato: { type: Number, default: 0 },
  barley: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

// ✅ 기존 API: 사용자 등록
app.post("/users/register", async (req, res) => {
  const { kakaoId, nickname, farmName } = req.body;
  try {
    let user = await User.findOne({ kakaoId });
    if (!user) {
      user = new User({ kakaoId, nickname, farmName });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("서버 오류");
  }
});

// ✅ 사용자 정보 조회
app.get("/users/me", async (req, res) => {
  const { kakaoId } = req.query;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).send("사용자 없음");
    res.json(user);
  } catch (err) {
    res.status(500).send("서버 오류");
  }
});

// ✅ 자원 사용
app.patch("/users/use-resource", async (req, res) => {
  const { kakaoId, water = 0, fertilizer = 0 } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).send("사용자 없음");

    user.water += water;
    user.fertilizer += fertilizer;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send("서버 오류");
  }
});

// ✅ 작물 수확
app.patch("/users/update-crops", async (req, res) => {
  const { kakaoId, potato = 0, barley = 0 } = req.body;
  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).send("사용자 없음");

    user.potato += potato;
    user.barley += barley;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send("서버 오류");
  }
});

// ✅ 씨앗 반환
app.patch("/storage/return-seed", async (req, res) => {
  const { seedType, count } = req.body;
  const { kakaoId } = req.query;

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).send("사용자 없음");

    if (seedType === "seedPotato") user.seedPotato -= count;
    else if (seedType === "seedBarley") user.seedBarley -= count;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send("서버 오류");
  }
});

// ✅ 자원 저장
app.patch("/users/save-resources", async (req, res) => {
  const {
    kakaoId,
    orcx,
    water,
    fertilizer,
    seedPotato,
    seedBarley,
    potato,
    barley,
  } = req.body;

  try {
    const user = await User.findOne({ kakaoId });
    if (!user) return res.status(404).send("사용자 없음");

    if (orcx !== undefined) user.orcx = orcx;
    if (water !== undefined) user.water = water;
    if (fertilizer !== undefined) user.fertilizer = fertilizer;
    if (seedPotato !== undefined) user.seedPotato = seedPotato;
    if (seedBarley !== undefined) user.seedBarley = seedBarley;
    if (potato !== undefined) user.potato = potato;
    if (barley !== undefined) user.barley = barley;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("서버 오류");
  }
});

// ✅ [💡 추가된 부분] API 라우터 연결
const initUserRouter = require('./routes/init-user');
const userDataRouter = require('./routes/userdata');
const loginRouter = require('./routes/login');

app.use('/api/init-user', initUserRouter);
app.use('/api/userdata', userDataRouter);
app.use('/api/login', loginRouter);

// ✅ 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 : http://localhost:${PORT}`);
});
