export const createTodoTool = {
  type: "function" as const,
  strict: false as const,
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

export const getAllTodosTool = {
  type: "function" as const,
  strict: false as const,
  name: "getAllTodos",
  description: "Retrieve all saved tasks when a broad task overview is needed.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
};

export const getTodosByStatusTool = {
  type: "function" as const,
  strict: false as const,
  name: "getTodosByStatus",
  description: "Retrieve saved tasks with one specific status.",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["in_progress", "blocked", "completed"],
        description: "The task status to retrieve.",
      },
    },
    required: ["status"],
    additionalProperties: false,
  },
};

export const getTodosByDueDateRangeTool = {
  type: "function" as const,
  strict: false as const,
  name: "getTodosByDueDateRange",
  description:
    "Retrieve saved tasks due on or between two calendar dates, inclusive. Use ISO 8601 dates (YYYY-MM-DD).",
  parameters: {
    type: "object",
    properties: {
      startDate: {
        type: "string",
        description: "First included due date in YYYY-MM-DD format.",
      },
      endDate: {
        type: "string",
        description: "Last included due date in YYYY-MM-DD format.",
      },
    },
    required: ["startDate", "endDate"],
    additionalProperties: false,
  },
};
