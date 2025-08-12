// 프론트엔드/js/corn-api.js

const API_BASE_URL = "https://climbing-wholly-grouper.jp.ngrok.io"; // 고정 도메인
const CORN_DATA_ENDPOINT = "/api/corn-data";

// 카카오 로그인된 유저 ID 가져오기
function getKakaoId() {
    return localStorage.getItem("kakaoId");
}

// 서버에서 옥수수 농장 데이터 불러오기
async function fetchCornData() {
    const kakaoId = getKakaoId();
    if (!kakaoId) {
        alert("카카오 로그인이 필요합니다.");
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${CORN_DATA_ENDPOINT}?kakaoId=${kakaoId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("옥수수 데이터 불러오기 실패:", error);
    }
}

// 옥수수 등급 계산 로직 (5일 연속 작업)
function getCornGrade(daysWorked) {
    if (daysWorked >= 5) return "A";
    if (daysWorked === 4) return "B";
    if (daysWorked === 3) return "C";
    if (daysWorked === 2) return "D";
    if (daysWorked === 1) return "E";
    return "F";
}

// 팝콘 튀기기 로직 (소금+설탕 1:1 비율)
function makePopcorn(cornCount, saltCount, sugarCount) {
    const possibleBatches = Math.min(cornCount, saltCount, sugarCount);
    const tokenCost = possibleBatches * (10 + 20); // 소금 10토큰 + 설탕 20토큰
    return { batches: possibleBatches, tokenCost };
}

// 농사 비용/수익 계산
function calculateFarmingProfit(cornCount) {
    const expenses = 1000; // 씨앗+노동+물+거름
    const income = cornCount * 1000; // 옥수수당 1000토큰
    return income - expenses;
}

// 데이터 저장 (몽고 서버에 반영)
async function updateCornData(updatedData) {
    const kakaoId = getKakaoId();
    try {
        const response = await fetch(`${API_BASE_URL}${CORN_DATA_ENDPOINT}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kakaoId, ...updatedData }),
        });
        return await response.json();
    } catch (error) {
        console.error("옥수수 데이터 저장 실패:", error);
    }
}

// 페이지 로드 시 데이터 불러와서 UI 업데이트
async function initCornFarm() {
    const data = await fetchCornData();
    if (!data) return;

    document.getElementById("waterCount").innerText = data.water || 0;
    document.getElementById("fertilizerCount").innerText = data.fertilizer || 0;
    document.getElementById("cornCount").innerText = data.corn || 0;
    document.getElementById("popcornCount").innerText = data.popcorn || 0;
    document.getElementById("saltCount").innerText = data.additives?.salt || 0;
    document.getElementById("sugarCount").innerText = data.additives?.sugar || 0;
    document.getElementById("tokenCount").innerText = data.tokens || 0;
}

document.addEventListener("DOMContentLoaded", initCornFarm);
