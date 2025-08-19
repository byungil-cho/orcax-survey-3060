// routes/admin-routes.js
import express from "express";
import { AdminLogic } from "../engtes/admin.js";  // ✅ 엔진 직접 연결

const router = express.Router();

// 관리자 엔진 인스턴스
const adminEngine = new AdminLogic("admin01"); // adminId는 로그인 기반으로 대체 가능

// === 설정 변경 ===
router.post("/config", (req, res) => {
  const { category, key, value } = req.body;
  const result = adminEngine.setConfig(category, key, value);
  res.json(result);
});

// === 대출 규칙 수정 ===
router.post("/loan/rules", (req, res) => {
  const { unit, harvestInterest, overdueInterest } = req.body;
  const result = adminEngine.updateLoanRules({ unit, harvestInterest, overdueInterest });
  res.json(result);
});

// === 대출 강제 상환 ===
router.post("/loan/repay", (req, res) => {
  const { userId, amount } = req.body;
  const result = adminEngine.forceRepay(userId, amount);
  res.json(result);
});

// === NFT 지급 ===
router.post("/nft/grant", (req, res) => {
  const { userId, rewardIndex, walletAddr } = req.body;
  const result = adminEngine.sendNFT(userId, rewardIndex, walletAddr);
  res.json(result);
});

// === 수동 보상 지급 ===
router.post("/reward/manual", (req, res) => {
  const { userId, type, amount } = req.body;
  const result = adminEngine.manualReward(userId, type, amount);
  res.json(result);
});

// === 유저 지갑 주소 변경 ===
router.post("/user/wallet", (req, res) => {
  const { userId, newWallet } = req.body;
  const result = adminEngine.updateWallet(userId, newWallet);
  res.json(result);
});

// === 로그 조회 ===
router.get("/logs", (req, res) => {
  res.json(adminEngine.getLogs());
});

// === 대기 중인 설정 반영 (08:00 스케줄러 대신 수동 호출) ===
router.post("/apply", (req, res) => {
  adminEngine.applyPendingChanges();
  res.json({ message: "모든 대기 변경사항이 적용됨" });
});

export default router;
