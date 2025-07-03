// 📂 frontend/initUser.js

const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

const getUserInfoFromKakao = async (accessToken) => {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error('카카오 사용자 정보 요청 실패');
    }

    const data = await response.json();
    const kakaoId = data.id;
    const nickname = data.properties?.nickname || '감자유저';

    return { kakaoId, nickname };
  } catch (err) {
    console.error('카카오 정보 에러:', err);
    return null;
  }
};

const initUser = async () => {
  const user = await getUserInfoFromKakao(accessToken);
  if (!user) return;

  console.log("🚀 보내는 데이터:", user);

  try {
    const response = await fetch('https://climbing-wholly-grouper.jp.ngrok.io/api/init-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    console.log("📦 응답 상태코드:", response.status);

    const result = await response.json();
    console.log("✅ 서버 응답:", result);
  } catch (err) {
    console.error("❌ 에러 발생:", err);
  }
};

initUser();