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
    <div style={{ 
      backgroundColor: todo.completed ? '#F8FAFC' : '#EFF6FF', 
      color: todo.completed ? '#94A3B8' : '#2563EB', 
      padding: '12px 16px', 
      borderRadius: '8px', 
      fontSize: '13px', 
      fontWeight: 'bold', 
      marginBottom: '10px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px',
      textDecoration: todo.completed ? 'line-through' : 'none',
      border: '1px solid',
      borderColor: todo.completed ? '#E2E8F0' : 'transparent'
    }}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563EB', flexShrink: 0 }}
      />
      
      {editing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ flex: 1, border: 'none', background: 'white', padding: '4px 8px', borderRadius: '4px', outline: '1px solid #2563EB', fontSize: '13px' }}
        />
      ) : (
        <span 
          style={{ flex: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
          onDoubleClick={() => { setEditValue(todo.title); setEditing(true); }}
        >
          {todo.title}
        </span>
      )}
      
      {!editing && (
        <button
          onClick={() => { setEditValue(todo.title); setEditing(true); }}
          style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
        >
          수정
        </button>
      )}
    </div>
  );
};