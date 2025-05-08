import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 定义待办事项接口
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// 定义待办事项状态接口
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';

  // 操作方法
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  clearCompleted: () => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
}

// 创建持久化的待办事项状态存储
const useTodoStore = create<TodoState>()(
  persist(
    set => ({
      todos: [] as Todo[],
      filter: 'all' as const,

      addTodo: text =>
        set(state => ({
          todos: [
            ...state.todos,
            {
              id: Date.now(),
              text,
              completed: false,
            },
          ],
        })),

      toggleTodo: id =>
        set(state => ({
          todos: state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),

      removeTodo: id =>
        set(state => ({
          todos: state.todos.filter(todo => todo.id !== id),
        })),

      clearCompleted: () =>
        set(state => ({
          todos: state.todos.filter(todo => !todo.completed),
        })),

      setFilter: filter => set({ filter }),
    }),
    {
      name: 'todo-storage', // 存储的名称
    }
  )
);

export default useTodoStore;
