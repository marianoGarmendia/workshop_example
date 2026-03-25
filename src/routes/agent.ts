import { Request, Response, Router } from "express";
import { runAgent } from "../agent/graph.js";

const router = Router();

/**
 * POST /api/agent
 * Body: { "question": "How do I install Claude Code?" }
 * Response: { "answer": "..." }
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { question } = req.body as { question?: unknown };

  if (!question || typeof question !== "string" || question.trim() === "") {
    res.status(400).json({
      error: "Field 'question' is required and must be a non-empty string.",
    });
    return;
  }

  try {
    const answer = await runAgent(question.trim());
    res.json({ answer });
  } catch (err) {
    console.error("[agent route error]", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
