const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

(async () => {
  try {
    const users = await User.find({});
    for (const user of users) {
      if (!user.inventory) {
        user.inventory = {
          seedPotato: user.seedPotato || 0,
          seedBarley: user.seedBarley || 0,
          water: user.water || 0,
          fertilizer: user.fertilizer || 0,
          token: user.token || 0,
        };
      }

      if (!user.farm) {
        user.farm = {
          potato: user.potato || 0,
          barley: user.barley || 0,
        };
      }

      if (!user.products) {
        user.products = {
          chips: user.chips || 0,
          noodles: user.noodles || 0,
        };
      }

      await user.save();
    }

    console.log('✅ 마이그레이션 완료');
    process.exit(0);
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
  }
})();
