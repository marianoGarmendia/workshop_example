import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { searchClaudeCodeDocs } from "./tools.js";
import { SYSTEM_PROMPT } from "./prompts.js";

type MessagesState = typeof MessagesAnnotation.State;

const tools = [searchClaudeCodeDocs];
const toolNode = new ToolNode(tools);

const llm = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  temperature: 0,
}).bindTools(tools);

// Node: call the LLM
async function callLlm(state: MessagesState): Promise<{ messages: BaseMessage[] }> {
  const response = await llm.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    ...state.messages,
  ]);
  return { messages: [response] };
}

// Conditional edge: route to tools or finish
function shouldContinue(state: MessagesState): "tools" | "__end__" {
  const lastMessage = state.messages.at(-1);
  const hasToolCalls =
    lastMessage !== undefined &&
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0;

  return hasToolCalls ? "tools" : "__end__";
}

// Build the StateGraph
const graph = new StateGraph(MessagesAnnotation)
  .addNode("llm", callLlm)
  .addNode("tools", toolNode)
  .addEdge("__start__", "llm")
  .addConditionalEdges("llm", shouldContinue, ["tools", "__end__"])
  .addEdge("tools", "llm")
  .compile();

/**
 * Run the agent with a user question.
 * Returns the agent's final answer as a string.
 */
export async function runAgent(question: string): Promise<string> {
  const result = await graph.invoke({
    messages: [new HumanMessage(question)],
  });

  const lastMessage = result.messages.at(-1) as BaseMessage | undefined;

  if (!lastMessage) {
    throw new Error("Agent returned no messages.");
  }

  const content = lastMessage.content;
  return typeof content === "string" ? content : JSON.stringify(content);
}
