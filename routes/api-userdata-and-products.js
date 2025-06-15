
// Express 라우터 통합 버전
const express = require("express");
const router = express.Router();
const Farm = require("../models/Farm");
const Product = require("../models/Product");

// 1. 사용자 정보 불러오기 (닉네임 + farmName 포함)
router.post("/userdata", async (req, res) => {
  try {
    const { nickname } = req.body;
    if (!nickname) {
      return res.status(401).json({
        success: false,
        message: "🚫 인증되지 않은 접근입니다. 로그인 후 이용해 주세요."
      });
    }

    const user = await Farm.findOne({ nickname });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "❌ 등록되지 않은 사용자입니다."
      });
    }

    return res.json({
      success: true,
      user: {
        nickname: user.nickname,
        farmName: user.farmName || "미지정",
        water: user.water,
        fertilizer: user.fertilizer,
        token: user.token
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "🔥 서버 오류 발생",
      error: err.message
    });
  }
});

// 2. 제품 불러오기 API
router.get("/products/:nickname", async (req, res) => {
  try {
    const nickname = req.params.nickname;
    if (!nickname) {
      return res.status(400).json({ success: false, message: "닉네임 누락" });
    }

    const products = await Product.find({ nickname });
    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, message: "❌ 보관된 제품 없음" });
    }

    return res.json({
      success: true,
      products: products.map(p => ({
        name: p.name,
        type: p.type,
        count: p.count
      }))
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "🚨 제품 불러오기 실패",
      error: err.message
    });
  }
});

module.exports = router;
