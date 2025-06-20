// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose"); // ✅ 이 줄 추가
const app = express();
const PORT = 3060;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "orcax-club")));

// API 라우트 연결
app.use("/api/user", require("./orcax-club/api/user"));
app.use("/api/admin", require("./orcax-club/api/admin"));
app.use("/api/farm", require("./orcax-club/api/farm"));
app.use("/api/auth", require("./orcax-club/api/auth"));

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ OrcaX Server ON! → http://localhost:${PORT}`);
});
