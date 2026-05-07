import { useAuth } from './hooks/useAuth';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';

export function App() {
  const { isAuthenticated, toggleAuth } = useAuth();

  return (
    <div className="page">
      <header className="header">
        <div className="headerRow">
          <h1 className="title">Todo App</h1>
          <button className="authButton" type="button" onClick={toggleAuth}>
            {isAuthenticated ? 'Sign out' : 'Sign in (demo)'}
          </button>
        </div>
        <p className="lede">
          Public: <code>getAll</code>, <code>add</code>, <code>update</code>.{' '}
          Protected: <code>delete</code> — sign in to unlock.
        </p>
        {isAuthenticated && (
          <p className="authBadge">Signed in as Demo User · token: demo-token</p>
        )}
      </header>

      <TodoForm />
      <TodoList />
    </div>
  );
}
