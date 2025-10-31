import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>ShareFare</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Create Ride</Link>
        <Link to="/join" style={styles.link}>Join Ride</Link>
        <Link to="/myrides" style={styles.link}>My Rides</Link>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    backgroundColor: "#111",
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { margin: 0 },
  links: { display: "flex", gap: "20px" },
  link: { color: "#ccc", textDecoration: "none", fontSize: "16px" },
};

export default Navbar;
