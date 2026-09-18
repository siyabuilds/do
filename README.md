# do

`do` turns unstructured text into a reviewed list of saved tasks. Paste meeting notes, a learning goal, a project brief, a brainstorm, or any other free-form text, then review the tasks it proposes. It is a small Next.js task workspace with two complementary ways to work:

- Paste notes, generate task proposals with AI, review the proposals, and save only the selected tasks.
- Chat with an assistant that can retrieve saved tasks and, on an explicit request, create, update, or delete them.

The review step is deliberate: extraction is not persistence. Model-generated task proposals stay in the browser until a person selects and saves them.

## Core Workflow

1. Enter free-form text on the Tasks view.
2. `POST /api/todos/generate` asks the OpenAI Responses API to call `createTodo` for each actionable task. This endpoint only returns proposed task data; it does not write to MongoDB.
3. The UI selects generated proposals by default, but lets the user deselect or remove each one.
4. Saving posts the selected task fields to `POST /api/todos`.
5. The service layer creates MongoDB documents through Mongoose, and the saved tasks appear in the workspace.

The Chat view sends the in-memory conversation to `POST /api/chat`. The server lets the model retrieve task data when it needs it, then executes permitted tool calls against the same service layer. See [docs/architecture.md](docs/architecture.md) for the complete tool-calling flow and guardrails.

## Requirements

- Node.js compatible with Next.js 16
- A MongoDB deployment reachable from the development machine
- An OpenAI API key with access to the configured Responses API model (`gpt-5.6`)

## Local Development

Install dependencies and create `.env.local` at the repository root:

```bash
npm install
```

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
OPENAI_API_KEY=<your-api-key>
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run build
```

`MONGODB_URI` is required when the database connection module is loaded. `OPENAI_API_KEY` is passed to the OpenAI SDK. Neither variable is exposed to the browser by this codebase; keep `.env.local` out of version control.

## Task Model

Tasks are MongoDB documents represented by the Mongoose `Todo` model:

| Field                    | Type                                      | Notes                          |
| ------------------------ | ----------------------------------------- | ------------------------------ |
| `_id`                    | MongoDB ObjectId                          | Assigned by MongoDB            |
| `title`                  | string                                    | Required and trimmed           |
| `description`            | string                                    | Optional and trimmed           |
| `assignee`               | string                                    | Optional and trimmed           |
| `dueDate`                | Date                                      | Optional                       |
| `status`                 | `in_progress` \| `blocked` \| `completed` | Defaults to `in_progress`      |
| `createdAt`, `updatedAt` | Date                                      | Managed by Mongoose timestamps |

The task REST endpoint only changes `status`; richer task edits are available through the chat tool path when explicitly requested. Dates passed through chat use `YYYY-MM-DD` and are converted to UTC calendar-day boundaries.

## HTTP API

| Route                 | Method   | Implemented behavior                                                   |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| `/api/todos`          | `GET`    | Returns all saved tasks, newest first by `createdAt`                   |
| `/api/todos`          | `POST`   | Saves `todos`, an array of task objects, and returns created documents |
| `/api/todos/generate` | `POST`   | Extracts task proposals from `{ "text": string }`; never persists them |
| `/api/todos/:id`      | `PATCH`  | Updates a task status from `{ "status": "..." }`                       |
| `/api/todos/:id`      | `DELETE` | Deletes the specified task                                             |
| `/api/chat`           | `POST`   | Runs the conversational task assistant for `{ "messages": [...] }`     |

API routes return JSON. The chat response is `{ "message": "<sanitized-by-client HTML source>" }`; its content is intentionally HTML rather than Markdown.

## Current Behavior and Boundaries

- There is no authentication, user tenancy, authorization, or ownership model. All requests operate on the same task collection.
- Browser chat history is held in React state and is not persisted or shared across browser sessions.
- The REST delete button issues a direct delete request without a browser confirmation prompt. The chat path has stricter confirmation checks before it can delete.
- The task list displays date groups named Today, Tomorrow, This week, and No date. In the current implementation, every valid dated task that is not today or tomorrow is placed in “This week,” including past and future dates outside the week.
- The UI renders a “Pending” status filter, but the current filter compares it directly to stored statuses; because no task has a `pending` status, it produces no results. “All,” “In Progress,” “Blocked,” and “Done” map to the implemented statuses.

## Architecture Reference

[docs/architecture.md](docs/architecture.md) documents the MongoDB/Mongoose connection and service layer, OpenAI tools and execution loop, chat safeguards, HTML sanitization, date semantics, and design decisions grounded in the current code.
