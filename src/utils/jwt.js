const jwt = require("jsonwebtoken");

async function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }, (error, token) => {
      if (error) {
        return reject(error);
      }

      return resolve(token);
    });
  });
}

async function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return reject(error);
      }

      return resolve(decoded);
    });
  });
}

module.exports = { signToken, verifyToken };
