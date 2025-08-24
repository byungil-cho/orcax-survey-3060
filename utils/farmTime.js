// utils/farmTime.js
// 시간/창구 계산 전용 유틸. 감자/보리도 재사용 가능.

const ACTIVE_START = 8;   // 08:00
const ACTIVE_END   = 23;  // 23:00 (미포함)
const SEGMENT_HOURS = 3;  // 한 구간 = 3시간
const DAY_SEGMENTS = 5;   // 하루 = 5구간 = 15시간

function isSleep(now = new Date()) {
  const h = now.getHours();
  return (h >= ACTIVE_END) || (h < ACTIVE_START);
}

function atTime(date, hours, minutes = 0) {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// 활성 구간 내 누적 시간(시간 단위, 소수 허용)
function activeHoursBetween(start, now) {
  if (!start) return 0;
  if (now <= start) return 0;
  let hours = 0;
  const sDay = new Date(start); sDay.setHours(0,0,0,0);
  const eDay = new Date(now);   eDay.setHours(0,0,0,0);

  const firstDayEnd = atTime(start, ACTIVE_END);
  const firstDayStart = atTime(start, ACTIVE_START);
  hours += Math.max(0, Math.min(now, firstDayEnd) - Math.max(start, firstDayStart)) / 3600000;

  let d = addDays(sDay, 1);
  while (d < eDay) { hours += (ACTIVE_END - ACTIVE_START); d = addDays(d, 1); }

  const todayStart = atTime(now, ACTIVE_START);
  const todayEnd   = atTime(now, ACTIVE_END);
  if (eDay.getTime() !== sDay.getTime()) {
    hours += Math.max(0, Math.min(now, todayEnd) - todayStart) / 3600000;
  }
  return Math.max(0, hours);
}

// 심은 뒤 현재의 (일/구간) 계산
function nowPhase(plantedAt, now = new Date()) {
  const h = activeHoursBetween(plantedAt, now);
  const day = Math.floor(h / (DAY_SEGMENTS * SEGMENT_HOURS)) + 1; // 1..∞
  const seg = Math.floor((h % (DAY_SEGMENTS * SEGMENT_HOURS)) / SEGMENT_HOURS) + 1; // 1..5
  return { day, seg };
}

function gradeByDays(days) {
  if (days <= 5) return 'A';
  if (days === 6) return 'B';
  if (days === 7) return 'C';
  if (days === 8) return 'D';
  if (days === 9) return 'E';
  if (days === 10) return 'F';
  return '폐농';
}

function isHarvestWindow(now = new Date()) {
  // 21:00~23:00 사이
  const h = now.getHours();
  return h >= 21 && h < 23;
}

// fallowSince(수확 시각) 기준, "다음날 12:00~23:00" 예약 가능
function isReserveWindow(now, fallowSince) {
  if (!fallowSince) return false;
  const nextDayNoon = atTime(addDays(fallowSince, 1), 12);
  const nextDayEnd  = atTime(addDays(fallowSince, 1), 23);
  return now >= nextDayNoon && now < nextDayEnd;
}

module.exports = {
  ACTIVE_START, ACTIVE_END, SEGMENT_HOURS, DAY_SEGMENTS,
  isSleep, atTime, addDays, activeHoursBetween, nowPhase, gradeByDays, isHarvestWindow, isReserveWindow
};
