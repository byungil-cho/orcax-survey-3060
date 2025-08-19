// admin.js — Corn Engine 5.0 관리자 모드
// 먼데이™ 제작 — 문서 규정 100% 반영

export class AdminLogic {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.logs = [];
    this.pendingChanges = []; // 다음날 8시에 반영될 변경 사항
  }

  // === 성장/수확/뻥튀기/자원/보상 설정 ===
  setConfig(category, key, value, adminId = "system") {
    const change = {
      category, key, value,
      adminId,
      time: new Date().toISOString(),
      status: "대기"
    };
    this.pendingChanges.push(change);
    this._log("설정변경", change);
    return this._notify(`${category}.${key} → ${value} (적용: 내일 08:00)`);
  }

  // === 대출 관리 ===
  updateLoanRules({unit, harvestInterest, overdueInterest}, adminId="system") {
    return this.setConfig("loanRules", "update", 
      {unit, harvestInterest, overdueInterest}, adminId);
  }

  forceRepay(userId, amount, adminId="system") {
    this._log("강제상환", {userId, amount, adminId});
    return this._notify(`유저 ${userId} 강제 상환: ${amount}`);
  }

  // === 보상 관리 ===
  sendNFT(userId, rewardIndex, walletAddr, adminId="system") {
    this._log("NFT전송", {userId, rewardIndex, walletAddr, adminId});
    return this._notify(`NFT 전송 완료: ${userId} → ${walletAddr}`);
  }

  manualReward(userId, type, amount, adminId="system") {
    this._log("수동보상", {userId, type, amount, adminId});
    return this._notify(`유저 ${userId} 보상 지급: ${type} x${amount}`);
  }

  // === 유저 관리 ===
  updateWallet(userId, newWallet, adminId="system") {
    this._log("지갑수정", {userId, newWallet, adminId});
    return this._notify(`유저 ${userId} 지갑 수정: ${newWallet}`);
  }

  // === 로그 & 상태 ===
  _log(action, data) {
    this.logs.push({action, ...data, time: new Date().toISOString()});
  }

  getLogs() {
    return this.logs;
  }

  applyPendingChanges() {
    this.pendingChanges.forEach(c => c.status = "적용됨");
    const applied = [...this.pendingChanges];
    this.pendingChanges = [];
    this._log("일괄적용", {count: applied.length});
    return applied;
  }

  // === 알림 ===
  _notify(msg) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({message: msg, logs: this.logs});
    }
    return msg;
  }
}
