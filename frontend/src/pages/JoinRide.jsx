import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../index.css";

// 🧭 Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ✅ Use backend base URL from environment
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const JoinRide = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rides, setRides] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const currentUserId = localStorage.getItem("creatorId");

  // ✅ Fetch recent rides on mount (exclude user's own rides)
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rides`);
        const data = await res.json();

        // Exclude rides created by this user
        const filtered = data
          .filter((r) => r.creatorId !== currentUserId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setRides(filtered);
      } catch (err) {
        console.error("Error fetching rides:", err);
      }
    };
    fetchRides();
  }, [currentUserId]);

  // 🔍 Fetch suggestions from OpenStreetMap (Nominatim)
  const fetchSuggestions = async (query, type) => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const data = await res.json();
      if (type === "pickup") setPickupSuggestions(data.slice(0, 5));
      else setDestinationSuggestions(data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const selectLocation = (place, type) => {
    if (type === "pickup") {
      setPickup(place.display_name);
      setPickupCoords({ lat: place.lat, lng: place.lon });
      setPickupSuggestions([]);
    } else {
      setDestination(place.display_name);
      setDestinationCoords({ lat: place.lat, lng: place.lon });
      setDestinationSuggestions([]);
    }
  };

  // ✅ Search rides (excluding own rides)
  const searchRides = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/rides/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup, destination }),
      });
      const data = await res.json();

      // Filter out rides created by the current user
      const filtered = data.filter((r) => r.creatorId !== currentUserId);
      setRides(filtered);
    } catch (err) {
      console.error("Error searching rides:", err);
      alert("❌ Error fetching rides");
    }
  };

  // ✅ Send join request
  const sendJoinRequest = async (rideId) => {
    const name = prompt("Enter your name:");
    const contact = prompt("Enter your contact number:");
    const message = prompt("Add a message (optional):");

    if (!name || !contact) {
      alert("Name and contact are required!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, message }),
      });

      const data = await res.json();
      alert(data.message || "✅ Request sent successfully!");
    } catch (err) {
      console.error("Error sending join request:", err);
      alert("❌ Could not send join request");
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-ride-container">
        {/* Search Form */}
        <div className="ride-form">
          <h2>Join a Ride</h2>

          <form onSubmit={searchRides}>
            <input
              type="text"
              placeholder="Pickup Location"
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value);
                fetchSuggestions(e.target.value, "pickup");
              }}
              required
            />
            {pickupSuggestions.length > 0 && (
              <ul className="suggestions">
                {pickupSuggestions.map((place, idx) => (
                  <li key={idx} onClick={() => selectLocation(place, "pickup")}>
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}

            <input
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                fetchSuggestions(e.target.value, "destination");
              }}
              required
            />
            {destinationSuggestions.length > 0 && (
              <ul className="suggestions">
                {destinationSuggestions.map((place, idx) => (
                  <li
                    key={idx}
                    onClick={() => selectLocation(place, "destination")}
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}

            <button type="submit">Search Rides</button>
          </form>

          {/* Rides List */}
          {rides.length > 0 ? (
            <div className="rides-list">
              {rides.map((ride) => (
                <div className="ride-card" key={ride._id}>
                  <h3>{ride.name}</h3>
                  <p>
                    <strong>From:</strong> {ride.pickup}
                  </p>
                  <p>
                    <strong>To:</strong> {ride.destination}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(ride.datetime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Seats Available:</strong> {ride.seatsAvailable}
                  </p>
                  <button onClick={() => sendJoinRequest(ride._id)}>
                    Request to Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: "20px" }}>No rides found.</p>
          )}
        </div>

        {/* Map Section */}
        <div className="map-container">
          <MapContainer
            center={[19.076, 72.8777]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            />
            {pickupCoords && (
              <Marker position={[pickupCoords.lat, pickupCoords.lng]} />
            )}
            {destinationCoords && (
              <Marker
                position={[destinationCoords.lat, destinationCoords.lng]}
              />
            )}
            {pickupCoords && destinationCoords && (
              <Polyline
                positions={[
                  [pickupCoords.lat, pickupCoords.lng],
                  [destinationCoords.lat, destinationCoords.lng],
                ]}
                color="lime"
              />
            )}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default JoinRide;
