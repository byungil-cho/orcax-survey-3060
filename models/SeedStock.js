const mongoose = require("mongoose");

const seedStockSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // "gamja", "bori"
  stock: { type: Number, default: 0 },                  // 수량
  price: { type: Number, default: 1 }                   // 가격
});

module.exports = mongoose.models.SeedStock || mongoose.model("SeedStock", seedStockSchema);
