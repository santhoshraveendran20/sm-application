import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  method: null,
  remember: true,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, method = "password", remember = true } = action.payload;
      state.user = user;
      state.accessToken = token;
      state.method = method;
      state.remember = remember;
      state.isAuthenticated = Boolean(token);
    },
    logout: () => initialState,
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
