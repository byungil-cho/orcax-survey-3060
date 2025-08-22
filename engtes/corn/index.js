// engines/corn/index.js
const express = require("express");

module.exports = function attachCornEngine(app, db) {
  const router = express.Router();
  const col = () => db.collection("corn_data");

  // 상태 조회
  router.get("/status", async (req, res) => {
    try {
      const kakaoId = req.query.kakaoId;
      if (!kakaoId) return res.status(400).json({ success: false, message: "kakaoId 필요" });

      let doc = await col().findOne({ kakaoId });
      if (!doc) {
        doc = {
          kakaoId, seeds: 0, water: 0, fertilizer: 0,
          corn: 0, popcorn: 0, salt: 0, sugar: 0, token: 0,
          loan: { active: false, unpaid: 0, startDate: null },
          bankrupt: false, createdAt: new Date(), updatedAt: new Date(),
        };
        await col().insertOne(doc);
      }
      res.json({ success: true, resources: doc });
    } catch (e) {
      console.error("corn/status error:", e);
      res.status(500).json({ success: false });
    }
  });

  // 씨앗 심기
  router.post("/plant", async (req, res) => {
    try {
      const { kakaoId } = req.body;
      if (!kakaoId) return res.status(400).json({ success: false });

      const cur = await col().findOne({ kakaoId });
      if (!cur || (cur.seeds || 0) <= 0) return res.json({ success: false, message: "씨앗 없음" });

      await col().updateOne({ kakaoId }, { $inc: { seeds: -1, corn: 1 }, $set: { updatedAt: new Date() } });
      const after = await col().findOne({ kakaoId });
      res.json({ success: true, resources: after });
    } catch (e) {
      console.error("corn/plant error:", e);
      res.status(500).json({ success: false });
    }
  });

  // 수확
  router.post("/harvest", async (req, res) => {
    try {
      const { kakaoId } = req.body;
      if (!kakaoId) return res.status(400).json({ success: false });

      const cur = await col().findOne({ kakaoId });
      if (!cur || (cur.corn || 0) <= 0) return res.json({ success: false, message: "옥수수 없음" });

      await col().updateOne({ kakaoId }, { $inc: { corn: -1, popcorn: 1 }, $set: { updatedAt: new Date() } });
      const after = await col().findOne({ kakaoId });
      res.json({ success: true, resources: after });
    } catch (e) {
      console.error("corn/harvest error:", e);
      res.status(500).json({ success: false });
    }
  });

  // 모듈 mount
  app.use("/api/corn", router);
  console.log("🔥 processing.js 라우터 파일이 서버에 적용됨!"); // 주인님 로그 스타일 유지
};
