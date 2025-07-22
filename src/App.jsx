import { Routes, Route, Navigate } from "react-router-dom";
import Badge from "./components/Badge";
import Verify from "./components/Verify";

function App() {
  return (
    <Routes>
      <Route path="/badges/:badge_id" element={<Badge />} />
      <Route path="/verify/:badge_id" element={<Verify />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
