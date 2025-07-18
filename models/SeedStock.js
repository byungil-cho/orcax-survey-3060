const mongoose = require("mongoose");

const seedStockSchema = new mongoose.Schema({
  seedType: { type: String, required: true, unique: true }, // "gamja", "bori"
  quantity: { type: Number, default: 0 },
  price: { type: Number, default: 1 }, // ★ price 필드 추가
});

module.exports = mongoose.models.SeedStock || mongoose.model("SeedStock", seedStockSchema);
