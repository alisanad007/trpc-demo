import { trpc } from '../trpc';

type Todo = { id: string; title: string; completed: boolean };

type Props = {
  todo: Todo;
  // Controls whether the delete button is enabled (auth enforced on server too).
  isAuthenticated: boolean;
};

// Single todo row: checkbox to toggle completion, title, and a protected delete button.
export function TodoItem({ todo, isAuthenticated }: Props) {
  const utils = trpc.useUtils();

  const updateTodo = trpc.todos.update.useMutation({
    onSuccess: () => void utils.todos.getAll.invalidate(),
  });

  const deleteTodo = trpc.todos.delete.useMutation({
    onSuccess: () => void utils.todos.getAll.invalidate(),
    // Surface the server's UNAUTHORIZED message if the token is missing or invalid.
    onError: (err) => alert(err.message),
  });

  return (
    <li className="todoItem">
      <input
        className="checkbox"
        type="checkbox"
        checked={todo.completed}
        onChange={() => updateTodo.mutate({ id: todo.id, completed: !todo.completed })}
      />
      <span className={`todoTitle${todo.completed ? ' completed' : ''}`}>{todo.title}</span>
      {/* delete is a protectedProcedure — disable the button as a UX hint; server still guards it. */}
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
