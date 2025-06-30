// 브라우저에서만 실행됨
Kakao.init('284b798a9d9be8202f9c2e129fa6f329');

function kakaoLogin() {
  Kakao.Auth.login({
    success: function(authObj) {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          // 로컬 저장
          localStorage.setItem('kakaoId', res.id);
          localStorage.setItem('nickname', res.kakao_account.profile.nickname);
          localStorage.setItem('orcx', 10);
          localStorage.setItem('water', 10);
          localStorage.setItem('fertilizer', 10);

          // 서버 저장
          fetch('https://climbing-wholly-grouper.jp.ngrok.io/api/saveUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kakaoId: res.id,
              nickname: res.kakao_account.profile.nickname,
              orcx: 10,
              water: 10,
              fertilizer: 10
            })
          })
          .then(() => {
            // 성공 시 농장 페이지로 이동
            window.location.href = 'gamja-farm.html';
          });
        }
      });
    }
  });
}
