const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3060;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB 연결 완료"))
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// 라우터 등록
app.use("/api/userdata", require("./routes/userdata"));
app.use("/api/seed", require("./routes/seed"));  // 중요
app.use("/api/init-user", require("./routes/init-user")); // 예시

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중 http://localhost:${PORT}`);
});
