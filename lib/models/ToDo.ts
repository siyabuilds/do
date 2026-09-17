import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
  status: "pending" | "in_progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    assignee: {
      type: String,
      trim: true,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Todo = mongoose.models.Todo || mongoose.model<ITodo>("Todo", todoSchema);

export default Todo;
