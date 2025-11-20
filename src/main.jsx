import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{
          top: "70%",
        }}
        gutter={8}
        toastOptions={{
          duration: 3000,
          icon: false,
          className: "custom-toast",
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "16px",
            padding: "12px 20px",
          },
          success: {
            icon: false,
            style: {
              background: "#22c55e",
            },
          },
          error: {
            icon: false,
            style: {
              background: "#ef4444",
            },
          },
          loading: {
            icon: false,
            style: {
              background: "#3b82f6",
            },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>
);
