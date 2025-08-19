// resources.js — Corn Engine 5.0 자원 관리 전용
// 먼데이™ 제작

export class ResourceEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate; // 상태 변경 콜백

    // 초기 상태
    this.resources = {
      water: 0,        // 현재 물 보유량
      fertilizer: 0,   // 현재 거름 보유량
      time: 0          // 경과 시간 (분)
    };

    this.maxWater = 5;        // 물 최대치
    this.maxFertilizer = 5;   // 거름 최대치
    this.cycleMinutes = 180;  // 3시간(180분) 단위
  }

  // 물 추가
  addWater(amount = 1) {
    this.resources.water = Math.min(this.maxWater, this.resources.water + amount);
    this._notify("물 추가");
  }

  // 거름 추가
  addFertilizer(amount = 1) {
    this.resources.fertilizer = Math.min(this.maxFertilizer, this.resources.fertilizer + amount);
    this._notify("거름 추가");
  }

  // 시간 경과 (분 단위)
  tick(minutes = 1) {
    this.resources.time += minutes;

    // cycleMinutes(180분) 도달하면 리셋
    if (this.resources.time >= this.cycleMinutes) {
      this.resources.time = 0;
      this._notify("주기 도달 (3시간)");
    } else {
      this._notify("시간 경과");
    }
  }

  // 현재 상태 조회
  getResources() {
    return { ...this.resources };
  }

  // 초기화
  reset() {
    this.resources = { water: 0, fertilizer: 0, time: 0 };
    this._notify("자원 리셋");
  }

  // 알림 처리
  _notify(msg) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({
        message: msg,
        resources: { ...this.resources }
      });
    }
  }
}
