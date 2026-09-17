"use client";

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ListTodo,
  LoaderCircle,
  Search,
  SquarePen,
  Trash2,
  UserRound,
} from "lucide-react";

type Status = "pending" | "in_progress" | "completed";
type Todo = {
  _id?: string;
  id?: string;
  toolCallId?: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string | Date;
  status?: Status;
};
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`} {...props} />
  );
}
export function IconButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`icon-button ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Checkbox({
  id,
  label,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  const checkboxId =
    id ?? `checkbox-${label?.replaceAll(" ", "-").toLowerCase()}`;
  return (
    <label className={`checkbox ${className}`} htmlFor={checkboxId}>
      <input id={checkboxId} type="checkbox" {...props} />
      <span className="checkbox__control">
        <Check size={12} strokeWidth={3} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}
export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...props} />;
}
export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`textarea ${className}`} {...props} />;
}
export function Label({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="label" {...props}>
      {children}
    </label>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Separator() {
  return <div className="separator" role="separator" />;
}

export function TodoStatus({ status = "pending" }: { status?: Status }) {
  return (
    <Badge>
      {
        { pending: "Open", in_progress: "In progress", completed: "Complete" }[
          status
        ]
      }
    </Badge>
  );
}
export function TodoAssignee({ assignee }: { assignee?: string }) {
  return assignee ? (
    <span className="todo-meta">
      <UserRound size={13} />
      {assignee}
    </span>
  ) : null;
}
export function TodoDueDate({ dueDate }: { dueDate?: string | Date }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  return (
    <span className="todo-meta">
      <CalendarDays size={13} />
      {Number.isNaN(date.valueOf())
        ? String(dueDate)
        : new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(date)}
    </span>
  );
}
export function TodoDescription({ description }: { description?: string }) {
  return description ? <p className="todo-description">{description}</p> : null;
}
export function TodoItem({
  todo,
  selected = false,
  onSelectedChange,
  action,
}: {
  todo: Todo;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  action?: ReactNode;
}) {
  return (
    <article className="todo-item">
      <Checkbox
        aria-label={`Select ${todo.title}`}
        checked={selected}
        onChange={(event) => onSelectedChange?.(event.target.checked)}
      />
      <div className="todo-item__body">
        <div className="todo-item__heading">
          <h3>{todo.title}</h3>
          <TodoStatus status={todo.status} />
        </div>
        <div className="todo-item__metadata">
          <TodoAssignee assignee={todo.assignee} />
          <TodoDueDate dueDate={todo.dueDate} />
        </div>
        <TodoDescription description={todo.description} />
      </div>
      {action && <div className="todo-item__action">{action}</div>}
    </article>
  );
}
export function TodoList({
  todos,
  onDelete,
  deletingId,
}: {
  todos: Todo[];
  onDelete?: (id: string) => void;
  deletingId?: string;
}) {
  return (
    <div className="todo-list">
      {todos.map((todo, index) => {
        const id = todo._id ?? todo.id ?? `${todo.title}-${index}`;
        return (
          <TodoItem
            key={id}
            todo={todo}
            action={
              onDelete && todo._id ? (
                <IconButton
                  className="todo-delete"
                  type="button"
                  aria-label={`Delete ${todo.title}`}
                  title="Delete task"
                  disabled={deletingId === todo._id}
                  onClick={() => onDelete(todo._id!)}
                >
                  <Trash2 size={15} />
                </IconButton>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

export function MeetingNotesInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="notes-input">
      <Label htmlFor="meeting-notes">Meeting notes</Label>
      <Textarea
        id="meeting-notes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Paste notes, decisions, and follow-ups from your meeting..."
      />
    </div>
  );
}
export function GenerateButton({
  generating,
  disabled,
  onClick,
}: {
  generating: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" disabled={disabled} onClick={onClick}>
      {generating ? (
        <>
          <LoaderCircle className="spin" size={15} />
          Generating
        </>
      ) : (
        <>
          <SquarePen size={15} />
          Generate tasks
        </>
      )}
    </Button>
  );
}
export function TodoSelection({
  todo,
  selected,
  onSelectedChange,
  onRemove,
}: {
  todo: Todo;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <TodoItem
      todo={todo}
      selected={selected}
      onSelectedChange={onSelectedChange}
      action={
        <IconButton
          type="button"
          aria-label={`Remove ${todo.title}`}
          title="Remove proposed task"
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </IconButton>
      }
    />
  );
}
export function ProposedTodoItem(
  props: React.ComponentProps<typeof TodoSelection>,
) {
  return <TodoSelection {...props} />;
}
export function ProposedTodoList({
  todos,
  selectedIds,
  onSelect,
  onRemove,
}: {
  todos: Todo[];
  selectedIds: string[];
  onSelect: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="todo-list">
      {todos.map((todo, index) => {
        const id = todo.toolCallId ?? todo.id ?? `proposed-${index}`;
        return (
          <ProposedTodoItem
            key={id}
            todo={todo}
            selected={selectedIds.includes(id)}
            onSelectedChange={(checked) => onSelect(id, checked)}
            onRemove={() => onRemove(id)}
          />
        );
      })}
    </div>
  );
}
export function SaveSelectedButton({
  count,
  saving,
  onClick,
}: {
  count: number;
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" disabled={!count || saving} onClick={onClick}>
      {saving ? "Saving" : `Save selected${count ? ` (${count})` : ""}`}
    </Button>
  );
}

export function SidebarItem({
  icon,
  children,
  active = false,
}: {
  icon: ReactNode;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button className={`sidebar-item ${active ? "sidebar-item--active" : ""}`}>
      {icon}
      {children}
    </button>
  );
}
export function Sidebar() {
  return (
    <aside className="sidebar">
      <p className="eyebrow">Workspace</p>
      <nav aria-label="Workspace navigation">
        <SidebarItem icon={<ListTodo size={16} />} active>
          My tasks
        </SidebarItem>
      </nav>
    </aside>
  );
}
export function Header() {
  return (
    <header className="header">
      <Link className="wordmark" href="/">
        do
      </Link>
      <div className="header__actions">
        <IconButton aria-label="Search tasks" title="Search tasks">
          <Search size={16} />
        </IconButton>
        <span className="avatar">D</span>
      </div>
    </header>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
export function PageHeader() {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">Workspace / My tasks</p>
        <h1>Tasks</h1>
      </div>
      <p>Turn meeting notes into clear, actionable work.</p>
    </div>
  );
}
export function EmptyState() {
  return (
    <div className="empty-state">
      <h3>No saved tasks</h3>
      <p>Generate tasks from meeting notes to start your list.</p>
    </div>
  );
}

export function DoApp() {
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [proposed, setProposed] = useState<Todo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/todos")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load tasks");
        return data;
      })
      .then((data) => setTodos(data.todos))
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load tasks",
        ),
      );
  }, []);
  async function generate() {
    if (!notes.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/todos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Unable to generate tasks");
      const generated = data.todos as Todo[];
      setProposed(generated);
      setSelected(
        generated.map(
          (todo, index) => todo.toolCallId ?? todo.id ?? `proposed-${index}`,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to generate tasks",
      );
    } finally {
      setGenerating(false);
    }
  }
  function remove(id: string) {
    setProposed((items) =>
      items.filter(
        (todo, index) =>
          (todo.toolCallId ?? todo.id ?? `proposed-${index}`) !== id,
      ),
    );
    setSelected((items) => items.filter((item) => item !== id));
  }
  async function save() {
    const chosen = proposed
      .filter((todo, index) =>
        selected.includes(todo.toolCallId ?? todo.id ?? `proposed-${index}`),
      )
      .map((todo) => ({
        title: todo.title,
        ...(todo.description && { description: todo.description }),
        ...(todo.assignee && { assignee: todo.assignee }),
        ...(todo.dueDate && { dueDate: todo.dueDate }),
      }));
    if (!chosen.length) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: chosen }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save tasks");
      setTodos((items) => [...data.todos, ...items]);
      setProposed([]);
      setSelected([]);
      setNotes("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save tasks",
      );
    } finally {
      setSaving(false);
    }
  }
  async function deleteSavedTodo(id: string) {
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete task");
      setTodos((items) => items.filter((todo) => todo._id !== id));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to delete task",
      );
    } finally {
      setDeletingId("");
    }
  }
  return (
    <AppShell>
      <PageHeader />
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">Draft</p>
            <h2>New tasks</h2>
          </div>
          <GenerateButton
            generating={generating}
            disabled={!notes.trim() || generating}
            onClick={generate}
          />
        </div>
        <MeetingNotesInput
          value={notes}
          onChange={setNotes}
          disabled={generating}
        />
      </section>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {proposed.length > 0 && (
        <section className="section">
          <div className="section__header">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Proposed tasks</h2>
            </div>
            <span className="count">{selected.length} selected</span>
          </div>
          <ProposedTodoList
            todos={proposed}
            selectedIds={selected}
            onSelect={(id, checked) =>
              setSelected((items) =>
                checked ? [...items, id] : items.filter((item) => item !== id),
              )
            }
            onRemove={remove}
          />
          <Separator />
          <div className="section__actions">
            <SaveSelectedButton
              count={selected.length}
              saving={saving}
              onClick={save}
            />
          </div>
        </section>
      )}
      <section className="section">
        <div className="section__header">
          <div>
            <p className="eyebrow">Saved</p>
            <h2>Your tasks</h2>
          </div>
          <span className="count">{todos.length}</span>
        </div>
        {todos.length ? (
          <div className="saved-tasks">
            <TodoList
              todos={todos}
              onDelete={deleteSavedTodo}
              deletingId={deletingId}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </AppShell>
  );
}
