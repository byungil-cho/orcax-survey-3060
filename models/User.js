const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, default: "신규 사용자" },
  farmName: { type: String, default: "" },
  token: { type: Number, default: 0 },
  seedPotato: { type: Number, default: 0 },
  seedBarley: { type: Number, default: 0 }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
