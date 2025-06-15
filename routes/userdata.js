const rawNickname = req.params.nickname;
if (!rawNickname || rawNickname.trim() === '') {
  return res.status(400).json({ error: "잘못된 nickname 입력" });
}

const regex = new RegExp(`^${rawNickname.trim()}$`, 'i');
const user = await Farm.findOne({ nickname: regex });