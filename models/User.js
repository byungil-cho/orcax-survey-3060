const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    kakaoId: String,
    nickname: String,
    farmName: String,
    potato: { type: Number, default: 0 },
    seed: { type: Number, default: 2 },
    water: { type: Number, default: 10 },
    fertilizer: { type: Number, default: 10 },
    token: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);