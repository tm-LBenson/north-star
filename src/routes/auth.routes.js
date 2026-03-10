const express = require("express");
const bcrypt = require("bcrypt");
const { db } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { signToken } = require("../utils/jwt");

const router = express.Router();
const USERS_COLLECTION = "users";
const SALT_ROUNDS = 10;

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

async function findUserByEmail(email) {
  const snapshot = await db.collection(USERS_COLLECTION).where("email", "==", email).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const createdAt = new Date().toISOString();

    const userRef = await db.collection(USERS_COLLECTION).add({
      email,
      passwordHash,
      createdAt,
    });

    const token = await signToken({
      sub: userRef.id,
      email,
    });

    return res.status(201).json({ token });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
    });

    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
