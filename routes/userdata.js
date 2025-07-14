const formattedUser = {
  nickname: user.nickname ?? "",
  kakaoId: user.kakaoId ?? "",
  inventory: {
    water: user["물"] ?? 0,
    fertilizer: user["거름"] ?? 0,
    seedPotato: user["씨앗감자"] ?? user["씨감자"] ?? 0, // ✅ 둘 중 하나라도 있으면 사용
    seedBarley: user["씨앗보리"] ?? user["씨보리"] ?? 0
  },
  wallet: {
    orcx: user.orcx ?? 0
  },
  storage: {
    gamja: user["감자"] ?? 0,
    bori: user["보리"] ?? 0
  }
};
