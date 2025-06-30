Kakao.init('284b798a9d9be8202f9c2e129fa6f329');

function loginWithKakao() {
  Kakao.Auth.login({
    success: function (authObj) {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function (response) {
          const kakaoId = response.id;
          const nickname = response.properties.nickname;

          fetch('https://climbing-wholly-grouper.jp.ngrok.io/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ kakaoId, nickname }),
          })
            .then((res) => res.json())
            .then((data) => {
              // ✅ 서버로부터 받은 초기 자산 정보
              const { orcx, water, fertilizer } = data;

              // ✅ 로컬스토리지에 저장
              localStorage.setItem('kakaoId', kakaoId);
              localStorage.setItem('nickname', nickname);
              localStorage.setItem('orcx', orcx);
              localStorage.setItem('water', water);
              localStorage.setItem('fertilizer', fertilizer);

              // ✅ 페이지 이동
              window.location.href = 'gamja-farm.html';
            })
            .catch((err) => {
              console.error('서버 저장 실패:', err);
              alert('로그인 후 서버 저장 중 오류가 발생했습니다.');
            });
        },
        fail: function (error) {
          console.error(error);
          alert('카카오 사용자 정보 요청 실패');
        },
      });
    },
    fail: function (err) {
      console.error(err);
      alert('카카오 로그인 실패');
    },
  });
}
