
const accessToken = 'YOUR_ACCESS_TOKEN_HERE'; // access token을 여기에 넣어!

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

    // 🔐 로컬스토리지에 저장
    localStorage.setItem('nickname', nickname);
    localStorage.setItem('userId', kakaoId);

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

    const result = await response.json();
    console.log("✅ 서버 응답:", result);
  } catch (err) {
    console.error("❌ init-user 에러:", err);
  }
};

initUser();
