import { deleteTodo } from "@/lib/services/index";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const todo = await deleteTodo(id);

    if (!todo) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    return Response.json({ todo });
  } catch (error) {
    console.error("Failed to delete todo:", error);
    return Response.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
