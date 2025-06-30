const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const path     = require('path');

const userdataRouter = require('./routes/userdata');
const User = require('./models/User');
const app = express();
// 환경변수 PORT 사용 (배포용)
const port = process.env.PORT || 3060;

// 미들웨어
app.use(cors());
app.use(express.json());

// 1) 유저 저장 API
app.post('/api/saveUser', async (req, res) => {
const { kakaoId, nickname, orcx, water, fertilizer } = req.body;
try {
let user = await User.findOne({ kakaoId });
if (!user) {
user = new User({ kakaoId, nickname, orcx, water, fertilizer });
await user.save();
console.log('✅ 신규 유저 저장:', kakaoId);
} else {
console.log('ℹ️ 이미 등록된 유저:', kakaoId);
}
return res.json({ success: true });
} catch (err) {
console.error('❌ saveUser 오류:', err);
return res.status(500).json({ success: false, error: err.message });
}
});

// 2) 로그인 API (index9.html 용)
app.post('/api/login', (req, res) => {
// 단순 성공 응답
return res.json({ success: true });
});

// 3) 유저 조회 API
app.use('/api/userdata', userdataRouter);

// 4) 정적 파일 제공 (HTML, JS, CSS)
app.use(express.static(path.join(\_\_dirname)));

// MongoDB 연결
mongoose.connect('mongodb://localhost:27017/orcax', {
useNewUrlParser: true,
useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 연결 성공!'))
.catch(err => {
console.error('❌ MongoDB 연결 실패:', err);
process.exit(1); // DB 연결 실패 시 서버 종료
});

// 서버 시작
app.listen(port, () => {
console.log(`🚀 Server running on http://localhost:${port}`);
});
