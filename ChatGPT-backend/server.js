import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // OK locally; harmless on hosts that inject env vars

const app = express();
app.use(cors({
    origin: ["https://shahryar-zainaee.github.io"], // CORS origin only
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Optional health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Chat endpoint
const client = new OpenAI({ apiKey: process.env.MIGMIG_2000 });

app.post("/api/chat", async (req, res) => {
    try {
        const userMessage = req.body?.message ?? "";
        if (!userMessage) return res.status(400).json({ error: "Missing message" });

        const r = await client.responses.create({
            model: "gpt-4.1-mini",
            input: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: userMessage }
            ]
        });

        res.json({ reply: r.output_text ?? "" });
    } catch (err) {
        // Do NOT log secrets; this only logs messages/status
        console.error("OpenAI error:", err?.response?.data || err?.message || err);
        res.status(500).json({ error: "Server error calling OpenAI" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
