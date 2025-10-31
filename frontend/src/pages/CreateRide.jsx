import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../index.css";

// Fix Leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CreateRide = () => {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    pickup: "",
    destination: "",
    seatsAvailable: "",
    datetime: "",
    notes: "",
  });

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🆕 Generate and store unique creator ID if not present
  useEffect(() => {
    let id = localStorage.getItem("creatorId");
    if (!id) {
      id = Math.floor(100000 + Math.random() * 900000).toString(); // random 6-digit ID
      localStorage.setItem("creatorId", id);
    }
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 🔍 Fetch location suggestions from Nominatim
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

  const selectLocation = (place, type) => {
    if (type === "pickup") {
      setFormData((prev) => ({ ...prev, pickup: place.display_name }));
      setPickupCoords({ lat: place.lat, lng: place.lon });
      setPickupSuggestions([]);
    } else {
      setFormData((prev) => ({ ...prev, destination: place.display_name }));
      setDestinationCoords({ lat: place.lat, lng: place.lon });
      setDestinationSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const creatorId = localStorage.getItem("creatorId");

    try {
      const response = await fetch("http://localhost:5000/api/rides/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pickupCoords,
          destinationCoords,
          creatorId, // 🆕 added here
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Ride Created Successfully!");
        setFormData({
          name: "",
          contact: "",
          pickup: "",
          destination: "",
          seatsAvailable: "",
          datetime: "",
          notes: "",
        });
        setPickupCoords(null);
        setDestinationCoords(null);
      } else {
        alert(`❌ ${data.message || "Failed to create ride"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-ride-container">
        <div className="ride-form">
          <h2>Create a Ride</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="contact"
              placeholder="Phone Number"
              value={formData.contact}
              onChange={handleChange}
              required
            />

            {/* Pickup Field */}
            <input
              type="text"
              name="pickup"
              placeholder="Pickup Location"
              value={formData.pickup}
              onChange={(e) => {
                handleChange(e);
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

            {/* Destination Field */}
            <input
              type="text"
              name="destination"
              placeholder="Drop Location"
              value={formData.destination}
              onChange={(e) => {
                handleChange(e);
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

            <input
              type="number"
              name="seatsAvailable"
              placeholder="Available Seats"
              value={formData.seatsAvailable}
              onChange={handleChange}
            />
            <input
              type="datetime-local"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
            />
            <textarea
              name="notes"
              placeholder="Additional Notes"
              value={formData.notes}
              onChange={handleChange}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Ride"}
            </button>
          </form>
        </div>

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

export default CreateRide;
