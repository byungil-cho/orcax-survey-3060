const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
let db;

async function connectDB() {
  await client.connect();
  db = client.db("farmgame");
  console.log("✅ MongoDB Connected");
}
connectDB();

// ---------------- 로그인 / 유저 초기화 ----------------
app.post("/api/login", async (req, res) => {
  const { nickname } = req.body;
  let user = await db.collection("users").findOne({ nickname });

  if (!user) {
    user = {
      nickname,
      level: 1,
      water: 0,
      fertilizer: 0,
      token: 0,
      seed: 0,
      salt: 0,
      sugar: 0,
      popcorn: 0,
      season: "winter",
      growthStage: "seed"
    };
    await db.collection("users").insertOne(user);
  }
  res.json(user);
});

// ---------------- 유저 정보 불러오기 ----------------
app.get("/api/userdata", async (req, res) => {
  const nickname = req.query.nickname;
  const user = await db.collection("users").findOne({ nickname });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ---------------- 옥수수 농장 요약 ----------------
app.get("/api/corn/summary/:nickname", async (req, res) => {
  const { nickname } = req.params;
  const corn = await db.collection("corn_data").findOne({ nickname });
  if (!corn) {
    return res.json({
      nickname,
      season: "winter",
      growthStage: "seed",
      progress: 0
    });
  }
  res.json(corn);
});

// ---------------- 자원 업데이트 ----------------
app.post("/api/update", async (req, res) => {
  const { nickname, field, value } = req.body;
  await db.collection("users").updateOne(
    { nickname },
    { $inc: { [field]: value } }
  );
  const user = await db.collection("users").findOne({ nickname });
  res.json(user);
});

// ---------------- 서버 실행 ----------------
app.listen(3060, () => console.log("🚀 Server running on port 3060"));





