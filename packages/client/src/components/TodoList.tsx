import { useQuery } from '@tanstack/react-query';
import { trpc } from '../api/trpc';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const todos = useQuery(trpc.todos.getAll.queryOptions());

  if (todos.isLoading) return <p className="muted">Loading todos…</p>;
  if (todos.error) return <p className="error">Failed to load: {todos.error.message}</p>;
  if (!todos.data?.length) return <p className="muted">No todos yet. Add one above!</p>;

  return (
    <ul className="todoList">
      {todos.data.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
