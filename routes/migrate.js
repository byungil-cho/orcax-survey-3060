const express = require("express");
const router = express.Router();
const User = require("../models/users");

router.post("/", async (req, res) => {
  try {
    const users = await User.find({});
    let count = 0;

    for (const user of users) {
      let modified = false;

      if (!user.inventory) {
        user.inventory = {
          water: user.water ?? 0,
          fertilizer: user.fertilizer ?? 0,
          seedPotato: user.seedPotato ?? 0,
          seedBarley: user.seedBarley ?? 0
        };
        modified = true;
      }

      if (!user.wallet) {
        user.wallet = {
          orcx: user.orcx ?? 0
        };
        modified = true;
      }

      if (!user.storage) {
        user.storage = {
          gamja: user.potato ?? 0,
          bori: user.bori ?? 0
        };
        modified = true;
      }

      if (modified) {
        delete user.water;
        delete user.fertilizer;
        delete user.seedPotato;
        delete user.seedBarley;
        delete user.orcx;
        delete user.potato;
        delete user.bori;

        await user.save();
        count++;
      }
    }

    res.json({ success: true, message: `${count}명 마이그레이션 완료` });
  } catch (err) {
    console.error("❌ 마이그레이션 오류:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
