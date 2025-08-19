// gauge.js — Corn Engine 5.0 게이지 관리 모듈
// 먼데이™ 제작 — 문서 명세 100% 반영

export class GaugeSystem {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;

    // 원형 게이지: 일차 → 색상 + 등급
    this.circleGauge = [
      { day: 1, percent: 20, color: "red", grade: null },
      { day: 2, percent: 40, color: "orange", grade: null },
      { day: 3, percent: 60, color: "yellow", grade: null },
      { day: 4, percent: 80, color: "green", grade: null },
      { day: 5, percent: 100, color: "blue", grade: "A" },
      { day: 6, percent: 100, color: "navy", grade: "B" },
      { day: 7, percent: 100, color: "purple", grade: "C" },
      { day: 8, percent: 100, color: "lime", grade: "D" },
      { day: 9, percent: 100, color: "white", grade: "E" },
      { day: 10, percent: 100, color: "black", grade: "F" }
    ];

    // 세로 막대 게이지
    this.waterGauge = 0;     // 0 ~ 100%
    this.fertilizerGauge = 0;
    this.growthGauge = 0;    // 하루 단위 (5구간)

    // 가로 레벨 게이지
    this.levelProgress = 0;  // 0 ~ 100%
  }

  // === 원형 게이지 조회 ===
  getCircleStatus(day) {
    return this.circleGauge.find(d => d.day === day) || null;
  }

  // === 물 게이지 ===
  addWater(amount = 1) {
    this.waterGauge = Math.min(100, this.waterGauge + (amount * 33.3));
    return this._notify("물 추가", this.waterGauge);
  }
  tickWater() {
    this.waterGauge = Math.max(0, this.waterGauge - (100 / 18)); // 10분 단위 소모
    return this._notify("물 소모", this.waterGauge);
  }

  // === 거름 게이지 ===
  addFertilizer(amount = 1) {
    this.fertilizerGauge = Math.min(100, this.fertilizerGauge + (amount * 100));
    return this._notify("거름 추가", this.fertilizerGauge);
  }
  tickFertilizer() {
    this.fertilizerGauge = Math.max(0, this.fertilizerGauge - (100 / 18));
    return this._notify("거름 소모", this.fertilizerGauge);
  }

  // === 성장 게이지 (구간 진척) ===
  progressGrowth() {
    if (this.waterGauge > 0 && this.fertilizerGauge > 0) {
      this.growthGauge = Math.min(100, this.growthGauge + 20);
      return this._notify("성장 진행", this.growthGauge);
    }
    return this._notify("조건 부족", this.growthGauge);
  }

  // === 레벨 게이지 ===
  updateLevel(day) {
    this.levelProgress = Math.min(100, day * 20);
    if (day >= 5) {
      this.levelProgress = 100;
    }
    return this._notify("레벨 게이지", this.levelProgress);
  }
  resetLevel() {
    this.levelProgress = 0;
  }

  // === 상태 조회 ===
  getStatus(day) {
    return {
      circle: this.getCircleStatus(day),
      water: this.waterGauge,
      fertilizer: this.fertilizerGauge,
      growth: this.growthGauge,
      level: this.levelProgress
    };
  }

  // === 알림 ===
  _notify(msg, value) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({ message: msg, value });
    }
    return { message: msg, value };
  }
}
