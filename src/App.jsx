import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
      <Toaster position="top-right" gutter={10} toastOptions={toastOptions} />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
