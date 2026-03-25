import "dotenv/config";
import express from "express";
import agentRouter from "./routes/agent.js";

const app = express();
const PORT = process.env["PORT"] ?? 3000;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "claude-code-agent" });
});

// Agent endpoint
app.use("/api/agent", agentRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/agent`);
});
