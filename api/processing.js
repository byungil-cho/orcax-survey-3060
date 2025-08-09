// api/processing.js (트랜잭션 없이 단일 원자 업데이트)
const User = require('../models/users');

async function makeProductAtomic(req, res) {
  const { kakaoId, material, product } = req.body || {};
  if (!kakaoId) return res.json({ success:false, message:'kakaoId 누락' });
  if (!product || String(product).length < 2)
    return res.json({ success:false, message:'제품명 오류' });

  let decField = null;
  if (material === 'potato' || material === 'seedPotato') decField = 'storage.gamja';
  if (material === 'barley' || material === 'seedBarley') decField = 'storage.bori';
  if (!decField) return res.json({ success:false, message:'material 오류' });

  try {
    const incDoc = { [decField]: -1, [`products.${product}`]: 1 };
    const updatedUser = await User.findOneAndUpdate(
      { kakaoId, [decField]: { $gte: 1 } }, // 조건 충족 시에만
      { $inc: incDoc },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(409).json({ success:false, message:'재고 부족' });
    }
    return res.json({
      success: true,
      user: { storage: updatedUser.storage, products: updatedUser.products || {} }
    });
  } catch (e) {
    console.error('makeProductAtomic error:', e);
    return res.status(500).json({ success:false, message:'processing_failed' });
  }
}

module.exports = { makeProductAtomic };
