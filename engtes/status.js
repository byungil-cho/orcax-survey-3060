// status.js — Corn Engine 5.0 상태 조회 모듈
// 먼데이™ 제작 — 문서 규정 100% 반영

export class StatusLogic {
  constructor(engine, isAdmin = false, onUpdate) {
    this.engine = engine;     // CornEngine 인스턴스
    this.isAdmin = isAdmin;   // 관리자 여부
    this.onUpdate = onUpdate;
  }

  // === 유저 상태 조회 ===
  getUserStatus(userId) {
    const status = this.engine.getStatus();

    const userView = {
      farm: {
        growthGauge: status.resources.growthGauge,
        waterUsed: status.resources.waterUsed,
        fertilizerUsed: status.resources.fertilizerUsed,
        wilted: status.resources.wilted,
        harvestReady: status.resources.harvestReady
      },
      myPage: {
        rewardBox: status.rewardBox,
        level: status.level,
        loans: status.economy.loans,
        harvestHistory: status.economy.history || [],
        tokenBalance: status.economy.tokens
      }
    };

    return this._notify({ userId, view: userView });
  }

  // === 관리자 상태 조회 ===
  getAdminStatus() {
    if (!this.isAdmin) return this._notify("관리자 권한 없음");

    const status = this.engine.getStatus();

    const adminView = {
      users: status.resources,  // 유저 자원 상태
      growth: status.resources.growthDetail || {}, // 구간별 성장률, 물/거름
      rewards: status.rewardBox,
      economy: status.economy,
      logs: status.adminLogs || []
    };

    return this._notify({ view: adminView });
  }

  // === 동기화 ===
  sync() {
    const data = this.isAdmin ? this.getAdminStatus() : this.getUserStatus("self");
    return this._notify({ sync: true, data });
  }

  // === 알림 ===
  _notify(data) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(data);
    }
    return data;
  }
}
