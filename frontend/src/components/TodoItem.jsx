import React, { useState } from "react";

export const TodoItem = ({ todo, toggleTodo, updateTodo }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(todo.title);

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
    <li className="bg-[#F4F7F9] px-4 py-4 rounded-md font-light text-sm flex gap-2 border border-stone-200 mb-3 items-center">
      <input
        type="checkbox"
        id={todo.id}
        checked={todo.completed}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
        onChange={() => toggleTodo(todo.id)}
      />
      {editing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-white border border-stone-300 rounded px-2 py-0.5 outline-none text-sm"
        />
      ) : (
        <span className={`flex-1 ${todo.completed ? "line-through text-gray-400" : ""}`}>
          {todo.title}
        </span>
      )}
      {!editing && (
        <button
          onClick={() => {
            setEditValue(todo.title);
            setEditing(true);
          }}
          className="text-gray-400 hover:text-gray-600 text-xs shrink-0"
        >
          수정
        </button>
      )}
    </li>
  );
};
