import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth";

const STORAGE_KEY = "cdi_auth";

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken) return undefined;
    return { auth: { ...parsed, isAuthenticated: true } };
  } catch {
    return undefined;
  }
};

const persistAuth = (auth) => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!auth.isAuthenticated) return;
    const target = auth.remember ? localStorage : sessionStorage;
    target.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    return;
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: loadAuth(),
});

let previousAuth = store.getState().auth;

store.subscribe(() => {
  const { auth } = store.getState();
  if (auth === previousAuth) return;
  previousAuth = auth;
  persistAuth(auth);
});
