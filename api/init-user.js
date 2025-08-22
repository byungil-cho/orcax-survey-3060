// api/init-user.js
module.exports = function initUserAPI(app, db) {
  // /api/init-user → /api/corn/status 래핑
  app.get("/api/init-user", async (req, res) => {
    try {
      const kakaoId = req.query.kakaoId;
      if (!kakaoId) return res.status(400).json({ error: "kakaoId required" });

      // 기존 corn_data에서 불러오기
      const data = await db.collection("corn_data").findOne({ kakaoId });

      if (!data) {
        // 신규 유저면 기본값으로 생성
        const newUser = {
          kakaoId,
          nickname: "새 사용자",
          seeds: 0,
          water: 0,
          fertilizer: 0,
          corn: 0,
          popcorn: 0,
          salt: 0,
          sugar: 0,
          token: 0,
          createdAt: new Date()
        };
        await db.collection("corn_data").insertOne(newUser);
        return res.json(newUser);
      }

      // 기존 유저 있으면 그대로 리턴
      res.json(data);
    } catch (err) {
      console.error("init-user error:", err);
      res.status(500).json({ error: "서버 오류" });
    }
  });
};
