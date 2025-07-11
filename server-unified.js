const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

// 🔧 Express app init
const app = express();
const PORT = process.env.PORT || 3060;

// 🔌 Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB 연결 완료"))
.catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ 라우터 연결
app.use(require("./routes/userdata"));
app.use(require("./routes/seed-status"));
app.use(require("./routes/seed-price"));
app.use(require("./routes/init-user")); // 필요 시
app.use(require("./routes/seed-buy"));  // 필요 시

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 : http://localhost:${PORT}`);
});
