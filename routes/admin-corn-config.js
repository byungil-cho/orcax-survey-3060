// routes/admin-corn-config.js
const router = require('express').Router();
const CornConfig = require('../models/CornConfig');

// ⛔ 간단 관리자 인증 (메모에 저장된 비번 "2025")
const ADMIN_PASS = process.env.ADMIN_PASS || '2025';

const DEFAULTS = {
  grades: {
    A: { tokenRate: 0.9, popcornRate: 0.1, tokenTable: [1000, 900, 800] },
    B: { tokenRate: 0.7, popcornRate: 0.3, tokenTable: [800, 700, 600]  },
    C: { tokenRate: 0.6, popcornRate: 0.4, tokenTable: [600, 500, 400]  },
    D: { tokenRate: 0.5, popcornRate: 0.5, tokenTable: [400, 300, 200]  },
    E: { tokenRate: 0.4, popcornRate: 0.6, tokenTable: [200, 100, 50]   },
    F: { tokenRate: 0.3, popcornRate: 0.7, tokenTable: [100, 50, 10]    },
  },
  preset: { "5":[2,1,1,1], "7":[1,3,2,1], "9":[1,3,4,1] }
};

async function getOrInit() {
  let cfg = await CornConfig.findOne({ key:'global' });
  if (!cfg) {
    cfg = await CornConfig.create({ key:'global', ...DEFAULTS, updatedBy:'system' });
  }
  return cfg;
}

// GET: 현재 설정 조회
router.get('/corn-config', async (req,res) => {
  const cfg = await getOrInit();
  return res.json({ ok:true, config: cfg });
});

// POST: 값 업데이트 (관리자 인증)
router.post('/corn-config', async (req,res) => {
  const { password, grades, preset, updatedBy } = req.body || {};
  if (password !== ADMIN_PASS) return res.status(403).json({ ok:false, message:'FORBIDDEN' });

  const cfg = await getOrInit();

  if (grades) {
    for (const g of ['A','B','C','D','E','F']) {
      if (!grades[g]) continue;
      if (typeof grades[g].tokenRate === 'number')  cfg.grades[g].tokenRate  = grades[g].tokenRate;
      if (typeof grades[g].popcornRate === 'number')cfg.grades[g].popcornRate= grades[g].popcornRate;
      if (Array.isArray(grades[g].tokenTable) && grades[g].tokenTable.length===3) {
        cfg.grades[g].tokenTable = grades[g].tokenTable.map(n=>Number(n));
      }
    }
  }
  if (preset) {
    ['5','7','9'].forEach(k=>{
      if (Array.isArray(preset[k]) && preset[k].length===4) cfg.preset[k] = preset[k].map(n=>Number(n));
    });
  }
  cfg.updatedAt = new Date();
  cfg.updatedBy = updatedBy || 'admin';
  await cfg.save();

  return res.json({ ok:true, config: cfg });
});

module.exports = router;
