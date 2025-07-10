
const mongoose = require('mongoose');

const FarmSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  potato: { type: Number, default: 0 },
  barley: { type: Number, default: 0 }
});

module.exports = mongoose.model('Farm', FarmSchema);
