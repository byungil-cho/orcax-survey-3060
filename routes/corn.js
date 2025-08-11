import PriceBoard from "../models/PriceBoard.js";

// 가격판 조회 (누구나)
r.get("/priceboard", async (req, res) => {
  const pb = await PriceBoard.findOneAndUpdate(
    { scope: "corn.additives" },
    { $setOnInsert: { scope: "corn.additives" } },
    { new: true, upsert: true }
  );
  res.json({ currency: pb.currency, salt: pb.salt, sugar: pb.sugar, updatedAt: pb.updatedAt });
});

// 가격판 수정 (관리자만)
r.patch("/priceboard", async (req, res) => {
  // 관리자 보호: req.user.role === 'admin' 같은 체크 필수
  if (req.user?.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });

  const { salt, sugar, currency } = req.body || {};
  const $set = {};
  if (Number.isFinite(salt))  $set.salt  = Math.max(0, Math.floor(salt));
  if (Number.isFinite(sugar)) $set.sugar = Math.max(0, Math.floor(sugar));
  if (typeof currency === "string") $set.currency = currency;

  const pb = await PriceBoard.findOneAndUpdate(
    { scope: "corn.additives" },
    { $set, updatedBy: req.user._id, updatedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json({ ok: true, currency: pb.currency, salt: pb.salt, sugar: pb.sugar, updatedAt: pb.updatedAt });
});
