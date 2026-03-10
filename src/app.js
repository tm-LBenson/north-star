const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const notesRoutes = require("./routes/notes.routes");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

app.use(apiLimiter);

app.get("/", async (req, res) => {
  return res.status(200).json({
    message: "Teaching Notes API is running",
    endpoints: {
      register: "POST /auth/register",
      login: "POST /auth/login",
      me: "GET /auth/me",
      notes: "CRUD /notes",
    },
  });
});

app.get("/health", async (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/notes", notesRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
