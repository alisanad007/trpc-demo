import { useState } from 'react';
import { trpc } from '../trpc';

// Isolated add-todo form — owns its own title state and the add mutation.
export function TodoForm() {
  const [title, setTitle] = useState('');
  const utils = trpc.useUtils();

  const addTodo = trpc.todos.add.useMutation({
    // Refresh the list and clear the input after a successful add.
    onSuccess: () => {
      void utils.todos.getAll.invalidate();
      setTitle('');
    },
  });

  return (
    // Inline handler lets TypeScript infer the event type — no FormEvent import needed.
    <form
      className="addForm"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        addTodo.mutate({ title: trimmed });
      }}
    >
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoComplete="off"
      />
      <button className="button" type="submit" disabled={addTodo.isPending || !title.trim()}>
        {addTodo.isPending ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
