require('dotenv').config();
const mongoose = require('mongoose');

const seedInventorySchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  seedPotato: {
    available: { type: Number, default: 100 },
    used: { type: Number, default: 0 },
  },
  seedBarley: {
    available: { type: Number, default: 100 },
    used: { type: Number, default: 0 },
  },
}, { collection: 'seedinventories' });

const SeedInventory = mongoose.model('SeedInventory', seedInventorySchema);

async function initSingletonSeedInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existing = await SeedInventory.findById('singleton');
    if (existing) {
      console.log('✅ 이미 singleton 문서가 존재합니다.');
    } else {
      const newInventory = new SeedInventory({
        _id: 'singleton',
        seedPotato: { available: 100, used: 0 },
        seedBarley: { available: 100, used: 0 },
      });
      await newInventory.save();
      console.log('🌱 singleton 문서를 초기화했습니다.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB 연결 또는 저장 중 오류:', err);
    process.exit(1);
  }
}

initSingletonSeedInventory();
