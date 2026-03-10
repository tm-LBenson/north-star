require("dotenv").config();

const REQUIRED_ENV_VARS = ["JWT_SECRET", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = require("./app");

const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", async () => {
  console.log(`Server is running on port ${port}`);
});
