// ✅ Step 1: 백엔드에서 제품 목록 조회 API가 정상인지 확인하고 구현함

// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 제품 목록 불러오기
router.get('/:nickname', async (req, res) => {
  const { nickname } = req.params;
  try {
    const products = await Product.find({ nickname });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 실패' });
  }
});

// 제품 저장
router.post('/', async (req, res) => {
  const { nickname, productName, productType, quantity } = req.body;
  try {
    let item = await Product.findOne({ nickname, productName, productType });
    if (item) {
      item.quantity += quantity;
    } else {
      item = new Product({ nickname, productName, productType, quantity });
    }
    await item.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '저장 실패' });
  }
});

module.exports = router;

// ✅ Step 2: 프론트엔드에서 제품 보관함 UI 로딩 로직 (JS)

// HTML에 이미 존재한다고 가정: <ul id="productList"></ul>

async function loadProducts(nickname) {
  try {
    const res = await fetch(`/api/products/${nickname}`);
    const data = await res.json();
    if (data.success) {
      const list = document.getElementById('productList');
      list.innerHTML = '';
      data.products.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.productType} 제품: ${p.productName} (${p.quantity})`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error('제품 목록 불러오기 실패:', err);
  }
}

// ✅ Step 3: 제품 가공 시 productType 반영하는 POST 로직 예시 (JS)

async function registerProduct(nickname, productName, productType) {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, productName, productType, quantity: 1 })
    });
    const data = await res.json();
    if (data.success) {
      loadProducts(nickname);
    }
  } catch (err) {
    console.error('제품 등록 실패:', err);
  }
}
