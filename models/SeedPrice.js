const mongoose = require("mongoose");

const SeedPriceSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "seedPotato" or "seedBarley"
  price: { type: Number, required: true }
});

module.exports = mongoose.models.SeedPrice || mongoose.model("SeedPrice", SeedPriceSchema);
