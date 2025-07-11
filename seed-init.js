const mongoose = require('mongoose');
const User = require('./models/User'); // ✅ 이 줄 추가

mongoose.connect('mongodb://localhost:27017/orcax', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB 연결 성공');

  await User.create({
    kakaoId: '4235108081',
    nickname: '범고래X',
    email: '',
    오크: 4,
    물: 10,
    비료: 10,
    다섯: 1,
    목록: { 감자: 0, 씨앗감자: 0, 씨앗보리: 0 }
  });

  console.log('✅ 유저 생성 완료');
  mongoose.connection.close();
}).catch(err => {
  console.error('❌ MongoDB 연결 실패:', err);
});
