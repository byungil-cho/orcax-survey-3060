// 씨감자 수 관리 함수
function getSeedCount() {
  return parseInt(localStorage.getItem("seedCount") || "0");
}

function setSeedCount(count) {
  localStorage.setItem("seedCount", count);
}

// 구매 함수 예시
function buySeed() {
  const current = getSeedCount();
  if (current >= 2) {
    alert("씨감자는 최대 2개까지만 보유할 수 있습니다.");
    return;
  }
  setSeedCount(current + 1);
  alert("씨감자 1개를 구매했습니다.");
}

// 물 주기
function applyWater() {
  const seeds = getSeedCount();
  if (seeds <= 0) {
    alert("씨감자가 없습니다. 물 주기를 할 수 없습니다.");
    return;
  }

  setSeedCount(seeds - 1);
  updateSeedDisplay();

  // 성장포인트 1 증가 로직 (예시)
  fetch("/api/grow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "water" }),
  }).then(res => {
    if (res.ok) {
      alert("물 주기로 성장포인트가 증가했습니다!");
    }
  });
}

// 거름 주기
function applyFertilizer() {
  const seeds = getSeedCount();
  if (seeds <= 0) {
    alert("씨감자가 없습니다. 거름 주기를 할 수 없습니다.");
    return;
  }

  setSeedCount(seeds - 1);
  updateSeedDisplay();

  fetch("/api/grow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "fertilizer" }),
  }).then(res => {
    if (res.ok) {
      alert("거름 주기로 성장포인트가 증가했습니다!");
    }
  });
}

// 수확하기 (예시)
function startFarming() {
  alert("감자를 수확했습니다!");
}

// 씨감자 보유 수 업데이트
function updateSeedDisplay() {
  const count = getSeedCount();
  const el = document.getElementById("seedCountDisplay");
  if (el) el.textContent = `씨감자: ${count}개`;
}