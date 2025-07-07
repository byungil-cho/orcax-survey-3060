// public/js/market.js

document.querySelectorAll(".purchase-button").forEach((button) => {
  button.addEventListener("click", async (e) => {
    const itemId = e.target.dataset.itemId;
    try {
      const response = await fetch(`/api/market/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });
      const result = await response.json();

      if (response.ok) {
        alert("구매 성공: " + result.message);
      } else {
        alert("구매 실패: " + result.message);
      }
    } catch (err) {
      console.error("에러 발생:", err);
      alert("에러가 발생했습니다. 콘솔을 확인해주세요.");
    }
  });
});
