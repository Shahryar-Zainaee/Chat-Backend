import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // Reads .env locally, safe on Render

const app = express();
app.use(cors({
  origin: ["https://shahryar-zainaee.github.io"], // Allow only your GitHub Pages site
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Health check route
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// OpenAI client (✅ use the standard env var)
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    console.error("OpenAI error:", err?.status, err?.message, err?.response?.data);
    res.status(500).json({ error: "Server error calling OpenAI" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
