// reward.js — Corn Engine 5.0 보상 관리 모듈
// 먼데이™ 제작 — 문서 규정 100% 반영

export class RewardBox {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.box = []; // {type, amount, status, source, time, wallet, adminCheck}
    this.logs = [];
  }

  // === 보상 적립 ===
  addReward(type, amount, source = "system") {
    const reward = {
      type,          // token | nft | event
      amount,
      status: "대기", // 대기 | 수령완료
      source,
      time: new Date().toISOString(),
      wallet: null,  // NFT일 경우 유저가 입력
      adminCheck: false
    };
    this.box.push(reward);
    this._log("적립", reward);
    return this._notify(`보상 적립: ${type} x${amount} (출처: ${source})`);
  }

  // === 유저 수령 (토큰/이벤트) ===
  claimReward(index) {
    if (!this.box[index]) return this._notify("잘못된 인덱스");
    const reward = this.box[index];
    if (reward.status === "수령완료") return this._notify("이미 수령됨");

    if (reward.type === "nft") {
      return this._notify("NFT는 관리자 승인 필요");
    }

    reward.status = "수령완료";
    this._log("수령", reward);
    return reward;
  }

  // === 전체 수령 (NFT 제외) ===
  claimAll() {
    const claimed = [];
    this.box.forEach(r => {
      if (r.status === "대기" && r.type !== "nft") {
        r.status = "수령완료";
        claimed.push(r);
        this._log("수령", r);
      }
    });
    return claimed;
  }

  // === NFT 지갑 주소 등록 ===
  setWallet(index, walletAddr) {
    const reward = this.box[index];
    if (!reward || reward.type !== "nft") return this._notify("NFT 보상이 아님");
    reward.wallet = walletAddr;
    this._log("지갑등록", reward);
    return this._notify(`NFT 지갑 등록 완료: ${walletAddr}`);
  }

  // === 관리자 전송 체크 ===
  adminConfirm(index) {
    const reward = this.box[index];
    if (!reward || reward.type !== "nft") return this._notify("NFT 보상이 아님");
    reward.adminCheck = true;
    reward.status = "수령완료";
    this._log("NFT전송완료", reward);
    return this._notify("NFT 전송 완료 처리");
  }

  // === 보관함 조회 ===
  getBox() {
    return this.box;
  }

  // === 로그 ===
  _log(action, reward) {
    this.logs.push({ action, ...reward, time: new Date().toISOString() });
  }

  // === 알림 ===
  _notify(msg) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({ message: msg, box: this.box });
    }
    return msg;
  }
}
