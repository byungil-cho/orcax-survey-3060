const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    nickname: String,
    water: Number,
    fertilizer: Number,
    token: Number,
    potatoCount: Number,
    inventory: [
        {
            type: { type: String },
            count: Number
        }
    ],
    seedPotato: Number,
    lastFreeTime: Date,
    freeFarmCount: Number
});

module.exports = mongoose.model('Farm', farmSchema);
