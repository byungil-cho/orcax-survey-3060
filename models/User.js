
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: String,  // 로그인 별명
  자원: {
    물: { type: Number, default: 0 },
    거름: { type: Number, default: 0 }
  },
  토큰: {
    오크: { type: Number, default: 0 }
  },
  씨앗: {
    type: [String],
    default: []
  },
  목록: {
    type: [String],
    default: []
  },
  감자_개수: { type: Number, default: 0 },
  보리_개수: { type: Number, default: 0 }
}, { collection: 'users' });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
