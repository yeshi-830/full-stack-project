
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "full_stack_db",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/", (req, res) => {
  res.json({
    message: "Full-Stack Project API is running!"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      api: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      api: "ok",
      database: "disconnected"
    });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Name and email are required."
      });
    }

    const [result] = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name.trim(), email.trim()]
    );

    res.status(201).json({
      message: "User registered successfully!",
      id: result.insertId,
      name: name.trim(),
      email: email.trim()
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Unable to register user."
    });
  }
});
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required."
      });
    }

    const [result] = await db.execute(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name.trim(), email.trim()]
    );

    res.status(201).json({
      message: "User registered successfully!",
      id: result.insertId
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Unable to register user."
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
