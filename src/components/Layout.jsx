import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold text-xl text-brand-700">
            Hotels Lite
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium ${location.pathname === '/' ? 'text-brand-600' : 'text-surface-500 hover:text-surface-700'}`}
            >
              Search
            </Link>
            <Link
              to="/bookings"
              className={`text-sm font-medium ${location.pathname === '/bookings' ? 'text-brand-600' : 'text-surface-500 hover:text-surface-700'}`}
            >
              My Bookings
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-surface-200 py-6 text-center text-sm text-surface-400">
        Demo hotel booking · No login required
      </footer>
    </div>
  );
}
