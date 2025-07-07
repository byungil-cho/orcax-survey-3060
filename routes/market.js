// 수정된 market.js

// 구매 버튼 이벤트 핸들러 (예시용, 실제 코드와 위치 다를 수 있음)
document.querySelectorAll(".purchase-button").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const seedType = e.target.dataset.seedtype;

    try {
      const res = await fetch("/api/seed/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: seedType }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`구매 실패: ${errorText}`);
        return;
      }

      const result = await res.json();
      alert("구매 성공! 씨감자가 인벤토리에 추가되었습니다.");
      location.reload();
    } catch (err) {
      console.error("구매 요청 중 오류 발생:", err);
      alert("서버 오류로 인해 구매에 실패했습니다.");
    }
  });
});
