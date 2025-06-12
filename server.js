const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const farmRoutes = require('./routes/farm');
const barleyRoutes = require('./routes/barley');

const PORT = 3060;
const MONGO_URI = 'mongodb://127.0.0.1:27017/orcax';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB 연결됨');
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err.message);
});

app.use('/api', farmRoutes);
app.use('/api', barleyRoutes);

app.get('/api/status', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중 : http://localhost:${PORT}`);
});
