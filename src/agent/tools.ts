import { tool } from "@langchain/core/tools";
import { z } from "zod";

type KnowledgeBase = Record<string, string>;

const CLAUDE_CODE_KNOWLEDGE: KnowledgeBase = {
  overview: `Claude Code is Anthropic's official CLI (Command Line Interface) for AI-assisted software engineering.
It lets developers interact with Claude directly from the terminal to write, edit, debug, and explain code.
Available as: CLI, desktop app (Mac/Windows), web app (claude.ai/code), and IDE extensions (VS Code, JetBrains).`,

  installation: `Install Claude Code via npm:
  npm install -g @anthropic-ai/claude-code

Then authenticate:
  claude login

Or set the API key:
  export ANTHROPIC_API_KEY=your_key_here`,

  slash_commands: `Built-in slash commands:
  /help        — Show help and available commands
  /clear       — Clear the conversation context
  /compact     — Compress conversation to save context
  /cost        — Show token usage and cost for the session
  /doctor      — Check Claude Code installation health
  /init        — Initialize a CLAUDE.md file for the project
  /login       — Authenticate with Anthropic
  /logout      — Log out
  /memory      — View and manage persistent memory
  /model       — Change the Claude model
  /permissions — View and manage tool permissions
  /review      — Review recent changes
  /status      — Show current session status
  /vim         — Toggle vim keybindings`,

  tools_available: `Claude Code has access to these tools during a session:
  - Read / Write / Edit files
  - Bash — execute shell commands
  - Glob — file pattern matching
  - Grep — search file contents
  - WebFetch / WebSearch — fetch web content
  - Agent — spawn sub-agents for complex tasks
  - NotebookEdit — edit Jupyter notebooks`,

  memory: `Claude Code has a persistent memory system stored in ~/.claude/projects/<project>/memory/.
Types of memories:
  - user     — information about the user's role and preferences
  - feedback — guidance on how to approach work
  - project  — ongoing work, goals, and decisions
  - reference — pointers to external resources

Memory is indexed in MEMORY.md and individual files per topic.`,

  claude_md: `CLAUDE.md is a special file Claude Code reads automatically at the start of each session.
Use it to store project-specific instructions, conventions, or context.
Create it with: /init
It can be placed at the repo root, home directory, or subdirectories.`,

  models: `Supported Claude models (as of early 2026):
  - claude-opus-4-6      — Most capable, best for complex tasks
  - claude-sonnet-4-6    — Balanced speed and capability (default)
  - claude-haiku-4-5     — Fastest, best for simple tasks

Change model with: /model or --model flag`,

  hooks: `Claude Code supports hooks — shell commands that run automatically on events:
  Events: PreToolUse, PostToolUse, Stop, SubagentStop, NotificationHook
  Configured in settings.json under "hooks".
  Useful for: linting after edits, running tests after code changes, custom notifications.`,

  permissions: `Claude Code uses a permission system to control tool access.
  - Auto-approved: reading files, searching
  - Requires confirmation: writing files, running commands, web fetch
  Manage with /permissions or in settings.json.
  Permission modes: default, auto-approve, manual.`,

  settings: `Settings are stored in:
  - Global: ~/.claude/settings.json
  - Project: .claude/settings.json (per repo)
  - Local override: .claude/settings.local.json

Configure: model, permissions, hooks, environment variables, theme, keybindings.`,

  mcp: `MCP (Model Context Protocol) — Claude Code can connect to MCP servers to extend its capabilities.
MCP servers provide additional tools and resources.
Configure MCP servers in settings.json under "mcpServers".
Example: filesystem MCP, GitHub MCP, database MCPs.`,
};

export const searchClaudeCodeDocs = tool(
  async ({ topic }: { topic: string }): Promise<string> => {
    const key = topic.toLowerCase();
    const results: string[] = [];

    for (const [section, content] of Object.entries(CLAUDE_CODE_KNOWLEDGE)) {
      if (
        section.includes(key) ||
        content.toLowerCase().includes(key) ||
        key.includes(section)
      ) {
        results.push(`## ${section}\n${content}`);
      }
    }

    if (results.length === 0) {
      const allTopics = Object.keys(CLAUDE_CODE_KNOWLEDGE).join(", ");
      return `No specific information found for "${topic}". Available topics: ${allTopics}`;
    }

    return results.join("\n\n");
  },
  {
    name: "search_claude_code_docs",
    description:
      "Search the Claude Code knowledge base for information about a specific topic. " +
      "Use this to look up: overview, installation, slash_commands, tools_available, memory, " +
      "claude_md, models, hooks, permissions, settings, mcp.",
    schema: z.object({
      topic: z
        .string()
        .describe(
          "The topic to search for, e.g. 'installation', 'slash commands', 'memory', 'hooks', 'models'"
        ),
    }),
  }
);
