const mongoose = require("mongoose");

const seedInventorySchema = new mongoose.Schema({
  _id: { type: String, default: "singleton" }, // 고정 ID
  seedPotato: {
    quantity: { type: Number, default: 100 },
    price: { type: Number, default: 2 }
  },
  seedBarley: {
    quantity: { type: Number, default: 100 },
    price: { type: Number, default: 2 }
  }
});

module.exports = mongoose.models.SeedInventory || mongoose.model("SeedInventory", seedInventorySchema);
