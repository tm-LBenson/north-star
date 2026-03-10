const { verifyToken } = require("../utils/jwt");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        error: "Authorization header must be in the format: Bearer <token>",
      });
    }

    const decoded = await verifyToken(token);

    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
