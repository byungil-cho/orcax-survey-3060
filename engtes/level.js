// level.js — Corn Engine 5.0 캐릭터 레벨 모듈
// 먼데이™ 제작 — 문서 규정 100% 반영

export class LevelSystem {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.level = 1;
    this.box = []; // 보관함
    this.logs = [];
  }

  static MAX_LEVEL = 50;

  // 보상 테이블
  static rewards = {
    tokenLevels: [5, 10, 20, 30, 40, 50],
    nftLevels: [11, 21, 31, 41, 51]
  };

  // 캐릭터 이미지 단계 계산
  static getImageStage(level) {
    if (level >= 46) return "final";
    return `stage${Math.ceil(level / 5)}`;
  }

  // 옥수수 수확 시 호출
  harvestSuccess() {
    if (this.level >= LevelSystem.MAX_LEVEL) {
      return this._notify("최대 레벨 도달 (Lv.50)");
    }
    this.level++;
    this._giveReward(this.level);
    this._log("레벨업", this.level);
    return this._notify(`레벨업! Lv.${this.level} (보관함 확인)`);
  }

  harvestFail() {
    this._log("수확 실패", this.level);
    return this._notify("수확 실패 → 레벨 변화 없음");
  }

  // 보상 적립
  _giveReward(level) {
    if (LevelSystem.rewards.tokenLevels.includes(level)) {
      this.box.push({ type: "token", level });
    }
    if (LevelSystem.rewards.nftLevels.includes(level)) {
      this.box.push({ type: "nft", level });
    }
  }

  // 보관함 수령
  claimRewards() {
    const items = [...this.box];
    this.box = [];
    return items;
  }

  // 로그 기록
  _log(event, level) {
    this.logs.push({ event, level, time: Date.now() });
  }

  // 상태 조회
  getStatus() {
    return {
      level: this.level,
      imageStage: LevelSystem.getImageStage(this.level),
      box: this.box,
      logs: this.logs
    };
  }

  // 알림
  _notify(msg) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({ message: msg, level: this.level, box: this.box });
    }
    return msg;
  }
}
