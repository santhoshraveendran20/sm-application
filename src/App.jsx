import { RouterProvider } from "react-router-dom";
import { ToastBar, Toaster, toast } from "react-hot-toast";
import { X } from "lucide-react";
import router from "./router.jsx";
import "./App.css";

const toastOptions = {
  duration: 4000,
  className: "app-toast",
  style: {
    background: "var(--surface)",
    color: "var(--ink)",
    border: "1px solid var(--line)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
    fontFamily: "var(--font-sans)",
    fontSize: "14px",
    fontWeight: 500,
    padding: "12px 14px",
    maxWidth: "420px",
  },
  success: {
    style: { border: "1px solid var(--success)" },
    iconTheme: { primary: "var(--success)", secondary: "var(--surface)" },
  },
  error: {
    style: { border: "1px solid var(--danger)" },
    iconTheme: { primary: "var(--danger)", secondary: "var(--surface)" },
  },
};

function App() {
  return (
    <>
      <Toaster position="top-right" gutter={10} toastOptions={toastOptions}>
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== "loading" && (
                  <button type="button" className="app-toast-close" aria-label="Dismiss notification" onClick={() => toast.dismiss(t.id)}>
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
