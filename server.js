const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3060;

app.use(cors());
app.use(express.json());

/* 기존 라우터 유지 */
const farmRoutes = require('./routes/farm'); 
app.use('/api/farm', farmRoutes);

/* 보리 라우터 추가 */
const barleyRoutes = require('./routes/barley');
app.use('/api', barleyRoutes); // /api/convert-barley 등 사용 가능

/* MongoDB 연결 */
mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 완료'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

/* 기본 상태 확인 */
app.get('/', (req, res) => {
  res.send('✅ OrcaX 서버 정상 작동 중!');
});

/* ✅ 전기 공급 상태 확인 (수정됨) */
app.get('/api/status', (req, res) => {
  res.status(200).json({ message: '전기 공급 정상' });
});

/* 서버 실행 */
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
