import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateProvider } from "./features/templates/context/TemplateContext";
import "./index.css";
import App from "./App.jsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TemplateProvider>
          <App />
        </TemplateProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
