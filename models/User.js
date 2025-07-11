const userSchema = new mongoose.Schema({
  kakaoId: String,
  nickname: String,
  email: String,
  오크: Number,
  물: Number,            // ← 수정됨
  비료: Number,
  다섯: Number,
  목록: Object,
  감자: Number,
  씨앗감자: Number,
  씨앗보리: Number
});
