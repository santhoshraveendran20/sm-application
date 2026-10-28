import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import { msalInstance } from "./config/authConfig.jsx";
import { store } from "./Components/redux/store/store.jsx";
import { ThemeProvider } from "./Themecontext.jsx";

const renderApp = () => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <Provider store={store}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </Provider>
      </MsalProvider>
    </StrictMode>
  );
};

msalInstance.initialize().then(renderApp).catch(renderApp);
