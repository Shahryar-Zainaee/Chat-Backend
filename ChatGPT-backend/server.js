import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors({
  origin: ["https://shahryar-zainaee.github.io"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ Read API key from env (supports both names)
const apiKey = process.env.OPENAI_API_KEY || process.env.MIGMIG_2000;
if (!apiKey) {
  console.error("❌ Missing OPENAI_API_KEY or MIGMIG_2000 in environment");
}
const client = new OpenAI({ apiKey });

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message ?? "";
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: userMessage
    });

    res.json({ reply: r.output_text ?? "" });
  } catch (err) {
    // Surface helpful info without secrets
    const status = err?.status || 500;
    const detail = err?.response?.data || err?.message || "Unknown error";
    console.error("OpenAI error:", status, detail);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running on port ${port}`));
