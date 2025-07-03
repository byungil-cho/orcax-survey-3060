// 📂 frontend/initUser.js

// 예시: 카카오 로그인 후 accessToken이 이미 확보된 상태
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
    const nickname = data.properties?.nickname || '익명의 감자';

    return { kakaoId, nickname };
  } catch (err) {
    console.error('카카오 정보 에러:', err);
    return null;
  }
};

const initUser = async (accessToken) => {
  const user = await getUserInfoFromKakao(accessToken);
  if (!user) return;

  fetch('/api/init-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      kakaoId: user.kakaoId,
      nickname: user.nickname,
    }),
  })
    .then(res => res.json())
    .then(data => console.log('Init User Response:', data))
    .catch(err => console.error('Error initializing user:', err));
};

// 호출 예시
initUser(accessToken);
