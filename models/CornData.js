// models/cornData.js
const mongoose = require("mongoose");

// 옥수수 개별 데이터
const cornItemSchema = new mongoose.Schema({
  grade: { type: String, enum: ["A", "B", "F"], default: "F" }, // 등급
  color: { type: String, enum: ["red", "yellow"], default: "yellow" }, 
  plantedAt: { type: Date, default: Date.now },   // 심은 날짜
  harvestedAt: { type: Date },                    // 수확 날짜
});

const cornSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true }, 
  corn: [cornItemSchema],             // 심어서 자라는 옥수수들
  popcorn: { type: Number, default: 0 },   // 뻥튀기 가능 수확물
  seed: { type: Number, default: 0 },      // 씨옥수수
  additives: {
    salt: { type: Number, default: 0 },    
    sugar: { type: Number, default: 0 },   
  },
  loan: {
    amount: { type: Number, default: 0 },   
    interest: { type: Number, default: 0 }, 
    createdAt: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 저장 전 updatedAt 자동 갱신
cornSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("CornData", cornSchema, "corn_data");
