import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../index.css";

// 🧭 Leaflet icons fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const JoinRide = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rides, setRides] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const currentUserId = localStorage.getItem("creatorId");

  // ✅ Fetch 4 latest rides on mount (excluding user’s own)
  useEffect(() => {
    const fetchInitialRides = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rides");
        const data = await res.json();

        // Sort newest first and take 4
        const recent = data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .filter((ride) => ride.creatorId !== currentUserId)
          .slice(0, 4);

        setRides(recent);
      } catch (err) {
        console.error("Error loading rides:", err);
      }
    };
    fetchInitialRides();
  }, [currentUserId]);

  // ✅ Fetch location suggestions
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
      console.error("Error fetching location:", err);
    }
  };

  // ✅ Select suggestion
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

  // ✅ Search rides manually
  const searchRides = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/rides/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup, destination }),
      });
      const data = await res.json();

      // Filter out own rides
      const filtered = data.filter((ride) => ride.creatorId !== currentUserId);
      setRides(filtered);
    } catch (err) {
      console.error(err);
      alert("Error fetching rides");
    }
  };

  // ✅ Send join request
  const sendJoinRequest = async (rideId) => {
    const name = prompt("Enter your name:");
    const contact = prompt("Enter your contact number:");
    const message = prompt("Add a message (optional):");
    if (!name || !contact) return alert("Name and contact are required!");

    try {
      const res = await fetch(
        `http://localhost:5000/api/rides/${rideId}/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, contact, message }),
        }
      );
      const data = await res.json();
      alert(data.message || "Request sent!");
    } catch (err) {
      console.error(err);
      alert("Error sending request");
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

          {/* Results */}
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
                    <strong>Seats:</strong> {ride.seatsAvailable}
                  </p>
                  <button onClick={() => sendJoinRequest(ride._id)}>
                    Request to Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: "20px" }}>No rides found yet.</p>
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
              <Marker position={[destinationCoords.lat, destinationCoords.lng]} />
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
