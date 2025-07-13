const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URL || '몽고URL입력';

const SeedInventorySchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  seedPotato: { type: Object, default: {} },
  seedBarley: { type: Object, default: {} }
}, { collection: 'seedinventories' });

const SeedInventory = mongoose.model('SeedInventory', SeedInventorySchema);

async function initSingletonSeedInventory() {
  await mongoose.connect(MONGODB_URI);

  const exists = await SeedInventory.findById('singleton');
  if (exists) {
    console.log('✅ singleton 문서가 이미 존재합니다.');
  } else {
    await SeedInventory.create({
      _id: 'singleton',
      seedPotato: {},
      seedBarley: {}
    });
    console.log('🌱 seedinventories 초기 singleton 문서 생성 완료!');
  }

  mongoose.disconnect();
}

initSingletonSeedInventory();
