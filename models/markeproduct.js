const mongoose = require("mongoose");

const marketProductSchema = new mongoose.Schema({
  name:       { type: String, required: true },   // 예: "감자칩", "보리빵", "팝콘"
  price:      { type: Number, required: true },   // 전광판/관리자 가격
  stock:      { type: Number, default: 0 },       // 재고(선택)
  isActive:   { type: Boolean, default: true },   // 판매여부
  updatedAt:  { type: Date, default: Date.now }
});

marketProductSchema.pre("save", function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("MarketProduct", marketProductSchema, "market_products");
