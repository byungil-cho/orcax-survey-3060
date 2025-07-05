const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, default: "Unknown" },
  orcx: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 }
  // email 제거됨
});

const User = mongoose.model("User", userSchema);

module.exports = User;
