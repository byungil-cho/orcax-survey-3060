const nickname = req.body.nickname || req.params.nickname;
if (!nickname || typeof nickname !== 'string' || !nickname.trim().match(/^[a-zA-Z가-힣0-9_]{2,30}$/)) {
  return res.status(400).json({ success: false, message: "잘못된 nickname" });
}