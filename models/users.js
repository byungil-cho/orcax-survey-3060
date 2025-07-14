const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  nickname: String,
  wallet: String,
  inventory: {
    water: { type: Number, default: 10 },
    fertilizer: { type: Number, default: 10 },
    orcx: { type: Number, default: 10 },
    seed_potato: { type: Number, default: 0 },
    seed_barley: { type: Number, default: 0 },
    potato: { type: Number, default: 0 },
    barley: { type: Number, default: 0 }
  },
  farmName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
