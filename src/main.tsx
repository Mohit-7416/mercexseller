import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before render to avoid flash
const savedTheme = localStorage.getItem("theme") === "light" ? "light" : "dark";
document.documentElement.classList.add(savedTheme);

createRoot(document.getElementById("root")!).render(<App />);
