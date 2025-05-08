import React, { useState } from 'react';
import useTodoStore from '../store/todoStore';

export const TodoApp: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');

  // 从状态存储中获取数据和方法
  const { todos, filter, addTodo, toggleTodo, removeTodo, clearCompleted, setFilter } =
    useTodoStore();

  // 根据过滤条件筛选要显示的待办事项
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    addTodo(newTodo);
    setNewTodo('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">待办事项</h2>

      {/* 添加新待办事项的表单 */}
      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="添加新的待办事项..."
          className="flex-grow border rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          添加
        </button>
      </form>

      {/* 过滤器 */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded ${filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          未完成
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          已完成
        </button>
      </div>

      {/* 待办事项列表 */}
      <ul className="divide-y">
        {filteredTodos.map(todo => (
          <li key={todo.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="mr-2 h-5 w-5"
              />
              <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                {todo.text}
              </span>
            </div>
            <button onClick={() => removeTodo(todo.id)} className="text-red-500 hover:text-red-700">
              删除
            </button>
          </li>
        ))}
      </ul>

      {/* 清除已完成 */}
      {todos.some(todo => todo.completed) && (
        <button onClick={clearCompleted} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
          清除已完成
        </button>
      )}
    </div>
  );
};

export default TodoApp;
