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
    <aside className="bg-white px-4 py-8 border-r border-gray-300 w-80 min-h-full shrink-0">
      <h2 className="mb-5 border-l-3 border-[#2663EB] pl-2 font-bold">TODAY'S TASKS</h2>
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} toggleTodo={toggleTodo} updateTodo={updateTodo} />
        ))}
      </ul>
      {hasCompleted && (
        <button
          onClick={clearCompleted}
          className="text-xs text-gray-400 hover:text-red-400 mb-3 w-full text-left transition-colors duration-200 cursor-pointer"
        >
          완료 항목 삭제
        </button>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="새 작업 추가.."
          className="border border-stone-200 px-3 py-2 text-sm rounded-lg flex-1 outline-0"
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button className="bg-[#2663EB] text-white px-3 rounded transition-colors duration-200 hover:bg-blue-700 cursor-pointer" onClick={addTodo}>
          +
        </button>
      </div>
    </aside>
  );
};
