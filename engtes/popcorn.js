// popcorn.js — Corn Engine 5.0 팝콘 가공 모듈 (최종판)
// 먼데이™ 제작 — 문서 규정 100% 반영

export class PopcornEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;   // 상태 갱신 콜백
    this.storage = [];          // 가공 결과 기록
  }

  // === 등급별 단가표 ===
  static gradePrices = {
    A: [1000, 900, 800],
    B: [800,  700, 600],
    C: [600,  500, 400],
    D: [400,  300, 200],
    E: [200,  100,  50],
    F: [100,   50,  10]
  };

  // === 수확량별 배분 패턴 ===
  // [단가1개수, 단가2개수, 단가3개수]
  static distribution = {
    5: [2, 1, 1],  // 5개 수확
    7: [1, 2, 3],  // 7개 수확
    9: [2, 2, 3]   // 9개 수확
  };

  // === 수확량별 팝콘 개수 ===
  static popcornCount = { 5: 1, 7: 1, 9: 2 };

  // 팝콘 가공
  makePopcorn(cornBatch) {
    if (!cornBatch || cornBatch.quantity <= 0) {
      return this._notify("가공할 옥수수가 없음", null);
    }

    const grade = cornBatch.grade;
    const qty = cornBatch.quantity;

    const prices = PopcornEngine.gradePrices[grade];
    const dist = PopcornEngine.distribution[qty];

    if (!prices || !dist) {
      return this._notify(`등급 ${grade} 또는 수확량 ${qty}에 대한 규칙 없음`, null);
    }

    // 총 토큰 계산
    let tokens = 0;
    dist.forEach((count, i) => {
      tokens += prices[i] * count;
    });

    // 팝콘 개수
    const popcorns = PopcornEngine.popcornCount[qty] || 0;

    const result = {
      grade,
      input: qty,
      tokens,
      popcorns,
      image: "🍿",
      timestamp: Date.now()
    };

    this.storage.push(result);
    return this._notify(
      `팝콘 가공 완료 (${grade}급, ${qty}개 → ${tokens} 토큰 + 팝콘 ${popcorns}개)`,
      result
    );
  }

  // 저장소 조회
  getStorage() {
    return this.storage;
  }

  // 알림 처리
  _notify(msg, result) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate({ message: msg, result, storage: this.storage });
    }
    return result;
  }
}
