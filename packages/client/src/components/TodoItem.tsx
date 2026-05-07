import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { trpc } from '../api/trpc';
import { queryClient } from '../api/react-query';

type Todo = { id: string; title: string; completed: boolean };

const invalidateTodos = () =>
  void queryClient.invalidateQueries({ queryKey: trpc.todos.getAll.queryKey() });

export function TodoItem({ todo }: { todo: Todo }) {
  const { isAuthenticated } = useAuth();

  const updateTodo = useMutation(
    trpc.todos.update.mutationOptions({ onSuccess: invalidateTodos }),
  );

  const deleteTodo = useMutation(
    trpc.todos.delete.mutationOptions({
      onSuccess: invalidateTodos,
      onError: (err) => alert(err.message),
    }),
  );

  return (
    <li className="todoItem">
      <input
        className="checkbox"
        type="checkbox"
        checked={todo.completed}
        disabled={updateTodo.isPending}
        onChange={() => updateTodo.mutate({ id: todo.id, completed: !todo.completed })}
      />
      <span className={`todoTitle${todo.completed ? ' completed' : ''}`}>{todo.title}</span>
      <button
        className="deleteButton"
        type="button"
        disabled={!isAuthenticated || deleteTodo.isPending}
        title={isAuthenticated ? 'Delete todo' : 'Sign in to delete'}
        onClick={() => deleteTodo.mutate({ id: todo.id })}
      >
        {deleteTodo.isPending ? '…' : '✕'}
      </button>
    </li>
  );
}
