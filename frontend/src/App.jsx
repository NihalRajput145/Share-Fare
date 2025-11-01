import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateRide from "./pages/CreateRide";
import JoinRide from "./pages/JoinRide";
import MyRides from "./pages/MyRides";

const App = () => {
  useEffect(() => {
    // ✅ Check if a creatorId already exists in localStorage
    let creatorId = localStorage.getItem("creatorId");

    // ✅ If not, generate and store a new one
    if (!creatorId) {
      creatorId = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem("creatorId", creatorId);
      console.log("🆕 Generated new creatorId:", creatorId);
    } else {
      console.log("✅ Existing creatorId found:", creatorId);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateRide />} />
        <Route path="/join" element={<JoinRide />} />
        <Route path="/myrides" element={<MyRides />} />
      </Routes>
    </Router>
  );
};

export default App;
