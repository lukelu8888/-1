
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeSupabaseStorageBridge } from "./lib/supabaseStorageBridge";

function bootstrap() {
  createRoot(document.getElementById("root")!).render(<App />);

  // Do not block the first paint on bridge initialization. We can safely
  // warm it up in the background and let the app fall back if it times out.
  void initializeSupabaseStorageBridge().catch((error) => {
    console.error('[bootstrap] initializeSupabaseStorageBridge failed:', error);
  });
}

void bootstrap();
  
