const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, default: "Unknown" },
  email: { type: String, default: "" },
  orcx: { type: Number, default: 0 },
  water: { type: Number, default: 0 },
  fertilizer: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
