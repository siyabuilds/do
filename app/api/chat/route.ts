import { openai } from "@/lib/ai/openai";
import {
  createTodoTool,
  deleteTodoTool,
  getAllTodosTool,
  getTodosByDueDateRangeTool,
  getTodosByStatusTool,
  updateTodoTool,
} from "@/lib/ai/tools";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  getTodosByDueDateRange,
  getTodosByStatus,
  updateTodo,
} from "@/lib/services";
import { isValidObjectId } from "mongoose";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const tools = [
  createTodoTool,
  updateTodoTool,
  deleteTodoTool,
  getAllTodosTool,
  getTodosByStatusTool,
  getTodosByDueDateRangeTool,
];

const todoStatuses = ["in_progress", "blocked", "completed"] as const;
type TodoStatus = (typeof todoStatuses)[number];
type RetrievedTodo = { _id?: unknown; title?: unknown };

function parseCalendarDate(value: unknown, endOfDay = false) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Dates must use YYYY-MM-DD format");
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid calendar date");
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
}

function requireRetrievedTodo(
  id: unknown,
  retrievedTodos: Map<string, string>,
) {
  if (typeof id !== "string" || !isValidObjectId(id)) {
    throw new Error("Invalid todo ID");
  }
  const title = retrievedTodos.get(id);
  if (!title) {
    throw new Error("Retrieve the specific task before modifying it");
  }
  return { id, title };
}

function optionalText(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

async function runTool(
  name: string,
  argumentsJson: string,
  retrievedTodos: Map<string, string>,
  messages: ChatMessage[],
) {
  const args = JSON.parse(argumentsJson) as Record<string, unknown>;

  switch (name) {
    case "createTodo": {
      const title = optionalText(args.title, "Title");
      if (!title) throw new Error("Title is required");
      const dueDate =
        args.dueDate === undefined
          ? undefined
          : parseCalendarDate(args.dueDate);
      const todo = await createTodo({
        title,
        description: optionalText(args.description, "Description"),
        assignee: optionalText(args.assignee, "Assignee"),
        dueDate,
      });
      return { action: "created", todo };
    }
    case "updateTodo": {
      const { id } = requireRetrievedTodo(args.id, retrievedTodos);
      const status = args.status;
      if (
        status !== undefined &&
        !todoStatuses.includes(status as TodoStatus)
      ) {
        throw new Error("Invalid task status");
      }
      const dueDate =
        args.dueDate === undefined
          ? undefined
          : parseCalendarDate(args.dueDate);
      const input = {
        title: optionalText(args.title, "Title"),
        description: optionalText(args.description, "Description"),
        assignee: optionalText(args.assignee, "Assignee"),
        dueDate,
        status: status as TodoStatus | undefined,
      };
      if (Object.values(input).every((value) => value === undefined)) {
        throw new Error("Provide at least one task field to update");
      }
      const todo = await updateTodo(id, input);
      if (!todo) throw new Error("Todo not found");
      return { action: "updated", todo };
    }
    case "deleteTodo": {
      const { id, title } = requireRetrievedTodo(args.id, retrievedTodos);
      if (args.confirmed !== true) {
        throw new Error(
          "Explicit user confirmation is required before deletion",
        );
      }
      const latestMessage = messages.at(-1);
      const previousAssistantMessage = [...messages]
        .reverse()
        .find((message) => message.role === "assistant");
      const userConfirmed =
        latestMessage?.role === "user" &&
        /\b(yes|confirm|confirmed|proceed|delete it|remove it)\b/i.test(
          latestMessage.content,
        );
      const assistantAskedForConfirmation =
        previousAssistantMessage &&
        /\bconfirm(?:ation)?\b/i.test(previousAssistantMessage.content) &&
        previousAssistantMessage.content
          .toLowerCase()
          .includes(title.toLowerCase());
      if (!userConfirmed || !assistantAskedForConfirmation) {
        throw new Error(
          "Deletion requires a prior named confirmation question and a later explicit user confirmation",
        );
      }
      const todo = await deleteTodo(id);
      if (!todo) throw new Error("Todo not found");
      return { action: "deleted", todo };
    }
    case "getAllTodos": {
      const todos = await getAllTodos();
      todos.forEach((todo: RetrievedTodo) => {
        if (todo._id && typeof todo.title === "string") {
          retrievedTodos.set(String(todo._id), todo.title);
        }
      });
      return todos;
    }
    case "getTodosByStatus":
      if (
        args.status !== "in_progress" &&
        args.status !== "blocked" &&
        args.status !== "completed"
      ) {
        throw new Error("Invalid task status");
      }
      {
        const todos = await getTodosByStatus(args.status);
        todos.forEach((todo: RetrievedTodo) => {
          if (todo._id && typeof todo.title === "string") {
            retrievedTodos.set(String(todo._id), todo.title);
          }
        });
        return todos;
      }
    case "getTodosByDueDateRange": {
      const startDate = parseCalendarDate(args.startDate);
      const endDate = parseCalendarDate(args.endDate, true);
      if (startDate > endDate)
        throw new Error("Start date must precede end date");
      const todos = await getTodosByDueDateRange(startDate, endDate);
      todos.forEach((todo: RetrievedTodo) => {
        if (todo._id && typeof todo.title === "string") {
          retrievedTodos.set(String(todo._id), todo.title);
        }
      });
      return todos;
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
            `You are the task assistant for do. Today is ${new Date().toISOString().slice(0, 10)}. ` +
            "Use the task tools whenever an answer depends on saved task data. " +
            "Create or update a task only when the user explicitly asks you to do so; never infer a modification from a question or suggestion. " +
            "Before updating, retrieve the task data and use the exact _id of the identified task. " +
            "For deletion, first retrieve the task, clearly name it, and ask for confirmation. Only call deleteTodo after a later user message explicitly confirms deleting that named task. " +
            "Never say a task operation succeeded unless its tool result reports success; explain tool errors or missing tasks plainly. " +
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

    const retrievedTodos = new Map<string, string>();

    while (true) {
      const calls = response.output.filter(
        (item) => item.type === "function_call",
      );
      if (!calls.length) break;

      const outputs = await Promise.all(
        calls.map(async (call) => {
          try {
            const result = await runTool(
              call.name,
              call.arguments,
              retrievedTodos,
              messages,
            );
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
