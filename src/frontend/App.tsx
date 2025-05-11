import { createRoot } from "react-dom/client";
import "./shared/db";
import { useEffect } from "react";
import { loadCurrentMonth } from "./shared/loadCurrentMonth";
const App = () => {
  useEffect(() => {
    const db = loadCurrentMonth();
  }, []);
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
