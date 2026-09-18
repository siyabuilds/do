export const createTodoTool = {
  type: "function" as const,
  strict: false as const,
  name: "createTodo",
  description:
    "Create a saved task only when the user explicitly asks to create, add, or save it.",
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
          "The deadline for the task in YYYY-MM-DD format, if explicitly stated.",
      },
    },
    required: ["title"],
  },
};

export const updateTodoTool = {
  type: "function" as const,
  strict: false as const,
  name: "updateTodo",
  description:
    "Update one saved task only after retrieving task data and identifying its exact MongoDB _id. Use only when the user explicitly asks to modify that task.",
  parameters: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The exact _id of the retrieved task to update.",
      },
      title: { type: "string", description: "Replacement task title." },
      description: {
        type: "string",
        description: "Replacement task description.",
      },
      assignee: {
        type: "string",
        description: "Replacement task assignee.",
      },
      dueDate: {
        type: "string",
        description: "Replacement due date in YYYY-MM-DD format.",
      },
      status: {
        type: "string",
        enum: ["in_progress", "blocked", "completed"],
        description: "Replacement task status.",
      },
    },
    required: ["id"],
  },
};

export const deleteTodoTool = {
  type: "function" as const,
  strict: false as const,
  name: "deleteTodo",
  description:
    "Permanently delete one retrieved task only after the assistant has named it and the user has explicitly confirmed deletion in a later message.",
  parameters: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The exact _id of the retrieved task to delete.",
      },
      confirmed: {
        type: "boolean",
        description:
          "True only after a later user message explicitly confirms deletion of the named task.",
      },
    },
    required: ["id", "confirmed"],
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
