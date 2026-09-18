import { openai } from "@/lib/ai/openai";
import {
  getAllTodosTool,
  getTodosByDueDateRangeTool,
  getTodosByStatusTool,
} from "@/lib/ai/tools";
import {
  getAllTodos,
  getTodosByDueDateRange,
  getTodosByStatus,
} from "@/lib/services";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const tools = [
  getAllTodosTool,
  getTodosByStatusTool,
  getTodosByDueDateRangeTool,
];

function parseCalendarDate(value: unknown, endOfDay = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Dates must use YYYY-MM-DD format");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid calendar date");
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

async function runTool(name: string, argumentsJson: string) {
  const args = JSON.parse(argumentsJson) as Record<string, unknown>;

  switch (name) {
    case "getAllTodos":
      return getAllTodos();
    case "getTodosByStatus":
      if (
        args.status !== "in_progress" &&
        args.status !== "blocked" &&
        args.status !== "completed"
      ) {
        throw new Error("Invalid task status");
      }
      return getTodosByStatus(args.status);
    case "getTodosByDueDateRange": {
      const startDate = parseCalendarDate(args.startDate);
      const endDate = parseCalendarDate(args.endDate, true);
      if (startDate > endDate)
        throw new Error("Start date must precede end date");
      return getTodosByDueDateRange(startDate, endDate);
    }
    default:
      throw new Error("Unsupported tool");
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages?: ChatMessage[] };
    if (
      !Array.isArray(messages) ||
      !messages.length ||
      messages.some(
        (message) =>
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          !message.content.trim(),
      )
    ) {
      return Response.json(
        { error: "A conversation is required" },
        { status: 400 },
      );
    }

    let response = await openai.responses.create({
      model: "gpt-5.6",
      input: [
        {
          role: "system",
          content:
            `You are the read-only task assistant for do. Today is ${new Date().toISOString().slice(0, 10)}. ` +
            "Use the task tools whenever an answer depends on saved task data. " +
            "You can inspect tasks but must never claim to create, update, delete, or change them. " +
            "Use prior conversation context, identify priorities and risks, and ask a concise clarifying question when the request is ambiguous. " +
            "Offer a useful next step when appropriate. " +
            "Do not invent task facts, dates, or URLs. " +
            "Respond using HTML only, never Markdown. " +
            "Only use these HTML elements: <p>, <strong>, <em>, <ul>, <ol>, <li>, <a>, and <br>. " +
            'Format links exactly as <a href="URL" class="text-primary underline">Link text</a>. ' +
            "Only provide a link when its URL is supplied in the conversation or task data.",
        },
        ...messages,
      ],
      tools,
    });

    while (true) {
      const calls = response.output.filter(
        (item) => item.type === "function_call",
      );
      if (!calls.length) break;

      const outputs = await Promise.all(
        calls.map(async (call) => {
          try {
            const result = await runTool(call.name, call.arguments);
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify(result),
            };
          } catch (error) {
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify({
                error: error instanceof Error ? error.message : "Tool failed",
              }),
            };
          }
        }),
      );

      response = await openai.responses.create({
        model: "gpt-5.6",
        previous_response_id: response.id,
        input: outputs,
        tools,
      });
    }

    return Response.json({ message: response.output_text });
  } catch (error) {
    console.error("Task chat failed:", error);
    return Response.json(
      { error: "Unable to respond to your task question" },
      { status: 500 },
    );
  }
}
