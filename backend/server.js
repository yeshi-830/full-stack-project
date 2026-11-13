require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "full_stack_db",
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
}));
app.use(express.json({ limit: "10kb" }));

function validateUser(body) {
  const { name, email } = body || {};
  if (
    typeof name !== "string"
    || typeof email !== "string"
    || name.trim().length < 2
    || name.trim().length > 100
    || email.trim().length === 0
    || email.trim().length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return {
      error: "Enter a name between 2 and 100 characters and a valid email address (up to 254 characters).",
    };
  }
  return {
    value: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    },
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

app.get("/", (_req, res) => {
  res.json({ message: "Full-Stack Project API is running!" });
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ api: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({ api: "ok", database: "disconnected" });
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, created_at FROM users ORDER BY id DESC",
    );
    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error.message);
    res.status(500).json({ message: "Unable to fetch registered users." });
  }
});

app.post("/api/users", async (req, res) => {
  const { error, value } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [result] = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [value.name, value.email],
    );
    const [rows] = await db.execute(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This email is already registered." });
    }
    console.error("Create user error:", error.message);
    res.status(500).json({ message: "Unable to add this member. Please try again." });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "A valid member ID is required." });
  const { error, value } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [result] = await db.execute(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [value.name, value.email, id],
    );
    if (!result.affectedRows) {
      const [rows] = await db.execute("SELECT id FROM users WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ message: "Member not found." });
    }
    const [rows] = await db.execute(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [id],
    );
    res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "This email is already registered." });
    }
    console.error("Update user error:", error.message);
    res.status(500).json({ message: "Unable to update this member. Please try again." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "A valid member ID is required." });

  try {
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Member not found." });
    res.status(204).end();
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({ message: "Unable to remove this member. Please try again." });
  }
});

app.use((error, _req, res, _next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  console.error("Request error:", error.message);
  return res.status(500).json({ message: "Unable to process this request." });
});

async function startServer() {
  try {
    await db.query("SELECT 1");
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("MySQL database connected.");
    });
    return server;
  } catch (error) {
    console.error("Could not connect to MySQL:", error.message);
    process.exitCode = 1;
    throw error;
  }
}

if (require.main === module) {
  startServer().catch(() => {});
}

module.exports = { app, db, startServer, validateUser };
