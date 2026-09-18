import { connectToDatabase } from "../connection";
import Todo, { ITodo } from "../models/ToDo";

type CreateTodoInput = {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
};

type UpdateTodoInput = {
  status: ITodo["status"];
};

export async function createTodo(input: CreateTodoInput) {
  await connectToDatabase();

  const todo = await Todo.create(input);

  return todo;
}

export async function getAllTodos() {
  await connectToDatabase();

  return Todo.find().sort({ createdAt: -1 });
}

export async function getTodosByStatus(status: ITodo["status"]) {
  await connectToDatabase();

  return Todo.find({ status }).sort({ dueDate: 1, createdAt: -1 });
}

export async function getTodosByDueDateRange(startDate: Date, endDate: Date) {
  await connectToDatabase();

  return Todo.find({
    dueDate: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ dueDate: 1, createdAt: -1 });
}

export async function updateTodo(id: string, input: UpdateTodoInput) {
  await connectToDatabase();

  return Todo.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  });
}

export async function saveTodo(input: CreateTodoInput) {
  await connectToDatabase();

  return Todo.create(input);
}

export async function deleteTodo(id: string) {
  await connectToDatabase();

  return Todo.findByIdAndDelete(id);
}
