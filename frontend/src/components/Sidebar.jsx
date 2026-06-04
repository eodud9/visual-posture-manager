import React, { useRef, useState, useEffect } from "react";
import { TodoItem } from "./TodoItem";
import { createTask, updateTask, deleteTask, getTasks } from "../api/tasks";

export const Sidebar = () => {
  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");

  useEffect(() => {
    getTasks().then((data) => {
      if (Array.isArray(data)) {
        setTodos(data.map((t) => ({ id: t.taskId, title: t.title, completed: false })));
      }
    });
  }, []);

  const localIdRef = useRef(-1);

  const addTodo = async () => {
    if (!todoInput.trim()) return;
    const localId = localIdRef.current--;
    const title = todoInput.trim();

    setTodos((prev) => [...prev, { id: localId, title, completed: false }]);
    setTodoInput("");

    const res = await createTask(title);
    if (res.taskId != null) {
      setTodos((prev) => prev.map((t) => (t.id === localId ? { ...t, id: res.taskId } : t)));
    }
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const updateTodo = async (id, newTitle) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title: newTitle } : todo)));
    if (id > 0) await updateTask(id, newTitle);
  };

  const clearCompleted = async () => {
    const completed = todos.filter((t) => t.completed);
    setTodos((prev) => prev.filter((todo) => !todo.completed));
    const serverIds = completed.filter((t) => t.id > 0).map((t) => t.id);
    await Promise.all(serverIds.map((id) => deleteTask(id)));
  };

  const hasCompleted = todos.some((todo) => todo.completed);
  const doneCount = todos.filter((t) => t.completed).length;
  const pct = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  return (
    <aside
      style={{
        width: 268,
        flexShrink: 0,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-sm)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--text-3)", display: "flex" }}>
            <ListIcon />
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Today Tasks
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          {doneCount}/{todos.length}
        </span>
      </div>

      {/* progress bar */}
      <div
        style={{
          height: 5,
          borderRadius: 99,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--brand)",
            borderRadius: 99,
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#d3d7df transparent",
          margin: "0 -4px",
          padding: "0 4px",
          minHeight: 80,
        }}
      >
        {todos.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-4)", fontSize: 13, marginTop: 28 }}>
            할 일이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} updateTodo={updateTodo} />
            ))}
          </div>
        )}
      </div>

      {/* clear completed */}
      {hasCompleted && (
        <button
          onClick={clearCompleted}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-3)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
            padding: "12px 2px 6px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <TrashIcon /> 완료 항목 삭제
        </button>
      )}

      {/* add input */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          type="text"
          placeholder="할 일을 추가하세요"
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) addTodo();
          }}
          style={{
            flex: 1,
            height: 40,
            padding: "0 13px",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--r-md)",
            fontSize: 13.5,
            color: "var(--text)",
            background: "var(--surface)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={addTodo}
          aria-label="추가"
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--r-md)",
            fontSize: 22,
            fontWeight: 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </aside>
  );
};

function ListIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}
