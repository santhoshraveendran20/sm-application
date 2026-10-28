import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          msal: ["@azure/msal-browser", "@azure/msal-react"],
          vendor: ["@reduxjs/toolkit", "react-redux", "axios", "react-hot-toast"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  base: "/",
});
