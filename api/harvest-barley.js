fetch("https://climbing-wholly-grouper.jp.ngrok.io/api/harvest-barley", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    nickname: nickname,
    amount: yieldAmount
  })
})
.then(res => res.json())
.then(data => console.log("✅ 서버에 보리 수확 저장 완료:", data))
.catch(err => console.error("❌ 서버 저장 실패:", err));
