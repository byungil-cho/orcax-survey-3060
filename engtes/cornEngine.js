// engine/cornEngine.js

const mongoose = require('mongoose');

// 옥수수 수확 등급 테이블
const gradeTable = {
  A: [1000, 900, 800],
  B: [800, 700, 600],
  C: [600, 500, 400],
  D: [400, 300, 200],
  E: [200, 100, 50],
  F: [100, 50, 10],
};

// 레벨 보상 테이블
const levelRewards = {
  default: 100,
  milestone: {
    11: 5000,
    21: 10000,
    31: 15000,
    41: 20000,
    51: 25000,
  }
};

function plantSeed(user) {
  if (user.loan && user.loan.active) {
    return 'corn-red.png';
  } else if (user.loan && user.loan.defaulted) {
    return 'corn-black.png';
  } else {
    return 'corn-yellow.png';
  }
}

function growStep(user, currentTime) {
  const plantedAt = new Date(user.plantedAt);
  const hours = Math.floor((currentTime - plantedAt) / (1000 * 60 * 60));
  const days = Math.floor(hours / 24) + 1;
  const segments = Math.floor((hours % 24) / 3) + 1;
  return { days, segments };
}

function harvestCorn(user) {
  const { days } = growStep(user, new Date());
  let grade = 'F';
  if (days === 5) grade = 'A';
  else if (days === 6) grade = 'B';
  else if (days === 7) grade = 'C';
  else if (days === 8) grade = 'D';
  else if (days === 9) grade = 'E';
  else if (days >= 10) grade = 'F';

  const cornCount = Math.floor(Math.random() * 5) + 5; // 5~9 랜덤
  return { grade, cornCount };
}

function popCorn(user, grade, cornCount) {
  const values = gradeTable[grade];
  let tokens = 0;
  for (let i = 0; i < cornCount; i++) {
    const reward = values[Math.floor(Math.random() * values.length)];
    tokens += reward;
  }

  // 소금1 + 설탕1 + 토큰30 소모
  if (user.salt < 1 || user.sugar < 1 || user.tokens < 30) {
    throw new Error('자원이 부족합니다.');
  }
  user.salt -= 1;
  user.sugar -= 1;
  user.tokens -= 30;

  // 대출 상태 반영
  if (user.loan && user.loan.active) {
    tokens = Math.floor(tokens * 0.7); // 30% 공제
  }
  if (user.loan && user.loan.defaulted) {
    tokens = Math.floor(tokens * 0.7); // 30% 공제
    const daysDefaulted = Math.floor((new Date() - new Date(user.loan.start)) / (1000*60*60*24));
    const penalty = Math.floor(user.loan.amount * 0.05 * daysDefaulted);
    user.tokens -= penalty;
  }

  user.tokens += tokens;
  return tokens;
}

function exchangePopcorn(user, popcorn) {
  if (popcorn < 1) throw new Error('팝콘 부족');
  user.popcorn -= popcorn;
  user.fertilizer += popcorn;
  return { fertilizer: user.fertilizer };
}

function levelUp(user) {
  user.level = (user.level || 0) + 1;
  let reward = levelRewards.default;
  if (levelRewards.milestone[user.level]) {
    reward = levelRewards.milestone[user.level];
  }
  user.tokens += reward;
  return { level: user.level, reward };
}

function schedulePlant(user, now) {
  const plantedAt = new Date(now);
  const hours = plantedAt.getHours();
  const segment = Math.floor((hours - 8) / 3) + 1;
  if (segment <= 2) {
    return { scheduled: false, seed: plantSeed(user) };
  } else {
    return { scheduled: true, scheduledAt: new Date(plantedAt.setDate(plantedAt.getDate() + 1)).setHours(8,0,0,0), seed: plantSeed(user) };
  }
}

module.exports = {
  plantSeed,
  growStep,
  harvestCorn,
  popCorn,
  exchangePopcorn,
  levelUp,
  schedulePlant
};
