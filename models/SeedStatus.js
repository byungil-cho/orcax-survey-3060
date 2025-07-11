const mongoose = require('mongoose');

const seedStatusSchema = new mongoose.Schema({
  potato: { type: Number, default: 0 },
  barley: { type: Number, default: 0 }
});

module.exports = mongoose.model('SeedStatus', seedStatusSchema);
