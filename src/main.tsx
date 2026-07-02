import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme + accent before render to avoid flash
const savedTheme = localStorage.getItem("theme") === "light" ? "light" : "dark";
document.documentElement.classList.add(savedTheme);
const validAccents = ["sea", "brown", "ocean", "sunset", "forest", "plum"] as const;
const savedAccent = localStorage.getItem("accent") as typeof validAccents[number] | null;
document.documentElement.classList.add(`accent-${savedAccent && validAccents.includes(savedAccent) ? savedAccent : "sea"}`);

createRoot(document.getElementById("root")!).render(<App />);
