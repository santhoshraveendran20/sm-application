import axios from "axios";
import { store } from "../Components/redux/store/store.jsx";
import { logout } from "../Components/redux/features/auth.jsx";

export const NodeURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const client = axios.create({
  baseURL: NodeURL,
  responseType: "json",
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  const token = store.getState()?.auth?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const request = (options) => {
  const onSuccess = (response) => response.data;

  const onError = (error) => {
    const status = error?.response?.status;
    if (status === 401 && store.getState()?.auth?.isAuthenticated) {
      store.dispatch(logout());
    }
    return Promise.reject(error?.response || { status: 0, message: error?.message });
  };

  return client(options).then(onSuccess).catch(onError);
};

export default request;
