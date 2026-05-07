import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';

type Props = {
  isAuthenticated: boolean;
  onToggleAuth: () => void;
};

// Top-level page: header with auth toggle, then the add form and list.
export function App({ isAuthenticated, onToggleAuth }: Props) {
  return (
    <div className="page">
      <header className="header">
        <div className="headerRow">
          <h1 className="title">Todo App</h1>
          <button className="authButton" type="button" onClick={onToggleAuth}>
            {isAuthenticated ? 'Sign out' : 'Sign in (demo)'}
          </button>
        </div>
        <p className="lede">
          Public: <code>getAll</code>, <code>add</code>, <code>update</code>.{' '}
          Protected: <code>delete</code> — sign in to unlock.
        </p>
        {/* Show a badge so it's clear which auth state the protected procedure sees. */}
        {isAuthenticated && (
          <p className="authBadge">Signed in as Demo User · token: demo-token</p>
        )}
      </header>

      <TodoForm />
      <TodoList isAuthenticated={isAuthenticated} />
    </div>
  );
}
