import express from "express";
import mongoose from "mongoose";

// ✅ engtes 폴더 안의 엔진 모듈 import
import { Economy } from "../engtes/economy.js";
import { HarvestEngine } from "../engtes/harvest.js";
import { ExchangeEngine } from "../engtes/exchange.js";

const router = express.Router();

// ===== MongoDB 모델 =====
const UserSchema = new mongoose.Schema({}, { strict: false });
const CornSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model("users", UserSchema);        // 기존 users 컬렉션
const Corn = mongoose.model("corn.data", CornSchema);    // 옥수수 전용 컬렉션

// ===== 엔진 인스턴스 =====
const economy = new Economy();
const harvestEngine = new HarvestEngine();
const exchange = new ExchangeEngine();

// ===== 씨앗 심기 =====
router.post("/plant", async (req, res) => {
  const { kakaoId, seeds } = req.body;
  const user = await User.findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: "유저 없음" });

  if (user.seeds < seeds) {
    return res.status(400).json({ error: "씨앗 부족" });
  }

  user.seeds -= seeds;
  await user.save();

  await Corn.updateOne(
    { kakaoId },
    { $inc: { cornSeeds: seeds } },
    { upsert: true }
  );

  res.json({ message: `${seeds}개 씨앗 심기 완료` });
});

// ===== 수확 =====
router.post("/harvest", async (req, res) => {
  const { kakaoId, count } = req.body;
  const user = await User.findOne({ kakaoId });
  const corn = await Corn.findOne({ kakaoId });

  if (!user || !corn) return res.status(404).json({ error: "유저/옥수수 없음" });

  const rawTokens = harvestEngine.calculateTokens(count);
  const netTokens = economy.harvestRepay(rawTokens);

  user.tokens = (user.tokens || 0) + netTokens;
  await user.save();

  await Corn.updateOne(
    { kakaoId },
    { $inc: { harvested: count } },
    { upsert: true }
  );

  res.json({
    message: `${count}개 수확 완료`,
    rawTokens,
    netTokens,
    loanStatus: economy.getStatus()
  });
});

// ===== 팝콘 → 교환 =====
router.post("/exchange", async (req, res) => {
  const { kakaoId, type } = req.body;
  const corn = await Corn.findOne({ kakaoId });
  if (!corn) return res.status(404).json({ error: "옥수수 없음" });

  if (type === "normal") {
    if ((corn.popcorn || 0) < 1) return res.status(400).json({ error: "팝콘 부족" });
    corn.popcorn -= 1;
    corn.fertilizer = (corn.fertilizer || 0) + 1;
    await corn.save();
    return res.json({ message: "팝콘 1개 → 비료 1개 교환 완료" });
  }

  if (type === "nft") {
    if ((corn.popcorn || 0) < 1000) return res.status(400).json({ error: "팝콘 부족 (1000개 필요)" });
    corn.popcorn -= 1000;
    corn.nft = (corn.nft || 0) + 1;
    await corn.save();
    return res.json({ message: "팝콘 1000개 → NFT 1개 교환 (보관함 등록)" });
  }

  res.status(400).json({ error: "잘못된 타입" });
});

// ===== 상태 조회 =====
router.get("/status/:kakaoId", async (req, res) => {
  const { kakaoId } = req.params;
  const user = await User.findOne({ kakaoId });
  const corn = await Corn.findOne({ kakaoId });

  if (!user || !corn) return res.status(404).json({ error: "유저/옥수수 없음" });

  res.json({
    user: {
      tokens: user.tokens,
      water: user.water,
      fertilizer: user.fertilizer
    },
    corn: corn,
    economy: economy.getStatus(),
    exchange: exchange.getStatus()
  });
});

export default router;
