
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSupabaseStorageBridge } from "./lib/supabaseStorageBridge";

async function bootstrap() {
  await initializeSupabaseStorageBridge();
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
  