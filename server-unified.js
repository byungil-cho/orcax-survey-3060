const express = require("express");
const cors = require("cors");
const app = express();
const port = 3060;

app.use(cors());
app.use(express.json());

const userData = {}; // 유저 데이터 저장소

// ✅ 초기 가입 (회원가입 시 기본 자원 지급)
app.post("/api/register", (req, res) => {
  const { kakaoId, nickname, farmName } = req.body;

  if (userData[kakaoId]) {
    return res.status(409).json({ message: "이미 가입된 사용자입니다." });
  }

  userData[kakaoId] = {
    kakaoId,
    nickname,
    farmName,
    orcx: 10,
    water: 10,
    fertilizer: 10,
    seedPotato: 0,
    seedBarley: 0,
    potato: 0,
    barley: 0,
    power: "에러", // ✅ power 상태 초기값
  };

  res.json({ message: "가입 완료", user: userData[kakaoId] });
});

// ✅ 유저 상태 조회
app.get("/users/me", (req, res) => {
  const kakaoId = req.query.kakaoId;
  const user = userData[kakaoId];
  if (!user) return res.status(404).json({ error: "유저 없음" });
  res.json(user);
});

// ✅ 자원 사용 (물/거름 차감)
app.patch("/users/use-resource", (req, res) => {
  const { kakaoId, water = 0, fertilizer = 0 } = req.body;
  const user = userData[kakaoId];
  if (!user) return res.status(404).json({ error: "유저 없음" });

  user.water += water;
  user.fertilizer += fertilizer;

  res.json({ message: "자원 업데이트 완료", user });
});

// ✅ 작물 수확 후 저장
app.patch("/users/update-crops", (req, res) => {
  const { kakaoId, potato = 0, barley = 0 } = req.body;
  const user = userData[kakaoId];
  if (!user) return res.status(404).json({ error: "유저 없음" });

  user.potato += potato;
  user.barley += barley;

  res.json({ message: "작물 업데이트 완료", user });
});

// ✅ 씨앗 반환 처리
app.patch("/storage/return-seed", (req, res) => {
  const { seedType, count = 1 } = req.body;

  for (const user of Object.values(userData)) {
    if (seedType === "seedPotato") user.seedPotato -= count;
    if (seedType === "seedBarley") user.seedBarley -= count;
  }

  res.json({ message: "씨앗 반환 처리 완료" });
});

// ✅ 자원 저장 통합 (물/거름/ORCX/감자/보리)
app.patch("/api/save-resources", (req, res) => {
  const { kakaoId, orcx, water, fertilizer, potato, barley } = req.body;
  const user = userData[kakaoId];
  if (!user) return res.status(404).json({ error: "유저 없음" });

  if (orcx !== undefined) user.orcx = orcx;
  if (water !== undefined) user.water = water;
  if (fertilizer !== undefined) user.fertilizer = fertilizer;
  if (potato !== undefined) user.potato = potato;
  if (barley !== undefined) user.barley = barley;

  res.json({ message: "자원 저장 완료", user });
});

// ✅ power 상태 조회 API 복구
app.get("/api/power-status", (req, res) => {
  const kakaoId = req.query.kakaoId;
  const user = userData[kakaoId];
  if (!user) return res.status(404).json({ error: "유저 없음" });

  res.json({ power: user.power || "없음" });
});

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${port}`);
});
