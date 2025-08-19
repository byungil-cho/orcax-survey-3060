import express from "express";
import { getDb } from "../db/mongo.js"; // 몽고DB 연결 유틸 (server-unified.js에서 세팅됨)

const router = express.Router();

/**
 * 🌱 씨앗 / 물 / 거름 구매
 */
router.post("/buy-additive", async (req, res) => {
  const { kakaoId, type, amount } = req.body;
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const key = type.toLowerCase(); // seed, water, fertilizer
  await db.collection("users").updateOne(
    { kakaoId },
    { $inc: { [`inventory.${key}`]: amount } }
  );

  const updated = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user: updated });
});

/**
 * 🌱 씨앗 심기
 */
router.post("/plant", async (req, res) => {
  const { kakaoId } = req.body;
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user || (user.inventory?.seed ?? 0) <= 0) {
    return res.status(400).json({ error: "No seeds available" });
  }

  await db.collection("users").updateOne(
    { kakaoId },
    {
      $inc: { "inventory.seed": -1 },
      $set: { "agri.phase": "GROW", "agri.plantTime": new Date() }
    }
  );

  const updated = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user: updated });
});

/**
 * 💧🌿 성장 단계 (물/거름 주기)
 */
router.post("/grow", async (req, res) => {
  const { kakaoId, action } = req.body; // action = water | fertilizer
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user || user.agri?.phase !== "GROW") {
    return res.status(400).json({ error: "Not in GROW phase" });
  }

  if ((user.inventory?.[action] ?? 0) <= 0) {
    return res.status(400).json({ error: `No ${action} available` });
  }

  await db.collection("users").updateOne(
    { kakaoId },
    {
      $inc: { [`inventory.${action}`]: -1 },
      $set: { "agri.lastGrow": new Date() }
    }
  );

  const updated = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user: updated });
});

/**
 * 🌾 수확
 */
router.post("/harvest", async (req, res) => {
  const { kakaoId } = req.body;
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user || user.agri?.phase !== "GROW") {
    return res.status(400).json({ error: "Nothing to harvest" });
  }

  // 간단하게: 수확 시 옥수수 5개 지급
  const cornYield = 5;

  await db.collection("users").updateOne(
    { kakaoId },
    {
      $inc: { "agri.corn": cornYield },
      $set: { "agri.phase": "HARVEST" }
    }
  );

  const updated = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user: updated, cornYield });
});

/**
 * 🍿 뻥튀기 (옥수수 → 팝콘)
 */
router.post("/pop", async (req, res) => {
  const { kakaoId } = req.body;
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user || (user.agri?.corn ?? 0) <= 0) {
    return res.status(400).json({ error: "No corn available" });
  }

  const cornUsed = user.agri.corn;
  const popcornMade = cornUsed; // 1:1 비율

  await db.collection("users").updateOne(
    { kakaoId },
    {
      $inc: { "agri.popcorn": popcornMade },
      $set: { "agri.corn": 0, "agri.phase": "IDLE" }
    }
  );

  const updated = await db.collection("users").findOne({ kakaoId });
  res.json({ success: true, user: updated, popcornMade });
});

/**
 * 📊 요약 정보 (프론트 UI용)
 */
router.post("/summary", async (req, res) => {
  const { kakaoId } = req.body;
  const db = getDb();

  const user = await db.collection("users").findOne({ kakaoId });
  if (!user) return res.status(404).json({ error: "User not found" });

  // 씨앗 수량 체크
  const seedCount = user.agri?.seeds ?? user.agri?.seed ?? user.inventory?.seed ?? 0;

  const summary = {
    phase: user.agri?.phase ?? "IDLE",
    seeds: seedCount,
    water: user.agri?.water ?? user.inventory?.water ?? 0,
    fertilizer: user.agri?.fertilizer ?? user.inventory?.fertilizer ?? 0,
    corn: user.agri?.corn ?? 0,
    popcorn: user.agri?.popcorn ?? 0,
    token: user.token ?? 0
  };

  res.json({ user, summary });
});

export default router;
