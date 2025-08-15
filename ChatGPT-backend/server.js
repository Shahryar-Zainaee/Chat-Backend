import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
// Optional (recommended) rate limiting to prevent abuse
import rateLimit from "express-rate-limit";

dotenv.config();

const ALLOWED_ORIGIN = "https://shahryar-zainaee.github.io";
const APP_SECRET = process.env.APP_SECRET || ""; // set in Render (or leave blank to disable)

// ──────────────────────────────────────────────────────────
// App & middleware
// ──────────────────────────────────────────────────────────
const app = express();

// CORS (+ preflight)
const corsOptions = {
  origin: [ALLOWED_ORIGIN],
  credentials: false,
  allowedHeaders: ["Content-Type", "x-app-secret"],
  methods: ["GET", "POST", "OPTIONS"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// JSON body
app.use(express.json({ limit: "1mb" }));

// Basic rate limit (tune as needed)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests/minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Minimal request log (safe)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (public)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Gatekeeping: require app secret if configured
function requireAppSecret(req, res, next) {
  if (!APP_SECRET) return next(); // disabled if not set
  const header = req.headers["x-app-secret"];
  if (header !== APP_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// ──────────────────────────────────────────────────────────
/** OpenAI client (supports OPENAI_API_KEY or MIGMIG_2000) */
// ──────────────────────────────────────────────────────────
const apiKey = process.env.OPENAI_API_KEY || process.env.MIGMIG_2000;
const client = apiKey ? new OpenAI({ apiKey }) : null;

// Chat endpoint
app.post("/api/chat", requireAppSecret, async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "").trim();
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    // Quick connectivity test without OpenAI usage
    if (userMessage.toLowerCase() === "ping") {
      return res.json({ reply: "pong (server reachable, CORS OK)" });
    }

    if (!client) {
      return res.status(500).json({ error: "Missing API key on server" });
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: userMessage,
    });

    res.json({ reply: r.output_text ?? "" });
  } catch (err) {
    const status = err?.status || 500;
    const detail = err?.response?.data || err?.message || "Unknown error";
    console.error("OpenAI error:", status, detail);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

// Start
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on port ${port}`));
