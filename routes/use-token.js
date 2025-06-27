
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const TOKENS_FILE = path.join(__dirname, "../data/token.json");

function readTokenData() {
  try {
    const data = fs.readFileSync(TOKENS_FILE);
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function writeTokenData(data) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
}

router.post("/", (req, res) => {
  const { nickname, amount } = req.body;
  console.log("🐾 POST /api/use-token endpoint 호출됨 , body:", req.body);

  if (!nickname || typeof amount !== "number") {
    return res.status(400).json({ success: false, message: "닉네임과 수량이 필요합니다." });
  }

  const tokenData = readTokenData();

  if (!tokenData[nickname] || tokenData[nickname].token < amount) {
    return res.status(400).json({ success: false, message: "토큰이 부족합니다." });
  }

  tokenData[nickname].token -= amount;
  tokenData[nickname].seedPotato = (tokenData[nickname].seedPotato || 0) + 1;

  writeTokenData(tokenData);

  res.json({ success: true, message: "씨감자 구매 성공", data: tokenData[nickname] });
});

module.exports = router;
