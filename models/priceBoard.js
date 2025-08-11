import mongoose from "mongoose";

const PriceBoardSchema = new mongoose.Schema({
  scope: { type: String, unique: true, default: "corn.additives" }, // 가격판 구분
  currency: { type: String, default: "ORCX" },
  salt:  { type: Number, min: 0, default: 10 }, // 기본: 10
  sugar: { type: Number, min: 0, default: 20 }, // 기본: 20
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model("PriceBoard", PriceBoardSchema);
