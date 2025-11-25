import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@navikt/ds-css";
import "./styles/novari-theme.css";

// Set the novari theme on the HTML element
document.documentElement.setAttribute("data-theme", "novari");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
