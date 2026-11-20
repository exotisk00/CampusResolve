import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-base gradient-hero flex items-center justify-center px-6">
      <div className="text-center p-8 rounded-2xl bg-white border border-border-ui-subtle shadow-card max-w-md w-full">
        <p className="text-[0.75rem] font-bold text-brand-blue uppercase tracking-widest mb-3">Error 404</p>
        <h1 className="font-heading font-extrabold text-content-heading text-h2 mb-3">Page Not Found</h1>
        <p className="text-body-md text-content-secondary mb-6">
          The requested page could not be found or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-[0.875rem] shadow-brand hover:shadow-brand-hover transition-all"
          style={{ background: 'linear-gradient(90deg, #1F47E8 0%, #2D56F5 100%)' }}
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
