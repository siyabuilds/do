import { getAllTodos, saveTodo } from "@/lib/services/index";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.todos)) {
      return Response.json(
        { error: "todos must be an array" },
        { status: 400 },
      );
    }

    const savedTodos = await Promise.all(
      body.todos.map((todo) => saveTodo(todo)),
    );

    return Response.json({ todos: savedTodos }, { status: 201 });
  } catch (error) {
    console.error("Failed to save todos:", error);

    return Response.json({ error: "Failed to save todos" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const todos = await getAllTodos();
    return Response.json({ todos });
  } catch (error) {
    console.error("Failed to retrieve todos:", error);
    return Response.json(
      { error: "Failed to retrieve todos" },
      { status: 500 },
    );
  }
}
