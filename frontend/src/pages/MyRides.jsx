import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../index.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MyRides = () => {
  const [myRides, setMyRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(false);

  const creatorId = localStorage.getItem("creatorId");

  // ✅ Fetch rides created by this user
  useEffect(() => {
    const fetchMyRides = async () => {
      if (!creatorId) return;
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/rides/my/${creatorId}`);
        const data = await res.json();
        setMyRides(data);
      } catch (err) {
        console.error("Error fetching rides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRides();
  }, [creatorId]);

  // ✅ Delete a ride
  const deleteRide = async (rideId) => {
    if (!window.confirm("Are you sure you want to delete this ride?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/rides/${rideId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      alert(data.message);
      setMyRides((prev) => prev.filter((r) => r._id !== rideId));
      if (selectedRide?._id === rideId) setSelectedRide(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting ride");
    }
  };

  // ✅ Accept join request
  const acceptRequest = async (rideId, index) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rides/${rideId}/accept/${index}`,
        { method: "PATCH" }
      );
      const data = await res.json();
      alert(data.message || "Join request accepted!");
      refreshRides();
    } catch (err) {
      console.error(err);
      alert("Error accepting request");
    }
  };

  // ✅ Reject join request
  const rejectRequest = async (rideId, index) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/rides/${rideId}/reject/${index}`,
        { method: "PATCH" }
      );
      const data = await res.json();
      alert(data.message || "Join request rejected!");
      refreshRides();
    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    }
  };

  // ✅ Refresh rides after action
  const refreshRides = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/rides/my/${creatorId}`);
      const data = await res.json();
      setMyRides(data);
      if (selectedRide) {
        const updated = data.find((r) => r._id === selectedRide._id);
        setSelectedRide(updated || null);
      }
    } catch (err) {
      console.error("Error refreshing rides:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-ride-container">
        {/* Left Panel */}
        <div className="ride-form">
          <h2>My Created Rides</h2>

          {loading ? (
            <p>Loading your rides...</p>
          ) : myRides.length > 0 ? (
            <div className="rides-list">
              {myRides.map((ride) => (
                <div
                  key={ride._id}
                  className={`ride-card ${
                    selectedRide?._id === ride._id ? "active" : ""
                  }`}
                  onClick={() => setSelectedRide(ride)}
                >
                  <h3>
                    {ride.pickup} → {ride.destination}
                  </h3>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(ride.datetime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Seats:</strong> {ride.seatsAvailable}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRide(ride._id);
                    }}
                    style={{ background: "#ff4444" }}
                  >
                    Delete Ride
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ marginTop: "20px" }}>You haven’t created any rides yet.</p>
          )}

          {/* Pending Join Requests */}
          {selectedRide && selectedRide.pendingJoinRequests?.length > 0 && (
            <div className="ride-requests">
              <h3>Join Requests for this ride</h3>
              {selectedRide.pendingJoinRequests.map((req, idx) => (
                <div
                  key={idx}
                  className={`request-card ${
                    req.status === "accepted"
                      ? "accepted"
                      : req.status === "rejected"
                      ? "rejected"
                      : ""
                  }`}
                >
                  <p>
                    <strong>Name:</strong> {req.name}
                  </p>
                  <p>
                    <strong>Contact:</strong> {req.contact}
                  </p>
                  <p>
                    <strong>Message:</strong> {req.message || "—"}
                  </p>
                  <p>
                    <strong>Status:</strong> {req.status}
                  </p>

                  {req.status === "pending" && (
                    <div className="request-actions">
                      <button
                        onClick={() => acceptRequest(selectedRide._id, idx)}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(selectedRide._id, idx)}
                        style={{ background: "#ff4444" }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Map View */}
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
            {selectedRide?.pickupCoords && (
              <Marker
                position={[
                  selectedRide.pickupCoords.lat,
                  selectedRide.pickupCoords.lng,
                ]}
              />
            )}
            {selectedRide?.destinationCoords && (
              <Marker
                position={[
                  selectedRide.destinationCoords.lat,
                  selectedRide.destinationCoords.lng,
                ]}
              />
            )}
            {selectedRide?.pickupCoords && selectedRide?.destinationCoords && (
              <Polyline
                positions={[
                  [selectedRide.pickupCoords.lat, selectedRide.pickupCoords.lng],
                  [
                    selectedRide.destinationCoords.lat,
                    selectedRide.destinationCoords.lng,
                  ],
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

export default MyRides;
