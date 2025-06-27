// 서버 코드 예시 - Express 사용

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json()); // ✅ JSON 파싱 활성화 (이게 핵심)

// 가짜 DB
let users = [
  { nickname: "범고래X", orcx: 5 }
];

// 토큰 차감 처리
app.post("/api/use-token", (req, res) => {
  const { nickname, amount, item } = req.body;
  if (!nickname || !amount || !item) {
    return res.status(400).json({ success: false, message: "Missing data" });
  }

  const user = users.find(u => u.nickname === nickname);
  if (!user || user.orcx < amount) {
    return res.status(400).json({ success: false, message: "Not enough tokens" });
  }

  user.orcx -= amount;
  console.log(`[TOKEN] ${nickname} => -${amount} ORCX (item: ${item})`);
  res.json({ success: true });
});

// 유저 데이터 요청
app.get("/api/userdata", (req, res) => {
  const { nickname } = req.query;
  const found = users.filter(u => u.nickname === nickname);
  res.json({ users: found });
});

// 기본 응답
app.get("/", (req, res) => {
  res.send("ORCX 서버 살아있음");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
