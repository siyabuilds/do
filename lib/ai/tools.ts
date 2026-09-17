export const createTodoTool = {
  type: "function",
  name: "createTodo",
  description:
    "Extract an actionable task from the user's text and return it as a proposed todo. Do not save it to the database.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "A concise title describing the task.",
      },
      description: {
        type: "string",
        description: "Additional context about the task.",
      },
      assignee: {
        type: "string",
        description:
          "The person responsible for the task, if explicitly stated.",
      },
      dueDate: {
        type: "string",
        description:
          "The deadline for the task in ISO 8601 format, if explicitly stated or unambiguously inferable.",
      },
    },
    required: ["title"],
  },
};
