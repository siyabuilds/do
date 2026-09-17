import { openai } from "@/lib/ai/openai";
import { createTodoTool } from "@/lib/ai/tools";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: "gpt-5.6",
      input: [
        {
          role: "system",
          content:
            "Extract actionable tasks from the user's text. " +
            "Use the createTodo tool for every actionable task you identify. " +
            "Do not save anything to the database.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      tools: [createTodoTool],
    });

    const todos = response.output
      .filter((item) => item.type === "function_call")
      .map((item) => ({
        ...JSON.parse(item.arguments),
        toolCallId: item.call_id,
      }));

    return Response.json({
      todos,
    });
  } catch (error) {
    console.error("Todo generation failed:", error);

    return Response.json(
      { error: "Failed to generate todos" },
      { status: 500 },
    );
  }
}
