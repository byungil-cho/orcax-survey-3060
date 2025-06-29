const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // "Bearer {token}"

  if (!token) {
    return res.status(401).json({ success: false, message: "토큰 없음" });
  }

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "토큰 검증 실패" });
  }
}

module.exports = authMiddleware;
