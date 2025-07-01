const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

const userRoute = require('./routes/userdata');
const initUserRoute = require('./routes/init-user');

app.use('/api/userdata', userRoute);
app.use('/api/init-user', initUserRoute);

app.get('/', (req, res) => {
  res.send("OrcaX 서버 작동 중 🐳");
});

mongoose.connect('mongodb+srv://<YOUR_MONGO_URL>', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB 연결 성공");
  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("❌ MongoDB 연결 실패:", err.message);
});
