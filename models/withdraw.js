const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  kakaoId:   { type: String, required: true },
  amount:    { type: Number, required: true },
  walletAddress: { type: String, required: true },
  status:    { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Withdraw", withdrawSchema, "withdraws");
