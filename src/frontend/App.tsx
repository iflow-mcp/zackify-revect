import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { database } from "./wasm-old/database";
const App = () => {
  useEffect(() => {
    const db = database();
  }, []);
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
