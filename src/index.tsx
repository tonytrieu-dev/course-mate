//import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { initSentry } from "./config/sentry";

// Initialize Sentry before anything else
initSentry();

// Validate configuration on startup
try {
  // Import config to trigger validation
  import("./config").then(() => {
    const container = document.getElementById("root");
    if (!container) {
      throw new Error("Root element not found");
    }
    
    const root = createRoot(container);
    root.render(<App />);
  }).catch((error: Error) => {
    console.error("Configuration validation failed:", error.message);
    // Show user-friendly error
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2>Configuration Error</h2>
        <p>${error.message}</p>
        <p>Please check your environment variables and try again.</p>
      </div>
    `;
  });
} catch (error) {
  console.error("Failed to load configuration:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h2>Application Error</h2>
      <p>Failed to load application configuration.</p>
    </div>
  `;
}