require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3060;

// ✅ CORS 고정 도메인 설정
const corsOptions = {
  origin: "https://climbing-wholly-grouper.jp.ngrok.io",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ API 라우팅
const userdataRoutes = require("./routes/userdata");
const loginRoutes = require("./routes/login");

app.use("/api/userdata", userdataRoutes);
app.use("/api/login", loginRoutes);

// ✅ 서버 상태 확인용 라우트
app.get("/", (req, res) => {
  res.send("✅ OrcaX Potato Server Running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
