import React, { useRef, useState } from "react";
import { TodoItem } from "./TodoItem";
import { createTask, updateTask, deleteTask } from "../api/tasks";

export const Sidebar = () => {
  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");
  const localIdRef = useRef(-1);

  
  const addTodo = async () => {
    if (!todoInput.trim()) return;
    const localId = localIdRef.current--;
    const title = todoInput.trim();

    setTodos((prev) => [...prev, { id: localId, title, completed: false }]);
    setTodoInput("");

    const res = await createTask(title);
    if (res?.id != null) {
      setTodos((prev) => prev.map((t) => (t.id === localId ? { ...t, id: res.id } : t)));
    }
  };

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  const updateTodo = async (id, newTitle) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, title: newTitle } : todo))
    );
    if (id > 0) await updateTask(id, newTitle);
  };

  const clearCompleted = async () => {
    const completed = todos.filter((t) => t.completed);
    setTodos((prev) => prev.filter((todo) => !todo.completed));
    const serverIds = completed.filter((t) => t.id > 0).map((t) => t.id);
    await Promise.all(serverIds.map((id) => deleteTask(id)));
  };

  const hasCompleted = todos.some((todo) => todo.completed);

  return (
  
    <aside style={{ 
      width: '280px', backgroundColor: 'white', borderRadius: '16px', 
      padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
      border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ width: '4px', height: '16px', backgroundColor: '#2563EB', borderRadius: '2px' }}></div>
        <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>TODAY TASKS</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {todos.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', marginTop: '20px' }}>할 일이 없습니다.</div>
        ) : (
          todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} updateTodo={updateTodo} />
          ))
        )}
      </div>

      {hasCompleted && (
        <button 
          onClick={clearCompleted} 
          style={{ backgroundColor: 'transparent', border: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', marginBottom: '15px' }}
        >
          완료 항목 삭제
        </button>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <input 
          type="text" 
          placeholder="할일을 추가하세요" 
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }} 
        />
        <button 
          onClick={addTodo} 
          style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          +
        </button>
      </div>
    </aside>
  );
};