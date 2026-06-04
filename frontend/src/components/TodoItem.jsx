import React, { useState } from "react";

export const TodoItem = ({ todo, toggleTodo, updateTodo }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);
  const [hover, setHover] = useState(false);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) updateTodo(todo.id, trimmed);
    else setEditValue(todo.title);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(todo.title);
      setEditing(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 10,
        background: todo.completed ? "transparent" : "var(--brand-tint)",
        border: "1px solid",
        borderColor: todo.completed ? "var(--border)" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        style={{
          appearance: "none",
          width: 17,
          height: 17,
          border: `1.6px solid ${todo.completed ? "var(--brand)" : "var(--border-strong)"}`,
          borderRadius: 5,
          background: todo.completed ? "var(--brand)" : "var(--surface)",
          cursor: "pointer",
          flexShrink: 0,
          position: "relative",
          transition: "background 0.15s, border-color 0.15s",
        }}
      />

      {editing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1,
            height: 28,
            border: "1px solid var(--brand)",
            borderRadius: 6,
            background: "var(--surface)",
            padding: "0 8px",
            outline: "none",
            fontSize: 13,
            fontFamily: "inherit",
            color: "var(--text)",
            boxShadow: "0 0 0 3px var(--brand-ring)",
          }}
        />
      ) : (
        <span
          onDoubleClick={() => { setEditValue(todo.title); setEditing(true); }}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 500,
            color: todo.completed ? "var(--text-4)" : "var(--text)",
            textDecoration: todo.completed ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "default",
          }}
        >
          {todo.title}
        </span>
      )}

      {!editing && !todo.completed && (
        <button
          onClick={() => { setEditValue(todo.title); setEditing(true); }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-3)",
            cursor: "pointer",
            padding: 2,
            opacity: hover ? 1 : 0,
            transition: "opacity 0.15s",
            display: "flex",
            flexShrink: 0,
          }}
          aria-label="수정"
        >
          <EditIcon />
        </button>
      )}
    </div>
  );
};

function EditIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
