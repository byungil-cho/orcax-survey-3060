const mongoose = require("mongoose");

const seedStockSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },  // 수정된 필드명
  quantity: { type: Number, default: 0 }
});

module.exports = mongoose.models.SeedStock || mongoose.model("SeedStock", seedStockSchema);
