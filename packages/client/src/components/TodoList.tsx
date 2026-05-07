import { trpc } from '../trpc';
import { TodoItem } from './TodoItem';

type Props = {
  isAuthenticated: boolean;
};

// Fetches the todo list and delegates rendering of each row to TodoItem.
export function TodoList({ isAuthenticated }: Props) {
  const todos = trpc.todos.getAll.useQuery();

  if (todos.isLoading) return <p className="muted">Loading todos…</p>;
  if (todos.error) return <p className="error">Failed to load: {todos.error.message}</p>;
  if (!todos.data?.length) return <p className="muted">No todos yet. Add one above!</p>;

  return (
    <ul className="todoList">
      {todos.data.map((todo) => (
        <TodoItem key={todo.id} todo={todo} isAuthenticated={isAuthenticated} />
      ))}
    </ul>
  );
}
