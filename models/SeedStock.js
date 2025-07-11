const mongoose = require("mongoose");

const seedStockSchema = new mongoose.Schema({
  seedType: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 }
});

module.exports = mongoose.models.SeedStock || mongoose.model("SeedStock", seedStockSchema);
