import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import CheckIn from "./pages/CheckIn";
import DailyView from "./pages/DailyView";
import AddDailyVolunteer from "./pages/AddDailyVolunteer";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/daily" element={<DailyView />} />
          <Route path="/daily/add" element={<AddDailyVolunteer />} />
          <Route path="/" element={<Navigate to="/check-in" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
