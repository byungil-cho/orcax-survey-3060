const mongoose = require("mongoose");

const seedPriceSchema = new mongoose.Schema({
  seedType: { type: String, required: true, unique: true },
  price: { type: Number, default: 1 }
});

module.exports = mongoose.models.SeedPrice || mongoose.model("SeedPrice", seedPriceSchema);
