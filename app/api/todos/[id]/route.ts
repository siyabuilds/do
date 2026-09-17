import { isValidObjectId } from "mongoose";
import { deleteTodo, updateTodo } from "@/lib/services/index";

const todoStatuses = ["in_progress", "blocked", "completed"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { status } = await request.json();

    if (
      typeof status !== "string" ||
      !todoStatuses.includes(status as (typeof todoStatuses)[number])
    ) {
      return Response.json({ error: "Invalid todo status" }, { status: 400 });
    }

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return Response.json({ error: "Invalid todo ID" }, { status: 400 });
    }

    const todo = await updateTodo(id, {
      status: status as (typeof todoStatuses)[number],
    });

    if (!todo) {
      return Response.json({ error: "Todo not found" }, { status: 404 });
    }

    return Response.json({ todo });
  } catch (error) {
    console.error("Failed to update todo:", error);
    return Response.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

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
