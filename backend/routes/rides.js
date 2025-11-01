const express = require("express");
const router = express.Router();
const RideRequest = require("../models/RideRequest");

// ✅ CREATE a new ride
router.post("/add", async (req, res) => {
  try {
    const {
      name,
      contact,
      pickup,
      destination,
      datetime,
      seatsAvailable,
      notes,
      pickupCoords,
      destinationCoords,
      creatorId, // ✅ use this from frontend
    } = req.body;

    // Validate required fields
    if (!name || !contact || !pickup || !destination || !datetime || !creatorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Do NOT overwrite creatorId — use frontend one
    const ride = new RideRequest({
      name,
      contact,
      pickup,
      destination,
      datetime,
      seatsAvailable,
      notes,
      pickupCoords,
      destinationCoords,
      creatorId,
    });

    await ride.save();
    res.status(201).json({ message: "Ride created successfully!", ride });
  } catch (err) {
    console.error("❌ Error creating ride:", err);
    res.status(500).json({ message: "Error creating ride" });
  }
});

// ✅ GET all rides
router.get("/", async (req, res) => {
  try {
    const rides = await RideRequest.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error("❌ Error fetching rides:", err);
    res.status(500).json({ message: "Error fetching rides" });
  }
});

// ✅ FIND rides (for JoinRide search)
router.post("/find", async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    const rides = await RideRequest.find({
      pickup: { $regex: pickup, $options: "i" },
      destination: { $regex: destination, $options: "i" },
      isFull: false,
    }).sort({ createdAt: -1 });

    res.json(rides);
  } catch (err) {
    console.error("❌ Error finding rides:", err);
    res.status(500).json({ message: "Error finding rides" });
  }
});

// ✅ SEND JOIN REQUEST
router.post("/:rideId/request", async (req, res) => {
  try {
    const { rideId } = req.params;
    const { name, contact, message } = req.body;

    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const alreadyRequested = ride.pendingJoinRequests.some(
      (r) => r.contact === contact
    );
    if (alreadyRequested)
      return res.status(400).json({ message: "You have already requested to join this ride." });

    ride.pendingJoinRequests.push({ name, contact, message, status: "pending" });
    await ride.save();

    res.json({ message: "Join request sent!" });
  } catch (err) {
    console.error("❌ Error sending join request:", err);
    res.status(500).json({ message: "Error sending join request" });
  }
});

// ✅ ACCEPT JOIN REQUEST
router.patch("/:rideId/accept/:requestIndex", async (req, res) => {
  try {
    const { rideId, requestIndex } = req.params;
    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const request = ride.pendingJoinRequests[requestIndex];
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Move to joinedUsers
    ride.joinedUsers.push({
      name: request.name,
      contact: request.contact,
    });

    // Update status
    ride.pendingJoinRequests[requestIndex].status = "accepted";

    if (ride.seatsAvailable > 0) ride.seatsAvailable -= 1;
    if (ride.seatsAvailable === 0) ride.isFull = true;

    await ride.save();
    res.json({ message: "Join request accepted!", ride });
  } catch (err) {
    console.error("❌ Error accepting request:", err);
    res.status(500).json({ message: "Error accepting request" });
  }
});

// ✅ REJECT JOIN REQUEST
router.patch("/:rideId/reject/:requestIndex", async (req, res) => {
  try {
    const { rideId, requestIndex } = req.params;
    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.pendingJoinRequests[requestIndex].status = "rejected";
    await ride.save();

    res.json({ message: "Join request rejected!" });
  } catch (err) {
    console.error("❌ Error rejecting request:", err);
    res.status(500).json({ message: "Error rejecting request" });
  }
});

// ✅ GET rides created by a specific user
router.get("/my/:creatorId", async (req, res) => {
  try {
    const rides = await RideRequest.find({ creatorId: req.params.creatorId }).sort({
      createdAt: -1,
    });
    res.json(rides);
  } catch (err) {
    console.error("❌ Error fetching user rides:", err);
    res.status(500).json({ message: "Error fetching your rides" });
  }
});

// ✅ DELETE a ride
router.delete("/:rideId", async (req, res) => {
  try {
    await RideRequest.findByIdAndDelete(req.params.rideId);
    res.json({ message: "Ride deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting ride:", err);
    res.status(500).json({ message: "Error deleting ride" });
  }
});

module.exports = router;
