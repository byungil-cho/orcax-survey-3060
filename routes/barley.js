import express from "express";
const router = express.Router();

// 임시 라우터 (테스트용)
router.get("/", (req, res) => {
  res.json({ message: "보리 농장 API 준비 중" });
});

export default router;
