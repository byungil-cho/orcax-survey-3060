// engine.js — Corn Engine 5.0 최종 통합본
// 먼데이™ 제작 — resources, popcorn, exchange, level, economy, reward, admin, status, gauge 전체 연결

import { ResourceManager } from "./resources.js";
import { PopcornEngine } from "./popcorn.js";
import { ExchangeEngine } from "./exchange.js";
import { LevelSystem } from "./level.js";
import { Economy } from "./economy.js";
import { RewardBox } from "./reward.js";
import { AdminLogic } from "./admin.js";
import { StatusLogic } from "./status.js";
import { GaugeSystem } from "./gauge.js";

export class CornEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;

    // === 서브 모듈 ===
    this.resources = new ResourceManager(this._notify.bind(this));
    this.popcorn = new PopcornEngine(this._notify.bind(this));
    this.exchange = new ExchangeEngine(this._notify.bind(this));
    this.level = new LevelSystem(this._notify.bind(this));
    this.economy = new Economy(this._notify.bind(this));
    this.reward = new RewardBox(this._notify.bind(this));
    this.admin = new AdminLogic(this._notify.bind(this));
    this.gauge = new GaugeSystem(this._notify.bind(this));

    // === 상태 뷰 ===
    this.status = new StatusLogic(this, false, this._notify.bind(this));
    this.adminStatus = new StatusLogic(this, true, this._notify.bind(this));

    // === 기본 설정 ===
    this.config = {
      growth: { sectionTime: 3 * 60 * 60 * 1000 }, // 3시간
      loan: { unit: 1000, harvestInterest: 0.3, overdueInterest: 0.05 },
      exchange: { popcornToFertilizer: 1, popcornToNFT: 18000 },
      rewards: {}
    };
  }

  // === 성장/수확 ===
  progressGrowth() {
    const growth = this.gauge.progressGrowth();
    return this._notify({ type: "growth", growth });
  }

  harvest(grade, quantity, day) {
    const result = this.popcorn.makePopcorn({ grade, quantity });

    const netTokens = this.economy.harvestRepay(result.tokens);
    this.economy.addTokens(netTokens, "옥수수 수확");

    this.exchange.addPopcorn(result.popcorn);
    this.level.harvestSuccess();

    const levelReward = this.level.getReward();
    if (levelReward) {
      this.reward.addReward(levelReward.type, levelReward.amount, "levelUp");
    }

    this.gauge.updateLevel(day);

    return this.getStatus();
  }

  // === 교환 ===
  exchangeNormal() { return this.exchange.exchangeNormal(); }
  exchangeSpecial() { return this.exchange.exchangeSpecial(); }

  // === 대출 ===
  takeLoan(amount) { return this.economy.takeLoan(amount); }
  applyOverdueInterest() { return this.economy.applyOverdueInterest(); }

  // === 관리자 변경 적용 ===
  applyAdminChanges() {
    const changes = this.admin.applyPendingChanges();
    changes.forEach(c => {
      if (c.category === "loanRules") {
        this.config.loan = { ...this.config.loan, ...c.value };
      } else if (c.category === "exchange") {
        this.config.exchange[c.key] = c.value;
      } else if (c.category === "growth") {
        this.config.growth[c.key] = c.value;
      } else if (c.category === "rewards") {
        this.config.rewards[c.key] = c.value;
      }
    });
    this._notify(`관리자 변경사항 ${changes.length}건 반영 완료`);
  }

  // === 상태 조회 ===
  getStatus(isAdmin = false) {
    return isAdmin 
      ? this.adminStatus.getAdminStatus()
      : this.status.getUserStatus("self");
  }

  // === 실시간 동기화 ===
  sync(isAdmin = false) {
    return isAdmin ? this.adminStatus.sync() : this.status.sync();
  }

  // === 알림 ===
  _notify(data) {
    if (typeof this.onUpdate === "function") {
      this.onUpdate(data);
    }
  }
}
