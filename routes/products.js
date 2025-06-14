// ✅ File: products.js (수정 대상)

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Farm = require('../models/Farm'); // ✅ 사용자 보관함용 모델

// 제품 등록 + 사용자 보관함에도 반영
router.post('/', async (req, res) => {
  const { nickname, productName, productType, quantity } = req.body;

  try {
    // 제품 저장
    const newProduct = new Product({
      nickname,
      type: productName,
      category: productType,
      count: quantity
    });
    await newProduct.save();

    // 보관함 업데이트
    const user = await Farm.findOne({ nickname });
    if (!user) return res.status(404).json({ error: "유저 없음" });

    user.inventory = user.inventory || [];
    const existing = user.inventory.find(i => i.type === productName);
    if (existing) {
      existing.count += quantity;
    } else {
      user.inventory.push({ type: productName, count: quantity });
    }

    await user.save();

    res.status(201).json({ message: "제품 저장 및 보관함 반영 완료", product: newProduct });
  } catch (err) {
    console.error("제품 저장 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

// 제품 조회 (유저 기준)
router.get('/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const products = await Product.find({ nickname });
    if (!products || products.length === 0) {
      return res.status(404).json({ message: '해당 유저의 제품이 없습니다.' });
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
});

// ✅ 추가: 프론트에서 사용할 렌더링용 JS 함수
// (이 코드는 프론트 JS 파일에 들어가야 함, 여긴 참고용)
/*
function loadProductStorage(nickname) {
  fetch(`/api/products/${nickname}`)
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById('productStorage');
      if (!container) {
        console.error("❌ 보관소 DOM 요소 없음");
        return;
      }

      container.innerHTML = ''; // 초기화

      if (!products.length) {
        container.textContent = '제품이 없습니다.';
        return;
      }

      products.forEach(p => {
        const div = document.createElement('div');
        div.textContent = `${p.type} (${p.category}) x${p.count}`;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("📛 제품 불러오기 실패:", err);
    });
}
*/

module.exports = router;
