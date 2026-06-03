import "./polyfills";
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
