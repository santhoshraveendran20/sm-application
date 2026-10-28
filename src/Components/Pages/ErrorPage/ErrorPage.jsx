import { Link, useNavigate } from "react-router-dom";
import { House, RefreshCw, TriangleAlert } from "lucide-react";
import "./errorpage.css";

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <main className="error-page">
      <div className="error-card">
        <span className="error-icon" aria-hidden="true">
          <TriangleAlert size={26} />
        </span>
        <h1 className="error-title">Something went wrong</h1>
        <p className="error-text">This page couldn't load. Reload to try again, or go back to the start.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(0)}>
            <RefreshCw size={16} />
            Reload
          </button>
          <Link to="/" className="btn btn-secondary">
            <House size={16} />
            Go to start
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ErrorPage;
