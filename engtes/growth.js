// growth.js — Corn Engine 5.0 성장 로직
// 먼데이™ 제작 (문서 규정 100% 반영)

export class GrowthEngine {
  constructor(onUpdate) {
    this.currentDay = 1;       // 현재 일차 (Day1~)
    this.currentStage = 1;     // 현재 구간 (Stage1~5)
    this.failCount = 0;        // 연속 미급여 횟수
    this.isResting = false;    // 휴경 여부
    this.isAbandoned = false;  // 폐농 여부
    this.isReserved = false;   // 다음날 예약 파종 여부

    this.resources = { water: 0, fertilizer: 0 }; // 투입 자원
    this.onUpdate = onUpdate;  // UI 업데이트 콜백
  }

  // 씨앗 파종 시작
  plantSeed() {
    if (this.isAbandoned) return;
    this.currentDay = 1;
    this.currentStage = 1;
    this.failCount = 0;
    this.isResting = false;
    this.isReserved = false;
    this.updateUI();
  }

  // 예약 파종
  reserveSeed() {
    if (this.isAbandoned) return;
    this.isReserved = true;
  }

  // 다음날 아침 08:00 자동 파종
  autoPlantNextDay() {
    if (this.isReserved) {
      this.plantSeed();
    } else {
      this.isAbandoned = true; // 예약 안 하면 폐농
      this.updateUI();
    }
  }

  // 물/거름 투입
  addWater(amount = 1) {
    this.resources.water += amount;
  }
  addFertilizer(amount = 1) {
    this.resources.fertilizer += amount;
  }

  // 구간 진행 (3시간 이벤트마다 호출)
  progressStage() {
    if (this.isResting || this.isAbandoned) return;

    const needWater = 3;
    const needFert = 1;

    if (this.resources.water >= needWater && this.resources.fertilizer >= needFert) {
      // ✅ 조건 충족
      this.currentStage++;
      this.failCount = 0;
      this.resources = { water: 0, fertilizer: 0 };

      if (this.currentStage > 5) {
        this.currentStage = 1;
        this.currentDay++;
      }

    } else {
      // ❌ 조건 미달
      this.failCount++;
      if (this.failCount === 1) {
        // 1회 실패 → 현 구간 유지
      } else if (this.failCount === 2) {
        // 2회 연속 실패 → Day1 Stage1로 후진
        this.currentDay = 1;
        this.currentStage = 1;
        this.resources = { water: 0, fertilizer: 0 };
      } else if (this.failCount >= 3) {
        // 후진 상태에서 또 실패 → 휴경
        this.isResting = true;
      }
    }

    this.updateUI();
  }

  // 휴경 → 다음날 처리
  handleRestDay() {
    if (this.isResting) {
      if (this.isReserved) {
        this.autoPlantNextDay();
      } else {
        this.isAbandoned = true; // 예약 안 하면 폐농
      }
      this.updateUI();
    }
  }

  // 이미지/게이지 갱신
  updateUI() {
    if (typeof this.onUpdate === "function") {
      const image = this.getCornImage();
      this.onUpdate({
        day: this.currentDay,
        stage: this.currentStage,
        resting: this.isResting,
        abandoned: this.isAbandoned,
        reserved: this.isReserved,
        image
      });
    }
  }

  // 이미지 매핑 테이블 (PC + 모바일 미니)
  static cornImages = {
    pc: {
      "01": { "01": "assets/img/corn_01_01.png", "02": "assets/img/corn_01_02.png", "03": "assets/img/corn_01_03.png", "04": "assets/img/corn_01_04.png", "05": "assets/img/corn_01_05.png" },
      "02": { "01": "assets/img/corn_02_01.png", "02": "assets/img/corn_02_02.png", "03": "assets/img/corn_02_03.png", "04": "assets/img/corn_02_04.png", "05": "assets/img/corn_02_05.png" },
      "03": { "01": "assets/img/corn_03_01.png", "02": "assets/img/corn_03_02.png", "03": "assets/img/corn_03_03.png", "04": "assets/img/corn_03_04.png", "05": "assets/img/corn_03_05.png" },
      "04": { "01": "assets/img/corn_04_01.png", "02": "assets/img/corn_04_02.png", "03": "assets/img/corn_04_03.png", "04": "assets/img/corn_04_04.png", "05": "assets/img/corn_04_05.png" },
      "05": { "01": "assets/img/corn_05_01.png", "02": "assets/img/corn_05_02.png", "03": "assets/img/corn_05_03.png", "04": "assets/img/corn_05_04.png", "05": "assets/img/corn_05_05.png" },
      "06": { "01": "assets/img/corn_06_01.png", "02": "assets/img/corn_06_02.png", "03": "assets/img/corn_06_03.png", "04": "assets/img/corn_06_04.png", "05": "assets/img/corn_06_05.png" },
      rest: "assets/img/corn_rest.png",
      abandoned: "assets/img/corn_abandoned.png"
    },
    mini: {
      "01": { "01": "assets/img/a_corn_01_01.png", "02": "assets/img/a_corn_01_02.png", "03": "assets/img/a_corn_01_03.png", "04": "assets/img/a_corn_01_04.png", "05": "assets/img/a_corn_01_05.png" },
      "02": { "01": "assets/img/a_corn_02_01.png", "02": "assets/img/a_corn_02_02.png", "03": "assets/img/a_corn_02_03.png", "04": "assets/img/a_corn_02_04.png", "05": "assets/img/a_corn_02_05.png" },
      "03": { "01": "assets/img/a_corn_03_01.png", "02": "assets/img/a_corn_03_02.png", "03": "assets/img/a_corn_03_03.png", "04": "assets/img/a_corn_03_04.png", "05": "assets/img/a_corn_03_05.png" },
      "04": { "01": "assets/img/a_corn_04_01.png", "02": "assets/img/a_corn_04_02.png", "03": "assets/img/a_corn_04_03.png", "04": "assets/img/a_corn_04_04.png", "05": "assets/img/a_corn_04_05.png" },
      "05": { "01": "assets/img/a_corn_05_01.png", "02": "assets/img/a_corn_05_02.png", "03": "assets/img/a_corn_05_03.png", "04": "assets/img/a_corn_05_04.png", "05": "assets/img/a_corn_05_05.png" },
      "06": { "01": "assets/img/a_corn_06_01.png", "02": "assets/img/a_corn_06_02.png", "03": "assets/img/a_corn_06_03.png", "04": "assets/img/a_corn_06_04.png", "05": "assets/img/a_corn_06_05.png" },
      rest: "assets/img/a_corn_rest.png",
      abandoned: "assets/img/a_corn_abandoned.png"
    }
  };

  // 옥수수 이미지 호출
  getCornImage(isMini = false) {
    const images = isMini ? GrowthEngine.cornImages.mini : GrowthEngine.cornImages.pc;

    if (this.isAbandoned) return images.abandoned;
    if (this.isResting) return images.rest;

    const dayStr = String(this.currentDay).padStart(2, "0");
    const stageStr = String(this.currentStage).padStart(2, "0");

    return images[dayStr][stageStr];
  }
}
