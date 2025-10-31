import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateRide from "./pages/CreateRide";
import JoinRide from "./pages/JoinRide";
import MyRides from "./pages/MyRides";

const App = () => {
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
