// models/CornData.js
const mongoose = require("mongoose");

const cornSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true },
  seed: { type: Number, default: 0 },
  corn: { type: Number, default: 0 },
  popcorn: { type: Number, default: 0 },
  additives: {
    salt: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 }
  }
});

// ✅ 이미 등록된 모델이 있으면 재사용
module.exports = mongoose.models.CornData || mongoose.model("CornData", cornSchema);
