import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const ALLOWED_ORIGIN = "https://shahryar-zainaee.github.io";

const app = express();

// ✅ CORS for GET/POST + explicit preflight handling
const corsOptions = {
  origin: [ALLOWED_ORIGIN],
  credentials: false,
  allowedHeaders: ["Content-Type"],
  methods: ["GET", "POST", "OPTIONS"],  // include OPTIONS
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));     // <-- handle preflight globally

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// OpenAI client (supports either env var name)
const apiKey = process.env.OPENAI_API_KEY || process.env.MIGMIG_2000;
const client = apiKey ? new OpenAI({ apiKey }) : null;

// 🔍 Minimal request logging (safe)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 🚑 TEMP: Quick echo path to prove frontend ↔ backend is OK
// Send "ping" and you'll get "pong" without calling OpenAI.
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "").trim();
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    // If message is 'ping', short‑circuit to test connectivity
    if (userMessage.toLowerCase() === "ping") {
      return res.json({ reply: "pong (server reachable, CORS OK)" });
    }

    if (!client) {
      return res.status(500).json({ error: "Missing API key on server" });
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: userMessage,
      // Optional: small safety timeout to avoid long hangs
      // (The OpenAI SDK doesn’t support signal directly here; okay to omit)
    });

    res.json({ reply: r.output_text ?? "" });
  } catch (err) {
    const status = err?.status || 500;
    const detail = err?.response?.data || err?.message || "Unknown error";
    console.error("OpenAI error:", status, detail);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on port ${port}`));
