
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  별명: String,
  오크: Number,
  씨감자: Number,
  물: Number,
  비료: Number,
  '감자 개수': Number,
  '수확 횟수': Number,
  '농사 개수': Number,
  목록: Object,
  교환로그: Object,
  '마지막 종전': Number,
  __: Number,
  다섯: String
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
