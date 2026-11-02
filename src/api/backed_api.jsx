import axios from "axios";
import { store } from "../Components/redux/store/store.jsx";
import { logout } from "../Components/redux/features/auth.jsx";

// export const backendURL = "https://dev-backend-python.sytnova.srm-tech.com";
export const backendURL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

export const client = axios.create({
  baseURL: backendURL,
  responseType: "json",
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  const authToken = store.getState()?.auth?.accessToken;
  if (authToken) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }
  return config;
});

const requestPy = (options) => {
  const onSuccess = (response) => {
    if (response.data?.status === "00") {
      store.dispatch(logout());
      window.location = "/";
    }
    return response.data;
  };

  const onError = (error) => {
    if (error.response) {
      if (error.response.status === 401 && store.getState()?.auth?.isAuthenticated) {
        store.dispatch(logout());
      }
    }

    return Promise.reject(error.response || { status: 0, message: error.message });
  };

  return client(options).then(onSuccess).catch(onError);
};

export default requestPy;
