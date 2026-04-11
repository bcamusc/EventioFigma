
import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import App from "./app/App.tsx";
import Admin from "./app/Admin.tsx";
import "./styles/index.css";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: "identified_only",
});

const isAdmin = window.location.pathname === '/admin';

createRoot(document.getElementById("root")!).render(
  isAdmin ? <Admin /> : <App />
);
