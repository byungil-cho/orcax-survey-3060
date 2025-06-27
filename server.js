require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3060;

const userRouter = require("./routes/user");

app.use(cors());
app.use(express.json());
app.use("/api", userRouter);

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공!"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

app.get("/", (req, res) => {
  res.send("✅ OrcaX 감자 서버 작동 중!");
});

// (기존 /api/init-user, /api/login, /api/userdata 모두 routes/user.js에 포함)
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});

