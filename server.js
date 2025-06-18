const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

// ✅ MONGO_URL 환경변수 또는 직접 URL 설정
const MONGO_URL = "mongodb+srv://[ID]:[PW]@orcax-cluster.mongodb.net/?retryWrites=true&w=majority&appName=OrcaX-Cluster";

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB 연결됨"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

// ✅ 라우터 연결
const userdataRouter = require("./routes/userdata");
app.use("/api", userdataRouter);

app.get("/", (req, res) => res.send("OrcaX Farm 서버 실행 중"));

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
